mod audio;
mod whisper;
mod gemini;
mod deepgram;
mod executor;
mod server;

use anyhow::Result;
use clap::{Parser, Subcommand};
use colored::Colorize;
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "abel-voice")]
#[command(about = "Voice-controlled robot arm CLI with AI-generated Python scripts", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Start HTTP service for GUI integration
    Serve {
        /// Port to bind the service to
        #[arg(short, long, default_value = "8080")]
        port: u16,
    },

    /// Start an interactive voice control session
    Session {
        /// Save generated scripts to directory
        #[arg(short, long, default_value = "./scripts")]
        output_dir: PathBuf,

        /// Enable text-to-speech responses
        #[arg(short, long)]
        tts: bool,
    },

    /// Record and execute a single voice command
    Once {
        /// Save generated script to file
        #[arg(short, long)]
        save: Option<PathBuf>,

        /// Enable text-to-speech response
        #[arg(short, long)]
        tts: bool,
    },

    /// Execute a saved Python script
    Run {
        /// Path to Python script
        script: PathBuf,
    },

    /// Calibrate servo ranges interactively
    Calibrate {
        /// Servo ID to calibrate (0-3)
        #[arg(short, long)]
        servo: Option<u8>,
    },

    /// Test smooth motion with different durations
    Smooth {
        /// Servo ID to test (0-3)
        #[arg(short, long, default_value = "0")]
        servo: u8,

        /// Start angle
        #[arg(long, default_value = "45")]
        from: u8,

        /// End angle
        #[arg(long, default_value = "135")]
        to: u8,

        /// Duration in milliseconds
        #[arg(short, long, default_value = "1000")]
        duration: u16,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenv::dotenv().ok();

    let cli = Cli::parse();

    match cli.command {
        Commands::Serve { port } => {
            server::run_server(port).await?;
        }
        Commands::Session { output_dir, tts } => {
            run_session(output_dir, tts).await?;
        }
        Commands::Once { save, tts } => {
            run_once(save, tts).await?;
        }
        Commands::Run { script } => {
            executor::run_script(&script).await?;
        }
        Commands::Calibrate { servo } => {
            run_calibration(servo).await?;
        }
        Commands::Smooth { servo, from, to, duration } => {
            run_smooth_test(servo, from, to, duration).await?;
        }
    }

    Ok(())
}

async fn run_session(output_dir: PathBuf, tts_enabled: bool) -> Result<()> {
    println!("{}", "🎤 Starting Abel Voice Control Session".bright_cyan().bold());
    println!("{}", "Press Ctrl+C to exit".dimmed());
    println!();

    std::fs::create_dir_all(&output_dir)?;

    let whisper_client = whisper::WhisperClient::new()?;
    let gemini_client = gemini::GeminiClient::new()?;
    let deepgram_client = if tts_enabled {
        Some(deepgram::DeepgramClient::new()?)
    } else {
        None
    };

    let mut session_count = 0;

    loop {
        session_count += 1;

        println!("{}", format!("\n[Session #{}]", session_count).bright_green());
        println!("{}", "🎙️  Listening... (speak now)".yellow());

        // Record audio
        let audio_data = audio::record_audio(5).await?;
        println!("{}", "✓ Recording complete".green());

        // Transcribe with Whisper
        print!("{}", "🔤 Transcribing... ".cyan());
        let transcript = whisper_client.transcribe(&audio_data).await?;
        println!("{}", "✓".green());
        println!("{}: \"{}\"", "You said".bright_white(), transcript.bright_yellow());

        if transcript.trim().is_empty() {
            println!("{}", "⚠️  No speech detected, try again".yellow());
            continue;
        }

        // Generate Python script with Gemini
        print!("{}", "🤖 Generating robot control script... ".cyan());
        let script = gemini_client.generate_robot_script(&transcript).await?;
        println!("{}", "✓".green());

        // Save script
        let script_path = output_dir.join(format!("cmd_{:03}.py", session_count));
        std::fs::write(&script_path, &script)?;
        println!("{}: {}", "💾 Saved".green(), script_path.display().to_string().dimmed());

        // Show script preview
        println!("\n{}", "Generated Script:".bright_white().underline());
        for line in script.lines().take(10) {
            println!("  {}", line.dimmed());
        }
        if script.lines().count() > 10 {
            println!("  {}", "...".dimmed());
        }
        println!();

        // Confirm execution
        use dialoguer::Confirm;
        if Confirm::new()
            .with_prompt("Execute this script?")
            .default(true)
            .interact()?
        {
            println!("{}", "🚀 Executing...".cyan());

            match executor::run_script(&script_path).await {
                Ok(output) => {
                    println!("{}", "✓ Execution complete".green());
                    if !output.is_empty() {
                        println!("{}", output.dimmed());
                    }

                    // Text-to-speech response
                    if let Some(ref tts) = deepgram_client {
                        let response = "Command executed successfully";
                        tts.speak(response).await?;
                    }
                }
                Err(e) => {
                    println!("{}: {}", "✗ Execution failed".red(), e);

                    if let Some(ref tts) = deepgram_client {
                        tts.speak("Execution failed").await?;
                    }
                }
            }
        } else {
            println!("{}", "⊗ Skipped execution".yellow());
        }
    }
}

async fn run_once(save_path: Option<PathBuf>, tts_enabled: bool) -> Result<()> {
    println!("{}", "🎤 Voice Command".bright_cyan().bold());
    println!("{}", "🎙️  Listening... (speak now)".yellow());

    let whisper_client = whisper::WhisperClient::new()?;
    let gemini_client = gemini::GeminiClient::new()?;
    let deepgram_client = if tts_enabled {
        Some(deepgram::DeepgramClient::new()?)
    } else {
        None
    };

    // Record audio
    let audio_data = audio::record_audio(5).await?;
    println!("{}", "✓ Recording complete".green());

    // Transcribe
    print!("{}", "🔤 Transcribing... ".cyan());
    let transcript = whisper_client.transcribe(&audio_data).await?;
    println!("{}", "✓".green());
    println!("{}: \"{}\"", "You said".bright_white(), transcript.bright_yellow());

    // Generate script
    print!("{}", "🤖 Generating robot control script... ".cyan());
    let script = gemini_client.generate_robot_script(&transcript).await?;
    println!("{}", "✓".green());

    // Save if requested
    if let Some(path) = save_path {
        std::fs::write(&path, &script)?;
        println!("{}: {}", "💾 Saved".green(), path.display());
    }

    // Show script
    println!("\n{}", "Generated Script:".bright_white().underline());
    println!("{}", script);
    println!();

    // Execute
    let temp_script = std::env::temp_dir().join("abel_temp.py");
    std::fs::write(&temp_script, &script)?;

    println!("{}", "🚀 Executing...".cyan());
    match executor::run_script(&temp_script).await {
        Ok(output) => {
            println!("{}", "✓ Execution complete".green());
            if !output.is_empty() {
                println!("{}", output);
            }

            if let Some(ref tts) = deepgram_client {
                tts.speak("Command executed successfully").await?;
            }
        }
        Err(e) => {
            println!("{}: {}", "✗ Execution failed".red(), e);

            if let Some(ref tts) = deepgram_client {
                tts.speak("Execution failed").await?;
            }
        }
    }

    Ok(())
}

async fn run_calibration(servo_id: Option<u8>) -> Result<()> {
    use dialoguer::{Input, Select};
    use std::io::Write;
    use std::time::Duration;

    println!("{}", "🎯 Servo Calibration Tool".bright_cyan().bold());
    println!();

    let servo = match servo_id {
        Some(id) if id <= 3 => id,
        Some(_) => anyhow::bail!("Servo ID must be 0-3"),
        None => {
            let servos = vec!["Base (0)", "Shoulder (1)", "Elbow (2)", "Gripper (3)"];
            let selection = Select::new()
                .with_prompt("Select servo to calibrate")
                .items(&servos)
                .interact()?;
            selection as u8
        }
    };

    let servo_names = ["Base", "Shoulder", "Elbow", "Gripper"];
    println!("{}: {}", "Calibrating".green(), servo_names[servo as usize].bright_white());
    println!();

    let port = serialport::new("/dev/cu.usbserial-140", 115200)
        .timeout(Duration::from_secs(2))
        .open()?;

    let mut port = port;
    std::thread::sleep(Duration::from_millis(2000));

    println!("{}", "Testing range 0-180 degrees...".dimmed());
    println!();

    loop {
        let angle: String = Input::new()
            .with_prompt("Enter angle (0-180) or 'q' to quit")
            .interact_text()?;

        if angle.trim().to_lowercase() == "q" {
            break;
        }

        let angle: u8 = match angle.trim().parse() {
            Ok(a) if a <= 180 => a,
            _ => {
                println!("{}", "Invalid angle. Must be 0-180.".red());
                continue;
            }
        };

        let command = format!("#{servo}M{angle}T800\n");
        port.write_all(command.as_bytes())?;
        port.flush()?;

        println!("{} Servo {} → {}°", "➜".cyan(), servo, angle);
        std::thread::sleep(Duration::from_millis(900));
    }

    println!();
    println!("{}", "✓ Calibration complete".green());

    Ok(())
}

async fn run_smooth_test(servo: u8, from: u8, to: u8, duration: u16) -> Result<()> {
    use std::io::Write;
    use std::time::Duration;

    if servo > 3 {
        anyhow::bail!("Servo ID must be 0-3");
    }

    println!("{}", "⚡ Smooth Motion Test".bright_cyan().bold());
    println!();

    let servo_names = ["Base", "Shoulder", "Elbow", "Gripper"];
    println!("{}: {}", "Servo".bright_white(), servo_names[servo as usize]);
    println!("{}: {}° → {}°", "Range".bright_white(), from, to);
    println!("{}: {}ms", "Duration".bright_white(), duration);
    println!();

    let port = serialport::new("/dev/cu.usbserial-140", 115200)
        .timeout(Duration::from_secs(2))
        .open()?;

    let mut port = port;
    std::thread::sleep(Duration::from_millis(2000));

    println!("{}", "Running test...".cyan());

    let command = format!("#{servo}M{from}T{duration}\n");
    port.write_all(command.as_bytes())?;
    port.flush()?;
    println!("{} Moving to {}°", "➜".cyan(), from);
    std::thread::sleep(Duration::from_millis((duration + 200) as u64));

    std::thread::sleep(Duration::from_millis(500));

    let command = format!("#{servo}M{to}T{duration}\n");
    port.write_all(command.as_bytes())?;
    port.flush()?;
    println!("{} Moving to {}°", "➜".cyan(), to);
    std::thread::sleep(Duration::from_millis((duration + 200) as u64));

    std::thread::sleep(Duration::from_millis(500));

    let mid = (from + to) / 2;
    let command = format!("#{servo}M{mid}T{duration}\n");
    port.write_all(command.as_bytes())?;
    port.flush()?;
    println!("{} Returning to center {}°", "➜".cyan(), mid);
    std::thread::sleep(Duration::from_millis((duration + 200) as u64));

    println!();
    println!("{}", "✓ Smooth motion test complete".green());

    Ok(())
}

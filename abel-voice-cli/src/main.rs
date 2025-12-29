mod audio;
mod whisper;
mod gemini;
mod deepgram;
mod executor;

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
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenv::dotenv().ok();

    let cli = Cli::parse();

    match cli.command {
        Commands::Session { output_dir, tts } => {
            run_session(output_dir, tts).await?;
        }
        Commands::Once { save, tts } => {
            run_once(save, tts).await?;
        }
        Commands::Run { script } => {
            executor::run_script(&script).await?;
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

use anyhow::{Context, Result};
use serde::Serialize;
use std::process::Command;

#[derive(Serialize)]
struct DeepgramRequest {
    text: String,
}

pub struct DeepgramClient {
    api_key: String,
    client: reqwest::Client,
}

impl DeepgramClient {
    pub fn new() -> Result<Self> {
        let api_key = std::env::var("DEEPGRAM_API_KEY")
            .context("DEEPGRAM_API_KEY environment variable not set")?;

        Ok(Self {
            api_key,
            client: reqwest::Client::new(),
        })
    }

    pub async fn speak(&self, text: &str) -> Result<()> {
        let request = DeepgramRequest {
            text: text.to_string(),
        };

        // Use Deepgram's TTS API
        let response = self
            .client
            .post("https://api.deepgram.com/v1/speak?model=aura-asteria-en")
            .header("Authorization", format!("Token {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .context("Failed to send Deepgram TTS request")?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Deepgram API error ({}): {}", status, error_text);
        }

        let audio_data = response
            .bytes()
            .await
            .context("Failed to read audio response")?;

        // Save to temporary file
        let temp_audio = std::env::temp_dir().join("abel_tts.mp3");
        std::fs::write(&temp_audio, audio_data)?;

        // Play audio using system audio player
        self.play_audio(&temp_audio)?;

        Ok(())
    }

    fn play_audio(&self, path: &std::path::Path) -> Result<()> {
        // Detect OS and use appropriate audio player
        #[cfg(target_os = "macos")]
        {
            Command::new("afplay")
                .arg(path)
                .output()
                .context("Failed to play audio with afplay")?;
        }

        #[cfg(target_os = "linux")]
        {
            // Try different players
            let players = ["paplay", "aplay", "mpg123", "ffplay"];
            let mut played = false;

            for player in &players {
                if let Ok(_) = Command::new(player).arg(path).output() {
                    played = true;
                    break;
                }
            }

            if !played {
                anyhow::bail!("No audio player found. Install paplay, aplay, mpg123, or ffplay");
            }
        }

        #[cfg(target_os = "windows")]
        {
            Command::new("powershell")
                .args(&[
                    "-c",
                    &format!(
                        "(New-Object Media.SoundPlayer '{}').PlaySync()",
                        path.display()
                    ),
                ])
                .output()
                .context("Failed to play audio with PowerShell")?;
        }

        Ok(())
    }
}

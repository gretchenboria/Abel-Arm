use anyhow::{Context, Result};
use reqwest::multipart;
use serde::Deserialize;

#[derive(Deserialize)]
struct WhisperResponse {
    text: String,
}

pub struct WhisperClient {
    api_key: String,
    client: reqwest::Client,
}

impl WhisperClient {
    pub fn new() -> Result<Self> {
        let api_key = std::env::var("OPENAI_API_KEY")
            .context("OPENAI_API_KEY environment variable not set")?;

        Ok(Self {
            api_key,
            client: reqwest::Client::new(),
        })
    }

    pub async fn transcribe(&self, audio_data: &[u8]) -> Result<String> {
        let form = multipart::Form::new()
            .text("model", "whisper-1")
            .part(
                "file",
                multipart::Part::bytes(audio_data.to_vec())
                    .file_name("audio.wav")
                    .mime_str("audio/wav")?,
            );

        let response = self
            .client
            .post("https://api.openai.com/v1/audio/transcriptions")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .multipart(form)
            .send()
            .await
            .context("Failed to send transcription request")?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Whisper API error ({}): {}", status, error_text);
        }

        let whisper_response: WhisperResponse = response
            .json()
            .await
            .context("Failed to parse Whisper response")?;

        Ok(whisper_response.text.trim().to_string())
    }
}

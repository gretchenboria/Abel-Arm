use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use actix_cors::Cors;
use actix_multipart::Multipart;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use anyhow::Result;

use crate::whisper::WhisperClient;
use crate::gemini::GeminiClient;

#[derive(Serialize)]
struct TranscriptResponse {
    transcript: String,
}

#[derive(Deserialize)]
struct InterpretRequest {
    transcript: String,
}

#[derive(Serialize)]
struct InterpretResponse {
    action: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    servo: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    angle: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    sequence_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

async fn health() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "abel-voice-service",
        "version": "0.1.0"
    }))
}

async fn transcribe(mut payload: Multipart) -> impl Responder {
    // Extract audio file from multipart
    let mut audio_data = Vec::new();

    while let Some(item) = payload.next().await {
        let mut field = match item {
            Ok(f) => f,
            Err(e) => {
                return HttpResponse::BadRequest().json(ErrorResponse {
                    error: format!("Failed to parse multipart: {}", e),
                });
            }
        };

        while let Some(chunk) = field.next().await {
            let data = match chunk {
                Ok(d) => d,
                Err(e) => {
                    return HttpResponse::BadRequest().json(ErrorResponse {
                        error: format!("Failed to read chunk: {}", e),
                    });
                }
            };
            audio_data.extend_from_slice(&data);
        }
    }

    if audio_data.is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "No audio data received".to_string(),
        });
    }

    // Transcribe using Whisper
    let whisper = match WhisperClient::new() {
        Ok(w) => w,
        Err(e) => {
            return HttpResponse::InternalServerError().json(ErrorResponse {
                error: format!("Failed to initialize Whisper client: {}", e),
            });
        }
    };

    let transcript = match whisper.transcribe(&audio_data).await {
        Ok(t) => t,
        Err(e) => {
            return HttpResponse::InternalServerError().json(ErrorResponse {
                error: format!("Transcription failed: {}", e),
            });
        }
    };

    HttpResponse::Ok().json(TranscriptResponse { transcript })
}

async fn interpret(req: web::Json<InterpretRequest>) -> impl Responder {
    let gemini = match GeminiClient::new() {
        Ok(g) => g,
        Err(e) => {
            return HttpResponse::InternalServerError().json(ErrorResponse {
                error: format!("Failed to initialize Gemini client: {}", e),
            });
        }
    };

    let result = match gemini.interpret_command(&req.transcript).await {
        Ok(r) => r,
        Err(e) => {
            return HttpResponse::InternalServerError().json(ErrorResponse {
                error: format!("Interpretation failed: {}", e),
            });
        }
    };

    // Parse the Gemini response into our response format
    let response = InterpretResponse {
        action: result.action.clone(),
        servo: result.servo,
        angle: result.angle,
        sequence_name: result.sequence_name.clone(),
        message: result.message.clone(),
    };

    HttpResponse::Ok().json(response)
}

pub async fn run_server(port: u16) -> Result<()> {
    println!("Starting Abel Voice Service on http://localhost:{}", port);
    println!("Press Ctrl+C to stop");

    HttpServer::new(|| {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(cors)
            .route("/health", web::get().to(health))
            .route("/transcribe", web::post().to(transcribe))
            .route("/interpret", web::post().to(interpret))
    })
    .bind(("127.0.0.1", port))?
    .run()
    .await?;

    Ok(())
}

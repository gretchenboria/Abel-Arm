use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct CommandResult {
    pub action: String,
    pub servo: Option<u8>,
    pub angle: Option<u8>,
    pub sequence_name: Option<String>,
    pub message: Option<String>,
}

#[derive(Serialize)]
struct GeminiRequest {
    contents: Vec<Content>,
}

#[derive(Serialize)]
struct Content {
    parts: Vec<Part>,
}

#[derive(Serialize)]
struct Part {
    text: String,
}

#[derive(Deserialize)]
struct GeminiResponse {
    candidates: Vec<Candidate>,
}

#[derive(Deserialize)]
struct Candidate {
    content: CandidateContent,
}

#[derive(Deserialize)]
struct CandidateContent {
    parts: Vec<ResponsePart>,
}

#[derive(Deserialize)]
struct ResponsePart {
    text: String,
}

pub struct GeminiClient {
    api_key: String,
    client: reqwest::Client,
}

impl GeminiClient {
    pub fn new() -> Result<Self> {
        let api_key = std::env::var("GEMINI_API_KEY")
            .context("GEMINI_API_KEY environment variable not set")?;

        Ok(Self {
            api_key,
            client: reqwest::Client::new(),
        })
    }

    pub async fn generate_robot_script(&self, command: &str) -> Result<String> {
        let system_prompt = r##"You are a robot control code generator. Generate Python scripts to control a robot arm based on natural language commands.

The robot arm has 4 servos:
- Servo 0: Base (rotation) - 0-180 degrees
- Servo 1: Shoulder - 0-180 degrees
- Servo 2: Elbow - 0-180 degrees
- Servo 3: Gripper - 60=open, 120=closed

Use this Python API:

```python
import serial
import time

# Initialize serial connection
ser = serial.Serial('/dev/ttyUSB0', 115200, timeout=1)
time.sleep(2)

def move_servo(servo_id, angle, duration_ms=800):
    """Move servo to angle with smooth motion"""
    command = f"#{servo_id}M{angle}T{duration_ms}\n"
    ser.write(command.encode())
    time.sleep(duration_ms / 1000.0 + 0.1)

def go_home():
    """Return all servos to center position"""
    move_servo(0, 90)
    move_servo(1, 90)
    move_servo(2, 90)
    move_servo(3, 90)

def pick_and_place():
    """Pick up object and move it 45 degrees"""
    # Open gripper
    move_servo(3, 55, 800)
    # Lower to object
    move_servo(1, 135, 1200)
    move_servo(2, 155, 1200)
    # Grip
    move_servo(3, 125, 800)
    # Lift
    move_servo(2, 90, 1000)
    move_servo(1, 85, 1000)
    # Rotate 45 degrees
    move_servo(0, 135, 1400)
    # Lower
    move_servo(1, 135, 1200)
    move_servo(2, 155, 1200)
    # Release
    move_servo(3, 55, 800)
    # Return home
    go_home()
```

Generate complete, executable Python scripts. Include imports, serial setup, and clean code structure.
Always close the serial connection at the end with: ser.close()

Examples:
- "wave" -> rotate base back and forth
- "pick and place" -> use the pick_and_place function
- "open gripper" -> move_servo(3, 55)
- "close gripper" -> move_servo(3, 120)
- "go home" -> go_home()

Now generate a script for this command:
"##;

        let full_prompt = format!("{}\n\nCommand: {}", system_prompt, command);

        let request = GeminiRequest {
            contents: vec![Content {
                parts: vec![Part {
                    text: full_prompt,
                }],
            }],
        };

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={}",
            self.api_key
        );

        let response = self
            .client
            .post(&url)
            .json(&request)
            .send()
            .await
            .context("Failed to send Gemini request")?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Gemini API error ({}): {}", status, error_text);
        }

        let gemini_response: GeminiResponse = response
            .json()
            .await
            .context("Failed to parse Gemini response")?;

        let script = gemini_response
            .candidates
            .first()
            .and_then(|c| c.content.parts.first())
            .map(|p| p.text.clone())
            .context("No response from Gemini")?;

        // Extract Python code from markdown if present
        let script = self.extract_python_code(&script);

        Ok(script)
    }

    pub async fn interpret_command(&self, command: &str) -> Result<CommandResult> {
        let system_prompt = r##"You are a robot command interpreter. Parse natural language commands and return JSON.

Supported actions:
- "move": Move a specific servo to an angle
- "sequence": Execute a predefined sequence (WAVE, NOD_YES, SHAKE_NO, PICK_PLACE)
- "home": Return to home position
- "stop": Emergency stop
- "unknown": Command not recognized

Servo IDs:
- 0: Base (rotation)
- 1: Shoulder
- 2: Elbow
- 3: Gripper (60=open, 120=closed)

Return JSON in this format:
{
  "action": "move" | "sequence" | "home" | "stop" | "unknown",
  "servo": 0-3 (only for "move" action),
  "angle": 0-180 (only for "move" action),
  "sequence_name": "WAVE" | "NOD_YES" | "SHAKE_NO" | "PICK_PLACE" (only for "sequence" action),
  "message": "explanation text" (only for "unknown" action)
}

Examples:
- "wave" -> {"action": "sequence", "sequence_name": "WAVE"}
- "pick and place" -> {"action": "sequence", "sequence_name": "PICK_PLACE"}
- "move base to 45 degrees" -> {"action": "move", "servo": 0, "angle": 45}
- "open gripper" -> {"action": "move", "servo": 3, "angle": 60}
- "close gripper" -> {"action": "move", "servo": 3, "angle": 120}
- "go home" -> {"action": "home"}
- "stop" -> {"action": "stop"}

Now parse this command and respond with ONLY valid JSON:
"##;

        let full_prompt = format!("{}\n\nCommand: {}", system_prompt, command);

        let request = GeminiRequest {
            contents: vec![Content {
                parts: vec![Part {
                    text: full_prompt,
                }],
            }],
        };

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={}",
            self.api_key
        );

        let response = self
            .client
            .post(&url)
            .json(&request)
            .send()
            .await
            .context("Failed to send Gemini request")?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Gemini API error ({}): {}", status, error_text);
        }

        let gemini_response: GeminiResponse = response
            .json()
            .await
            .context("Failed to parse Gemini response")?;

        let response_text = gemini_response
            .candidates
            .first()
            .and_then(|c| c.content.parts.first())
            .map(|p| p.text.clone())
            .context("No response from Gemini")?;

        // Extract JSON from response (might be wrapped in markdown)
        let json_text = self.extract_json(&response_text);

        // Parse as CommandResult
        let result: CommandResult = serde_json::from_str(&json_text)
            .context("Failed to parse command result JSON")?;

        Ok(result)
    }

    fn extract_json(&self, text: &str) -> String {
        // Check if JSON is wrapped in markdown code blocks
        if text.contains("```json") {
            let start = text.find("```json").unwrap() + 7;
            let end = text[start..].find("```").unwrap_or(text.len() - start);
            text[start..start + end].trim().to_string()
        } else if text.contains("```") {
            let start = text.find("```").unwrap() + 3;
            let end = text[start..].find("```").unwrap_or(text.len() - start);
            text[start..start + end].trim().to_string()
        } else {
            text.trim().to_string()
        }
    }

    fn extract_python_code(&self, text: &str) -> String {
        // Check if code is wrapped in markdown code blocks
        if text.contains("```python") {
            let start = text.find("```python").unwrap() + 9;
            let end = text[start..].find("```").unwrap_or(text.len() - start);
            text[start..start + end].trim().to_string()
        } else if text.contains("```") {
            let start = text.find("```").unwrap() + 3;
            let end = text[start..].find("```").unwrap_or(text.len() - start);
            text[start..start + end].trim().to_string()
        } else {
            text.trim().to_string()
        }
    }
}

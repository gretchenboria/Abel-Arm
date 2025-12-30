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
- Servo 3: Gripper - 55=open, 125=closed

Use this Python API with smooth motion planning:

```python
import serial
import time
import math

ser = serial.Serial('/dev/cu.usbserial-140', 115200, timeout=1)
time.sleep(2)

current_positions = [90, 90, 90, 90]

def calculate_duration(start_angle, end_angle, speed_factor=1.2):
    """Calculate smooth movement duration based on angular distance"""
    distance = abs(end_angle - start_angle)
    base_duration = int(distance * speed_factor * 10)
    return max(400, min(base_duration, 3000))

def move_servo_smooth(servo_id, target_angle, duration_ms=None):
    """Move servo with calculated smooth motion"""
    if duration_ms is None:
        duration_ms = calculate_duration(current_positions[servo_id], target_angle)

    command = f"#{servo_id}M{target_angle}T{duration_ms}\n"
    ser.write(command.encode())
    current_positions[servo_id] = target_angle
    time.sleep(duration_ms / 1000.0 + 0.15)

def move_coordinated(movements, settle_time=0.2):
    """Execute multiple servo movements with coordination"""
    if not movements:
        return

    max_duration = 0
    for servo_id, target_angle in movements:
        duration = calculate_duration(current_positions[servo_id], target_angle)
        max_duration = max(max_duration, duration)

    for servo_id, target_angle in movements:
        command = f"#{servo_id}M{target_angle}T{max_duration}\n"
        ser.write(command.encode())
        current_positions[servo_id] = target_angle

    time.sleep(max_duration / 1000.0 + settle_time)

def move_trajectory(servo_id, waypoints, segment_duration=None):
    """Move through multiple waypoints smoothly"""
    for target in waypoints:
        duration = segment_duration or calculate_duration(current_positions[servo_id], target, 1.5)
        move_servo_smooth(servo_id, target, duration)

def go_home():
    """Return to home position with smooth coordinated motion"""
    move_coordinated([(0, 90), (1, 90), (2, 90), (3, 90)])

def pick_and_place():
    """Pick and place with smooth coordinated motion"""
    # Move to ready position with open gripper
    move_servo_smooth(3, 55, 600)
    time.sleep(0.1)
    move_coordinated([(1, 100), (2, 100)])

    # Approach object smoothly
    move_coordinated([(1, 135), (2, 155)])
    time.sleep(0.3)

    # Close gripper with firm grip
    move_servo_smooth(3, 125, 800)
    time.sleep(0.2)

    # Lift with coordinated motion
    move_coordinated([(1, 85), (2, 90)])
    time.sleep(0.2)

    # Rotate to target position
    move_servo_smooth(0, 135, None)
    time.sleep(0.2)

    # Lower to place position
    move_coordinated([(1, 135), (2, 155)])
    time.sleep(0.3)

    # Release gripper
    move_servo_smooth(3, 55, 800)
    time.sleep(0.2)

    # Return to home
    go_home()
```

CRITICAL MOTION PLANNING RULES:
1. Always use move_servo_smooth() for single servo movements - it calculates proper timing
2. Use move_coordinated() when multiple servos need to move together smoothly
3. Add settle_time delays (0.2-0.3s) after reaching positions before gripper operations
4. Never use fixed durations - let calculate_duration() compute based on angular distance
5. Gripper operations should have explicit durations: 600-800ms
6. Always include time.sleep() after movements for mechanical settling

Generate complete, executable Python scripts. Include imports, serial setup, and clean code structure.
Always close the serial connection at the end with: ser.close()

Examples:
- "wave" -> use move_trajectory for base servo
- "pick and place" -> use the pick_and_place function
- "open gripper" -> move_servo_smooth(3, 55, 600)
- "close gripper" -> move_servo_smooth(3, 125, 800)
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
- 3: Gripper (55=open, 125=closed)

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
- "open gripper" -> {"action": "move", "servo": 3, "angle": 55}
- "close gripper" -> {"action": "move", "servo": 3, "angle": 125}
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

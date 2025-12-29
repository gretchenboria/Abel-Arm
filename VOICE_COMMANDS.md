# Voice Control Guide

## Architecture

Abel Arm supports two voice control modes:

### Browser Mode (Default)
**Flow:** Click Mic → Browser Speech API → Gemini interprets → Robot executes

**Requirements:**
- Robot connected
- Valid `VITE_GEMINI_API_KEY` in `.env` file
- Chrome, Edge, or Safari browser
- Microphone permission granted

### Service Mode (Enhanced)
**Flow:** Click Mic → Browser Speech API → Local HTTP Service → Gemini interprets → Robot executes

**Advantages:**
- More reliable command interpretation
- Better structured prompts
- Shared logic with CLI
- No API key exposure in browser

**Setup:**
```bash
cd abel-voice-cli
cargo run -- serve --port 8080
```

GUI automatically detects and uses the service if available, falling back to browser mode if not.

## Supported Commands

**Sequences:**
- "wave" - Base rotates back/forth
- "pick and place" - Full pick/place sequence  
- "nod yes" - Elbow nods
- "shake no" - Base shakes

**Servo Control:**
- "move base to 45 degrees"
- "open gripper" (60°)
- "close gripper" (120°)

**Control:**
- "go home" - Return to 90°
- "stop" - Emergency stop

## Constraints

**Angle Limits:** 0-180° (Gripper: 60-120°)
**API Limits:** 15 requests/min (free tier)
**Connection:** Robot must be connected
**Language:** English only

## Rust CLI Modes

**Location:** `/Users/dr.gretchenboria/abel-arm/abel-voice-cli/`

### HTTP Service Mode
Start service for GUI integration:
```bash
cd abel-voice-cli
cargo run -- serve --port 8080
```

### Interactive Session Mode
Continuous voice control with script generation:
```bash
cd abel-voice-cli
cargo run -- session
```
- Uses OpenAI Whisper (better accuracy than browser)
- Generates and saves Python scripts
- Runs scripts in isolated venv
- Terminal-based with confirmations

### One-Shot Mode
Single command execution:
```bash
cargo run -- once --save my-script.py
```

### Script Execution Mode
Run saved Python scripts:
```bash
cargo run -- run scripts/cmd_001.py
```

## Comparison

| Feature | Browser Mode | Service Mode | CLI Session |
|---------|-------------|--------------|-------------|
| Transcription | Browser API | Browser API | OpenAI Whisper |
| Interpretation | Direct Gemini | Service Gemini | Service Gemini |
| Script Generation | No | No | Yes |
| Visual Feedback | Yes | Yes | No |
| Best For | Quick testing | Reliable commands | Automation |


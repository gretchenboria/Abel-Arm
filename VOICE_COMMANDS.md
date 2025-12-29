# Voice Control Guide

## How It Works

**Flow:** Click Mic → Speak → Browser transcribes → Gemini interprets → Robot executes

**Requirements:**
1. Robot MUST be connected first (voice button disabled otherwise)
2. Valid `VITE_GEMINI_API_KEY` in `.env` file
3. Chrome, Edge, or Safari browser
4. Microphone permission granted

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

## Rust CLI Location

**Path:** `/Users/dr.gretchenboria/abel-arm/abel-voice-cli/`

**How it's different:**
- Uses OpenAI Whisper (better accuracy than browser)
- Generates Python scripts that are saved
- Runs scripts in isolated venv
- Terminal-based, no GUI

**Usage:**
```bash
cd abel-voice-cli
cargo run -- session
# Or
cargo run -- once --save my-script.py
```

**When to use:**
- Web voice: Quick testing, visual feedback
- Rust CLI: Better transcription, script generation, automation


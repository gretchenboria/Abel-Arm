# Abel Voice CLI

A voice-controlled Rust CLI that uses AI to generate and execute Python robot control scripts from natural language commands.

## Why CLIs are Cool Again

CLIs are making a comeback because they're:
- **Fast**: No browser overhead, direct system access
- **Composable**: Pipe commands, chain operations, integrate with existing tools
- **AI-Friendly**: Perfect for AI workflows - generate code, execute, iterate
- **Scriptable**: Automate complex sequences easily
- **Portable**: One binary, runs anywhere

## Features

- 🎤 **Voice Control**: Speak naturally to control your robot arm
- 🤖 **AI-Powered**: Gemini AI generates Python scripts from your voice commands
- 🔊 **Speech-to-Text**: OpenAI Whisper for accurate transcription
- 🗣️ **Text-to-Speech**: Deepgram for high-quality voice feedback (optional)
- 💾 **Auto-Save**: All generated scripts saved automatically
- 🐍 **Python Venv**: Isolated environment for safe script execution
- ⚡ **Interactive Sessions**: Keep talking, keep controlling

## Architecture

```
User Voice → Whisper API → Transcript → Gemini AI → Python Script → Execute in venv → Robot
                                                         ↓
                                                    Auto-save to disk
```

## Installation

### Prerequisites

- Rust (install from https://rustup.rs)
- Python 3.7+ (for script execution)
- Microphone access

### Setup

1. Clone the repository:
```bash
cd abel-arm/abel-voice-cli
```

2. Copy `.env.example` to `.env` and add your API keys:
```bash
cp .env.example .env
# Edit .env with your actual API keys
```

3. Build the CLI:
```bash
cargo build --release
```

4. (Optional) Install globally:
```bash
cargo install --path .
```

## Usage

### Interactive Voice Session

Start a continuous voice control session:

```bash
cargo run -- session

# With text-to-speech feedback:
cargo run -- session --tts

# Save scripts to custom directory:
cargo run -- session --output-dir ~/robot-scripts
```

**How it works:**
1. Speak a command (e.g., "pick up the block and move it 45 degrees")
2. CLI transcribes your voice with Whisper
3. Gemini generates a Python script
4. Review the generated script
5. Confirm to execute or skip
6. Repeat!

### One-Shot Command

Execute a single voice command:

```bash
# Basic usage:
cargo run -- once

# Save the generated script:
cargo run -- once --save my-command.py

# With text-to-speech:
cargo run -- once --tts
```

### HTTP Service Mode

Start the HTTP service for GUI integration:

```bash
# Start on default port (8080):
cargo run -- serve

# Start on custom port:
cargo run -- serve --port 3000
```

**What it does:**
- Provides HTTP endpoints for the web GUI
- `/health` - Service health check
- `/interpret` - Interpret voice transcript into robot commands
- Enables better command interpretation in the web interface
- GUI automatically detects and uses the service when running

**Benefits:**
- No need to expose API keys in browser
- Shared command interpretation logic
- More reliable than browser-only mode
- Can run alongside web interface

### Run Saved Script

Execute a previously generated script:

```bash
cargo run -- run scripts/cmd_001.py
```

### Calibrate Servos

Interactive servo calibration to find min/max angles:

```bash
# Calibrate specific servo:
cargo run -- calibrate --servo 0

# Interactive selection:
cargo run -- calibrate
```

Enter angles 0-180 to test servo range. Type 'q' to quit.

### Test Smooth Motion

Test servo smoothing with different durations:

```bash
# Default test (Base servo, 45-135°, 1000ms):
cargo run -- smooth

# Custom parameters:
cargo run -- smooth --servo 1 --from 30 --to 150 --duration 2000

# Quick test:
cargo run -- smooth -s 2 --from 60 --to 120 -d 500
```

Tests back-and-forth motion to verify smooth acceleration/deceleration.

## Example Commands

Try saying:

- **"Wave"** - Robot waves back and forth
- **"Pick and place"** - Picks up object, moves 45°, places it down
- **"Open the gripper"** - Opens the gripper fully
- **"Close the gripper"** - Closes the gripper
- **"Go home"** - Returns to neutral position
- **"Move base to 120 degrees"** - Precise servo control
- **"Rotate base left and then open gripper"** - Multi-step commands

## Generated Scripts

Scripts are automatically saved in the `scripts/` directory (or your custom `--output-dir`):

```
scripts/
├── cmd_001.py  # First command
├── cmd_002.py  # Second command
└── ...
```

Each script is a complete, executable Python program that:
- Initializes serial connection
- Defines helper functions
- Executes your command
- Closes connection cleanly

## API Keys

### OpenAI (Whisper)
Get your API key at: https://platform.openai.com/api-keys

### Google Gemini
Get your API key at: https://aistudio.google.com/app/apikey

### Deepgram (Optional)
Get your API key at: https://console.deepgram.com/

## Troubleshooting

### "OPENAI_API_KEY environment variable not set"
- Make sure you created a `.env` file (not `.env.example`)
- Check that your `.env` contains `OPENAI_API_KEY=sk-...`

### "No input device available"
- Check microphone permissions
- macOS: System Preferences → Security & Privacy → Microphone
- Linux: Check `pactl list sources`

### "Failed to create virtual environment"
- Ensure Python 3 is installed: `python3 --version`
- Install python3-venv: `sudo apt install python3-venv` (Linux)

### Serial port issues
- Make sure robot arm is connected via USB
- Check device path (may need to change `/dev/ttyUSB0` to your actual port)
- Add user to dialout group: `sudo usermod -a -G dialout $USER` (Linux)

## Integration with Existing Web Interface

The Rust CLI complements the web interface by providing:
- Offline voice control (no browser required)
- Faster execution (native code)
- Script generation and reuse
- Better speech recognition (Whisper > Web Speech API)
- Higher quality TTS (Deepgram > Browser TTS)

Both can be used together:
- Use CLI for quick voice commands and script generation
- Use web interface for visual control and monitoring
- Share the same robot firmware and serial protocol

## Development

### Project Structure

```
src/
├── main.rs       # CLI entry point and command handlers
├── server.rs     # HTTP service for GUI integration
├── audio.rs      # Audio recording with cpal
├── whisper.rs    # OpenAI Whisper API client
├── gemini.rs     # Google Gemini API client (script generation + interpretation)
├── deepgram.rs   # Deepgram TTS client
└── executor.rs   # Python script execution in venv
```

### Building

```bash
# Development build:
cargo build

# Release build (optimized):
cargo build --release

# Run tests:
cargo test

# Run with logging:
RUST_LOG=debug cargo run -- session
```

## License

MIT

## Contributing

Issues and PRs welcome! This is an experimental project exploring AI-powered robot control.

---

Built with:
- [Rust](https://www.rust-lang.org/) - Systems programming language
- [OpenAI Whisper](https://openai.com/research/whisper) - Speech recognition
- [Google Gemini](https://deepmind.google/technologies/gemini/) - Code generation
- [Deepgram](https://deepgram.com/) - Text-to-speech
- [cpal](https://github.com/RustAudio/cpal) - Audio I/O

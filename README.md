# Abel Arm Control

A web-based interface for controlling the SIYEENOVE Smart Robot Arm (ESP32-C3/Arduino). Control via web GUI, voice commands, or Rust CLI.

## Quick Start (Choose ONE Method)

### Method 1: Web GUI Only (Simplest)
1. Connect robot arm via USB
2. Start dev server: `npm run dev`
3. Open browser to `http://localhost:5173`
4. Click "Connect Arm" and use manual controls

### Method 2: Web GUI + Voice Service (Better Voice Recognition)
1. Start voice service: `cd abel-voice-cli && cargo run -- serve`
2. Start dev server: `npm run dev` (in separate terminal)
3. Open browser to `http://localhost:5173`
4. GUI automatically uses service for voice commands

### Method 3: Rust CLI Only (Best Transcription, No Browser)
1. Navigate: `cd abel-voice-cli`
2. Run: `cargo run -- once` (single command)
3. OR: `cargo run -- session` (continuous commands)
4. Speak when prompted - uses OpenAI Whisper for accurate transcription

All three methods control the same robot. Use whichever fits your workflow.

## Important: Environment Requirements

The Web Serial API has strict security requirements.

### Supported Environments
* Localhost: `http://localhost:port` or `http://127.0.0.1:port` (Treated as secure by browsers).
* HTTPS: `https://your-website.com` (Requires valid SSL certificate).
* Browsers: Google Chrome, Microsoft Edge, Opera.

### Unsupported Environments
* File Protocol: `file:///C:/Users/.../index.html` (The API is blocked here).
* Standard HTTP: `http://192.168.1.5` (Blocked, unless it's localhost).
* Browsers: Firefox (No Web Serial support yet), Safari.

---

## Installation & Running

Since you cannot use `file://`, choose one of these methods to run the app:

### Option A: Node.js (Recommended)
If you have Node/NPM installed:
```bash
npx serve
# Open http://localhost:3000
```
Or if using Vite:
```bash
npm run dev
# Open http://localhost:5173
```

### Option B: Python
Every macOS/Linux machine (and many Windows) has Python installed:
```bash
python -m http.server 8000
# Open http://localhost:8000
```

### Option C: VS Code
1. Install "Live Server" extension.
2. Right-click `index.html`.
3. Select "Open with Live Server".

## Troubleshooting

### "System Alert: Insecure Context"
*   **Problem**: You are probably opening the `index.html` file directly or using an IP address like `192.168.x.x` without HTTPS.
*   **Fix**: Use `http://localhost` or `http://127.0.0.1`.

### "Port Busy" or "NetworkError"
*   **Problem**: The USB port is locked by another program.
*   **Fix**: Close the Arduino IDE, Python scripts, or any slicer software (Cura) that might auto-connect to COM ports. Unplug and replug the USB cable.

### "No Device Selected"
*   **Problem**: You canceled the selection dialog.
*   **Fix**: Click Connect again and select the device named "USB Serial", "CP210x", or "CH340".

### Linux Permissions
If you are on Linux and cannot connect:
```bash
sudo usermod -a -G dialout $USER
# Then restart your computer or log out/in
```

## Features

* Manual servo control via sliders
* Pre-programmed movement sequences (Wave, Nod, Shake, Hand Over)
* Voice control using speech recognition and natural language processing
* Home position reset
* Emergency stop with automatic return to home
* Real-time serial communication logging
* Smooth trajectory motion with progressive deceleration

## Configuration

The application requires environment variables for voice control functionality. Create a `.env` file in the project root:

```
VITE_GEMINI_API_KEY=your_api_key_here
VITE_ELEVENLABS_VOICE_ID=your_voice_id_here
VITE_ELEVENLABS_API_KEY=your_api_key_here
```

Note: The `.env` file is gitignored and should never be committed to version control.

## Architecture

* Frontend: React (v19), TypeScript, Tailwind CSS
* Communication: Web Serial API
* Motion Control: Firmware-side trajectory interpolation with cubic easing
* Voice: Web Speech API + Gemini function calling for natural language commands

### Protocol

Two command types:

1. Instant move: `#<servo>P<pulse>\n`
2. Smooth move: `#<servo>S<pulse>T<duration>\n`

Smooth motion is interpolated on the ESP32 firmware for consistent timing without serial latency.

## Documentation

- [Voice Control Guide](VOICE_CONTROL.md) - Voice commands and Gemini API integration
- [Firmware Documentation](FIRMWARE.md) - Motion control architecture and protocol details

## Testing

Validate voice control integration:
```bash
node test_voice_control.js
```

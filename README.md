# Abel Arm Control

A web-based interface for controlling the SIYEENOVE Smart Robot Arm (ESP32-C3/Arduino). This application allows for direct control of 4 servos via the Web Serial API.

## Quick Start

1. Connect Hardware: Plug in your Robot Arm via USB.
2. Serve Application: You must run this app via a local web server (see below).
3. Connect in Browser: Open the URL (e.g., `http://localhost:5173`) in Chrome or Edge.

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
* Protocol: Sends string commands (e.g., `#0P1500\n`) matching the robot's firmware expectations
* Voice: Browser Speech Recognition API with AI command interpretation

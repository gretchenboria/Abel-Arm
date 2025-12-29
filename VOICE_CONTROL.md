# Voice Control Documentation

## Overview

Voice control uses Web Speech Recognition API for speech-to-text, then Gemini API for natural language interpretation via function calling.

## Architecture

```
User Speech → Web Speech API → Transcript → Gemini API → Function Calls → Robot Actions
```

## Setup

1. Add API key to `.env`:
```
VITE_GEMINI_API_KEY=your_key_here
```

2. API key is loaded via `import.meta.env.VITE_GEMINI_API_KEY`

3. Model: `gemini-2.0-flash-exp`

## Supported Commands

### Servo Movement
- "move base to 45 degrees"
- "rotate shoulder to 120"
- "open gripper" (60 degrees)
- "close gripper" (120 degrees)

### Sequences
- "wave"
- "nod yes"
- "shake no"
- "hand over"
- "pick and place"

### Control
- "go home"
- "stop"

### Multi-Step
- "move base to 90 and open the gripper"

## Function Declarations

The system uses 4 function declarations:

1. **move_servo(servo, angle)**
   - servo: 0=Base, 1=Shoulder, 2=Elbow, 3=Gripper
   - angle: 0-180 degrees

2. **run_sequence(sequence_name)**
   - sequence_name: WAVE, NOD_YES, SHAKE_NO, HAND_OVER, PICK_PLACE

3. **go_home()**
   - Returns all servos to 90 degrees

4. **stop()**
   - Emergency stop, returns to home

## Testing

Run the test suite with your API key:
```bash
GEMINI_API_KEY=your_key_here node test_voice_control.js
```

IMPORTANT: Never commit API keys to version control. Use environment variables only.

This validates:
- API connectivity
- Simple servo commands
- Sequence commands
- Multi-step commands
- Natural language variations

## Implementation Details

### VoiceService Class
- Location: `services/voiceService.ts`
- Methods:
  - `isSupported()`: Checks if Web Speech API available
  - `listen()`: Starts speech recognition, returns transcript
  - `interpretCommand(transcript)`: Sends to Gemini, returns command object
  - `stop()`: Stops listening

### Command Flow

1. User clicks microphone button
2. `startListening()` called in `useAbel` hook
3. Web Speech API captures audio
4. Transcript sent to Gemini API with function declarations
5. Gemini returns function call(s)
6. Commands executed sequentially
7. Feedback shown in Terminal section

## Error Handling

- No speech detected: Times out after silence
- API error: Shows error message in Terminal
- Unrecognized command: Shows what was heard but couldn't interpret
- No browser support: Button disabled with message

## Browser Compatibility

Requires Web Speech API support:
- Chrome (desktop/mobile)
- Edge
- Safari (iOS 14.5+)
- NOT supported: Firefox

## API Rate Limits

Free tier: 15 requests per minute
If quota exceeded, upgrade to Gemini 2.5 Flash or use paid tier.

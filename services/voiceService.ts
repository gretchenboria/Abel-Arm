const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

interface VoiceCommand {
  action: 'move' | 'sequence' | 'home' | 'stop' | 'unknown';
  servo?: number;
  angle?: number;
  sequenceName?: string;
}

class VoiceService {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  async listen(): Promise<string> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    return new Promise((resolve, reject) => {
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      this.recognition.onerror = (event: any) => {
        reject(new Error(event.error));
      };

      this.recognition.start();
      this.isListening = true;
    });
  }

  async interpretCommand(transcript: string): Promise<VoiceCommand> {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a robot arm command interpreter. Parse the following voice command and return ONLY a JSON object with no markdown formatting or additional text.

The robot has:
- Servo 0: Base (rotation)
- Servo 1: Shoulder
- Servo 2: Elbow
- Servo 3: Gripper
- Sequences: wave, nod yes, shake no, hand over

Return JSON format:
{"action": "move|sequence|home|stop|unknown", "servo": 0-3, "angle": 0-180, "sequenceName": "WAVE|NOD_YES|SHAKE_NO|HAND_OVER"}

Examples:
"move base to 90 degrees" -> {"action":"move","servo":0,"angle":90}
"wave" -> {"action":"sequence","sequenceName":"WAVE"}
"go home" -> {"action":"home"}
"stop" -> {"action":"stop"}

Command: "${transcript}"`
            }]
          }]
        })
      });

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text.trim();

      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Failed to interpret command:', error);
      return { action: 'unknown' };
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

export const voiceService = new VoiceService();

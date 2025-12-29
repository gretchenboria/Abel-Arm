const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface VoiceCommand {
  action: 'move' | 'sequence' | 'home' | 'stop' | 'unknown' | 'multi';
  servo?: number;
  angle?: number;
  sequenceName?: string;
  commands?: VoiceCommand[];
  message?: string;
}

const FUNCTION_DECLARATIONS = [
  {
    name: 'move_servo',
    description: 'Move a specific servo to a target angle. Use this for precise control of individual joints.',
    parameters: {
      type: 'object',
      properties: {
        servo: {
          type: 'integer',
          description: 'Servo ID: 0=Base (rotation), 1=Shoulder, 2=Elbow, 3=Gripper'
        },
        angle: {
          type: 'integer',
          description: 'Target angle in degrees (0-180). For gripper: 60=open, 120=closed'
        }
      },
      required: ['servo', 'angle']
    }
  },
  {
    name: 'run_sequence',
    description: 'Execute a pre-programmed movement sequence.',
    parameters: {
      type: 'object',
      properties: {
        sequence_name: {
          type: 'string',
          description: 'Name of the sequence to run',
          enum: ['WAVE', 'NOD_YES', 'SHAKE_NO', 'PICK_PLACE']
        }
      },
      required: ['sequence_name']
    }
  },
  {
    name: 'go_home',
    description: 'Return all servos to the home position (90 degrees center).',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'stop',
    description: 'Emergency stop. Halt any running sequence and return to home.',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
];

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
              text: `Robot control command: "${transcript}"\n\nInterpret this natural language command and call the appropriate function(s). You can chain multiple function calls for complex commands.`
            }]
          }],
          tools: [{
            function_declarations: FUNCTION_DECLARATIONS
          }]
        })
      });

      const data = await response.json();

      if (!data.candidates || !data.candidates[0]) {
        console.error('No candidates in response:', data);
        return { action: 'unknown', message: 'No response from AI' };
      }

      const candidate = data.candidates[0];

      // Check if LLM wants to call functions
      if (candidate.content?.parts?.[0]?.functionCall) {
        const functionCall = candidate.content.parts[0].functionCall;
        return this.convertFunctionCallToCommand(functionCall);
      }

      // Check for multiple function calls
      if (candidate.content?.parts && candidate.content.parts.length > 1) {
        const commands: VoiceCommand[] = [];
        for (const part of candidate.content.parts) {
          if (part.functionCall) {
            commands.push(this.convertFunctionCallToCommand(part.functionCall));
          }
        }
        if (commands.length > 0) {
          return { action: 'multi', commands };
        }
      }

      // Fallback: LLM responded with text instead of function call
      const text = candidate.content?.parts?.[0]?.text;
      if (text) {
        return { action: 'unknown', message: text };
      }

      return { action: 'unknown', message: 'Could not interpret command' };
    } catch (error) {
      console.error('Failed to interpret command:', error);
      return { action: 'unknown', message: 'Error processing command' };
    }
  }

  private convertFunctionCallToCommand(functionCall: any): VoiceCommand {
    const name = functionCall.name;
    const args = functionCall.args || {};

    switch (name) {
      case 'move_servo':
        return {
          action: 'move',
          servo: args.servo,
          angle: args.angle
        };
      case 'run_sequence':
        return {
          action: 'sequence',
          sequenceName: args.sequence_name
        };
      case 'go_home':
        return { action: 'home' };
      case 'stop':
        return { action: 'stop' };
      default:
        return { action: 'unknown', message: `Unknown function: ${name}` };
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

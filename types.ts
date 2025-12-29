export enum ServoId {
  Base = 0,
  Shoulder = 1,
  Elbow = 2,
  Gripper = 3,
}

export interface RobotState {
  [ServoId.Base]: number;
  [ServoId.Shoulder]: number;
  [ServoId.Elbow]: number;
  [ServoId.Gripper]: number;
}

export type Mood = 'neutral' | 'annoyed' | 'working' | 'emo' | 'happy';

export interface LogMessage {
  id: string;
  text: string;
  sender: 'System' | 'Abel';
  timestamp: number;
}

// Web Serial API Types (Experimental)
export interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: WritableStream<Uint8Array>;
}

export interface NavigatorWithSerial extends Navigator {
  serial: {
    requestDevice(options?: { filters: any[] }): Promise<SerialPort>;
  };
}
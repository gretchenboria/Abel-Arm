import { ServoId } from '../types';

// The protocol from the Python script:
// pulse = int(500 + (angle / 180.0) * 2000)
// command = f"#{servo}P{pulse}\n"

interface ConnectResult {
  success: boolean;
  error?: string;
}

class SerialService {
  private port: any | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private textEncoder = new TextEncoder();

  async connect(): Promise<ConnectResult> {
    // 1. Diagnostic Check: Environment
    if (!("serial" in navigator)) {
      if (!window.isSecureContext) {
        return { 
          success: false, 
          error: "Insecure Context. Web Serial requires HTTPS or localhost." 
        };
      }
      return { 
        success: false, 
        error: "Browser unsupported. Please use Chrome, Edge, or Opera." 
      };
    }

    const serial = (navigator as any).serial;

    try {
      // 2. Request the device (opens the browser dialog)
      // filters: [] allows all standard serial devices
      this.port = await serial.requestDevice({ filters: [] });
      
      // 3. Open the port
      // standard ESP32/Arduino config: 115200, 8, 1, None
      await this.port.open({ 
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none"
      }); 

      // 4. Set Signals (Crucial for some ESP32/CP210x chips to start communication)
      // DTR/RTS false usually prevents resetting the board, or allows it to run normal firmware
      try {
        await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });
      } catch (e) {
        console.warn("Could not set signals, continuing anyway:", e);
      }
      
      if (this.port.writable) {
        this.writer = this.port.writable.getWriter();
        return { success: true };
      }
      return { success: false, error: "Port connected but not writable." };

    } catch (error: any) {
      console.error("Connection failed details:", error);
      
      let errorMessage = "Unknown connection error.";
      
      if (error.name === 'NotFoundError') {
        errorMessage = "No device selected.";
      } else if (error.name === 'SecurityError') {
        errorMessage = "Security Blocked. HTTPS required.";
      } else if (error.name === 'NetworkError') {
        errorMessage = "Port Busy. Unplug/Replug device.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Cleanup
      await this.disconnect();

      return { success: false, error: errorMessage };
    }
  }

  async disconnect() {
    if (this.writer) {
      try {
        await this.writer.releaseLock();
      } catch (e) { console.error(e); }
      this.writer = null;
    }
    if (this.port) {
      try {
        await this.port.close();
      } catch (e) { console.error(e); }
      this.port = null;
    }
  }

  private angleToPulse(angle: number): number {
    // 0 deg = 500, 180 deg = 2500
    return Math.floor(500 + (angle / 180.0) * 2000);
  }

  async sendCommand(servo: ServoId, angle: number) {
    if (!this.writer) return;

    // Safety clamping
    const safeAngle = Math.max(0, Math.min(180, angle));
    const pulse = this.angleToPulse(safeAngle);
    
    // Protocol: #{servo}P{pulse}\r\n 
    // Adding \r just in case, though \n is standard for the python script provided
    const command = `#${servo}P${pulse}\r\n`;
    
    try {
      await this.writer.write(this.textEncoder.encode(command));
    } catch (e) {
      console.error("Error writing to serial port:", e);
      // Attempt to recover writer if lost? 
      // usually requires reconnection
    }
  }
}

export const serialService = new SerialService();
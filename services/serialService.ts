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
      // Clean up any existing connection first
      if (this.port) {
        console.log('[SERIAL] Cleaning up existing connection...');
        await this.disconnect();
      }

      // 2. Request the device (opens the browser dialog)
      // filters: [] allows all standard serial devices
      this.port = await serial.requestPort({ filters: [] });

      console.log('[SERIAL] Port selected, opening connection...');

      // 3. Open the port (check if already open first)
      if (!this.port.readable || !this.port.writable) {
        // standard ESP32/Arduino config: 115200, 8, 1, None
        await this.port.open({
          baudRate: 115200,
          dataBits: 8,
          stopBits: 1,
          parity: "none",
          flowControl: "none"
        });
      } else {
        console.log('[SERIAL] Port already open, reusing connection');
      }

      console.log('[SERIAL] Port opened successfully');

      // 4. Set Signals (Crucial for some ESP32/CP210x chips to start communication)
      // DTR/RTS false usually prevents resetting the board, or allows it to run normal firmware
      try {
        await this.port.setSignals({ dataTerminalReady: true, requestToSend: false });
        console.log('[SERIAL] DTR/RTS signals set');
      } catch (e) {
        console.warn("Could not set signals, continuing anyway:", e);
      }

      // 5. CRITICAL: Wait for connection to stabilize (like Python script does)
      console.log('[SERIAL] Waiting 2 seconds for connection to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (this.port.writable) {
        this.writer = this.port.writable.getWriter();
        console.log('[SERIAL] Writer acquired, connection ready!');
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
    console.log('[SERIAL] Disconnecting...');

    // Release writer lock first
    if (this.writer) {
      try {
        this.writer.releaseLock();
        console.log('[SERIAL] Writer lock released');
      } catch (e) {
        console.error('[SERIAL] Error releasing writer:', e);
      }
      this.writer = null;
    }

    // Then close the port
    if (this.port) {
      try {
        await this.port.close();
        console.log('[SERIAL] Port closed');
      } catch (e) {
        console.error('[SERIAL] Error closing port:', e);
      }
      this.port = null;
    }
  }

  private angleToPulse(angle: number): number {
    // 0 deg = 500, 180 deg = 2500
    return Math.floor(500 + (angle / 180.0) * 2000);
  }

  // Easing function for smooth motion (ease-in-out cubic)
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  async sendCommand(servo: ServoId, angle: number) {
    if (!this.writer) {
      console.warn('[SERIAL] Cannot send command - no writer available');
      return;
    }

    // Safety clamping
    const safeAngle = Math.max(0, Math.min(180, angle));
    const pulse = this.angleToPulse(safeAngle);

    // Protocol: #{servo}P{pulse}\n (instant move)
    const command = `#${servo}P${pulse}\n`;

    console.log(`[SERIAL] Instant move: Servo ${servo} -> ${safeAngle}° (${pulse}us)`);

    try {
      await this.writer.write(this.textEncoder.encode(command));
    } catch (e) {
      console.error("Error writing to serial port:", e);
    }
  }

  async sendCommandSmooth(servo: ServoId, targetAngle: number, currentAngle: number, duration: number = 600) {
    if (!this.writer) {
      console.warn('[SERIAL] Cannot send command - no writer available');
      return;
    }

    const safeTargetAngle = Math.max(0, Math.min(180, targetAngle));

    // Skip if no movement needed
    if (Math.abs(targetAngle - currentAngle) < 1) {
      return;
    }

    const targetPulse = this.angleToPulse(safeTargetAngle);

    // Clamp duration to firmware limits (100-10000ms)
    const safeDuration = Math.max(100, Math.min(10000, Math.floor(duration)));

    // Protocol: #{servo}S{pulse}T{duration}\n (smooth move)
    // The firmware handles all interpolation with consistent timing
    const command = `#${servo}S${targetPulse}T${safeDuration}\n`;

    console.log(`[SERIAL] Smooth move: Servo ${servo} -> ${safeTargetAngle}° (${targetPulse}us) over ${safeDuration}ms`);

    try {
      await this.writer.write(this.textEncoder.encode(command));
    } catch (e) {
      console.error("Error writing to serial port:", e);
    }
  }
}

export const serialService = new SerialService();
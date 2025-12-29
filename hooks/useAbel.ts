import { useState, useCallback, useEffect } from 'react';
import { serialService } from '../services/serialService';
import { RobotState, ServoId, Mood, LogMessage } from '../types';
import { INITIAL_POSITIONS, ABEL_QUOTES } from '../constants';

export const useAbel = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [positions, setPositions] = useState<RobotState>(INITIAL_POSITIONS);
  const [mood, setMood] = useState<Mood>('neutral');
  const [logs, setLogs] = useState<LogMessage[]>([]);

  const addLog = useCallback((text: string, sender: 'System' | 'Abel' = 'System') => {
    setLogs(prev => [...prev.slice(-4), { // Keep last 5 messages
      id: Math.random().toString(36).substr(2, 9),
      text,
      sender,
      timestamp: Date.now()
    }]);
  }, []);

  // Check environment on mount with detailed diagnostics
  useEffect(() => {
    const checkSupport = () => {
      // 1. Check for Secure Context
      if (!window.isSecureContext) {
        addLog("CRITICAL: Insecure Context.", "System");
        addLog("FIX: Must use HTTPS or localhost.", "System");
        return;
      }

      // 2. Check for API existence
      if (!('serial' in navigator)) {
        addLog("CRITICAL: Web Serial API missing.", "System");
        addLog("FIX: Use Chrome, Edge, or Opera.", "System");
        return;
      }
      
      addLog("System initialized. Driver ready.", "System");
    };

    checkSupport();
  }, [addLog]);

  const speak = useCallback(() => {
    const quote = ABEL_QUOTES[Math.floor(Math.random() * ABEL_QUOTES.length)];
    addLog(quote, 'Abel');
    setMood('emo');
    setTimeout(() => setMood('neutral'), 3000);
  }, [addLog]);

  const toggleSimulation = useCallback(() => {
    if (isSimulated) {
      setIsSimulated(false);
      addLog("Waking up from the dream...", "System");
    } else {
      setIsSimulated(true);
      addLog("Entering Dream Mode. Hardware bypassed.", "System");
      speak();
    }
  }, [isSimulated, addLog, speak]);

  const connect = useCallback(async () => {
    addLog("Attempting to summon Abel...", "System");
    
    try {
      const result = await serialService.connect();
      
      setIsConnected(result.success);
      
      if (result.success) {
        addLog("Connection established. Ugh.", "Abel");
        setMood('annoyed');
      } else {
        addLog(`Error: ${result.error}`, "System");
        if (result.error?.includes("Port Busy")) {
          addLog("CHECK: Close Python/Arduino apps.", "System");
        }
      }
    } catch (e) {
      addLog(`Critical Failure: ${e}`, "System");
    }
  }, [addLog]);

  const disconnect = useCallback(async () => {
    if (isConnected) {
      await serialService.disconnect();
      setIsConnected(false);
      addLog("Disconnected. Finally, peace.", "Abel");
    }
  }, [addLog, isConnected]);

  const moveServo = useCallback(async (id: ServoId, angle: number) => {
    if (!isConnected && !isSimulated) return;
    
    // Update local state immediately for UI responsiveness
    setPositions(prev => ({ ...prev, [id]: angle }));
    
    if (isConnected) {
      // Send to hardware
      await serialService.sendCommand(id, angle);
    } else if (isSimulated) {
      // Fake delay for realism
      // await new Promise(r => setTimeout(r, 10)); 
    }
  }, [isConnected, isSimulated]);

  // Execute a predefined sequence of moves
  const runSequence = useCallback(async (sequence: { servo: ServoId, angle: number, delay: number }[]) => {
    if (!isConnected && !isSimulated) {
      addLog("I can't move if I'm not connected...", "Abel");
      return;
    }

    setMood('working');
    addLog("Executing sequence... if I must.", "Abel");

    for (const step of sequence) {
      await moveServo(step.servo, step.angle);
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }

    setMood('neutral');
    speak(); // Say something emo after finishing
  }, [isConnected, isSimulated, moveServo, addLog, speak]);

  return {
    isConnected,
    isSimulated,
    positions,
    mood,
    logs,
    connect,
    disconnect,
    toggleSimulation,
    moveServo,
    runSequence,
    speak
  };
};
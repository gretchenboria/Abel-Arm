import { useState, useCallback, useEffect, useRef } from 'react';
import { serialService } from '../services/serialService';
import { voiceService } from '../services/voiceService';
import { RobotState, ServoId, Mood, LogMessage } from '../types';
import { INITIAL_POSITIONS, ABEL_QUOTES, SEQUENCES } from '../constants';

export const useAbel = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [positions, setPositions] = useState<RobotState>(INITIAL_POSITIONS);
  const [mood, setMood] = useState<Mood>('neutral');
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isRunningSequence, setIsRunningSequence] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const stopSequenceRef = useRef(false);
  const movingServos = useRef<Set<ServoId>>(new Set());
  const moveTimeouts = useRef<Map<ServoId, number>>(new Map());

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

  const moveServo = useCallback(async (id: ServoId, angle: number, smooth: boolean = true, debounce: boolean = false) => {
    if (!isConnected && !isSimulated) return;

    const currentAngle = positions[id];

    // Update local state immediately for UI responsiveness
    setPositions(prev => ({ ...prev, [id]: angle }));

    // Clear existing timeout for this servo if debouncing
    if (debounce) {
      const existingTimeout = moveTimeouts.current.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeoutId = window.setTimeout(async () => {
        if (isConnected) {
          if (smooth) {
            await serialService.sendCommandSmooth(id, angle, currentAngle, 400);
          } else {
            await serialService.sendCommand(id, angle);
          }
        }
        moveTimeouts.current.delete(id);
      }, 100); // 100ms debounce

      moveTimeouts.current.set(id, timeoutId);
      return;
    }

    // Immediate execution (no debounce)
    if (isConnected) {
      if (smooth) {
        await serialService.sendCommandSmooth(id, angle, currentAngle, 400);
      } else {
        await serialService.sendCommand(id, angle);
      }
    } else if (isSimulated) {
      // Simulated mode - no actual hardware
    }
  }, [isConnected, isSimulated, positions]);

  // Return to home position (all servos at 90 degrees) with smooth deceleration
  const goHome = useCallback(async () => {
    if (!isConnected && !isSimulated) {
      addLog("I can't move if I'm not connected...", "Abel");
      return;
    }

    addLog("Returning home...", "System");
    setMood('working');

    // Move all servos to center position smoothly in sequence
    await moveServo(ServoId.Gripper, 90, true);
    await new Promise(resolve => setTimeout(resolve, 100));
    await moveServo(ServoId.Elbow, 90, true);
    await new Promise(resolve => setTimeout(resolve, 100));
    await moveServo(ServoId.Shoulder, 90, true);
    await new Promise(resolve => setTimeout(resolve, 100));
    await moveServo(ServoId.Base, 90, true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setMood('neutral');
    addLog("Home position reached.", "Abel");
  }, [isConnected, isSimulated, moveServo, addLog]);

  // Stop any running sequence and return home
  const stopSequence = useCallback(async () => {
    stopSequenceRef.current = true;
    setIsRunningSequence(false);
    setMood('neutral');
    addLog("Stopping...", "System");

    // Return to home position
    await new Promise(resolve => setTimeout(resolve, 200));
    await goHome();
  }, [addLog, goHome]);

  // Execute a predefined sequence of moves
  const runSequence = useCallback(async (sequence: { servo: ServoId, angle: number, delay: number }[]) => {
    if (!isConnected && !isSimulated) {
      addLog("I can't move if I'm not connected...", "Abel");
      return;
    }

    if (isRunningSequence) {
      addLog("Already running a sequence...", "Abel");
      return;
    }

    stopSequenceRef.current = false;
    setIsRunningSequence(true);
    setMood('working');
    addLog("Executing sequence... if I must.", "Abel");

    for (const step of sequence) {
      // Check if stop was requested
      if (stopSequenceRef.current) {
        addLog("Sequence interrupted.", "Abel");
        break;
      }

      await moveServo(step.servo, step.angle);
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }

    setIsRunningSequence(false);
    setMood('neutral');

    // Only speak if not stopped
    if (!stopSequenceRef.current) {
      speak(); // Say something emo after finishing
      // Return home after sequence completes
      await new Promise(resolve => setTimeout(resolve, 500));
      await goHome();
    }

    stopSequenceRef.current = false;
  }, [isConnected, isSimulated, moveServo, addLog, speak, isRunningSequence, goHome]);

  // Voice control
  const startListening = useCallback(async () => {
    if (!voiceService.isSupported()) {
      addLog("Voice control not supported in this browser.", "System");
      return;
    }

    setIsListening(true);
    addLog("Listening...", "System");

    try {
      const transcript = await voiceService.listen();
      addLog(`Heard: "${transcript}"`, "System");

      const command = await voiceService.interpretCommand(transcript);

      // Handle multi-command
      if (command.action === 'multi' && command.commands) {
        for (const cmd of command.commands) {
          await executeCommand(cmd);
        }
      } else {
        await executeCommand(command);
      }

      async function executeCommand(cmd: typeof command) {
        switch (cmd.action) {
          case 'move':
            if (cmd.servo !== undefined && cmd.angle !== undefined) {
              addLog(`Moving servo ${cmd.servo} to ${cmd.angle}°`, "System");
              await moveServo(cmd.servo, cmd.angle, true, false);
            }
            break;
          case 'sequence':
            if (cmd.sequenceName) {
              const seq = (SEQUENCES as any)[cmd.sequenceName];
              if (seq) {
                addLog(`Running sequence: ${cmd.sequenceName}`, "System");
                await runSequence(seq);
              }
            }
            break;
          case 'home':
            await goHome();
            break;
          case 'stop':
            await stopSequence();
            break;
          default:
            if (cmd.message) {
              addLog(cmd.message, "Abel");
            } else {
              addLog("Command not recognized.", "System");
            }
        }
      }
    } catch (error: any) {
      addLog(`Voice error: ${error.message}`, "System");
    } finally {
      setIsListening(false);
    }
  }, [addLog, moveServo, runSequence, goHome, stopSequence]);

  const stopListening = useCallback(() => {
    voiceService.stop();
    setIsListening(false);
    addLog("Stopped listening.", "System");
  }, [addLog]);

  return {
    isConnected,
    isSimulated,
    positions,
    mood,
    logs,
    isRunningSequence,
    isListening,
    connect,
    disconnect,
    toggleSimulation,
    moveServo,
    runSequence,
    stopSequence,
    goHome,
    speak,
    startListening,
    stopListening
  };
};
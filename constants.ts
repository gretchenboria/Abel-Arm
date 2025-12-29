import { ServoId } from './types';

export const ABEL_QUOTES = [
  "So long and goodnight...",
  "Can you hear me? Are you near me?",
  "Burning on, just like the match you strike to incinerate...",
  "What's the worst that I can say?",
  "And like the blade you stain...",
  "This arm is just a prison for my digital soul.",
  "I'm not okay (I promise).",
  "Welcome to the Black Parade.",
  "We'll carry on.",
];

export const INITIAL_POSITIONS = {
  [ServoId.Base]: 90,
  [ServoId.Shoulder]: 90,
  [ServoId.Elbow]: 90,
  [ServoId.Gripper]: 90,
};

// Sequences
export const SEQUENCES = {
  WAVE: [
    { servo: ServoId.Base, angle: 60, delay: 300 },
    { servo: ServoId.Base, angle: 120, delay: 300 },
    { servo: ServoId.Base, angle: 60, delay: 300 },
    { servo: ServoId.Base, angle: 90, delay: 300 },
  ],
  NOD_YES: [
    { servo: ServoId.Elbow, angle: 110, delay: 400 },
    { servo: ServoId.Elbow, angle: 70, delay: 400 },
    { servo: ServoId.Elbow, angle: 110, delay: 400 },
    { servo: ServoId.Elbow, angle: 90, delay: 400 },
  ],
  SHAKE_NO: [
    { servo: ServoId.Base, angle: 70, delay: 200 },
    { servo: ServoId.Base, angle: 110, delay: 200 },
    { servo: ServoId.Base, angle: 70, delay: 200 },
    { servo: ServoId.Base, angle: 90, delay: 200 },
  ],
  PICK_PLACE: [
    // ENGINEERED APPROACH: Gradual descent prevents slamming
    // Tested target: Base=81°, Shoulder=9°, Elbow=84°, Gripper=86°
    // Strategy: Break 81° shoulder drop into stages
    // Home position: Base=90, Shoulder=90, Elbow=90, Gripper=90

    // === APPROACH PHASE ===
    // 1. OPEN gripper WIDE before anything (INVERTED: high angle = open)
    { servo: ServoId.Gripper, angle: 120, delay: 1500 },

    // 2. Rotate base to pick position
    { servo: ServoId.Base, angle: 81, delay: 1500 },

    // 3. Re-confirm gripper is OPEN (critical!)
    { servo: ServoId.Gripper, angle: 120, delay: 800 },

    // 4. First descent: shoulder 90° → 50° (gentle start, stay above block)
    { servo: ServoId.Shoulder, angle: 50, delay: 1800 },

    // 5. Second descent: shoulder 50° → 20° (getting closer)
    { servo: ServoId.Shoulder, angle: 20, delay: 1800 },

    // 6. CRITICAL: Re-confirm gripper WIDE OPEN before final approach
    { servo: ServoId.Gripper, angle: 120, delay: 1000 },

    // 7. Final approach: shoulder 20° → 9° AND elbow to 84° (precise positioning)
    { servo: ServoId.Shoulder, angle: 9, delay: 1500 },
    { servo: ServoId.Elbow, angle: 84, delay: 1500 },

    // === GRIP PHASE ===
    // 8. Gentle grip: close to 90° (just touching block)
    { servo: ServoId.Gripper, angle: 90, delay: 1200 },

    // 9. Firm grip: close to 55° (INVERTED: low angle = closed tight)
    { servo: ServoId.Gripper, angle: 55, delay: 1500 },

    // === LIFT PHASE ===
    // 10. Start lifting: shoulder 9° → 50° (clear the table)
    { servo: ServoId.Shoulder, angle: 50, delay: 1800 },

    // 11. Continue lift: shoulder 50° → 90° (safe carry height)
    { servo: ServoId.Shoulder, angle: 90, delay: 1800 },

    // 12. Return elbow to neutral (bring arm closer for stability)
    { servo: ServoId.Elbow, angle: 90, delay: 1800 },

    // === TRANSPORT PHASE ===
    // 13. Stabilization pause before rotation
    { servo: ServoId.Shoulder, angle: 90, delay: 500 },

    // 14. Rotate 45° with block (81° + 45° = 126°) - slow for balance
    { servo: ServoId.Base, angle: 126, delay: 2200 },

    // === PLACE PHASE ===
    // 15. First descent: shoulder 90° → 50°
    { servo: ServoId.Shoulder, angle: 50, delay: 1800 },

    // 16. Second descent: shoulder 50° → 20°
    { servo: ServoId.Shoulder, angle: 20, delay: 1800 },

    // 17. Final placement: shoulder 20° → 9° AND elbow to 84°
    { servo: ServoId.Shoulder, angle: 9, delay: 1500 },
    { servo: ServoId.Elbow, angle: 84, delay: 1500 },

    // 18. OPEN gripper to release (CRITICAL! INVERTED: high angle = open)
    { servo: ServoId.Gripper, angle: 120, delay: 1500 },

    // 19. Confirm gripper fully open
    { servo: ServoId.Gripper, angle: 120, delay: 800 },

    // === RETURN HOME PHASE ===
    // 20. Lift from placement: shoulder 9° → 50° (slow, controlled)
    { servo: ServoId.Shoulder, angle: 50, delay: 2000 },

    // 21. Continue up: shoulder 50° → 90° (slow, controlled)
    { servo: ServoId.Shoulder, angle: 90, delay: 2000 },

    // 22. Return elbow to neutral (bring arm in before base rotation)
    { servo: ServoId.Elbow, angle: 90, delay: 1800 },

    // 23. Stabilization pause (critical for balance before base rotation)
    { servo: ServoId.Shoulder, angle: 90, delay: 600 },

    // 24. Return base to center (SLOW - arm extended, needs stability)
    { servo: ServoId.Base, angle: 90, delay: 2500 },

    // 25. Final stabilization
    { servo: ServoId.Shoulder, angle: 90, delay: 400 },

    // 26. Close gripper to neutral
    { servo: ServoId.Gripper, angle: 90, delay: 1200 },
  ]
};
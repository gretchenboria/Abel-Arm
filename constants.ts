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
    // Tested target: Base=81°, Shoulder=9°, Elbow=84°
    // Gripper: 60=open, 120=closed
    // Multi-stage descent prevents slamming

    // === APPROACH PHASE ===
    // 1. OPEN gripper wide (60° = open)
    { servo: ServoId.Gripper, angle: 60, delay: 2000 },

    // 2. Rotate base to pick position
    { servo: ServoId.Base, angle: 81, delay: 2200 },

    // 3. Re-confirm gripper OPEN
    { servo: ServoId.Gripper, angle: 60, delay: 1000 },

    // 4. First descent: shoulder 90° → 50°
    { servo: ServoId.Shoulder, angle: 50, delay: 2200 },

    // 5. Second descent: shoulder 50° → 20°
    { servo: ServoId.Shoulder, angle: 20, delay: 2200 },

    // 6. Re-confirm gripper OPEN before final approach
    { servo: ServoId.Gripper, angle: 60, delay: 1000 },

    // 7. Final approach: shoulder 20° → 9° AND elbow to 84°
    { servo: ServoId.Shoulder, angle: 9, delay: 2000 },
    { servo: ServoId.Elbow, angle: 84, delay: 2000 },

    // === GRIP PHASE ===
    // 8. Gentle close to 90° (touching block)
    { servo: ServoId.Gripper, angle: 90, delay: 1500 },

    // 9. Firm grip: fully close (120° = closed)
    { servo: ServoId.Gripper, angle: 120, delay: 2000 },

    // === LIFT PHASE ===
    // 10. Hold grip firmly closed
    { servo: ServoId.Gripper, angle: 120, delay: 800 },

    // 11. Start lifting: shoulder 9° → 50°
    { servo: ServoId.Shoulder, angle: 50, delay: 2500 },

    // 12. Maintain closed grip during lift
    { servo: ServoId.Gripper, angle: 120, delay: 800 },

    // 13. Continue lift: shoulder 50° → 90°
    { servo: ServoId.Shoulder, angle: 90, delay: 2500 },

    // 14. Return elbow to neutral
    { servo: ServoId.Elbow, angle: 90, delay: 2200 },

    // 15. Confirm grip still closed
    { servo: ServoId.Gripper, angle: 120, delay: 800 },

    // === TRANSPORT PHASE ===
    // 16. Stabilization pause
    { servo: ServoId.Shoulder, angle: 90, delay: 800 },

    // 17. Rotate 45° with block (81° + 45° = 126°)
    { servo: ServoId.Base, angle: 126, delay: 2500 },

    // 18. Maintain closed grip during rotation
    { servo: ServoId.Gripper, angle: 120, delay: 800 },

    // === PLACE PHASE ===
    // 19. First descent: shoulder 90° → 50°
    { servo: ServoId.Shoulder, angle: 50, delay: 2200 },

    // 20. Second descent: shoulder 50° → 20°
    { servo: ServoId.Shoulder, angle: 20, delay: 2200 },

    // 21. Final placement: shoulder 20° → 9° AND elbow to 84°
    { servo: ServoId.Shoulder, angle: 9, delay: 2000 },
    { servo: ServoId.Elbow, angle: 84, delay: 2000 },

    // 22. OPEN gripper to release (60° = open)
    { servo: ServoId.Gripper, angle: 60, delay: 2000 },

    // 23. Confirm gripper open
    { servo: ServoId.Gripper, angle: 60, delay: 1000 },

    // === RETURN HOME PHASE ===
    // 24. Lift from placement: shoulder 9° → 50°
    { servo: ServoId.Shoulder, angle: 50, delay: 2200 },

    // 25. Continue up: shoulder 50° → 90°
    { servo: ServoId.Shoulder, angle: 90, delay: 2200 },

    // 26. Return elbow to neutral
    { servo: ServoId.Elbow, angle: 90, delay: 2200 },

    // 27. Stabilization pause
    { servo: ServoId.Shoulder, angle: 90, delay: 800 },

    // 28. Return base to center
    { servo: ServoId.Base, angle: 90, delay: 2500 },

    // 29. Final stabilization
    { servo: ServoId.Shoulder, angle: 90, delay: 800 },

    // 30. Close gripper to neutral
    { servo: ServoId.Gripper, angle: 90, delay: 1500 },
  ]
};
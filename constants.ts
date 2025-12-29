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
    // Step 1: Open gripper WIDE and wait
    { servo: ServoId.Gripper, angle: 60, delay: 1500 },

    // Step 2: Lower shoulder (wrist down) - wait for completion
    { servo: ServoId.Shoulder, angle: 130, delay: 1500 },

    // Step 3: Extend elbow OUT to reach object - wait for completion
    { servo: ServoId.Elbow, angle: 150, delay: 1500 },

    // Step 4: Close gripper to GRASP - wait fully before moving
    { servo: ServoId.Gripper, angle: 120, delay: 1500 },

    // Step 5: Retract elbow back - wait for completion
    { servo: ServoId.Elbow, angle: 90, delay: 1500 },

    // Step 6: Lift shoulder (wrist up) to safe carry position
    { servo: ServoId.Shoulder, angle: 90, delay: 1500 },

    // Step 7: Small rotation to place location
    { servo: ServoId.Base, angle: 135, delay: 1500 },

    // Step 8: Lower shoulder (wrist down) for placing
    { servo: ServoId.Shoulder, angle: 130, delay: 1500 },

    // Step 9: Extend elbow OUT to place position
    { servo: ServoId.Elbow, angle: 150, delay: 1500 },

    // Step 10: Open gripper to RELEASE object
    { servo: ServoId.Gripper, angle: 60, delay: 1500 },

    // Step 11: Retract elbow back
    { servo: ServoId.Elbow, angle: 90, delay: 1500 },

    // Step 12: Lift shoulder to safe position
    { servo: ServoId.Shoulder, angle: 90, delay: 1500 },

    // Step 13: Return base to center
    { servo: ServoId.Base, angle: 90, delay: 1500 },

    // Step 14: Close gripper to neutral position - FINAL STOP
    { servo: ServoId.Gripper, angle: 90, delay: 1500 },
  ]
};
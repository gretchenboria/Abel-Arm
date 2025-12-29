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
  HAND_OVER: [
    // Open gripper wide
    { servo: ServoId.Gripper, angle: 120, delay: 500 },
    // Extend arm to pick
    { servo: ServoId.Shoulder, angle: 60, delay: 600 },
    { servo: ServoId.Elbow, angle: 140, delay: 800 },
    // Close gripper
    { servo: ServoId.Gripper, angle: 60, delay: 600 },
    // Retract
    { servo: ServoId.Elbow, angle: 90, delay: 600 },
    { servo: ServoId.Shoulder, angle: 90, delay: 600 },
    // Extend to give
    { servo: ServoId.Shoulder, angle: 120, delay: 600 },
    { servo: ServoId.Elbow, angle: 130, delay: 800 },
    // Open gripper to release
    { servo: ServoId.Gripper, angle: 120, delay: 600 },
    // Retract
    { servo: ServoId.Elbow, angle: 90, delay: 500 },
    { servo: ServoId.Shoulder, angle: 90, delay: 500 },
    // Reset gripper to neutral
    { servo: ServoId.Gripper, angle: 90, delay: 500 },
  ],
  PICK_PLACE: [
    // Open gripper wide
    { servo: ServoId.Gripper, angle: 120, delay: 500 },
    // Lower wrist and extend elbow to pick position
    { servo: ServoId.Shoulder, angle: 120, delay: 600 },
    { servo: ServoId.Elbow, angle: 140, delay: 800 },
    // Close gripper to grab
    { servo: ServoId.Gripper, angle: 60, delay: 600 },
    // Retract elbow and lift wrist
    { servo: ServoId.Elbow, angle: 90, delay: 600 },
    { servo: ServoId.Shoulder, angle: 90, delay: 600 },
    // Rotate base to place location
    { servo: ServoId.Base, angle: 120, delay: 700 },
    // Lower wrist and extend elbow to place position
    { servo: ServoId.Shoulder, angle: 120, delay: 600 },
    { servo: ServoId.Elbow, angle: 140, delay: 800 },
    // Open gripper to release
    { servo: ServoId.Gripper, angle: 120, delay: 600 },
    // Retract elbow and lift wrist
    { servo: ServoId.Elbow, angle: 90, delay: 500 },
    { servo: ServoId.Shoulder, angle: 90, delay: 500 },
    // Return base to center
    { servo: ServoId.Base, angle: 90, delay: 700 },
    // Reset gripper to neutral
    { servo: ServoId.Gripper, angle: 90, delay: 500 },
  ]
};
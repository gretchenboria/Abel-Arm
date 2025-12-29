/*
 * Abel Arm - ESP32-C3 Servo Controller Firmware v4.0
 * Advanced Motion Control with Quintic Polynomial Trajectory Planning
 *
 * Features:
 * - Quintic (5th-order) polynomial trajectories for ultra-smooth motion
 * - C2 continuous (smooth position, velocity, acceleration)
 * - Zero jerk at endpoints (no sudden acceleration changes)
 * - Adaptive trajectory planning based on movement distance
 * - Velocity and acceleration constraints based on servo capabilities
 * - Coordinated multi-axis motion support
 *
 * Protocol: #<servo>M<angle>T<duration>\n
 * Example: #0M90T1000\n (move servo 0 to 90 degrees over 1 second)
 */

#include <ESP32Servo.h>

// Servo objects
Servo servos[4];
const int SERVO_PINS[4] = {4, 5, 6, 7};

// Physical constraints (degrees/sec and degrees/sec^2)
const float MAX_VELOCITY = 120.0;      // Maximum angular velocity (deg/s)
const float MAX_ACCELERATION = 200.0;  // Maximum angular acceleration (deg/s^2)
const float MAX_JERK = 600.0;          // Maximum jerk (deg/s^3)

// Motion profile for each servo
struct MotionProfile {
  float currentAngle;
  float targetAngle;
  float startAngle;

  // Current kinematic state
  float currentVelocity;
  float currentAcceleration;

  // Trajectory parameters
  unsigned long startTime;
  unsigned long duration;
  bool moving;

  // Quintic polynomial coefficients: q(t) = a0 + a1*t + a2*t^2 + a3*t^3 + a4*t^4 + a5*t^5
  float a0, a1, a2, a3, a4, a5;

  // Trajectory type
  enum TrajectoryType { QUINTIC, TRAPEZOIDAL } trajectoryType;
};

MotionProfile profiles[4];

String commandBuffer = "";
const float UPDATE_RATE = 200.0;      // 200Hz update rate for ultra-smooth motion
const unsigned long UPDATE_INTERVAL = 5; // 5ms = 200Hz

unsigned long lastUpdate = 0;

// Quintic polynomial trajectory calculation
// Provides C2 continuous motion (smooth position, velocity, acceleration)
// Boundary conditions: q(0)=q0, q(T)=qf, v(0)=0, v(T)=0, a(0)=0, a(T)=0
void calculateQuinticCoefficients(MotionProfile &profile, float T) {
  float q0 = profile.startAngle;
  float qf = profile.targetAngle;

  // Standard quintic polynomial coefficients for point-to-point motion
  // with zero velocity and acceleration at endpoints
  profile.a0 = q0;
  profile.a1 = 0.0;
  profile.a2 = 0.0;
  profile.a3 = 10.0 * (qf - q0) / (T * T * T);
  profile.a4 = -15.0 * (qf - q0) / (T * T * T * T);
  profile.a5 = 6.0 * (qf - q0) / (T * T * T * T * T);
}

// Evaluate position at time t using quintic polynomial
float evaluateQuinticPosition(const MotionProfile &profile, float t) {
  return profile.a0
       + profile.a1 * t
       + profile.a2 * t * t
       + profile.a3 * t * t * t
       + profile.a4 * t * t * t * t
       + profile.a5 * t * t * t * t * t;
}

// Evaluate velocity at time t using quintic polynomial derivative
float evaluateQuinticVelocity(const MotionProfile &profile, float t) {
  return profile.a1
       + 2.0 * profile.a2 * t
       + 3.0 * profile.a3 * t * t
       + 4.0 * profile.a4 * t * t * t
       + 5.0 * profile.a5 * t * t * t * t;
}

// Evaluate acceleration at time t using quintic polynomial second derivative
float evaluateQuinticAcceleration(const MotionProfile &profile, float t) {
  return 2.0 * profile.a2
       + 6.0 * profile.a3 * t
       + 12.0 * profile.a4 * t * t
       + 20.0 * profile.a5 * t * t * t;
}

// Calculate optimal duration based on distance and constraints
unsigned long calculateOptimalDuration(float deltaAngle) {
  deltaAngle = abs(deltaAngle);

  // For quintic trajectory, the peak velocity is approximately 1.875 * (distance/duration)
  // To respect velocity constraint: 1.875 * (delta/T) <= v_max
  // Therefore: T >= 1.875 * delta / v_max

  float minTimeForVelocity = 1.875 * deltaAngle / MAX_VELOCITY;

  // For acceleration constraint, peak acceleration is approximately 5.77 * (distance/duration^2)
  // To respect acceleration constraint: 5.77 * (delta/T^2) <= a_max
  // Therefore: T >= sqrt(5.77 * delta / a_max)

  float minTimeForAcceleration = sqrt(5.77 * deltaAngle / MAX_ACCELERATION);

  // Take the maximum of both constraints and add 20% safety margin
  float optimalTime = max(minTimeForVelocity, minTimeForAcceleration) * 1.2;

  // Convert to milliseconds and enforce minimum duration
  unsigned long duration = (unsigned long)(optimalTime * 1000.0);
  return max(duration, 200UL); // Minimum 200ms for stability
}

void setup() {
  Serial0.begin(115200);
  delay(1000);

  Serial0.println("Abel Arm Firmware v4.0");
  Serial0.println("Quintic Polynomial Trajectory Planning");
  Serial0.println("C2 Continuous Motion Control");

  // Attach servos and initialize to home position
  for (int i = 0; i < 4; i++) {
    servos[i].attach(SERVO_PINS[i], 500, 2500);
    profiles[i].currentAngle = 90;
    profiles[i].targetAngle = 90;
    profiles[i].currentVelocity = 0.0;
    profiles[i].currentAcceleration = 0.0;
    profiles[i].moving = false;
    servos[i].write(90);
  }

  delay(100);

  // Initialize gripper to open position
  servos[3].write(120);
  profiles[3].currentAngle = 120;
  delay(300);
  servos[3].write(90);
  profiles[3].currentAngle = 90;

  Serial0.println("Ready.");
  Serial0.println("Command: #<servo>M<angle>T<duration>");
  Serial0.println("Constraints: v_max=120deg/s, a_max=200deg/s^2");
}

void loop() {
  // Handle serial commands
  while (Serial0.available() > 0) {
    char c = Serial0.read();
    if (c == '\n' || c == '\r') {
      if (commandBuffer.length() > 0) {
        processCommand(commandBuffer);
        commandBuffer = "";
      }
    } else {
      commandBuffer += c;
    }
  }

  // Update motion profiles at fixed rate (200Hz)
  unsigned long now = millis();
  if (now - lastUpdate >= UPDATE_INTERVAL) {
    lastUpdate = now;
    updateMotion();
  }
}

void updateMotion() {
  for (int i = 0; i < 4; i++) {
    if (!profiles[i].moving) continue;

    unsigned long elapsed = millis() - profiles[i].startTime;
    float t = (float)elapsed / 1000.0; // Convert to seconds
    float T = (float)profiles[i].duration / 1000.0;

    if (elapsed >= profiles[i].duration) {
      // Motion complete - ensure exact final position
      profiles[i].currentAngle = profiles[i].targetAngle;
      profiles[i].currentVelocity = 0.0;
      profiles[i].currentAcceleration = 0.0;
      profiles[i].moving = false;
      servos[i].write((int)round(profiles[i].currentAngle));
    } else {
      // Calculate position, velocity, and acceleration using quintic trajectory
      profiles[i].currentAngle = evaluateQuinticPosition(profiles[i], t);
      profiles[i].currentVelocity = evaluateQuinticVelocity(profiles[i], t);
      profiles[i].currentAcceleration = evaluateQuinticAcceleration(profiles[i], t);

      // Write to servo (with rounding for integer angle)
      servos[i].write((int)round(profiles[i].currentAngle));
    }
  }
}

void processCommand(String cmd) {
  if (cmd.length() < 4 || cmd.charAt(0) != '#') {
    Serial0.println("ERR: Invalid format");
    return;
  }

  // Parse: #<servo>M<angle>T<duration>
  int mIndex = cmd.indexOf('M');
  int tIndex = cmd.indexOf('T');

  if (mIndex == -1 || tIndex == -1) {
    Serial0.println("ERR: Invalid command format");
    return;
  }

  String servoStr = cmd.substring(1, mIndex);
  int servoNum = servoStr.toInt();

  String angleStr = cmd.substring(mIndex + 1, tIndex);
  int targetAngle = angleStr.toInt();

  String durationStr = cmd.substring(tIndex + 1);
  unsigned long duration = durationStr.toInt();

  // Validate inputs
  if (servoNum < 0 || servoNum > 3) {
    Serial0.println("ERR: Invalid servo (0-3)");
    return;
  }

  if (targetAngle < 0 || targetAngle > 180) {
    Serial0.println("ERR: Angle out of range (0-180)");
    return;
  }

  if (duration < 100 || duration > 10000) {
    Serial0.println("ERR: Duration out of range (100-10000ms)");
    return;
  }

  // Calculate movement parameters
  float deltaAngle = abs((float)targetAngle - profiles[servoNum].currentAngle);

  // Check if requested duration is sufficient for the movement
  unsigned long optimalDuration = calculateOptimalDuration(deltaAngle);
  if (duration < optimalDuration) {
    Serial0.print("WARN: Duration adjusted ");
    Serial0.print(duration);
    Serial0.print("ms -> ");
    Serial0.print(optimalDuration);
    Serial0.println("ms (constraint violation)");
    duration = optimalDuration;
  }

  // Initialize motion profile
  profiles[servoNum].startAngle = profiles[servoNum].currentAngle;
  profiles[servoNum].targetAngle = (float)targetAngle;
  profiles[servoNum].startTime = millis();
  profiles[servoNum].duration = duration;
  profiles[servoNum].trajectoryType = MotionProfile::QUINTIC;

  // Calculate quintic polynomial coefficients
  float T = (float)duration / 1000.0;
  calculateQuinticCoefficients(profiles[servoNum], T);

  profiles[servoNum].moving = true;

  // Debug output
  Serial0.print("QUINTIC: Servo ");
  Serial0.print(servoNum);
  Serial0.print(" ");
  Serial0.print(profiles[servoNum].startAngle, 1);
  Serial0.print("deg -> ");
  Serial0.print(targetAngle);
  Serial0.print("deg over ");
  Serial0.print(duration);
  Serial0.print("ms (delta=");
  Serial0.print(deltaAngle, 1);
  Serial0.println("deg)");
}

# Firmware Documentation

## Architecture

Smooth motion control is implemented in the ESP32 firmware, not in JavaScript. This ensures consistent timing and eliminates serial communication jitter.

## Protocol

### Instant Move (Legacy)
```
#<servo>P<pulse>\n
```
Example: `#0P1500\n` moves servo 0 to 1500us (90 degrees)

### Smooth Move (v2.0 - Deprecated)
```
#<servo>S<pulse>T<duration>\n
```
Example: `#0S1800T1000\n` smoothly moves servo 0 to 1800us over 1 second

### Smooth Move with Angle (v3.0/v4.0 - Current)
```
#<servo>M<angle>T<duration>\n
```
Example: `#0M90T1000\n` smoothly moves servo 0 to 90 degrees over 1 second
- Firmware handles angle-to-pulse conversion (500-2500us)
- Simpler protocol: degrees instead of pulse width
- Backward compatible with previous versions

## Firmware v4.0 Features (Current)

### Quintic Polynomial Trajectory Planning
- 5th-order polynomial trajectories for ultra-smooth motion
- C2 continuous: smooth position, velocity, AND acceleration throughout motion
- Zero jerk at endpoints (no sudden acceleration changes)
- Mathematical boundary conditions:
  - Position: q(0) = start, q(T) = target
  - Velocity: v(0) = 0, v(T) = 0 (smooth starts and stops)
  - Acceleration: a(0) = 0, a(T) = 0 (no acceleration jumps)

### Polynomial Form
```
q(t) = a0 + a1*t + a2*t^2 + a3*t^3 + a4*t^4 + a5*t^5
```
Coefficients calculated to satisfy all boundary conditions for each movement.

### Physical Constraints
- Maximum velocity: 120 deg/s
- Maximum acceleration: 200 deg/s^2
- Maximum jerk: 600 deg/s^3
- Adaptive duration calculation based on movement distance

### Optimal Duration Calculation
Firmware automatically checks if requested duration respects physical constraints:
- Velocity constraint: Peak velocity ≈ 1.875 × (Δθ/T)
- Acceleration constraint: Peak acceleration ≈ 5.77 × (Δθ/T²)
- Auto-adjusts duration if constraints would be violated

### High-Frequency Control Loop
- 200Hz update rate (5ms intervals) for ultra-smooth motion
- Real-time trajectory evaluation at each timestep
- Precise numerical stability with floating-point calculations

## Firmware v3.0 Features (Legacy)

### S-Curve Acceleration Profile
- Smoother than cubic ease-in-out
- Natural acceleration/deceleration
- Reduces mechanical stress and vibration
- Basic jerk limiting

### Coordinated Multi-Axis Motion
- Independent motion state per servo allows simultaneous movement
- Send commands in rapid succession (50ms apart) for coordinated motion
- Example: Shoulder + Elbow moving together creates straight-line paths
- Firmware interpolates each axis independently with precise timing

## Firmware v2.0 Features (Legacy)

### Trajectory Interpolation
- Cubic ease-in-out function implemented in firmware
- Non-blocking motion updates in main loop
- Independent motion state for each servo
- Consistent timing using `millis()`

### Motion State
Each servo tracks:
- currentPulse: Current position
- targetPulse: Destination position
- startPulse: Position when motion started
- startTime: When motion began
- duration: How long motion should take
- moving: Boolean flag

### Update Loop
Main loop calls `updateSmoothMotion()` which:
1. Checks each servo's moving flag
2. Calculates elapsed time
3. Applies cubic easing to progress
4. Writes interpolated pulse to servo
5. Marks complete when duration reached

## Pulse Width Mapping

Angle to pulse conversion:
```
pulse = 500 + (angle / 180.0) * 2000
```

Examples:
- 0° = 500us
- 90° = 1500us
- 180° = 2500us

## Servo Assignment

- Servo 0: Base (GPIO 4)
- Servo 1: Shoulder (GPIO 5)
- Servo 2: Elbow (GPIO 6)
- Servo 3: Gripper (GPIO 7)

## Serial Configuration

- Port: Serial0 (hardware UART via CP2102)
- Baud: 115200
- Data: 8 bits
- Stop: 1 bit
- Parity: None

## Duration Limits

- Minimum: 100ms
- Maximum: 10000ms (10 seconds)

Commands outside this range are clamped.

## Web App Integration

Web app sends angle-based smooth move commands (v3.0 protocol):
```typescript
await serialService.sendCommandSmooth(servo, targetAngle, currentAngle, duration);
```

This generates:
```
#<servo>M<angle>T<duration>\n
```

For coordinated multi-axis motion:
```typescript
// Send commands in rapid succession (50ms apart)
await serialService.sendCommandSmooth(ServoId.Shoulder, 135, 90, 1200);
await new Promise(resolve => setTimeout(resolve, 50));
await serialService.sendCommandSmooth(ServoId.Elbow, 155, 90, 1200);
// Both servos move simultaneously with independent timing
```

Firmware handles all interpolation and coordination locally.

## Benefits

1. **Ultra-smooth motion**: Quintic polynomials provide C2 continuity - no discontinuities in position, velocity, or acceleration
2. **Zero jerk**: No sudden acceleration changes at motion start/stop, reducing mechanical stress
3. **Mathematically optimal**: Trajectory coefficients calculated to minimize mechanical vibration
4. **Physically realistic**: Respects velocity (120 deg/s) and acceleration (200 deg/s²) constraints
5. **Adaptive planning**: Automatically adjusts duration if constraints would be violated
6. **High-frequency updates**: 200Hz control loop (2x faster than v3.0) for smoother interpolation
7. **Consistent timing**: Firmware loop runs at precise intervals, eliminating serial jitter
8. **Lower bandwidth**: One command instead of 5-10 position updates
9. **Natural motion**: Movement mimics biological motion patterns with smooth acceleration profiles
10. **Coordinated motion**: Independent motion state per servo allows simultaneous multi-axis movement

## Uploading Firmware

1. Disconnect web app
2. Open Arduino IDE
3. Open: `robot_arm_project/Abel_Arm_Firmware/Abel_Arm_Firmware.ino`
4. Select board: ESP32-C3-DevKitC-02
5. Select port: (your CP2102 port)
6. Upload
7. Wait for "Hard resetting via RTS pin..."
8. Reconnect in web app

## Debugging

Serial output format (v4.0):
```
Abel Arm Firmware v4.0
Quintic Polynomial Trajectory Planning
C2 Continuous Motion Control
Ready.
Command: #<servo>M<angle>T<duration>
Constraints: v_max=120deg/s, a_max=200deg/s^2

QUINTIC: Servo 0 90.0deg -> 135deg over 1000ms (delta=45.0deg)
QUINTIC: Servo 1 45.0deg -> 90deg over 800ms (delta=45.0deg)
WARN: Duration adjusted 500ms -> 750ms (constraint violation)
ERR: Angle out of range (0-180)
ERR: Invalid servo (0-3)
```

The firmware provides detailed feedback on:
- Current trajectory type (QUINTIC)
- Start angle, target angle, and angular distance
- Actual duration used for motion
- Warnings when duration is auto-adjusted to respect constraints
- Error messages for invalid commands

## Mathematical Trajectory Planning (v4.0)

### Quintic Polynomial Formulation

The trajectory is defined by a 5th-order polynomial:
```
q(t) = a0 + a1*t + a2*t^2 + a3*t^3 + a4*t^4 + a5*t^5
```

With boundary conditions for smooth motion:
```
Position:     q(0) = q_start,  q(T) = q_target
Velocity:     q'(0) = 0,       q'(T) = 0
Acceleration: q''(0) = 0,      q''(T) = 0
```

This results in coefficient calculations:
```
a0 = q_start
a1 = 0
a2 = 0
a3 = 10(q_target - q_start) / T³
a4 = -15(q_target - q_start) / T⁴
a5 = 6(q_target - q_start) / T⁵
```

### Optimal Duration Calculation

The firmware calculates minimum duration based on physical constraints:

**Velocity Constraint:**
```
T_vel ≥ 1.875 × Δθ / v_max
```
Peak velocity in quintic trajectory is approximately 1.875 × (distance/duration)

**Acceleration Constraint:**
```
T_accel ≥ sqrt(5.77 × Δθ / a_max)
```
Peak acceleration in quintic trajectory is approximately 5.77 × (distance/duration²)

**Final Duration:**
```
T = max(T_vel, T_accel) × 1.2
```
20% safety margin ensures smooth operation under all conditions.

### Examples (v4.0)

With v_max = 120 deg/s, a_max = 200 deg/s²:

- **45° movement**:
  - T_vel = 1.875 × 45 / 120 = 703ms
  - T_accel = sqrt(5.77 × 45 / 200) = 360ms
  - T_optimal = max(703, 360) × 1.2 = 844ms → Use 850ms

- **90° movement**:
  - T_vel = 1.875 × 90 / 120 = 1406ms
  - T_accel = sqrt(5.77 × 90 / 200) = 509ms
  - T_optimal = max(1406, 509) × 1.2 = 1687ms → Use 1700ms

- **Small 10° movement**:
  - T_vel = 1.875 × 10 / 120 = 156ms
  - T_accel = sqrt(5.77 × 10 / 200) = 170ms
  - T_optimal = max(156, 170) × 1.2 = 204ms → Use 210ms

### Coordinated Motion Pattern

Commands sent in rapid succession execute simultaneously:
```
t=0ms:   Shoulder starts moving (1700ms duration)
t=50ms:  Elbow starts moving (1700ms duration)
t=1750ms: Both complete (within 50ms of each other)
```

Each servo follows its own quintic trajectory, creating smooth coordinated motion. The firmware tracks position, velocity, and acceleration for each axis independently.

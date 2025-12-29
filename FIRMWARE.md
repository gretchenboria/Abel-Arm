# Firmware Documentation

## Architecture

Smooth motion control is implemented in the ESP32 firmware, not in JavaScript. This ensures consistent timing and eliminates serial communication jitter.

## Protocol

### Instant Move
```
#<servo>P<pulse>\n
```
Example: `#0P1500\n` moves servo 0 to 1500us (90 degrees)

### Smooth Move (v2.0 - Deprecated)
```
#<servo>S<pulse>T<duration>\n
```
Example: `#0S1800T1000\n` smoothly moves servo 0 to 1800us over 1 second

### Smooth Move with Angle (v3.0 - Current)
```
#<servo>M<angle>T<duration>\n
```
Example: `#0M90T1000\n` smoothly moves servo 0 to 90 degrees over 1 second
- Firmware handles angle-to-pulse conversion (500-2500us)
- Simpler protocol: degrees instead of pulse width
- Backward compatible with v2.0

## Firmware v3.0 Features

### S-Curve Acceleration Profile
- Smoother than cubic ease-in-out
- Natural acceleration/deceleration
- Reduces mechanical stress and vibration
- Zero-jerk trajectory planning

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

1. **Consistent timing**: Firmware loop runs at consistent intervals
2. **No jitter**: Eliminates serial communication latency
3. **Lower bandwidth**: One command instead of 5-10 position updates
4. **Real-time control**: Proper embedded motion control
5. **Smooth motion**: S-curve acceleration produces natural acceleration/deceleration
6. **Coordinated motion**: Multi-axis movements for straight-line end-effector paths
7. **Minimum transit time**: Mathematically optimized trajectory durations based on angular velocity limits (~60°/sec)

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

Serial output format (v3.0):
```
Abel Arm Firmware v3.0 - S-Curve Motion
Initializing servos...
Ready.
Commands: #<servo>P<pulse>, #<servo>M<angle>T<ms>

SMOOTH: Servo 0 -> 90° (1500us) over 1000ms
INSTANT: Servo 1 -> 1500us
COORDINATED: Servo 1+2 moving
ERR: Pulse out of range
```

## Mathematical Trajectory Planning

### Duration Calculation
```
T = (Δθ / v_max) × safety_factor
```

Where:
- Δθ = Angular displacement (degrees)
- v_max = Maximum angular velocity (~60°/sec for smooth natural motion)
- safety_factor = 1.3-1.5× depending on load and coordination

Examples:
- Gripper 90°→55° (Δθ=35°): T = 35/60 × 1.4 = 817ms → 800ms
- Base rotation 45°: T = 45/60 × 1.3 = 975ms → 1100ms (loaded)
- Shoulder 90°→135° (Δθ=45°): T = 45/60 × 1.4 = 1050ms

### Coordinated Motion Pattern
Commands sent 50ms apart execute simultaneously:
```
t=0ms:   Shoulder starts moving (1200ms duration)
t=50ms:  Elbow starts moving (1200ms duration)
t=1250ms: Both complete (within 50ms of each other)
```

This creates smooth, straight-line end-effector trajectories instead of sequential arc movements.

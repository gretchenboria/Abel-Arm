# Firmware Documentation

## Architecture

Smooth motion control is implemented in the ESP32 firmware, not in JavaScript. This ensures consistent timing and eliminates serial communication jitter.

## Protocol

### Instant Move
```
#<servo>P<pulse>\n
```
Example: `#0P1500\n` moves servo 0 to 1500us (90 degrees)

### Smooth Move
```
#<servo>S<pulse>T<duration>\n
```
Example: `#0S1800T1000\n` smoothly moves servo 0 to 1800us over 1 second

## Firmware v2.0 Features

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

Web app sends single smooth move command per user action:
```typescript
await serialService.sendCommandSmooth(servo, targetAngle, currentAngle, duration);
```

This generates:
```
#<servo>S<pulse>T<duration>\n
```

Firmware handles all interpolation locally.

## Benefits

1. **Consistent timing**: Firmware loop runs at consistent intervals
2. **No jitter**: Eliminates serial communication latency
3. **Lower bandwidth**: One command instead of 5-10 position updates
4. **Real-time control**: Proper embedded motion control
5. **Smooth motion**: Cubic easing produces natural acceleration/deceleration

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

Serial output format:
```
Abel Arm Firmware v2.0 - Smooth Motion
Initializing servos...
Ready.
Commands: #<servo>P<pulse> or #<servo>S<pulse>T<ms>

SMOOTH: Servo 0 -> 1800us over 1000ms
INSTANT: Servo 1 -> 1500us
ERR: Pulse out of range
```

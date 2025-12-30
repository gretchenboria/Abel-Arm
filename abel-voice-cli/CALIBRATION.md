# Hardware Calibration Guide

## ESP32-C3 FNK0100 Robot Arm Specifications

### Servo Configuration

| Servo ID | Joint | GPIO Pin | Range | Home Position |
|----------|-------|----------|-------|---------------|
| 0 | Base (Rotation) | 4 | 0-180° | 90° |
| 1 | Shoulder | 5 | 0-180° | 90° |
| 2 | Elbow | 6 | 0-180° | 90° |
| 3 | Gripper | 7 | 60-120° | 90° |

### Gripper Calibration

- **Open Position**: 120°
- **Closed Position**: 60°
- **Neutral Position**: 90°
- **Two-Stage Grip**: 90° (touch) → 60° (firm grip)

### Pick and Place Calibrated Positions

Tested and verified positions for reliable object manipulation:

#### Target Object Position
- **Base**: 81°
- **Shoulder**: 9° (fully extended down)
- **Elbow**: 84°

#### Transport Position (45° rotation)
- **Base**: 126° (81° + 45°)
- **Shoulder**: 9°
- **Elbow**: 84°

### Multi-Stage Descent Pattern

To prevent slamming and ensure smooth approach:

1. **Ready Position**: Shoulder 90°, Elbow 90°
2. **First Descent**: Shoulder 50°
3. **Second Descent**: Shoulder 20°
4. **Final Approach**: Shoulder 9°, Elbow 84° (coordinated)

### Motion Timing Guidelines

#### Gripper Operations
- **Open/Close**: 600-800ms duration
- **Settle Delay**: 300ms after gripper actuation
- **Pre-Grip Pause**: 400ms after reaching target position

#### Arm Movements
- **Base Rotation**: Calculated based on angular distance
- **Shoulder/Elbow**: Coordinated motion with max duration
- **Lift Operations**: 200-300ms settle time between stages

### Physical Constraints (Firmware v4.0)

- **Maximum Velocity**: 120 deg/s
- **Maximum Acceleration**: 200 deg/s²
- **Maximum Jerk**: 600 deg/s³
- **Update Rate**: 200Hz (5ms intervals)

### Optimal Duration Calculations

The firmware automatically calculates duration based on angular distance:

```
T_vel = 1.875 × Δθ / v_max
T_accel = sqrt(5.77 × Δθ / a_max)
T_optimal = max(T_vel, T_accel) × 1.2
```

### Calibration Procedure

#### 1. Servo Range Test
```bash
cargo run -- calibrate --servo <0-3>
```
Test each servo from 0-180° to identify mechanical limits.

#### 2. Gripper Calibration
```bash
cargo run -- calibrate --servo 3
```
Find optimal open/closed positions:
- Start at 90° (neutral)
- Test opening: 100°, 110°, 120° until fully open
- Test closing: 80°, 70°, 60° until secure grip

#### 3. Pick Position Calibration
1. Place test object at target location
2. Use calibration mode to manually position arm
3. Record Base, Shoulder, and Elbow angles when gripper is aligned
4. Test grip at recorded position
5. Adjust and retest until reliable

#### 4. Smooth Motion Test
```bash
cargo run -- smooth --servo 1 --from 90 --to 9 --duration 2000
```
Test shoulder movement from home to pick position.

### Troubleshooting

#### Gripper Not Gripping
- Increase closed position (try 55° instead of 60°)
- Increase grip duration (800ms → 1000ms)
- Add longer settle time before lifting (300ms → 500ms)

#### Arm Overshooting
- Increase motion duration
- Check firmware velocity constraints
- Verify quintic trajectory calculation

#### Jerky Motion
- Ensure firmware v4.0 is uploaded
- Verify 200Hz update rate in firmware
- Check serial connection stability

#### Position Drift
- Verify servo power supply (5V, sufficient current)
- Check mechanical tightness
- Test with longer settle delays

### Hardware-Specific Notes

**ESP32-C3 FNK0100 Characteristics:**
- Servo type: SG90 or compatible micro servos
- Torque: ~1.8kg-cm at 5V
- Response time: ~100-120ms per 60°
- Mechanical backlash: ~2-3° typical
- Recommended operating voltage: 5V (USB power acceptable for light loads)

**Optimal Operating Conditions:**
- Object weight: < 50g
- Grip width: 20-40mm
- Surface: Flat, stable, non-slip
- Ambient temperature: 15-35°C

### Advanced Calibration

For precise applications, create a calibration matrix mapping commanded angles to actual measured positions using a protractor or digital angle sensor.

Example calibration matrix format:
```
Commanded | Measured | Offset
----------|----------|-------
0°        | 2°       | +2°
45°       | 46°      | +1°
90°       | 90°      | 0°
135°      | 134°     | -1°
180°      | 178°     | -2°
```

Apply offset correction in motion planning for sub-degree accuracy.

# Abel Arm - Regression Test Plan

## Test Date: 2025-12-29
## Firmware Version: v3.0 (S-Curve with Coordinated Motion)
## Software Version: Latest (with mathematical trajectory planning)

---

## Test Overview

This document validates that the new coordinated motion system works correctly and that all existing functionality (stop, home, sequences) remains intact.

---

## 1. Home Button Functionality

### Test Case 1.1: Home from Neutral Position
**Steps:**
1. Connect robot arm
2. Ensure all servos at 90° (neutral)
3. Click "Home" button

**Expected Result:**
- ✅ Button is enabled (not grayed out)
- ✅ Servos move sequentially: Gripper → Elbow → Shoulder → Base
- ✅ Each servo moves to 90° with 1000ms delay between movements
- ✅ Total time: ~4 seconds
- ✅ Terminal shows: "Returning home..." then "Home position reached."
- ✅ Mood changes to 'working' then back to 'neutral'

**Status:** ⏳ PENDING MANUAL TEST

---

### Test Case 1.2: Home from Random Position
**Steps:**
1. Move servos to arbitrary positions (e.g., Base=45°, Shoulder=120°, Elbow=60°, Gripper=100°)
2. Click "Home" button

**Expected Result:**
- ✅ All servos return to 90° sequentially
- ✅ Smooth motion with S-curve acceleration
- ✅ No collisions or jerky movements
- ✅ Final position: all servos at 90° ±2°

**Status:** ⏳ PENDING MANUAL TEST

---

### Test Case 1.3: Home Button Disabled During Sequence
**Steps:**
1. Click "Pick Place" sequence button
2. While sequence is running, observe Home button

**Expected Result:**
- ✅ Home button is grayed out (opacity-40)
- ✅ Home button shows grayscale styling
- ✅ Home button is disabled and unclickable
- ✅ Button re-enables after sequence completes

**Status:** ⏳ PENDING MANUAL TEST

---

## 2. Stop Button Functionality

### Test Case 2.1: Stop Button State When Idle
**Steps:**
1. Connect robot arm
2. Observe Stop button when no sequence is running

**Expected Result:**
- ✅ Stop button is grayed out (opacity-40)
- ✅ Button shows grayscale styling
- ✅ Button is disabled and unclickable
- ✅ No pulse animation

**Status:** ⏳ PENDING MANUAL TEST

---

### Test Case 2.2: Stop Button During Sequence
**Steps:**
1. Click "Wave" sequence button
2. Observe Stop button while sequence runs

**Expected Result:**
- ✅ Stop button becomes enabled immediately
- ✅ Button shows red styling (bg-red-950, border-red-600)
- ✅ Button pulses (animate-pulse)
- ✅ Button is clickable

**Status:** ⏳ PENDING MANUAL TEST

---

### Test Case 2.3: Stop Sequence Early (Wave)
**Steps:**
1. Click "Wave" sequence
2. Wait ~1 second (let it start moving)
3. Click "Stop" button

**Expected Result:**
- ✅ Terminal shows: "Emergency stop activated."
- ✅ Sequence interrupts immediately (within 50ms)
- ✅ After 500ms delay, goHome() executes
- ✅ All servos return to 90° sequentially
- ✅ Mood changes to 'neutral'
- ✅ Abel does NOT speak (sequence incomplete)
- ✅ isRunningSequence becomes false

**Status:** ⏳ PENDING MANUAL TEST

---

### Test Case 2.4: Stop Coordinated Pick/Place Sequence
**Steps:**
1. Click "Pick Place" sequence
2. Wait until shoulder+elbow coordinated movement starts (step 2)
3. Click "Stop" button during coordinated motion

**Expected Result:**
- ✅ Terminal shows: "Emergency stop activated."
- ✅ Currently executing servo commands complete (firmware continues interpolation)
- ✅ No new commands are sent
- ✅ After 500ms, goHome() executes
- ✅ Servos return to 90° safely without collisions

**Critical:** Coordinated moves sent 50ms apart may both complete before stop takes effect. This is EXPECTED and SAFE because:
- Commands already sent to firmware will complete smoothly
- Stop prevents NEW commands from being sent
- goHome() ensures safe return regardless of current position

**Status:** ⏳ PENDING MANUAL TEST

---

## 3. Pick/Place Sequence with Coordinated Motion

### Test Case 3.1: Full Pick/Place Execution
**Steps:**
1. Place toy chicken directly in front of robot (90° base position)
2. Ensure robot starts at home position (all 90°)
3. Click "Pick Place" button
4. Let sequence complete without interruption

**Expected Result:**

**Phase 1 - Pick:**
- ✅ Step 1: Gripper opens to 55° (800ms)
- ✅ Step 2: Shoulder+Elbow move simultaneously (50ms apart, ~1100ms duration)
  - Shoulder: 90° → 135°
  - Elbow: 90° → 155°
  - Creates straight-line downward path
- ✅ Step 3: Gripper gentle grip to 95° (950ms)
- ✅ Step 4: Gripper firm grip to 125° (700ms)
- ✅ Step 5: Elbow+Shoulder lift simultaneously (~1250ms)
  - Elbow: 155° → 90°
  - Shoulder: 135° → 85°
  - Creates straight-line upward path with object

**Phase 2 - Transport:**
- ✅ Step 6: Base rotates 45° (90° → 135°) with load (1350ms)
  - Slower for stability

**Phase 3 - Place:**
- ✅ Step 7: Shoulder+Elbow descend simultaneously (~1250ms)
  - Shoulder: 85° → 135°
  - Elbow: 90° → 155°
- ✅ Step 8: Gripper releases to 55° (900ms)

**Phase 4 - Return Home:**
- ✅ Step 9: Elbow+Shoulder retract simultaneously (~1150ms)
  - Elbow: 155° → 90°
  - Shoulder: 135° → 90°
- ✅ Step 10: Base returns to center 90° (1100ms)
- ✅ Step 11: Gripper closes to 90° (650ms)

**Overall:**
- ✅ Total time: ~10 seconds
- ✅ Smooth, natural human-like motion
- ✅ Object successfully moved 45° to the right
- ✅ No jerky movements or vibrations
- ✅ Abel speaks an emo quote at the end
- ✅ Terminal shows: "Sequence complete."

**Status:** ⏳ PENDING MANUAL TEST

---

### Test Case 3.2: Mathematical Trajectory Verification
**Steps:**
1. Use browser console to log timing
2. Run pick/place sequence
3. Measure actual durations vs calculated

**Expected Durations (from constants.ts):**
- Gripper 90°→55° (Δθ=35°): Calculated 817ms → Set 800ms
- Shoulder 90°→135° (Δθ=45°): Calculated 1050ms → Set 1100ms (with 50ms for coordination)
- Elbow 90°→155° (Δθ=65°): Calculated 1200ms → Set 1100ms (coordinated)
- Base 90°→135° (Δθ=45° loaded): Calculated 975ms → Set 1350ms (safety 1.3×)

**Validation:**
- ✅ All durations match T = (Δθ / 60°/s) × safety_factor
- ✅ Coordinated moves finish within 50ms of each other
- ✅ No servo exceeds ~60°/sec angular velocity

**Status:** ⏳ PENDING MANUAL TEST

---

## 4. Voice Control Integration

### Test Case 4.1: Voice "Pick and Place"
**Steps:**
1. Connect robot arm
2. Click microphone button
3. Say: "pick and place"
4. Confirm execution

**Expected Result:**
- ✅ Whisper transcribes correctly
- ✅ Gemini recognizes PICK_PLACE sequence
- ✅ Sequence executes as in Test Case 3.1

**Status:** ⏳ PENDING MANUAL TEST

---

### Test Case 4.2: Voice "Stop" During Sequence
**Steps:**
1. Say "pick and place" via voice
2. While running, click microphone again
3. Say "stop"

**Expected Result:**
- ✅ Stop command recognized
- ✅ Sequence interrupts (as in Test Case 2.4)
- ✅ goHome() executes

**Status:** ⏳ PENDING MANUAL TEST

---

## 5. Other Sequences (Regression)

### Test Case 5.1: Wave Sequence
**Steps:**
1. Click "Wave" button

**Expected Result:**
- ✅ Base: 90° → 60° → 120° → 60° → 90°
- ✅ Each move 300ms delay
- ✅ Total time: ~1.2 seconds
- ✅ Smooth back-and-forth motion

**Status:** ⏳ PENDING MANUAL TEST

---

### Test Case 5.2: Nod Yes Sequence
**Steps:**
1. Click "Nod Yes" button

**Expected Result:**
- ✅ Elbow: 90° → 110° → 70° → 110° → 90°
- ✅ Each move 400ms delay
- ✅ Creates nodding motion

**Status:** ⏳ PENDING MANUAL TEST

---

### Test Case 5.3: Shake No Sequence
**Steps:**
1. Click "Shake No" button

**Expected Result:**
- ✅ Base: 90° → 70° → 110° → 70° → 90°
- ✅ Each move 200ms delay
- ✅ Fast shaking motion

**Status:** ⏳ PENDING MANUAL TEST

---

## 6. Edge Cases

### Test Case 6.1: Stop Immediately After Starting
**Steps:**
1. Click "Pick Place"
2. Immediately click "Stop" (within 100ms)

**Expected Result:**
- ✅ First command may execute (gripper open)
- ✅ Subsequent commands cancelled
- ✅ goHome() returns to 90°
- ✅ No crashes or errors

**Status:** ⏳ PENDING MANUAL TEST

---

### Test Case 6.2: Rapid Sequence Clicks
**Steps:**
1. Rapidly click "Wave" button 5 times

**Expected Result:**
- ✅ Only ONE sequence runs
- ✅ Terminal shows: "Already running a sequence..."
- ✅ Subsequent clicks ignored
- ✅ No queue buildup

**Status:** ⏳ PENDING MANUAL TEST

---

### Test Case 6.3: Disconnect During Sequence
**Steps:**
1. Start "Pick Place" sequence
2. Physically disconnect USB cable mid-execution

**Expected Result:**
- ✅ Web app detects disconnection
- ✅ Sequence stops sending commands
- ✅ Robot servos hold last position
- ✅ Reconnect button becomes available
- ✅ No browser crashes

**Status:** ⏳ PENDING MANUAL TEST

---

## 7. Manual Control Regression

### Test Case 7.1: Slider Control During Idle
**Steps:**
1. Robot at home position
2. Move Base slider from 90° to 45°

**Expected Result:**
- ✅ Servo moves smoothly with debouncing (100ms)
- ✅ Position updates in real-time on slider
- ✅ Terminal shows: "[SERIAL] S-curve move: Servo 0 -> 45° over Xms"

**Status:** ⏳ PENDING MANUAL TEST

---

### Test Case 7.2: Sliders Disabled During Sequence
**Steps:**
1. Start "Pick Place" sequence
2. Try to move sliders

**Expected Result:**
- ✅ Slider visual updates (local state)
- ✅ But commands not sent while isRunningSequence=true
- ✅ This prevents interference with sequences

**Note:** This behavior depends on implementation. Verify in code if sliders are actually disabled during sequences.

**Status:** ⏳ PENDING MANUAL TEST

---

## 8. Firmware Protocol Verification

### Test Case 8.1: Protocol Format Check
**Steps:**
1. Open browser console
2. Move any servo
3. Inspect console logs

**Expected Result:**
- ✅ Command format: `#<servo>M<angle>T<duration>\n`
- ✅ Example: `#0M90T1000\n`
- ✅ Angle is in degrees (0-180)
- ✅ Duration is in milliseconds (100-10000)

**Status:** ⏳ PENDING MANUAL TEST

---

### Test Case 8.2: Coordinated Motion Protocol
**Steps:**
1. Open browser console
2. Run "Pick Place" sequence
3. Watch for step 2 (coordinated approach)

**Expected Result:**
- ✅ Two commands sent 50ms apart:
  - t=0ms: `#1M135T1100\n` (Shoulder)
  - t=50ms: `#2M155T1100\n` (Elbow)
- ✅ Both servos move simultaneously
- ✅ Finish within 50ms of each other

**Status:** ⏳ PENDING MANUAL TEST

---

## 9. Rust CLI Integration

### Test Case 9.1: CLI Session Mode
**Steps:**
1. `cd abel-voice-cli`
2. `cargo run -- session`
3. Say: "pick and place"

**Expected Result:**
- ✅ Audio recorded (5 seconds)
- ✅ Whisper transcription shown
- ✅ Gemini generates Python script
- ✅ Script saved to `scripts/cmd_001.py`
- ✅ Execution confirmation prompt
- ✅ Script executes pick/place sequence

**Status:** ⏳ PENDING MANUAL TEST

---

### Test Case 9.2: CLI One-Shot Mode
**Steps:**
1. `cargo run -- once --save test.py`
2. Say: "open gripper"

**Expected Result:**
- ✅ Script generated and saved to test.py
- ✅ Script contains `move_servo(3, 55)`
- ✅ Script executes, gripper opens

**Status:** ⏳ PENDING MANUAL TEST

---

## Summary of Critical Tests

### Must Pass Before Production:
1. ✅ Home button works from any position
2. ✅ Stop button interrupts sequences safely
3. ✅ Pick/Place with coordinated motion executes correctly
4. ✅ No collisions during coordinated moves
5. ✅ Stop during coordinated move doesn't cause crashes
6. ✅ Mathematical durations are correct (~60°/sec)

### Nice to Have:
7. ⚪ Voice control integration works
8. ⚪ Rust CLI generates correct scripts
9. ⚪ All legacy sequences (Wave, Nod, Shake) unchanged

---

## Test Execution Log

| Test Case | Status | Date | Tester | Notes |
|-----------|--------|------|--------|-------|
| 1.1 | ⏳ | - | - | - |
| 1.2 | ⏳ | - | - | - |
| 1.3 | ⏳ | - | - | - |
| 2.1 | ⏳ | - | - | - |
| 2.2 | ⏳ | - | - | - |
| 2.3 | ⏳ | - | - | - |
| 2.4 | ⏳ | - | - | - |
| 3.1 | ⏳ | - | - | - |
| 3.2 | ⏳ | - | - | - |
| 4.1 | ⏳ | - | - | - |
| 4.2 | ⏳ | - | - | - |
| 5.1 | ⏳ | - | - | - |
| 5.2 | ⏳ | - | - | - |
| 5.3 | ⏳ | - | - | - |
| 6.1 | ⏳ | - | - | - |
| 6.2 | ⏳ | - | - | - |
| 6.3 | ⏳ | - | - | - |
| 7.1 | ⏳ | - | - | - |
| 7.2 | ⏳ | - | - | - |
| 8.1 | ⏳ | - | - | - |
| 8.2 | ⏳ | - | - | - |
| 9.1 | ⏳ | - | - | - |
| 9.2 | ⏳ | - | - | - |

---

## Known Issues & Limitations

### Coordinated Motion Stop Behavior
**Issue:** When stop is pressed during coordinated moves (commands sent 50ms apart), both servo commands may complete before the stop takes effect.

**Why This Happens:**
- Firmware receives both commands before JavaScript loop checks `stopSequenceRef`
- Commands already in firmware continue to execute (by design)

**Is This a Problem?**
NO - This is expected and safe:
- Commands execute smoothly with S-curve acceleration
- No sudden stops mid-motion (which would cause mechanical stress)
- goHome() ensures safe recovery regardless of position
- Stop prevents NEW commands, which is the important part

**Alternative Approach (Not Recommended):**
Send emergency stop command to firmware to halt all servos immediately. This would require firmware changes and could cause:
- Mechanical stress from sudden stops
- Potential servo damage
- Oscillation or vibration

**Conclusion:** Current behavior is optimal for servo longevity and smooth operation.

---

## Regression Analysis

### Changes Made:
1. ✅ Updated `constants.ts` with coordinated motion sequence
2. ✅ Added mathematical trajectory calculations
3. ✅ Updated `FIRMWARE.md` documentation
4. ✅ Created `abel-voice-cli/` Rust CLI

### Code Unchanged (Should Still Work):
1. ✅ `useAbel.ts` - stopSequence(), goHome(), runSequence()
2. ✅ `ControlPanel.tsx` - Home/Stop button logic
3. ✅ `serialService.ts` - Command protocol
4. ✅ Legacy sequences: WAVE, NOD_YES, SHAKE_NO

### Conclusion:
**All existing functionality should work unchanged.** The coordinated motion is purely additive - it uses the existing 50ms delay pattern but with matching movement durations for simultaneous completion.

---

## Next Steps

1. **Manual Testing:** Execute all test cases with physical hardware
2. **Update Test Log:** Mark ✅ or ❌ for each test
3. **Document Issues:** Add any failures to Known Issues section
4. **Fix Critical Bugs:** Address any test failures before deployment
5. **Optional:** Add automated tests for sequence timing validation

/**
 * Voice Control & Gemini API Test Script
 * Tests the voice command interpretation system
 *
 * Usage: GEMINI_API_KEY=your_key_here node test_voice_control.js
 *
 * SECURITY: API key is loaded from environment variable, never hardcoded.
 */

// Load API key from environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

if (!GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY environment variable not set');
  console.error('Usage: GEMINI_API_KEY=your_key node test_voice_control.js');
  process.exit(1);
}

const FUNCTION_DECLARATIONS = [
  {
    name: 'move_servo',
    description: 'Move a specific servo to a target angle. Use this for precise control of individual joints.',
    parameters: {
      type: 'object',
      properties: {
        servo: {
          type: 'integer',
          description: 'Servo ID: 0=Base (rotation), 1=Shoulder, 2=Elbow, 3=Gripper'
        },
        angle: {
          type: 'integer',
          description: 'Target angle in degrees (0-180). For gripper: 60=open, 120=closed'
        }
      },
      required: ['servo', 'angle']
    }
  },
  {
    name: 'run_sequence',
    description: 'Execute a pre-programmed movement sequence.',
    parameters: {
      type: 'object',
      properties: {
        sequence_name: {
          type: 'string',
          description: 'Name of the sequence to run',
          enum: ['WAVE', 'NOD_YES', 'SHAKE_NO', 'HAND_OVER', 'PICK_PLACE']
        }
      },
      required: ['sequence_name']
    }
  },
  {
    name: 'go_home',
    description: 'Return all servos to the home position (90 degrees center).',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'stop',
    description: 'Emergency stop. Halt any running sequence and return to home.',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
];

async function testGeminiAPI(transcript) {
  try {
    console.log(`\n📝 Testing: "${transcript}"`);

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Robot control command: "${transcript}"\n\nInterpret this natural language command and call the appropriate function(s). You can chain multiple function calls for complex commands.`
          }]
        }],
        tools: [{
          function_declarations: FUNCTION_DECLARATIONS
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', data.error?.message || 'Unknown error');
      return null;
    }

    if (!data.candidates || !data.candidates[0]) {
      console.error('❌ No candidates in response');
      return null;
    }

    const candidate = data.candidates[0];

    // Check for function calls
    if (candidate.content?.parts) {
      const functionCalls = candidate.content.parts
        .filter(part => part.functionCall)
        .map(part => part.functionCall);

      if (functionCalls.length > 0) {
        console.log('✅ Function calls detected:');
        functionCalls.forEach(fc => {
          console.log(`   - ${fc.name}(${JSON.stringify(fc.args)})`);
        });
        return functionCalls;
      }
    }

    // Check for text response
    const text = candidate.content?.parts?.[0]?.text;
    if (text) {
      console.log('⚠️  Text response (no function call):', text);
      return null;
    }

    console.error('❌ Could not parse response');
    return null;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🤖 Abel Arm Voice Control Test Suite\n');
  console.log('=' .repeat(60));

  // Test 1: API connectivity
  console.log('\n📡 Test 1: API Connectivity');
  const connectivityTest = await testGeminiAPI('go home');
  if (connectivityTest) {
    console.log('✅ API is reachable and responding');
  } else {
    console.log('❌ API connectivity failed');
    return;
  }

  // Test 2: Simple servo movement
  console.log('\n🔧 Test 2: Simple Servo Commands');
  await testGeminiAPI('move base to 45 degrees');
  await testGeminiAPI('rotate shoulder to 120');
  await testGeminiAPI('open gripper');
  await testGeminiAPI('close gripper');

  // Test 3: Sequence commands
  console.log('\n🎭 Test 3: Sequence Commands');
  await testGeminiAPI('wave');
  await testGeminiAPI('nod yes');
  await testGeminiAPI('shake no');
  await testGeminiAPI('hand over');
  await testGeminiAPI('pick and place');

  // Test 4: Complex commands
  console.log('\n🧠 Test 4: Complex Multi-Step Commands');
  await testGeminiAPI('move base to 90 and open the gripper');
  await testGeminiAPI('set all servos to 90 degrees');

  // Test 5: Control commands
  console.log('\n⚡ Test 5: Control Commands');
  await testGeminiAPI('stop');
  await testGeminiAPI('go home');
  await testGeminiAPI('return to home position');

  // Test 6: Natural language variations
  console.log('\n💬 Test 6: Natural Language Variations');
  await testGeminiAPI('turn the base all the way to the left');
  await testGeminiAPI('lift the arm up');
  await testGeminiAPI('grab something');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test suite complete!\n');
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

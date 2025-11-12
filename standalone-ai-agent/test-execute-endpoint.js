// Test the agent API execute endpoint with correct action parameter
import dotenv from 'dotenv';
dotenv.config();

async function testExecuteEndpoint() {
  console.log('🧪 Testing Agent API Execute Endpoint...\n');

  // Test with correct action parameter ('clean' not 'clean_rug')
  console.log('🔧 Testing execute endpoint with action="clean"...');
  try {
    const mockAuth = {
      authorizationToken: '0x1234567890abcdef', // Mock token
      action: 'clean', // CORRECT: Should be 'clean', not 'clean_rug'
      tokenId: 1,
      nonce: 'test_nonce_123',
      expires: Math.floor(Date.now() / 1000) + 300 // 5 minutes from now
    };

    console.log('📤 Sending authorization object:', JSON.stringify(mockAuth, null, 2));

    const executeResponse = await fetch('http://localhost:3001/rug/1/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorization: mockAuth
      })
    });

    const executeResult = await executeResponse.json();
    console.log('📥 Execute response status:', executeResponse.status);
    console.log('📥 Execute result:', JSON.stringify(executeResult, null, 2));

    if (executeResponse.ok && executeResult.success) {
      console.log('✅ Agent API execute endpoint working correctly!');
    } else {
      console.log('❌ Agent API execute failed:', executeResult.error);

      // Check if it's the action validation error
      if (executeResult.error && executeResult.error.includes('Invalid action')) {
        console.log('🎯 This confirms the action parameter issue!');
        console.log('💡 The chat interface is sending action="clean_rug" instead of action="clean"');
      }
    }
  } catch (error) {
    console.error('❌ Error testing execute endpoint:', error.message);
  }

  // Test with incorrect action parameter to confirm the issue
  console.log('\n🔧 Testing execute endpoint with action="clean_rug" (should fail)...');
  try {
    const badAuth = {
      authorizationToken: '0x1234567890abcdef',
      action: 'clean_rug', // INCORRECT: Should cause validation error
      tokenId: 1,
      nonce: 'test_nonce_123',
      expires: Math.floor(Date.now() / 1000) + 300
    };

    const badResponse = await fetch('http://localhost:3001/rug/1/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorization: badAuth
      })
    });

    const badResult = await badResponse.json();
    console.log('❌ Bad action result (expected):', badResult.error);
  } catch (error) {
    console.error('❌ Error testing bad action:', error.message);
  }

  console.log('\n🎯 Execute endpoint test completed!');
}

testExecuteEndpoint().catch(console.error);

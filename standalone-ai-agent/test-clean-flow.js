// Test the complete clean rug flow
import dotenv from 'dotenv';
dotenv.config();

async function testCleanFlow() {
  console.log('🧪 Testing Clean Rug Flow...\n');

  // Step 1: Get quote
  console.log('📋 Step 1: Getting quote for cleaning rug 1...');
  try {
    const quoteResponse = await fetch('http://localhost:3000/api/maintenance/quote/1/clean');
    const quoteData = await quoteResponse.json();

    if (quoteResponse.status === 402 && quoteData.x402) {
      console.log('✅ Quote received:', quoteData.x402.accepts[0].description);
      console.log('💰 Cost:', quoteData.x402.accepts[0].maxAmountRequired, 'ETH\n');
    } else {
      console.log('❌ Unexpected quote response:', quoteResponse.status);
      return;
    }
  } catch (error) {
    console.error('❌ Quote failed:', error.message);
    return;
  }

  // Step 2: Simulate X402 payment
  console.log('💳 Step 2: Simulating X402 payment...');
  try {
    // This would normally be done by the chat interface
    // For now, let's just test if the action endpoint accepts payments
    console.log('⚠️  Skipping actual payment simulation for safety\n');
  } catch (error) {
    console.error('❌ Payment simulation failed:', error.message);
  }

  // Step 3: Check rug status
  console.log('🔍 Step 3: Checking current rug status...');
  try {
    const statusResponse = await fetch('http://localhost:3001/rug/1/status');
    const statusData = await statusResponse.json();

    if (statusResponse.ok && statusData.success) {
      console.log('✅ Rug status:', {
        canClean: statusData.data.canClean,
        dirtLevel: statusData.data.dirtLevel,
        maintenanceScore: statusData.data.maintenanceScore
      });
    } else {
      console.log('❌ Status check failed');
    }
  } catch (error) {
    console.error('❌ Status check error:', error.message);
  }

  console.log('\n🎯 Clean flow test completed!');
  console.log('💡 To test full flow: run "npm run chat" and say "clean rug 1"');
}

testCleanFlow().catch(console.error);

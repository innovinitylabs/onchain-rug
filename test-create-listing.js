// Test createListing transaction simulation
import https from 'https';

// Simulate the exact transaction the frontend would send
async function testCreateListing() {
  console.log('=== TESTING CREATE LISTING TRANSACTION ===');

  const contractAddress = '0xa60b6eE6dDF1339f73B18Cb759b583880Db64cce';
  const fromAddress = '0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F';

  // Parameters: createListing(uint256,uint256,uint256)
  // tokenId: 2, price: 0.001 ETH, duration: 7 days
  const tokenId = 2;
  const priceWei = BigInt('1000000000000000'); // 0.001 ETH in wei
  const duration = 7 * 24 * 60 * 60; // 7 days in seconds

  console.log('Parameters:');
  console.log('  Token ID:', tokenId);
  console.log('  Price:', priceWei.toString(), 'wei');
  console.log('  Duration:', duration, 'seconds');

  // Encode function call: createListing(2, 1000000000000000, 604800)
  // Function signature: 0xb03053b6
  const encodedData = '0xb03053b6' +
    tokenId.toString(16).padStart(64, '0') +
    priceWei.toString(16).padStart(64, '0') +
    duration.toString(16).padStart(64, '0');

  console.log('Encoded data:', encodedData);

  // Test eth_call to see if it would succeed
  const callData = JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [{
      from: fromAddress,
      to: contractAddress,
      data: encodedData,
      gas: '0x493e0', // 300,000 gas
      gasPrice: '0x3b9aca00' // 1 gwei
    }, 'latest'],
    id: 1
  });

  const options = {
    hostname: 'sepolia.shape.network',
    port: 443,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': callData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          console.log('eth_call result:', result);

          if (result.error) {
            console.error('❌ eth_call failed:', result.error.message);
            reject(new Error(result.error.message));
          } else {
            console.log('✅ eth_call succeeded - transaction would work');
            resolve(result.result);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(callData);
    req.end();
  });
}

// Also test gas estimation
async function testGasEstimation() {
  console.log('\n=== TESTING GAS ESTIMATION ===');

  const contractAddress = '0xa60b6eE6dDF1339f73B18Cb759b583880Db64cce';
  const fromAddress = '0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F';

  const tokenId = 2;
  const priceWei = BigInt('1000000000000000');
  const duration = 7 * 24 * 60 * 60;

  const encodedData = '0xb03053b6' +
    tokenId.toString(16).padStart(64, '0') +
    priceWei.toString(16).padStart(64, '0') +
    duration.toString(16).padStart(64, '0');

  const estimateData = JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_estimateGas',
    params: [{
      from: fromAddress,
      to: contractAddress,
      data: encodedData
    }],
    id: 1
  });

  const options = {
    hostname: 'sepolia.shape.network',
    port: 443,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': estimateData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          console.log('eth_estimateGas result:', result);

          if (result.error) {
            console.error('❌ Gas estimation failed:', result.error.message);
            reject(new Error(result.error.message));
          } else {
            console.log('✅ Gas estimation succeeded:', parseInt(result.result, 16), 'gas');
            resolve(result.result);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(estimateData);
    req.end();
  });
}

async function runTests() {
  try {
    await testCreateListing();
    await testGasEstimation();
    console.log('\n🎉 All tests passed - transaction should work!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
  }
}

runTests();

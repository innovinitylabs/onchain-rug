// Quick test to check if token 2 is listed
const https = require('https');

const data = JSON.stringify({
  jsonrpc: '2.0',
  method: 'eth_call',
  params: [{
    to: '0xa60b6eE6dDF1339f73B18Cb759b583880Db64cce',
    data: '0x' + '7e9e6b4f' + '0000000000000000000000000000000000000000000000000000000000000002'.padStart(64, '0') // getListing(2)
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
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('Response:', body);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.write(data);
req.end();

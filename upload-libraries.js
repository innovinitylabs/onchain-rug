import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const { execSync } = require('child_process');

// Read and encode p5.js
const p5Content = fs.readFileSync('data/p5.min.js', 'utf8');
const p5Base64 = Buffer.from(p5Content).toString('base64');

// Upload p5.js
console.log('Uploading p5.js to RugEthFSStorage...');
console.log('Base64 length:', p5Base64.length, 'characters');

try {
  const command = `cast send 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 "storeLibrary(string,string)" "p5.min.js" "${p5Base64}" --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`;
  const result = execSync(command, { encoding: 'utf8' });
  console.log('✅ p5.js uploaded successfully!');
  console.log(result);
} catch (error) {
  console.error('❌ Failed to upload p5.js:', error.message);
}

// Read and encode rug-algorithm.js
const algoContent = fs.readFileSync('data/rug-algorithm.js', 'utf8');
const algoBase64 = Buffer.from(algoContent).toString('base64');

// Upload rug-algorithm.js
console.log('\nUploading rug-algorithm.js to RugEthFSStorage...');
console.log('Base64 length:', algoBase64.length, 'characters');

try {
  const command = `cast send 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 "storeLibrary(string,string)" "rug-algorithm.js" "${algoBase64}" --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`;
  const result = execSync(command, { encoding: 'utf8' });
  console.log('✅ rug-algorithm.js uploaded successfully!');
  console.log(result);
} catch (error) {
  console.error('❌ Failed to upload rug-algorithm.js:', error.message);
}

// Verify uploads
console.log('\n🔍 Verifying uploads...');
try {
  const p5Exists = execSync(`cast call 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 "libraryExists(string)" "p5.min.js" --rpc-url http://localhost:8545`, { encoding: 'utf8' });
  const algoExists = execSync(`cast call 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 "libraryExists(string)" "rug-algorithm.js" --rpc-url http://localhost:8545`, { encoding: 'utf8' });

  console.log('p5.min.js exists:', p5Exists.trim());
  console.log('rug-algorithm.js exists:', algoExists.trim());
} catch (error) {
  console.error('❌ Failed to verify uploads:', error.message);
}

console.log('\n🎉 All libraries uploaded! Ready to mint NFTs with on-chain p5.js!');

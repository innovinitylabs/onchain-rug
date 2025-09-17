import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const { execSync } = require('child_process');

// Read and encode gzipped p5.js
console.log('Reading gzipped p5.js v1.11.10...');
const gzippedContent = fs.readFileSync('data/p5.min.js.gz');
const base64 = gzippedContent.toString('base64');

console.log(`Gzipped p5.js size: ${gzippedContent.length} bytes`);
console.log(`Base64 size: ${base64.length} characters`);
console.log(`Storage savings: ${Math.round((1 - base64.length/1409472)*100)}%`);

// Upload gzipped p5.js
console.log('\nUploading gzipped p5.js v1.11.10...');

try {
  const command = `cast send 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 "storeLibrary(string,string)" "p5.min.js.gz" "${base64}" --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`;
  const result = execSync(command, { encoding: 'utf8' });
  console.log('✅ Gzipped p5.js v1.11.10 uploaded successfully!');
  console.log('Transaction:', result.split('\n').find(line => line.includes('transactionHash')));

  // Verify upload
  console.log('\n🔍 Verifying upload...');
  const exists = execSync(`cast call 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 "libraryExists(string)" "p5.min.js.gz" --rpc-url http://localhost:8545`, { encoding: 'utf8' });
  console.log('p5.min.js.gz exists:', exists.trim());

} catch (error) {
  console.error('❌ Failed to upload gzipped p5.js:', error.message);
}

// Upload rug-algorithm.js
console.log('\n📤 Uploading rug-algorithm.js...');
const algoContent = fs.readFileSync('data/rug-algorithm.js');
const algoBase64 = algoContent.toString('base64');

try {
  const command = `cast send 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 "storeLibrary(string,string)" "rug-algorithm.js" "${algoBase64}" --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`;
  const result = execSync(command, { encoding: 'utf8' });
  console.log('✅ rug-algorithm.js uploaded successfully!');

  // Verify upload
  const exists = execSync(`cast call 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 "libraryExists(string)" "rug-algorithm.js" --rpc-url http://localhost:8545`, { encoding: 'utf8' });
  console.log('rug-algorithm.js exists:', exists.trim());

} catch (error) {
  console.error('❌ Failed to upload rug-algorithm.js:', error.message);
}

console.log('\n🎉 All libraries uploaded successfully!');
console.log('📊 Summary:');
console.log('- p5.js v1.11.10 (gzipped): ✅ Uploaded');
console.log('- rug-algorithm.js: ✅ Uploaded');
console.log('- Ready for NFT minting with on-chain p5.js! 🚀');

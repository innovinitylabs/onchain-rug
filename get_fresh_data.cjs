// Get fresh data directly from the contract
const { execSync } = require('child_process');
const fs = require('fs');

function getFreshData() {
  console.log('🔄 Getting fresh data from contract...');

  try {
    // Get fresh data from the contract
    console.log('📡 Calling contract...');
    const result = execSync(
      'cast call 0x2263cf7764c19070b6fce6e8b707f2bdc35222c9 "getContent(string,bytes)(bytes)" "rug-p5.js.b64" "0x" --rpc-url https://sepolia.shape.network',
      { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
    );

    console.log('📦 Raw result length:', result.length);
    console.log('📄 Raw result preview:', result.substring(0, 200) + '...');

    // Save the raw result
    fs.writeFileSync('fresh_contract_data.txt', result);
    console.log('💾 Saved raw data to fresh_contract_data.txt');

    // Clean the hex data (remove 0x prefix if present)
    const cleanHex = result.trim().startsWith('0x') ? result.trim().slice(2) : result.trim();

    console.log('🧹 Clean hex length:', cleanHex.length);

    // Convert to buffer
    const buffer = Buffer.from(cleanHex, 'hex');
    console.log('📏 Buffer length:', buffer.length);

    // Convert to string
    const rawString = buffer.toString('utf8');
    console.log('📄 String length:', rawString.length);

    // Save the decoded string
    fs.writeFileSync('fresh_decoded.txt', rawString);
    console.log('💾 Saved decoded string to fresh_decoded.txt');

    // Look for base64 patterns
    const base64Pattern = /[A-Za-z0-9+/]{200,}=*==/;
    const matches = rawString.match(base64Pattern);

    if (matches && matches.length > 0) {
      console.log('🎯 Found base64 content!');
      console.log('Length:', matches[0].length);

      // Save the base64 content
      fs.writeFileSync('fresh_base64.txt', matches[0]);
      console.log('💾 Saved base64 to fresh_base64.txt');

      // Try to decode
      try {
        const decoded = Buffer.from(matches[0], 'base64');
        console.log('✅ Decoded length:', decoded.length);

        const decodedStr = decoded.toString('utf8');
        fs.writeFileSync('fresh_decoded_js.js', decodedStr);
        console.log('💾 Saved decoded JS to fresh_decoded_js.js');

        // Check if it looks like p5.js
        if (decodedStr.includes('function') && (decodedStr.includes('p5') || decodedStr.includes('_p5'))) {
          console.log('🎨 This is definitely p5.js! ✅');
        } else {
          console.log('❓ Content decoded but may not be p5.js');
        }

      } catch (decodeError) {
        console.log('❌ Base64 decode failed:', decodeError.message);
      }

    } else {
      console.log('❌ No base64 pattern found');
      console.log('🔍 First 500 chars:', rawString.substring(0, 500));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getFreshData();

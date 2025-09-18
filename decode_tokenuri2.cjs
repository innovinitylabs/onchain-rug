const fs = require('fs');
const { execSync } = require('child_process');

try {
    console.log('Getting raw tokenURI...');
    const hexData = execSync('cast call --rpc-url http://localhost:8545 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 "tokenURI(uint256)" 1', { encoding: 'utf8' }).trim();
    
    // Remove 0x prefix and Solidity return format
    const cleanHex = hexData.replace('0x', '');
    
    // Skip the first 64 characters (32 bytes) which is the offset/length
    const dataHex = cleanHex.substring(128);
    
    // Convert to buffer and get the actual data
    const buffer = Buffer.from(dataHex, 'hex');
    const decoded = buffer.toString('utf8');
    
    // Extract base64 part
    const base64Start = decoded.indexOf('base64,') + 7;
    const base64Data = decoded.substring(base64Start);
    
    console.log('Base64 data length:', base64Data.length);
    console.log('Base64 data start:', base64Data.substring(0, 100));
    
    // Decode base64
    const jsonData = Buffer.from(base64Data, 'base64').toString('utf8');
    console.log('JSON data start:', jsonData.substring(0, 200));
    
    // Parse JSON
    const json = JSON.parse(jsonData);
    console.log('\n=== PARSED JSON ===');
    console.log('Name:', json.name);
    console.log('Description:', json.description);
    console.log('Animation URL preview:', json.animation_url.substring(0, 100) + '...');
    
    // Decode HTML
    const htmlBase64 = json.animation_url.replace('data:text/html;base64,', '');
    const html = Buffer.from(htmlBase64, 'base64').toString('utf8');
    
    console.log('\n=== HTML CONTENT ===');
    console.log(html.substring(0, 500));
    
    // Save HTML for inspection
    fs.writeFileSync('decoded_nft.html', html);
    console.log('\n✅ HTML saved to decoded_nft.html');
    
} catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
}

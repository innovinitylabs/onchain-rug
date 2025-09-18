const fs = require('fs');
const { execSync } = require('child_process');

try {
    console.log('Getting raw tokenURI...');
    const hexData = execSync('cast call --rpc-url http://localhost:8545 0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE "tokenURI(uint256)" 1', { encoding: 'utf8' }).trim();
    
    console.log('Raw hex length:', hexData.length);
    console.log('Raw hex start:', hexData.substring(0, 100));
    
    // Remove 0x prefix and Solidity return format
    const cleanHex = hexData.replace('0x', '');
    
    // Skip the first 64 characters (32 bytes) which is the offset/length
    const dataHex = cleanHex.substring(128); // Skip offset (64 chars) + length (64 chars)
    
    console.log('Clean data hex length:', dataHex.length);
    
    // Convert to buffer and get the actual data
    const buffer = Buffer.from(dataHex, 'hex');
    const decoded = buffer.toString('utf8');
    
    console.log('Decoded length:', decoded.length);
    console.log('Decoded start:', decoded.substring(0, 200));
    
    // Try to parse as JSON
    const jsonStart = decoded.indexOf('{');
    if (jsonStart !== -1) {
        const jsonData = decoded.substring(jsonStart);
        console.log('JSON data:', jsonData.substring(0, 300));
        
        const json = JSON.parse(jsonData);
        console.log('Animation URL:', json.animation_url.substring(0, 100));
    } else {
        console.log('No JSON found in decoded data');
    }
    
} catch (error) {
    console.error('Error:', error.message);
}

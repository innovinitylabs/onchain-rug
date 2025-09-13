// TokenURI Decoder - Shows how to properly decode the base64 structure

async function decodeTokenURI(contractAddress, tokenId) {
    console.log(`🔍 Decoding tokenURI for contract ${contractAddress}, token ${tokenId}`);
    
    // This would normally call the contract
    // const tokenURI = await contract.tokenURI(tokenId);
    
    // For demonstration, let's simulate what a tokenURI looks like
    const simulatedTokenURI = "data:application/json;base64," + btoa(JSON.stringify({
        name: "Onchain Rug #" + tokenId,
        description: "A fully on-chain generative rug NFT with aging mechanics",
        image: "data:text/html;base64," + btoa("<html><body>Rug Content</body></html>"),
        attributes: [
            { trait_type: "Text Lines", value: "3" },
            { trait_type: "Dirt Level", value: "0" }
        ]
    }));
    
    console.log("📄 Raw tokenURI:", simulatedTokenURI);
    
    try {
        // Step 1: Split to get base64 JSON part
        const base64Json = simulatedTokenURI.split('data:application/json;base64,')[1];
        console.log("🔢 Base64 JSON:", base64Json);
        
        // Step 2: Decode base64 to get JSON string
        const jsonString = atob(base64Json);
        console.log("📋 JSON String:", jsonString);
        
        // Step 3: Parse JSON
        const metadata = JSON.parse(jsonString);
        console.log("📊 Parsed Metadata:", metadata);
        
        // Step 4: Extract HTML from image field
        const imageUrl = metadata.image;
        console.log("🖼️ Image URL:", imageUrl);
        
        // Step 5: Get base64 HTML part
        const base64Html = imageUrl.split('data:text/html;base64,')[1];
        console.log("📄 Base64 HTML:", base64Html);
        
        // Step 6: Decode to get actual HTML
        const html = atob(base64Html);
        console.log("✅ Final HTML:", html);
        
        return html;
    } catch (error) {
        console.error("❌ Decoding failed:", error);
        return null;
    }
}

// Test the decoder
console.log("🧪 Testing tokenURI decoder...");
decodeTokenURI("0x38b7F32Bfb88f0c513E0e52257277057F2375010", 1);

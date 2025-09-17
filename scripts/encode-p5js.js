import fs from "fs";
import path from "path";

/**
 * Utility script to encode p5.js file to base64 for EthFS storage
 */
function encodeP5JS() {
  try {
    // Read p5.js file
    const p5Path = path.join(process.cwd(), "data", "p5.min.js");

    if (!fs.existsSync(p5Path)) {
      console.error("❌ p5.min.js not found at:", p5Path);
      console.log("Please ensure p5.min.js exists in the data/ folder");
      process.exit(1);
    }

    const p5Content = fs.readFileSync(p5Path, "utf8");
    console.log("📖 Read p5.js file");
    console.log("   Size:", p5Content.length, "characters");
    console.log("   Size:", (p5Content.length / 1024).toFixed(2), "KB");

    // Convert to base64
    const p5Base64 = Buffer.from(p5Content).toString("base64");
    console.log("🔄 Converted to base64");
    console.log("   Base64 size:", p5Base64.length, "characters");
    console.log("   Base64 size:", (p5Base64.length / 1024).toFixed(2), "KB");

    // Calculate gas estimate (rough)
    const gasPerByte = 20_000; // Approximate gas per byte for storage
    const estimatedGas = p5Base64.length * gasPerByte;
    console.log("⛽ Estimated gas for storage:", estimatedGas.toLocaleString());
    console.log("💰 Estimated ETH cost (at 20 gwei):", ((estimatedGas * 20e9) / 1e18).toFixed(6), "ETH");

    // Save base64 to file
    const outputPath = path.join(process.cwd(), "data", "p5.min.js.base64");
    fs.writeFileSync(outputPath, p5Base64);
    console.log("💾 Saved base64 to:", outputPath);

    // Display first 100 characters as preview
    console.log("\n📄 Base64 Preview (first 100 chars):");
    console.log(p5Base64.substring(0, 100) + "...");

    console.log("\n✅ p5.js encoding complete!");
    console.log("Use this base64 string when calling storeLibrary() in RugEthFSStorage");

    return p5Base64;

  } catch (error) {
    console.error("❌ Encoding failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  encodeP5JS();
}

export { encodeP5JS };

import fs from "fs";
import path from "path";

/**
 * Extract the rug algorithm from HTMLGenerator.sol and create rug-algorithm.js
 */
function extractRugAlgorithm() {
  try {
    // Read the HTMLGenerator.sol file
    const htmlGeneratorPath = path.join(process.cwd(), "src", "HTMLGenerator.sol");

    if (!fs.existsSync(htmlGeneratorPath)) {
      console.error("❌ HTMLGenerator.sol not found at:", htmlGeneratorPath);
      console.log("Make sure you're running this from the project root");
      process.exit(1);
    }

    const content = fs.readFileSync(htmlGeneratorPath, "utf8");
    console.log("📖 Read HTMLGenerator.sol");

    // Extract the getJavaScriptAlgorithm function content
    const algoRegex = /function getJavaScriptAlgorithm\(\) internal pure returns \(string memory\) \{([\s\S]*?)\}/;
    const match = content.match(algoRegex);

    if (!match) {
      console.error("❌ Could not find getJavaScriptAlgorithm function");
      process.exit(1);
    }

    let algorithmContent = match[1];

    // Clean up the extracted content
    // Remove the 'return string.concat(' and final ');'
    algorithmContent = algorithmContent.replace(/^\s*return string\.concat\(\s*/, '');
    algorithmContent = algorithmContent.replace(/\s*\);\s*$/, '');

    // Split by comma and clean up each line
    const lines = algorithmContent.split("',");

    let cleanAlgorithm = "";
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // Remove leading quote and any trailing quote
      line = line.replace(/^["']/, '');
      line = line.replace(/["']\s*$/, '');

      // Skip empty lines
      if (line.trim() === "") continue;

      // Add the line (but remove the trailing quote and comma from each line)
      cleanAlgorithm += line + "\n";
    }

    console.log("🔧 Extracted algorithm content");
    console.log("   Length:", cleanAlgorithm.length, "characters");

    // Save to file
    const outputPath = path.join(process.cwd(), "data", "rug-algorithm.js");
    fs.writeFileSync(outputPath, cleanAlgorithm.trim());
    console.log("💾 Saved rug algorithm to:", outputPath);

    // Display first few lines as preview
    const previewLines = cleanAlgorithm.split('\n').slice(0, 5);
    console.log("\n📄 Preview of extracted algorithm:");
    previewLines.forEach((line, index) => {
      console.log(`${index + 1}: ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
    });

    console.log("\n✅ Rug algorithm extraction complete!");
    console.log("You can now use this file with the EthFS deployment script");

    return cleanAlgorithm;

  } catch (error) {
    console.error("❌ Extraction failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  extractRugAlgorithm();
}

export { extractRugAlgorithm };

import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying Full Rug EthFS System...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  try {
    // ============================================================================
    // 1. DEPLOY CONTRACTS
    // ============================================================================

    console.log("\n📦 Step 1: Deploying RugScriptyBuilderV2...");
    const RugScriptyBuilderV2 = await hre.ethers.getContractFactory("RugScriptyBuilderV2");
    const rugScriptyBuilderV2 = await RugScriptyBuilderV2.deploy();
    await rugScriptyBuilderV2.waitForDeployment();
    const rugScriptyBuilderV2Address = await rugScriptyBuilderV2.getAddress();
    console.log("✅ RugScriptyBuilderV2 deployed to:", rugScriptyBuilderV2Address);

    console.log("\n💾 Step 2: Deploying RugEthFSStorage...");
    const RugEthFSStorage = await hre.ethers.getContractFactory("RugEthFSStorage");
    const rugEthFSStorage = await RugEthFSStorage.deploy();
    await rugEthFSStorage.waitForDeployment();
    const rugEthFSStorageAddress = await rugEthFSStorage.getAddress();
    console.log("✅ RugEthFSStorage deployed to:", rugEthFSStorageAddress);

    // Deploy OnchainRugsHTMLGenerator
    console.log("\n🎨 Step 3: Deploying OnchainRugsHTMLGenerator...");
    const OnchainRugsHTMLGenerator = await hre.ethers.getContractFactory("OnchainRugsHTMLGenerator");
    const onchainRugsHTMLGenerator = await OnchainRugsHTMLGenerator.deploy();
    await onchainRugsHTMLGenerator.waitForDeployment();
    const onchainRugsHTMLGeneratorAddress = await onchainRugsHTMLGenerator.getAddress();
    console.log("✅ OnchainRugsHTMLGenerator deployed to:", onchainRugsHTMLGeneratorAddress);

    // ============================================================================
    // 3. UPLOAD LIBRARIES
    // ============================================================================

    console.log("\n📤 Step 4: Uploading JavaScript libraries...");

    // Upload p5.js
    console.log("📦 Uploading p5.js...");
    const p5Path = path.join(process.cwd(), "data", "p5.min.js");
    if (!fs.existsSync(p5Path)) {
      throw new Error("p5.min.js not found at: " + p5Path);
    }

    const p5Content = fs.readFileSync(p5Path, "utf8");
    const p5Base64 = Buffer.from(p5Content).toString("base64");
    console.log("  p5.js size:", p5Content.length, "characters →", p5Base64.length, "base64 chars");

    const p5UploadTx = await rugEthFSStorage.storeLibrary("p5.min.js", p5Base64);
    await p5UploadTx.wait();
    console.log("✅ p5.js uploaded");

    // Upload rug algorithm
    console.log("🧶 Uploading rug algorithm...");
    const algoPath = path.join(process.cwd(), "data", "rug-algorithm.js");
    if (!fs.existsSync(algoPath)) {
      throw new Error("rug-algorithm.js not found at: " + algoPath);
    }

    const algoContent = fs.readFileSync(algoPath, "utf8");
    const algoBase64 = Buffer.from(algoContent).toString("base64");
    console.log("  Algorithm size:", algoContent.length, "characters →", algoBase64.length, "base64 chars");

    const algoUploadTx = await rugEthFSStorage.storeLibrary("rug-algorithm.js", algoBase64);
    await algoUploadTx.wait();
    console.log("✅ Rug algorithm uploaded");

    // Verify uploads
    const p5Exists = await rugEthFSStorage.libraryExists("p5.min.js");
    const p5Info = await rugEthFSStorage.getLibraryInfo("p5.min.js");
    const algoExists = await rugEthFSStorage.libraryExists("rug-algorithm.js");
    const algoInfo = await rugEthFSStorage.getLibraryInfo("rug-algorithm.js");

    console.log("🔍 Library Verification:");
    console.log("  p5.js:", p5Exists ? "✅" : "❌", "| size:", p5Info[0], "bytes");
    console.log("  rug-algorithm.js:", algoExists ? "✅" : "❌", "| size:", algoInfo[0], "bytes");

    // ============================================================================
    // 4. TEST INTEGRATION
    // ============================================================================

    console.log("\n🧪 Step 5: Testing integration...");

    // Create a test HTML request
    const testRequest = {
      headTags: [{
        tagOpen: '<meta charset="utf-8"><title>Test Rug</title><style>body{background:#f0f0f0;}</style>',
        tagContent: "",
        tagClose: "",
        tagType: 0, // useTagOpenAndClose
        name: "",
        contractAddress: hre.ethers.ZeroAddress,
        contractData: "0x"
      }],
      bodyTags: [{
        name: "p5.min.js",
        contractAddress: rugEthFSStorageAddress,
        contractData: hre.ethers.zeroPadValue(hre.ethers.toUtf8Bytes("p5.min.js"), 32),
        tagType: 1, // scriptBase64DataURI
        tagOpen: "",
        tagClose: "",
        tagContent: ""
      }, {
        tagOpen: '<div id="test"><canvas id="canvas" width="400" height="400"></canvas></div>',
        tagContent: "",
        tagClose: "",
        tagType: 0, // useTagOpenAndClose
        name: "",
        contractAddress: hre.ethers.ZeroAddress,
        contractData: "0x"
      }, {
        tagContent: 'console.log("Test script loaded!");',
        tagClose: "",
        tagType: 2, // script
        tagOpen: "",
        name: "",
        contractAddress: hre.ethers.ZeroAddress,
        contractData: "0x"
      }]
    };

    console.log("⏳ Generating test HTML...");
    const htmlResult = await rugScriptyBuilderV2.getHTMLURLSafeString(testRequest);
    console.log("✅ HTML generated successfully!");
    console.log("📏 HTML length:", htmlResult.length, "characters");

    // Extract and display a sample of the generated HTML
    const previewLength = Math.min(200, htmlResult.length);
    console.log("📄 HTML Preview (first", previewLength, "chars):");
    console.log(htmlResult.substring(0, previewLength) + (htmlResult.length > previewLength ? "..." : ""));

    // ============================================================================
    // 4. DISPLAY RESULTS
    // ============================================================================

    console.log("\n" + "=".repeat(80));
    console.log("🎉 FULL RUG ETHFS SYSTEM DEPLOYMENT COMPLETE!");
    console.log("=".repeat(80));

    const deploymentInfo = {
      network: await deployer.provider.getNetwork(),
      deployer: deployer.address,
      contracts: {
        rugScriptyBuilderV2: rugScriptyBuilderV2Address,
        rugEthFSStorage: rugEthFSStorageAddress,
        onchainRugsHTMLGenerator: onchainRugsHTMLGeneratorAddress
      },
      libraries: {
        p5js: {
          name: "p5.min.js",
          size: p5Info[0],
          uploadedBy: p5Info[2],
          uploadedAt: new Date(Number(p5Info[1]) * 1000).toISOString()
        },
        rugAlgorithm: {
          name: "rug-algorithm.js",
          size: algoInfo[0],
          uploadedBy: algoInfo[2],
          uploadedAt: new Date(Number(algoInfo[1]) * 1000).toISOString()
        }
      },
      testResults: {
        htmlGenerated: true,
        htmlLength: htmlResult.length,
        p5jsAccessible: p5Exists,
        algorithmAccessible: algoExists
      },
      timestamp: new Date().toISOString()
    };

    console.log("\n📋 DEPLOYMENT SUMMARY:");
    console.log("- RugScriptyBuilderV2:", rugScriptyBuilderV2Address);
    console.log("- RugEthFSStorage:", rugEthFSStorageAddress);
    console.log("- OnchainRugsHTMLGenerator:", onchainRugsHTMLGeneratorAddress);
    console.log("- p5.js uploaded:", p5Exists ? "✅" : "❌");
    console.log("- Rug algorithm uploaded:", algoExists ? "✅" : "❌");
    console.log("- HTML generation:", "✅");
    console.log("- Total gas used: Estimate available in transaction receipts");

    console.log("\n🎯 NEXT STEPS:");
    console.log("1. Set contract addresses in your OnchainRugs contract");
    console.log("2. The system will automatically use the new scripty approach");
    console.log("3. Test NFT generation with on-chain p5.js and algorithm");
    console.log("4. Verify OpenSea compatibility with URL-safe HTML");

    console.log("\n💡 USAGE EXAMPLE:");
    console.log(`// Set the contract addresses:
await onchainRugs.setRugScriptyContracts(
  "${rugScriptyBuilderV2Address}",     // RugScriptyBuilderV2
  "${rugEthFSStorageAddress}",         // RugEthFSStorage
  "${onchainRugsHTMLGeneratorAddress}"  // OnchainRugsHTMLGenerator
);

// Mint NFTs - automatically uses the new system!
await onchainRugs.mintRug(textRows, seed, paletteName, stripeData, characterMap);

// Get tokenURI - now fully on-chain with p5.js!
const metadata = await onchainRugs.tokenURI(tokenId);`);

    console.log("\n🔧 SYSTEM ARCHITECTURE:");
    console.log("├── RugScriptyBuilderV2 (Core HTML assembler)");
    console.log("├── RugEthFSStorage (Stores p5.js + algorithms)");
    console.log("├── OnchainRugsHTMLGenerator (Project-specific logic)");
    console.log("└── OnchainRugs (NFT contract using the system)");

    return deploymentInfo;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

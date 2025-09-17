import { ethers as ethersLib } from "ethers";

async function main() {
  console.log("🚀 Deploying Rug Scripty System Locally...");

  // Connect to local Hardhat network
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478c7428fe9b2c8e9b8c8c8c8c8c", provider);

  console.log("Deploying with account:", signer.address);
  console.log("Account balance:", ethers.formatEther(await provider.getBalance(signer.address)), "ETH");

  try {
    // ============================================================================
    // 1. DEPLOY CONTRACTS
    // ============================================================================

    console.log("\n📦 Step 1: Deploying RugScriptyBuilderV2...");
    const RugScriptyBuilderV2 = new ethers.ContractFactory([], [], signer);
    const rugScriptyBuilderV2 = await RugScriptyBuilderV2.deploy();
    await rugScriptyBuilderV2.waitForDeployment();
    const rugScriptyBuilderV2Address = await rugScriptyBuilderV2.getAddress();
    console.log("✅ RugScriptyBuilderV2 deployed to:", rugScriptyBuilderV2Address);

    console.log("\n💾 Step 2: Deploying RugEthFSStorage...");
    const RugEthFSStorage = new ethers.ContractFactory([], [], signer);
    const rugEthFSStorage = await RugEthFSStorage.deploy();
    await rugEthFSStorage.waitForDeployment();
    const rugEthFSStorageAddress = await rugEthFSStorage.getAddress();
    console.log("✅ RugEthFSStorage deployed to:", rugEthFSStorageAddress);

    console.log("\n🎨 Step 3: Deploying OnchainRugsHTMLGenerator...");
    const OnchainRugsHTMLGenerator = new ethers.ContractFactory([], [], signer);
    const onchainRugsHTMLGenerator = await OnchainRugsHTMLGenerator.deploy();
    await onchainRugsHTMLGenerator.waitForDeployment();
    const onchainRugsHTMLGeneratorAddress = await onchainRugsHTMLGenerator.getAddress();
    console.log("✅ OnchainRugsHTMLGenerator deployed to:", onchainRugsHTMLGeneratorAddress);

    // ============================================================================
    // 2. DEPLOYMENT SUMMARY
    // ============================================================================

    console.log("\n" + "=".repeat(80));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(80));

    const deploymentInfo = {
      network: await deployer.provider.getNetwork(),
      deployer: deployer.address,
      contracts: {
        rugScriptyBuilderV2: rugScriptyBuilderV2Address,
        rugEthFSStorage: rugEthFSStorageAddress,
        onchainRugsHTMLGenerator: onchainRugsHTMLGeneratorAddress
      },
      timestamp: new Date().toISOString()
    };

    console.log("\n📋 DEPLOYMENT SUMMARY:");
    console.log("- RugScriptyBuilderV2:", rugScriptyBuilderV2Address);
    console.log("- RugEthFSStorage:", rugEthFSStorageAddress);
    console.log("- OnchainRugsHTMLGenerator:", onchainRugsHTMLGeneratorAddress);

    console.log("\n🎯 NEXT STEPS:");
    console.log("1. Update your OnchainRugs contract with these addresses");
    console.log("2. Use the setRugScriptyContracts function:");
    console.log(`   await onchainRugs.setRugScriptyContracts(
     "${rugScriptyBuilderV2Address}",
     "${rugEthFSStorageAddress}",
     "${onchainRugsHTMLGeneratorAddress}"
   );`);
    console.log("3. Upload p5.js and algorithm to RugEthFSStorage");
    console.log("4. Test NFT generation with on-chain libraries!");

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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

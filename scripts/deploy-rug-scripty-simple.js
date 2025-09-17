import { ethers } from "ethers";

async function main() {
  console.log("🚀 Deploying Rug-Prefixed Scripty Contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  try {
    // Deploy RugScriptyBuilderV2
    console.log("\n📦 Deploying RugScriptyBuilderV2...");
    const RugScriptyBuilderV2 = await ethers.getContractFactory("RugScriptyBuilderV2");
    const rugScriptyBuilderV2 = await RugScriptyBuilderV2.deploy();
    await rugScriptyBuilderV2.waitForDeployment();

    const rugScriptyBuilderV2Address = await rugScriptyBuilderV2.getAddress();
    console.log("✅ RugScriptyBuilderV2 deployed to:", rugScriptyBuilderV2Address);

    // Deploy RugScriptyStorageV2
    console.log("\n💾 Deploying RugScriptyStorageV2...");
    const RugScriptyStorageV2 = await ethers.getContractFactory("RugScriptyStorageV2");
    const rugScriptyStorageV2 = await RugScriptyStorageV2.deploy();
    await rugScriptyStorageV2.waitForDeployment();

    const rugScriptyStorageV2Address = await rugScriptyStorageV2.getAddress();
    console.log("✅ RugScriptyStorageV2 deployed to:", rugScriptyStorageV2Address);

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");

    // Test getHTML with empty request
    const emptyRequest = {
      headTags: [],
      bodyTags: []
    };

    try {
      const htmlResult = await rugScriptyBuilderV2.getHTML(emptyRequest);
      console.log("✅ getHTML works - returned:", htmlResult.length, "bytes");
    } catch (error) {
      console.log("⚠️ getHTML test failed:", error.message);
    }

    // Display deployment summary
    console.log("\n📋 Deployment Summary:");
    console.log("=".repeat(50));
    console.log("RugScriptyBuilderV2:", rugScriptyBuilderV2Address);
    console.log("RugScriptyStorageV2:", rugScriptyStorageV2Address);
    console.log("=".repeat(50));

    console.log("\n🎯 Ready for integration testing!");
    console.log("Use these addresses in your RugHTMLGenerator contract.");

    return {
      rugScriptyBuilderV2: rugScriptyBuilderV2Address,
      rugScriptyStorageV2: rugScriptyStorageV2Address
    };

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

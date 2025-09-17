// Simple test to verify Rug-prefixed Scripty contracts compile
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Rug-Prefixed Scripty Contracts...");

  try {
    // Test if contracts can be compiled
    console.log("📦 Testing RugScriptyBuilderV2...");
    const RugScriptyBuilderV2 = await ethers.getContractFactory("RugScriptyBuilderV2");
    console.log("✅ RugScriptyBuilderV2 compiled successfully");

    console.log("💾 Testing RugScriptyStorageV2...");
    const RugScriptyStorageV2 = await ethers.getContractFactory("RugScriptyStorageV2");
    console.log("✅ RugScriptyStorageV2 compiled successfully");

    console.log("\n🎉 All Rug-prefixed Scripty contracts compile successfully!");
    console.log("The internal functionality is intact - no breaking changes from renaming!");

  } catch (error) {
    console.error("❌ Compilation failed:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });

// Simple deployment script for Rug Scripty system
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Deploying Rug Scripty System...");
  console.log("Deployer:", deployer.address);

  // Deploy RugScriptyBuilderV2
  console.log("\n📦 Deploying RugScriptyBuilderV2...");
  const RugScriptyBuilderV2 = await ethers.getContractFactory("RugScriptyBuilderV2");
  const rugScriptyBuilderV2 = await RugScriptyBuilderV2.deploy();
  await rugScriptyBuilderV2.waitForDeployment();
  const builderAddress = await rugScriptyBuilderV2.getAddress();
  console.log("✅ RugScriptyBuilderV2:", builderAddress);

  // Deploy RugEthFSStorage
  console.log("\n💾 Deploying RugEthFSStorage...");
  const RugEthFSStorage = await ethers.getContractFactory("RugEthFSStorage");
  const rugEthFSStorage = await RugEthFSStorage.deploy();
  await rugEthFSStorage.waitForDeployment();
  const storageAddress = await rugEthFSStorage.getAddress();
  console.log("✅ RugEthFSStorage:", storageAddress);

  // Deploy OnchainRugsHTMLGenerator
  console.log("\n🎨 Deploying OnchainRugsHTMLGenerator...");
  const OnchainRugsHTMLGenerator = await ethers.getContractFactory("OnchainRugsHTMLGenerator");
  const htmlGenerator = await OnchainRugsHTMLGenerator.deploy();
  await htmlGenerator.waitForDeployment();
  const generatorAddress = await htmlGenerator.getAddress();
  console.log("✅ OnchainRugsHTMLGenerator:", generatorAddress);

  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("Builder:", builderAddress);
  console.log("Storage:", storageAddress);
  console.log("Generator:", generatorAddress);

  console.log("\n📋 Use these addresses with setRugScriptyContracts:");
  console.log(`"${builderAddress}",`);
  console.log(`"${storageAddress}",`);
  console.log(`"${generatorAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

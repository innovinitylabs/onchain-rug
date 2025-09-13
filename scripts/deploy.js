const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment of Onchain Rugs contracts...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  // Deploy RugGenerator contract first
  console.log("\n🎨 Deploying RugGenerator contract...");
  const RugGenerator = await ethers.getContractFactory("RugGenerator");
  const rugGenerator = await RugGenerator.deploy();
  await rugGenerator.waitForDeployment();
  
  const rugGeneratorAddress = await rugGenerator.getAddress();
  console.log("✅ RugGenerator deployed to:", rugGeneratorAddress);
  
  // Deploy OnchainRugs contract
  console.log("\n🧶 Deploying OnchainRugs contract...");
  const OnchainRugs = await ethers.getContractFactory("OnchainRugs");
  const onchainRugs = await OnchainRugs.deploy(rugGeneratorAddress);
  await onchainRugs.waitForDeployment();
  
  const onchainRugsAddress = await onchainRugs.getAddress();
  console.log("✅ OnchainRugs deployed to:", onchainRugsAddress);
  
  // Save deployment addresses
  const deploymentInfo = {
    network: await deployer.provider.getNetwork(),
    deployer: deployer.address,
    rugGenerator: rugGeneratorAddress,
    onchainRugs: onchainRugsAddress,
    timestamp: new Date().toISOString()
  };
  
  const deploymentPath = path.join(__dirname, "..", "deployments", "latest.json");
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n📝 Deployment info saved to:", deploymentPath);
  
  // Display next steps
  console.log("\n🎯 Next Steps:");
  console.log("1. Initialize P5.js library and algorithm in RugGenerator contract");
  console.log("2. Update frontend with contract addresses");
  console.log("3. Test minting functionality");
  
  console.log("\n📋 Contract Addresses:");
  console.log("RugGenerator:", rugGeneratorAddress);
  console.log("OnchainRugs:", onchainRugsAddress);
  
  return {
    rugGenerator: rugGeneratorAddress,
    onchainRugs: onchainRugsAddress
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

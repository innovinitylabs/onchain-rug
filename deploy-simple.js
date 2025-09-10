const { ethers } = require("ethers");

// Shape Network RPC URLs
const SHAPE_SEPOLIA_RPC = "https://sepolia-rpc.shape.xyz";
const SHAPE_MAINNET_RPC = "https://rpc.shape.xyz";

// Contract ABIs (simplified for deployment)
const RUG_GENERATOR_ABI = [
  "constructor()",
  "function initialize(string memory _p5jsLibrary, string memory _generationAlgorithm) external",
  "function generateRugHTML(uint256 seed, string[] memory textLines) external view returns (string memory)",
  "function isReady() external view returns (bool)"
];

const ONCHAIN_RUGS_ABI = [
  "constructor(address _generator)",
  "function mintWithText(string[] memory textLines, uint256 seed) external payable",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function totalSupply() external view returns (uint256)"
];

// Contract bytecode (you'll need to compile and get the actual bytecode)
const RUG_GENERATOR_BYTECODE = "0x608060405234801561001057600080fd5b50600436106100415760003560e01c8063..."; // Placeholder
const ONCHAIN_RUGS_BYTECODE = "0x608060405234801561001057600080fd5b50600436106100415760003560e01c8063..."; // Placeholder

async function deployContracts() {
  console.log("🚀 Starting deployment to Shape Network...");
  
  // Check for private key
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ Please set PRIVATE_KEY in your .env file");
    process.exit(1);
  }
  
  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(SHAPE_SEPOLIA_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("📝 Deploying from address:", wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.01")) {
    console.error("❌ Insufficient balance for deployment");
    process.exit(1);
  }
  
  try {
    // Deploy RugGenerator
    console.log("\n🎨 Deploying RugGenerator...");
    const RugGeneratorFactory = new ethers.ContractFactory(
      RUG_GENERATOR_ABI,
      RUG_GENERATOR_BYTECODE,
      wallet
    );
    
    const rugGenerator = await RugGeneratorFactory.deploy();
    await rugGenerator.waitForDeployment();
    
    const rugGeneratorAddress = await rugGenerator.getAddress();
    console.log("✅ RugGenerator deployed to:", rugGeneratorAddress);
    
    // Deploy OnchainRugs
    console.log("\n🧶 Deploying OnchainRugs...");
    const OnchainRugsFactory = new ethers.ContractFactory(
      ONCHAIN_RUGS_ABI,
      ONCHAIN_RUGS_BYTECODE,
      wallet
    );
    
    const onchainRugs = await OnchainRugsFactory.deploy(rugGeneratorAddress);
    await onchainRugs.waitForDeployment();
    
    const onchainRugsAddress = await onchainRugs.getAddress();
    console.log("✅ OnchainRugs deployed to:", onchainRugsAddress);
    
    // Save deployment info
    const deploymentInfo = {
      network: "shape-sepolia",
      deployer: wallet.address,
      rugGenerator: rugGeneratorAddress,
      onchainRugs: onchainRugsAddress,
      timestamp: new Date().toISOString()
    };
    
    const fs = require("fs");
    const path = require("path");
    const deploymentPath = path.join(__dirname, "deployments", "latest.json");
    fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n📝 Deployment info saved to:", deploymentPath);
    console.log("\n🎯 Next Steps:");
    console.log("1. Initialize RugGenerator with P5.js library and algorithm");
    console.log("2. Update frontend with contract addresses");
    console.log("3. Test minting functionality");
    
    return deploymentInfo;
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  deployContracts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployContracts };

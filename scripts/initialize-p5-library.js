const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("📚 Initializing P5.js library in contract...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", "latest.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("No deployment found. Please run deploy.js first.");
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("Using P5Library at:", deployment.p5Library);
  
  // Connect to P5Library contract
  const P5Library = await ethers.getContractFactory("P5Library");
  const p5Library = P5Library.attach(deployment.p5Library);
  
  // Check if already initialized
  const isInitialized = await p5Library.isLibraryReady();
  if (isInitialized) {
    console.log("⚠️  P5.js library is already initialized!");
    return;
  }
  
  // Load P5.js library code
  // Note: In production, you would load the actual minified P5.js library
  // For now, we'll use a placeholder
  const p5jsCode = `
// P5.js Library Placeholder
// In production, this would be the actual minified P5.js library
function p5() {
  console.log("P5.js library loaded");
}

// Basic P5.js functions for rug generation
function setup() {
  createCanvas(400, 400);
  background(240);
}

function draw() {
  // Rug generation code would go here
  fill(100);
  rect(50, 50, 300, 300);
}
`;
  
  console.log("📦 P5.js library size:", p5jsCode.length, "characters");
  
  // Initialize the library
  console.log("⏳ Initializing P5.js library...");
  const tx = await p5Library.initializeLibrary(p5jsCode);
  await tx.wait();
  
  console.log("✅ P5.js library initialized successfully!");
  console.log("Transaction hash:", tx.hash);
  
  // Verify initialization
  const librarySize = await p5Library.getLibrarySize();
  console.log("📏 Library size in contract:", librarySize.toString(), "bytes");
}

// Execute initialization
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Initialization failed:", error);
    process.exit(1);
  });

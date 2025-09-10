const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🎨 Initializing RugGenerator with P5.js library and algorithm...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", "latest.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("No deployment found. Please run deploy.js first.");
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("Using RugGenerator at:", deployment.rugGenerator);
  
  // Connect to RugGenerator contract
  const RugGenerator = await ethers.getContractFactory("RugGenerator");
  const rugGenerator = RugGenerator.attach(deployment.rugGenerator);
  
  // Check if already initialized
  const isInitialized = await rugGenerator.isReady();
  if (isInitialized) {
    console.log("⚠️  RugGenerator is already initialized!");
    return;
  }
  
  // Load P5.js library code
  // Note: In production, you would load the actual minified P5.js library
  // For now, we'll use a placeholder
  const p5jsLibrary = `
// P5.js Library Placeholder
// In production, this would be the actual minified P5.js library
function p5() {
  console.log("P5.js library loaded");
}

// Basic P5.js functions for rug generation
function createCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.style.border = '1px solid #000';
  return canvas;
}

function setup() {
  createCanvas(400, 400);
  background(240);
}

function draw() {
  // Rug generation code would go here
  fill(100);
  rect(50, 50, 300, 300);
}

function background(color) {
  const canvas = document.getElementById('p5-container').querySelector('canvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function fill(color) {
  // Set fill color
}

function rect(x, y, w, h) {
  // Draw rectangle
}
`;
  
  // Load generation algorithm
  // Note: In production, this would be your actual P5.js algorithm
  const generationAlgorithm = `
// Your P5.js generation algorithm
function generateRug(seed, textLines) {
  // Set random seed
  randomSeed(seed);
  
  // Generate rug based on seed and text
  background(240);
  
  // Add your rug generation logic here
  // This is where your complete P5.js algorithm would go
  
  // Example: Draw text
  fill(0);
  textAlign(CENTER, CENTER);
  for(let i = 0; i < textLines.length; i++) {
    text(textLines[i], 200, 150 + i * 30);
  }
}

function randomSeed(seed) {
  // Set random seed for deterministic generation
}

function textAlign(horizontal, vertical) {
  // Set text alignment
}

function text(content, x, y) {
  // Draw text
}
`;
  
  console.log("📦 P5.js library size:", p5jsLibrary.length, "characters");
  console.log("📦 Algorithm size:", generationAlgorithm.length, "characters");
  console.log("📦 Total size:", p5jsLibrary.length + generationAlgorithm.length, "characters");
  
  // Initialize the generator
  console.log("⏳ Initializing RugGenerator...");
  const tx = await rugGenerator.initialize(p5jsLibrary, generationAlgorithm);
  await tx.wait();
  
  console.log("✅ RugGenerator initialized successfully!");
  console.log("Transaction hash:", tx.hash);
  
  // Verify initialization
  const librarySize = await rugGenerator.getLibrarySize();
  const algorithmSize = await rugGenerator.getAlgorithmSize();
  const totalSize = await rugGenerator.getTotalSize();
  
  console.log("📏 Library size:", librarySize.toString(), "bytes");
  console.log("📏 Algorithm size:", algorithmSize.toString(), "bytes");
  console.log("📏 Total size:", totalSize.toString(), "bytes");
}

// Execute initialization
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Initialization failed:", error);
    process.exit(1);
  });

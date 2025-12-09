#!/usr/bin/env node

/**
 * Manual upgrade script using ethers.js
 * This bypasses forge's library compilation issues
 */

import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIAMOND_ADDRESS = process.env.NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT;
const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY;
const RPC_URL = "https://sepolia.base.org";

if (!DIAMOND_ADDRESS || !PRIVATE_KEY) {
  console.error("Missing required environment variables:");
  console.error("  NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");
  console.error("  TESTNET_PRIVATE_KEY");
  process.exit(1);
}

// Diamond Cut ABI (minimal)
const DIAMOND_CUT_ABI = [
  "function diamondCut((address,uint8,bytes4[])[] calldata _diamondCut, address _init, bytes calldata _calldata) external"
];

// Facet function selectors for marketplace
const MARKETPLACE_SELECTORS = [
  "0x4e41a1fb", // createListing
  "0x97107d6d", // cancelListing
  "0x3593564c", // updateListingPrice
  "0xfb231981", // buyListing
  "0x", // makeOffer - need to calculate
  "0x", // acceptOffer - need to calculate
  "0x", // cancelOffer - need to calculate
  "0x", // setMarketplaceFee
  "0x", // withdrawFees
  "0x", // getListing
  "0x", // getMarketplaceStats
  "0x", // getOffer
  "0x", // getActiveTokenOffers
];

async function main() {
  console.log("Connecting to Base Sepolia...");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log("Deployer address:", wallet.address);
  console.log("Diamond address:", DIAMOND_ADDRESS);
  
  // Check if we have compiled artifacts
  const marketplaceArtifactPath = path.join(__dirname, "../out/RugMarketplaceFacet.sol/RugMarketplaceFacet.json");
  const nftArtifactPath = path.join(__dirname, "../out/RugNFTFacet.sol/RugNFTFacet.json");
  
  if (!fs.existsSync(marketplaceArtifactPath) || !fs.existsSync(nftArtifactPath)) {
    console.error("Compiled artifacts not found. Please run: forge build");
    process.exit(1);
  }
  
  console.log("\nLoading compiled artifacts...");
  const marketplaceArtifact = JSON.parse(fs.readFileSync(marketplaceArtifactPath));
  const nftArtifact = JSON.parse(fs.readFileSync(nftArtifactPath));
  
  // Check bytecode
  const nftBytecode = nftArtifact.bytecode?.object || nftArtifact.bytecode;
  const marketplaceBytecode = marketplaceArtifact.bytecode?.object || marketplaceArtifact.bytecode;
  
  if (!nftBytecode || nftBytecode === "0x") {
    throw new Error("RugNFTFacet bytecode is empty!");
  }
  if (!marketplaceBytecode || marketplaceBytecode === "0x") {
    throw new Error("RugMarketplaceFacet bytecode is empty!");
  }
  
  console.log("Bytecode lengths - NFT:", nftBytecode.length, "Marketplace:", marketplaceBytecode.length);
  
  console.log("\nDeploying new facets...");
  
  // Deploy RugNFTFacet
  console.log("Deploying RugNFTFacet...");
  const nftFactory = new ethers.ContractFactory(
    nftArtifact.abi,
    nftBytecode,
    wallet
  );
  const nftFacet = await nftFactory.deploy();
  const nftDeployTx = nftFacet.deploymentTransaction();
  console.log("Waiting for RugNFTFacet deployment transaction...");
  const nftReceipt = await nftDeployTx.wait();
  const nftFacetAddress = await nftFacet.getAddress();
  console.log("RugNFTFacet deployed at:", nftFacetAddress);
  console.log("Deployment block:", nftReceipt.blockNumber);
  
  // Wait a bit and verify contract has code
  await new Promise(resolve => setTimeout(resolve, 2000));
  const nftCode = await provider.getCode(nftFacetAddress);
  if (nftCode === "0x") {
    throw new Error("RugNFTFacet has no code!");
  }
  console.log("RugNFTFacet code verified, length:", nftCode.length);
  
  // Deploy RugMarketplaceFacet
  console.log("Deploying RugMarketplaceFacet...");
  const marketplaceFactory = new ethers.ContractFactory(
    marketplaceArtifact.abi,
    marketplaceBytecode,
    wallet
  );
  const marketplaceFacet = await marketplaceFactory.deploy();
  const marketplaceDeployTx = marketplaceFacet.deploymentTransaction();
  console.log("Waiting for RugMarketplaceFacet deployment transaction...");
  const marketplaceReceipt = await marketplaceDeployTx.wait();
  const marketplaceFacetAddress = await marketplaceFacet.getAddress();
  console.log("RugMarketplaceFacet deployed at:", marketplaceFacetAddress);
  console.log("Deployment block:", marketplaceReceipt.blockNumber);
  
  // Wait a bit and verify contract has code
  await new Promise(resolve => setTimeout(resolve, 2000));
  const marketplaceCode = await provider.getCode(marketplaceFacetAddress);
  if (marketplaceCode === "0x") {
    throw new Error("RugMarketplaceFacet has no code!");
  }
  console.log("RugMarketplaceFacet code verified, length:", marketplaceCode.length);
  
  console.log("\nPreparing diamond cut...");
  
  // Calculate selectors from ABI
  const iface = new ethers.Interface(marketplaceArtifact.abi);
  const marketplaceSelectors = [
    iface.getFunction("createListing").selector,
    iface.getFunction("cancelListing").selector,
    iface.getFunction("updateListingPrice").selector,
    iface.getFunction("buyListing").selector,
    iface.getFunction("makeOffer").selector,
    iface.getFunction("acceptOffer").selector,
    iface.getFunction("cancelOffer").selector,
    iface.getFunction("setMarketplaceFee").selector,
    iface.getFunction("withdrawFees").selector,
    iface.getFunction("getListing").selector,
    iface.getFunction("getMarketplaceStats").selector,
    iface.getFunction("getOffer").selector,
    iface.getFunction("getActiveTokenOffers").selector,
  ];
  
  const nftIface = new ethers.Interface(nftArtifact.abi);
  const nftSelectors = [
    nftIface.getFunction("ownerOf").selector,
    nftIface.getFunction("balanceOf").selector,
    nftIface.getFunction("approve").selector,
    nftIface.getFunction("getApproved").selector,
    nftIface.getFunction("setApprovalForAll").selector,
    nftIface.getFunction("isApprovedForAll").selector,
    nftIface.getFunction("transferFrom").selector,
    "0x42842e0e", // safeTransferFrom(address,address,uint256)
    "0xb88d4fde", // safeTransferFrom(address,address,uint256,bytes)
    nftIface.getFunction("name").selector,
    nftIface.getFunction("symbol").selector,
    nftIface.getFunction("tokenURI").selector,
    nftIface.getFunction("totalSupply").selector,
    nftIface.getFunction("supportsInterface").selector,
    nftIface.getFunction("mintRug").selector,
    nftIface.getFunction("burn").selector,
    nftIface.getFunction("getRugData").selector,
    nftIface.getFunction("getAgingData").selector,
  ];
  
  // Prepare facet cuts
  // Action: 0 = Add, 1 = Replace, 2 = Remove
  // Split marketplace selectors into existing (Replace) and new (Add)
  const existingMarketplaceSelectors = [
    iface.getFunction("createListing").selector,
    iface.getFunction("cancelListing").selector,
    iface.getFunction("updateListingPrice").selector,
    iface.getFunction("buyListing").selector,
    iface.getFunction("setMarketplaceFee").selector,
    iface.getFunction("withdrawFees").selector,
    iface.getFunction("getListing").selector,
    iface.getFunction("getMarketplaceStats").selector,
  ];
  
  const newMarketplaceSelectors = [
    iface.getFunction("makeOffer").selector,
    iface.getFunction("acceptOffer").selector,
    iface.getFunction("cancelOffer").selector,
    iface.getFunction("getOffer").selector,
    iface.getFunction("getActiveTokenOffers").selector,
  ];
  
  const cuts = [
    [nftFacetAddress, 1, nftSelectors], // Replace NFT facet
    [marketplaceFacetAddress, 1, existingMarketplaceSelectors], // Replace existing marketplace functions
    [marketplaceFacetAddress, 0, newMarketplaceSelectors], // Add new offer functions
  ];
  
  console.log("Executing diamond cut...");
  const diamond = new ethers.Contract(DIAMOND_ADDRESS, DIAMOND_CUT_ABI, wallet);
  
  const tx = await diamond.diamondCut(cuts, ethers.ZeroAddress, "0x");
  console.log("Transaction hash:", tx.hash);
  
  console.log("Waiting for confirmation...");
  const receipt = await tx.wait();
  console.log("Upgrade complete! Block:", receipt.blockNumber);
  console.log("\nNew facet addresses:");
  console.log("  RugNFTFacet:", nftFacetAddress);
  console.log("  RugMarketplaceFacet:", marketplaceFacetAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


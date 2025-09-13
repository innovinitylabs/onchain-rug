const { ethers } = require('hardhat');

async function main() {
  // Get the contract address from environment or use the deployed address
  const contractAddress = process.env.ONCHAIN_RUGS_CONTRACT || "0xYourContractAddress";
  
  console.log("Withdrawing from contract:", contractAddress);
  
  // Get the contract
  const OnchainRugs = await ethers.getContractFactory("OnchainRugs");
  const rugContract = OnchainRugs.attach(contractAddress);
  
  // Check current balance
  const balance = await ethers.provider.getBalance(contractAddress);
  console.log("Contract balance:", ethers.utils.formatEther(balance), "ETH");
  
  if (balance.eq(0)) {
    console.log("No funds to withdraw!");
    return;
  }
  
  // Withdraw funds (only owner can do this)
  console.log("Withdrawing funds...");
  const tx = await rugContract.withdraw();
  await tx.wait();
  
  console.log("Withdrawal completed! Transaction hash:", tx.hash);
  
  // Check balance after withdrawal
  const newBalance = await ethers.provider.getBalance(contractAddress);
  console.log("New contract balance:", ethers.utils.formatEther(newBalance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

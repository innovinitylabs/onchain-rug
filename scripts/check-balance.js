const { ethers } = require('hardhat');

async function main() {
  const contractAddress = "0x77c0F87621B7509eD76Bb78ce39eEaD9E98E6670";

  console.log("Checking contract:", contractAddress);
  console.log("Network:", network.name);

  // Get contract balance
  const balance = await ethers.provider.getBalance(contractAddress);
  console.log("Contract balance:", ethers.utils.formatEther(balance), "ETH");

  // Get signer balance
  const signer = await ethers.getSigner();
  const signerBalance = await signer.getBalance();
  console.log("Signer balance:", ethers.utils.formatEther(signerBalance), "ETH");
  console.log("Signer address:", signer.address);

  // Try to get contract instance and check functions
  try {
    const contract = await ethers.getContractAt("OnchainRugs", contractAddress);

    // Check if contract has owner
    try {
      const owner = await contract.owner();
      console.log("Contract owner:", owner);
      console.log("Is signer owner?", owner.toLowerCase() === signer.address.toLowerCase());
    } catch (error) {
      console.log("No owner function or error:", error.message);
    }

    // Check available functions
    const functions = Object.keys(contract.functions);
    console.log("Available functions:", functions);

  } catch (error) {
    console.log("Error getting contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import { ethers } from 'ethers';

// ERC721 contract ABI for tokenURI function
const abi = [
  "function tokenURI(uint256 tokenId) view returns (string)"
];

const contractAddress = '0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff';
const tokenId = 2;

// Use Base Sepolia RPC endpoint
const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');

async function getTokenURI() {
  try {
    const contract = new ethers.Contract(contractAddress, abi, provider);
    const tokenURI = await contract.tokenURI(tokenId);
    console.log('Token URI for token 2:', tokenURI);

    // If it's an IPFS URI, we might need to resolve it
    if (tokenURI.startsWith('ipfs://')) {
      console.log('IPFS URI detected, you may need to resolve it to https://ipfs.io/ipfs/...');
    } else if (tokenURI.startsWith('http')) {
      console.log('Fetching metadata from:', tokenURI);
      // Try to fetch the metadata
      const response = await fetch(tokenURI);
      const metadata = await response.json();
      console.log('Metadata:', JSON.stringify(metadata, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getTokenURI();

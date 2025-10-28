import fetch from 'node-fetch';

const API_KEY = '-qT6tVGNhhH2nnszM0VUh';
const CONTRACT = '0xfFa1E7F07490eF27B3F4b5C81cC3E635c86921d7';
const OWNER_ADDRESS = '0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F';

async function testAlchemy() {
  console.log('🧪 Testing Alchemy API responses...\n');

  // Test 1: Get NFTs for collection
  console.log('1️⃣ Testing getNFTsForCollection:');
  const collectionUrl = `https://shape-sepolia.g.alchemy.com/nft/v3/${API_KEY}/getNFTsForCollection?contractAddress=${CONTRACT}&withMetadata=false&limit=5`;
  console.log('URL:', collectionUrl);
  const collectionRes = await fetch(collectionUrl);
  const collectionData = await collectionRes.json();
  console.log('Response:', JSON.stringify(collectionData, null, 2));
  console.log();

  // Test 2: Get NFT metadata
  if (collectionData.nfts && collectionData.nfts.length > 0) {
    const tokenId = collectionData.nfts[0].tokenId;
    console.log('2️⃣ Testing getNFTMetadata for token', tokenId);
    const metadataUrl = `https://shape-sepolia.g.alchemy.com/nft/v3/${API_KEY}/getNFTMetadata?contractAddress=${CONTRACT}&tokenId=${tokenId}&refreshCache=false`;
    console.log('URL:', metadataUrl);
    const metadataRes = await fetch(metadataUrl);
    const metadataData = await metadataRes.json();
    console.log('Response:', JSON.stringify(metadataData, null, 2));
    console.log('Owner field check:');
    console.log('- metadata.owners:', metadataData.owners);
    console.log('- metadata.contract?.deployer:', metadataData.contract?.deployer);
    console.log();
  }

  // Test 3: Get NFTs for owner
  console.log('3️⃣ Testing getNFTsForOwner:');
  const ownerUrl = `https://shape-sepolia.g.alchemy.com/nft/v3/${API_KEY}/getNFTsForOwner?owner=${OWNER_ADDRESS}&contractAddresses[]=${CONTRACT}&withMetadata=true`;
  console.log('URL:', ownerUrl);
  const ownerRes = await fetch(ownerUrl);
  const ownerData = await ownerRes.json();
  console.log('Response:', JSON.stringify(ownerData, null, 2));
  console.log();

  console.log('✅ Debug complete');
}

testAlchemy().catch(console.error);

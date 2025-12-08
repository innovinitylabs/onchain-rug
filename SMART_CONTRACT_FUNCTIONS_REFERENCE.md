# Smart Contract Functions Reference

This document lists all functions exposed in the OnchainRugs Diamond contract that are visible on Etherscan, organized by access level.

## Access Levels

- **Public**: Anyone can call
- **Owner Only**: Only contract owner (admin) can call
- **Token Owner**: Only the owner of a specific token can call
- **Authorized Agent**: Only authorized maintenance agents can call
- **Marketplace/Trusted**: Only marketplace facet or trusted marketplaces can call

---

## 🔓 PUBLIC FUNCTIONS (Anyone Can Call)

### ERC721 Standard Functions (RugNFTFacet)

#### View Functions
- `name()` - Returns collection name ("OnchainRugs")
- `symbol()` - Returns collection symbol ("RUGS")
- `totalSupply()` - Returns total number of minted NFTs
- `ownerOf(uint256 tokenId)` - Returns owner address of a token
- `balanceOf(address owner)` - Returns number of tokens owned by address
- `tokenURI(uint256 tokenId)` - Returns metadata URI for a token
- `getApproved(uint256 tokenId)` - Returns approved address for a token
- `isApprovedForAll(address owner, address operator)` - Checks if operator is approved for all tokens
- `tokenOfOwnerByIndex(address owner, uint256 index)` - Returns token ID at index for owner
- `tokenByIndex(uint256 index)` - Returns token ID at global index
- `supportsInterface(bytes4 interfaceId)` - ERC165 interface support check

#### State-Changing Functions
- `mintRug(string[] textRows, uint256 seed, VisualConfig visual, ArtData art, uint256 characterCount)` - Mint a new NFT (payable)
- `mintRugFor(address recipient, string[] textRows, uint256 seed, VisualConfig visual, ArtData art, uint256 characterCount)` - Mint for another address (payable)
- `approve(address to, uint256 tokenId)` - Approve address to transfer token
- `setApprovalForAll(address operator, bool approved)` - Approve operator for all tokens
- `transferFrom(address from, address to, uint256 tokenId)` - Transfer token
- `safeTransferFrom(address from, address to, uint256 tokenId)` - Safe transfer token
- `safeTransferFrom(address from, address to, uint256 tokenId, bytes data)` - Safe transfer with data

### NFT Data Queries (RugNFTFacet)
- `getRugData(uint256 tokenId)` - Returns complete rug data struct
- `getAgingData(uint256 tokenId)` - Returns aging data struct
- `maxSupply()` - Returns maximum collection size
- `isTextAvailable(string[] textLines)` - Checks if text combination is available
- `getMintPrice(uint256 lineCount)` - Returns mint price for given line count
- `canMint(address account)` - Checks if address can mint
- `walletMints(address account)` - Returns mint count for address
- `isWalletException(address account)` - Checks if address is exempt from limits

### ERC721-C Transfer Security (RugNFTFacet)
- `getTransferValidator()` - Returns transfer validator address
- `getSecurityPolicy()` - Returns current security policy
- `getWhitelistedOperators()` - Returns whitelisted operators
- `getPermittedContractReceivers()` - Returns permitted contract receivers
- `isOperatorWhitelisted(address operator)` - Checks if operator is whitelisted
- `isContractReceiverPermitted(address receiver)` - Checks if contract receiver is permitted
- `isTransferAllowed(address caller, address from, address to)` - Checks if transfer is allowed

### Aging System (RugAgingFacet)
- `getDirtLevel(uint256 tokenId)` - Returns current dirt level (0-2)
- `hasDirt(uint256 tokenId)` - Checks if rug has dirt
- `getAgingLevel(uint256 tokenId)` - Returns current aging level (0-10)
- `getFrameLevel(uint256 tokenId)` - Returns current frame level (0-4)
- `getFrameName(uint256 tokenId)` - Returns frame name string
- `getMaintenanceScore(uint256 tokenId)` - Returns maintenance score
- `getDiamondFrameCount()` - Returns total diamond frame NFTs
- `hasDiamondFrame(uint256 tokenId)` - Checks if token has diamond frame
- `getDiamondFrameTokenIds()` - Returns all token IDs with diamond frames
- `getAgingState(uint256 tokenId)` - Returns complete aging state
- `isCleaningFree(uint256 tokenId)` - Checks if cleaning is free
- `timeUntilNextDirt(uint256 tokenId)` - Returns seconds until next dirt level
- `timeUntilNextAging(uint256 tokenId)` - Returns seconds until next aging level

### Maintenance System (RugMaintenanceFacet)
- `getAuthorizedAgents()` - Returns caller's authorized agents
- `getAuthorizedAgentsFor(address owner)` - Returns authorized agents for owner
- `isAgentAuthorized(address agent)` - Checks if agent is authorized for caller
- `getCleaningCost(uint256 tokenId)` - Returns cleaning cost
- `getRestorationCost(uint256 tokenId)` - Returns restoration cost
- `getMasterRestorationCost(uint256 tokenId)` - Returns master restoration cost
- `canCleanRug(uint256 tokenId)` - Checks if rug can be cleaned
- `canRestoreRug(uint256 tokenId)` - Checks if rug can be restored
- `needsMasterRestoration(uint256 tokenId)` - Checks if master restoration needed
- `getMaintenanceOptions(uint256 tokenId)` - Returns all maintenance options
- `getMaintenanceHistory(uint256 tokenId)` - Returns maintenance history
- `isAuthorizationTokenValid(bytes32 tokenHash)` - Checks if X402 token is valid

### Commerce & Royalties (RugCommerceFacet)
- `getBalance()` - Returns contract ETH balance
- `getRoyaltyConfig()` - Returns royalty configuration
- `calculateRoyalty(uint256 salePrice)` - Calculates royalty amount
- `getRoyaltyRecipients()` - Returns royalty recipients and shares
- `areRoyaltiesConfigured()` - Checks if royalties are configured
- `royaltyInfo(uint256 tokenId, uint256 salePrice)` - EIP-2981 royalty info
- `getPendingRoyalties(address recipient)` - Returns pending royalties for address
- `getPoolConfig()` - Returns pool contract configuration
- `getCollectionPricingBounds()` - Returns collection pricing bounds
- `getTokenPricingBounds(uint256 tokenId)` - Returns token pricing bounds
- `isCollectionPricingImmutable()` - Checks if collection pricing is immutable
- `isTokenPricingImmutable(uint256 tokenId)` - Checks if token pricing is immutable
- `getApprovedPaymentCoin()` - Returns approved payment coin
- `getSaleHistory(uint256 tokenId)` - Returns sale history

### Marketplace (RugMarketplaceFacet)
- `getListing(uint256 tokenId)` - Returns listing details
- `getMarketplaceStats()` - Returns marketplace statistics
- `buyListing(uint256 tokenId)` - Buy a listed NFT (payable, nonReentrant)

### Laundering System (RugLaunderingFacet)
- `wouldTriggerLaundering(uint256 tokenId, uint256 salePrice)` - Checks if sale would trigger laundering
- `getLaunderingSaleHistory(uint256 tokenId)` - Returns sale history
- `getMaxRecentSalePrice(uint256 tokenId)` - Returns max of last 3 sale prices
- `getLaunderingConfig()` - Returns laundering configuration
- `getLaunderingStats(uint256 tokenId)` - Returns laundering statistics

### Diamond Loupe (DiamondLoupeFacet)
- `facets()` - Returns all facets and their selectors
- `facetFunctionSelectors(address facet)` - Returns selectors for a facet
- `facetAddresses()` - Returns all facet addresses
- `facetAddress(bytes4 selector)` - Returns facet address for selector
- `supportsInterface(bytes4 interfaceId)` - ERC165 support check

### Transfer Security (RugTransferSecurityFacet)
- `getTransferValidator()` - Returns transfer validator address
- `getSecurityPolicyId()` - Returns Payment Processor policy ID
- `areTransfersEnforced()` - Checks if transfers are enforced
- `isSecurityInitialized()` - Checks if security is initialized
- `getSecurityPolicy()` - Returns current security policy

---

## 🔐 TOKEN OWNER FUNCTIONS (Owner of Specific Token)

### NFT Management (RugNFTFacet)
- `burn(uint256 tokenId)` - Burn your own token

### Maintenance (RugMaintenanceFacet)
- `authorizeMaintenanceAgent(address agent)` - Authorize an agent for your tokens
- `revokeMaintenanceAgent(address agent)` - Revoke agent authorization
- `cleanRug(uint256 tokenId)` - Clean your rug (payable)
- `restoreRug(uint256 tokenId)` - Restore your rug (payable)
- `masterRestoreRug(uint256 tokenId)` - Master restore your rug (payable)

### Marketplace (RugMarketplaceFacet)
- `createListing(uint256 tokenId, uint256 price, uint256 duration)` - Create listing for your token
- `cancelListing(uint256 tokenId)` - Cancel your listing
- `updateListingPrice(uint256 tokenId, uint256 newPrice)` - Update listing price

### Commerce (RugCommerceFacet)
- `claimPendingRoyalties()` - Claim your pending royalties
- `claimPoolRoyalties(uint256[] tokenIds)` - Claim pool royalties for your diamond frame tokens

---

## 🤖 AUTHORIZED AGENT FUNCTIONS (Authorized Maintenance Agents)

### Maintenance (RugMaintenanceFacet)
- `cleanRugAgent(uint256 tokenId, bytes32 authorizationToken, string nonce, uint256 expires)` - Clean using X402 token (payable, must send 0)
- `restoreRugAgent(uint256 tokenId, bytes32 authorizationToken, string nonce, uint256 expires)` - Restore using X402 token (payable, must send 0)
- `masterRestoreRugAgent(uint256 tokenId, bytes32 authorizationToken, string nonce, uint256 expires)` - Master restore using X402 token (payable, must send 0)
- `cleanRugAuthorized(uint256 tokenId)` - Clean using direct authorization (payable)
- `restoreRugAuthorized(uint256 tokenId)` - Restore using direct authorization (payable)
- `masterRestoreRugAuthorized(uint256 tokenId)` - Master restore using direct authorization (payable)

---

## 👑 ADMIN/OWNER ONLY FUNCTIONS

### Configuration (RugAdminFacet)
- `updateCollectionCap(uint256 newCap)` - Update max supply (0-10000)
- `updateWalletLimit(uint256 newLimit)` - Update NFTs per wallet limit
- `updateMintPricing(uint256[6] prices)` - Update mint pricing
- `updateServicePricing(uint256[4] prices)` - Update service pricing
- `updateAgingThresholds(uint256[5] thresholds)` - Update aging time thresholds
- `updateFrameThresholds(uint256[4] thresholds)` - Update frame progression thresholds
- `updateAIServiceFee(uint256 newFee)` - Update AI service fee
- `addToExceptionList(address account)` - Add address to exception list
- `removeFromExceptionList(address account)` - Remove from exception list
- `setLaunderingEnabled(bool enabled)` - Enable/disable laundering
- `setLaunchStatus(bool launched)` - Set launch status
- `setServiceFee(uint256 fee)` - Set flat service fee
- `setFeeRecipient(address recipient)` - Set fee recipient address
- `setScriptyContracts(address builder, address storage, address generator)` - Set Scripty contracts
- `setERC721Metadata(string name, string symbol)` - Set ERC721 name/symbol
- `addTrustedMarketplace(address marketplace)` - Add trusted marketplace
- `removeTrustedMarketplace(address marketplace)` - Remove trusted marketplace

### View Functions (RugAdminFacet)
- `getConfig()` - Get current configuration
- `getMintPricing()` - Get mint pricing
- `getServicePricing()` - Get service pricing
- `getAgentServiceFee()` - Get agent service fee
- `getAgingThresholds()` - Get aging thresholds
- `getExceptionList()` - Get exception list
- `isConfigured()` - Check if contract is configured
- `isTrustedMarketplace(address marketplace)` - Check if marketplace is trusted

### Commerce (RugCommerceFacet)
- `withdraw(uint256 amount)` - Withdraw ETH (0 = all)
- `withdrawTo(address to, uint256 amount)` - Withdraw to address
- `configureRoyalties(uint256 percentage, address[] recipients, uint256[] splits)` - Configure royalty system
- `setPoolContract(address poolContract)` - Set pool contract
- `setPoolPercentage(uint256 percentage)` - Set pool percentage
- `emergencyWithdrawFromPool(address recipient, uint256 amount)` - Emergency pool withdrawal
- `setCollectionPricingBounds(uint256 floorPrice, uint256 ceilingPrice, bool immutable)` - Set collection pricing bounds
- `setTokenPricingBounds(uint256 tokenId, uint256 floorPrice, uint256 ceilingPrice, bool immutable)` - Set token pricing bounds
- `setApprovedPaymentCoin(address coin)` - Set approved payment coin

### Marketplace (RugMarketplaceFacet)
- `setMarketplaceFee(uint256 newFeeBPS)` - Update marketplace fee
- `withdrawFees(address to)` - Withdraw collected fees

### Transfer Security (RugTransferSecurityFacet)
- `initializeTransferSecurity()` - Initialize transfer security
- `setTransferValidator(address validator)` - Set transfer validator
- `setToDefaultSecurityPolicy()` - Set default security policy
- `setToCustomSecurityPolicy(TransferSecurityLevels level, uint120 operatorWhitelistId, uint120 permittedContractReceiversId)` - Set custom security policy
- `setPaymentProcessorSecurityPolicy(uint256 policyId)` - Set Payment Processor policy
- `setTransferEnforcement(bool enforced)` - Enable/disable transfer enforcement

### Laundering (RugLaunderingFacet)
- `triggerLaundering(uint256 tokenId)` - Manually trigger laundering
- `updateLaunderingThreshold(uint256 newThreshold)` - Update laundering threshold

### NFT (RugNFTFacet)
- `initializeERC721Metadata()` - Initialize ERC721 metadata

---

## 🏪 MARKETPLACE/TRUSTED FUNCTIONS

### Laundering (RugLaunderingFacet)
- `recordSale(uint256 tokenId, address from, address to, uint256 salePrice)` - Record a sale (only marketplace, owner, or trusted marketplace)

### Commerce (RugCommerceFacet)
- `distributeRoyalties(uint256 tokenId, uint256 salePrice, address saleContract)` - Distribute royalties (only marketplace or owner)

---

## Summary Statistics

- **Total Public Functions**: ~100+
- **Token Owner Functions**: ~10
- **Authorized Agent Functions**: ~6
- **Admin/Owner Functions**: ~40+
- **Marketplace/Trusted Functions**: ~2

---

## Notes

1. **Diamond Pattern**: This contract uses the EIP-2535 Diamond pattern, so all functions are accessible through the main Diamond contract address.

2. **ERC721-C**: The contract implements ERC721-C (Creator Token Standard) for transfer security.

3. **Payment Requirements**: Many functions are `payable` - check function documentation for exact payment amounts.

4. **Reentrancy Protection**: Marketplace functions use `nonReentrant` modifier.

5. **Gas Optimization**: View functions are free to call, state-changing functions require gas.

6. **Access Control**: Owner functions use `LibDiamond.enforceIsContractOwner()` which checks the Diamond owner.


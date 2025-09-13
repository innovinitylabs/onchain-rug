# Mint UI Configuration Setup

## Security Notice
This file contains sensitive information (private keys). It is automatically excluded from git.

## Setup Instructions

1. **Create the config file:**
   ```bash
   cp mint-ui-config-template.js mint-ui-config.js
   ```

2. **Edit the config file** with your actual private keys:
   ```javascript
   const MINT_UI_CONFIG = {
     PRIVATE_KEYS: {
       local: "YOUR_LOCAL_PRIVATE_KEY",
       testnet: "YOUR_TESTNET_PRIVATE_KEY"
     },
     CONTRACTS: {
       local: "YOUR_LOCAL_CONTRACT_ADDRESS",
       testnet: "YOUR_TESTNET_CONTRACT_ADDRESS"
     }
   };
   ```

3. **Never commit this file** - it is already in .gitignore

## Getting Private Keys

### Local Network (Anvil)
- Default Anvil private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- This works with unlimited ETH on local network

### Testnet (Shape Sepolia)
- Get ETH from: https://faucet.shape.network
- Use the address that received the ETH
- Get private key from your wallet export

## Security Best Practices

- ✅ Keep private keys secure
- ✅ Never share config files
- ✅ Use different keys for different networks
- ✅ Regularly rotate private keys
- ❌ Never commit sensitive files to git

## Troubleshooting

If you see "CONFIG_NOT_LOADED":
- Check that mint-ui-config.js exists
- Verify the file syntax is correct
- Make sure the file is in the same directory as mint-ui.html

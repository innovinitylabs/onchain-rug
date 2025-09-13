# Environment-Based Configuration (NEW APPROACH)

## Why This Approach?

**Before:** JavaScript file approach
- ❌ Required manual file creation
- ❌ Timing issues with script loading
- ❌ CORS issues when opening files directly

**Now:** Environment file approach
- ✅ Uses your existing `.env` file
- ✅ Server-side secure access to environment variables
- ✅ No client-side file loading issues
- ✅ Proper separation of concerns

## Setup Instructions

### 1. Update Your .env File

Make sure your `.env` file has these variables:

```env
# Private Keys
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ONCHAIN_RUGS_PRIVATE_KEY=0xc944f06adcf72ce9afee9131a960a33cb35de65a63d5603814d119685446c207

# Contract Addresses
LOCAL_CONTRACT=0x5FbDB2315678afecb367f032d93F642f64180aa3
TESTNET_CONTRACT=0x38b7F32Bfb88f0c513E0e52257277057F2375010
```

### 2. Install Dependencies (Already Done)

The required packages are already installed:
- `express` - Web server
- `dotenv` - Environment variable loader

### 3. Start the Config Server

```bash
npm run config-server
```

This starts a server on port 3001 that:
- Serves static files (your HTML/CSS/JS)
- Provides `/api/config` endpoint for secure config access

### 4. Open Mint UI

Visit: `http://localhost:3001/mint-ui.html`

## How It Works

### Server-Side (.env → API)
```javascript
// config-server.js reads your .env file
const config = {
  PRIVATE_KEYS: {
    local: process.env.PRIVATE_KEY,
    testnet: process.env.ONCHAIN_RUGS_PRIVATE_KEY
  },
  CONTRACTS: {
    local: process.env.LOCAL_CONTRACT,
    testnet: process.env.TESTNET_CONTRACT
  }
};
```

### Client-Side (API → HTML)
```javascript
// mint-ui.html fetches from /api/config
const response = await fetch('/api/config');
const config = await response.json();
window.MINT_UI_CONFIG = config;
```

## Security Benefits

- ✅ **Server-side access** to sensitive .env data
- ✅ **No sensitive data** in client-side files
- ✅ **No CORS issues** with file:// protocol
- ✅ **Proper environment variable handling**
- ✅ **Git-safe** (no sensitive files committed)

## Troubleshooting

### Config Not Loading?
```bash
# Check if server is running
npm run config-server

# Test API endpoint
curl http://localhost:3001/api/config
```

### Server Errors?
```bash
# Check .env file exists
ls -la .env

# Check .env contents
cat .env
```

### Still Not Working?
The system has automatic fallbacks:
1. **API server** (primary - secure)
2. **Fallback config** (development only)

## Migration from JS File Approach

If you were using the old `mint-ui-config.js` approach:
1. ✅ **Copy your private keys** from `mint-ui-config.js` to `.env`
2. ✅ **Delete `mint-ui-config.js`** (no longer needed)
3. ✅ **Start the config server** with `npm run config-server`
4. ✅ **Use the new URL**: `http://localhost:3001/mint-ui.html`

## Architecture Comparison

| Aspect | Old JS File | New .env Approach |
|--------|-------------|-------------------|
| Security | Medium | High |
| Setup | Manual file creation | Use existing .env |
| CORS Issues | Yes | No |
| Timing Issues | Yes | No |
| Git Safety | Medium | High |
| Server Required | No | Yes |

**Recommendation:** Use the new .env approach for better security and reliability!

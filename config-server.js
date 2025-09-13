// Simple config server to serve .env values securely
const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = 3001;

// Serve static files
app.use(express.static('.'));

// API endpoint to get config
app.get('/api/config', (req, res) => {
    console.log('🔍 Environment variables loaded:');
    console.log('PRIVATE_KEY:', process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.substring(0, 10) + '...' : 'NOT SET');
    console.log('ONCHAIN_RUGS_PRIVATE_KEY:', process.env.ONCHAIN_RUGS_PRIVATE_KEY ? process.env.ONCHAIN_RUGS_PRIVATE_KEY.substring(0, 10) + '...' : 'NOT SET');
    console.log('LOCAL_CONTRACT:', process.env.LOCAL_CONTRACT || 'NOT SET');
    console.log('TESTNET_CONTRACT:', process.env.TESTNET_CONTRACT || 'NOT SET');

    const config = {
        PRIVATE_KEYS: {
            local: process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
            testnet: process.env.ONCHAIN_RUGS_PRIVATE_KEY || "YOUR_TESTNET_PRIVATE_KEY_HERE"
        },
        CONTRACTS: {
            local: process.env.LOCAL_CONTRACT || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            testnet: process.env.TESTNET_CONTRACT || "0xCCc8aBA355E37FDA0D680288F531840552C27342"
        }
    };

    console.log('📤 Sending config:', {
        local_key: config.PRIVATE_KEYS.local.substring(0, 10) + '...',
        testnet_key: config.PRIVATE_KEYS.testnet.substring(0, 10) + '...'
    });

    res.json(config);
});

app.listen(PORT, () => {
    console.log(`Config server running on port ${PORT}`);
    console.log(`- Static files: http://localhost:${PORT}/`);
    console.log(`- Config API: http://localhost:${PORT}/api/config`);
});

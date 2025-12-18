/**
 * OnchainRugs Analytics Dashboard
 * ERC-8021 Attribution Tracking Service
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { AttributionIndexer } = require('./src/indexer');
const { AnalyticsAPI } = require('./src/api');
const { Database } = require('./src/database');
const logger = require('./src/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize components
async function initializeApp() {
  try {
    // Initialize database
    const db = new Database();
    await db.connect();

    // Initialize indexer
    const indexer = new AttributionIndexer({
      rpcUrl: process.env.BASE_SEPOLIA_RPC_URL,
      contractAddress: process.env.CONTRACT_ADDRESS,
      startBlock: parseInt(process.env.START_BLOCK) || 35000000
    });

    // Initialize API
    const api = new AnalyticsAPI(db, indexer);

    // Mount API routes
    app.use('/api', api.router);

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // Start indexer
    await indexer.start();

    // Start server
    app.listen(PORT, () => {
      logger.info(`Analytics dashboard running on port ${PORT}`);
      logger.info(`Contract: ${process.env.CONTRACT_ADDRESS}`);
      logger.info(`Start Block: ${process.env.START_BLOCK}`);
    });

  } catch (error) {
    logger.error('Failed to initialize app:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the application
initializeApp().catch(console.error);

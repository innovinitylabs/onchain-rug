/**
 * ERC-8021 Attribution Event Indexer
 * Indexes all attribution events from the OnchainRugs contract
 */

const { ethers } = require('ethers');
const logger = require('./logger');

class AttributionIndexer {
  constructor(config) {
    this.rpcUrl = config.rpcUrl;
    this.contractAddress = config.contractAddress;
    this.startBlock = config.startBlock;
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    this.contract = null;
    this.db = config.database;
    this.isRunning = false;

    // Contract ABI (relevant events only)
    this.contractABI = [
      // Attribution Events
      "event MintAttributed(uint256 indexed tokenId, address indexed minter, string[] codes)",
      "event TransactionAttributed(uint256 indexed tokenId, address indexed buyer, uint256 price, string[] codes)",
      "event MaintenanceAttributed(uint256 indexed tokenId, address indexed agent, address indexed owner, string[] codes, string action)",

      // Referral Events
      "event ReferralRewardDistributed(address indexed referrer, address indexed referee, uint256 amount, uint8 transactionType)",

      // Agent Events (ERC-8004)
      "event AgentRegistered(address indexed agent, string agentId, string name)",
      "event FeedbackSubmitted(address indexed agent, address indexed client, uint256 indexed taskId, uint8 accuracy, uint8 timeliness, uint8 reliability)"
    ];
  }

  async start() {
    try {
      this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);

      // Get current block
      const currentBlock = await this.provider.getBlockNumber();
      logger.info(`Starting indexer from block ${this.startBlock} to ${currentBlock}`);

      // Index historical events
      await this.indexHistoricalEvents(this.startBlock, currentBlock);

      // Listen for new events
      this.startEventListener();

      this.isRunning = true;
      logger.info('Indexer started successfully');

    } catch (error) {
      logger.error('Failed to start indexer:', error);
      throw error;
    }
  }

  async indexHistoricalEvents(fromBlock, toBlock) {
    const batchSize = 10000; // Process in batches

    for (let start = fromBlock; start <= toBlock; start += batchSize) {
      const end = Math.min(start + batchSize - 1, toBlock);

      try {
        logger.info(`Indexing events from block ${start} to ${end}`);

        // Get all attribution events
        const events = await this.contract.queryFilter('*', start, end);

        for (const event of events) {
          await this.processEvent(event);
        }

        // Small delay to be respectful to RPC
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        logger.error(`Error indexing blocks ${start}-${end}:`, error);
      }
    }
  }

  startEventListener() {
    // Listen for new events
    this.contract.on('*', async (event) => {
      try {
        await this.processEvent(event);
      } catch (error) {
        logger.error('Error processing live event:', error);
      }
    });

    logger.info('Event listener started');
  }

  async processEvent(event) {
    const eventData = {
      blockNumber: event.blockNumber,
      blockHash: event.blockHash,
      transactionHash: event.transactionHash,
      transactionIndex: event.transactionIndex,
      logIndex: event.logIndex,
      eventName: event.eventName || event.fragment?.name,
      contractAddress: event.address,
      timestamp: await this.getBlockTimestamp(event.blockNumber),
      args: {}
    };

    // Extract event arguments
    if (event.args) {
      for (let i = 0; i < event.fragment.inputs.length; i++) {
        const input = event.fragment.inputs[i];
        eventData.args[input.name] = event.args[i];
      }
    }

    // Store event based on type
    switch (eventData.eventName) {
      case 'MintAttributed':
        await this.storeMintAttribution(eventData);
        break;
      case 'TransactionAttributed':
        await this.storeTransactionAttribution(eventData);
        break;
      case 'MaintenanceAttributed':
        await this.storeMaintenanceAttribution(eventData);
        break;
      case 'ReferralRewardDistributed':
        await this.storeReferralReward(eventData);
        break;
      case 'AgentRegistered':
        await this.storeAgentRegistration(eventData);
        break;
      case 'FeedbackSubmitted':
        await this.storeFeedback(eventData);
        break;
      default:
        // Other events - log but don't store
        logger.debug(`Unhandled event: ${eventData.eventName}`);
    }

    logger.info(`Processed ${eventData.eventName} event at block ${eventData.blockNumber}`);
  }

  async storeMintAttribution(eventData) {
    const query = `
      INSERT INTO attribution_events (
        event_type, block_number, transaction_hash, token_id, user_address,
        attribution_codes, timestamp, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (transaction_hash, log_index) DO NOTHING
    `;

    const values = [
      'mint',
      eventData.blockNumber,
      eventData.transactionHash,
      eventData.args.tokenId?.toString(),
      eventData.args.minter,
      JSON.stringify(eventData.args.codes || []),
      new Date(eventData.timestamp * 1000),
      JSON.stringify(eventData)
    ];

    await this.db.query(query, values);
  }

  async storeTransactionAttribution(eventData) {
    const query = `
      INSERT INTO attribution_events (
        event_type, block_number, transaction_hash, token_id, user_address,
        transaction_value, attribution_codes, timestamp, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (transaction_hash, log_index) DO NOTHING
    `;

    const values = [
      'marketplace',
      eventData.blockNumber,
      eventData.transactionHash,
      eventData.args.tokenId?.toString(),
      eventData.args.buyer,
      eventData.args.price?.toString(),
      JSON.stringify(eventData.args.codes || []),
      new Date(eventData.timestamp * 1000),
      JSON.stringify(eventData)
    ];

    await this.db.query(query, values);
  }

  async storeMaintenanceAttribution(eventData) {
    const query = `
      INSERT INTO attribution_events (
        event_type, block_number, transaction_hash, token_id, user_address,
        agent_address, action_type, attribution_codes, timestamp, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (transaction_hash, log_index) DO NOTHING
    `;

    const values = [
      'maintenance',
      eventData.blockNumber,
      eventData.transactionHash,
      eventData.args.tokenId?.toString(),
      eventData.args.owner,
      eventData.args.agent,
      eventData.args.action,
      JSON.stringify(eventData.args.codes || []),
      new Date(eventData.timestamp * 1000),
      JSON.stringify(eventData)
    ];

    await this.db.query(query, values);
  }

  async storeReferralReward(eventData) {
    const query = `
      INSERT INTO referral_rewards (
        transaction_hash, referrer_address, referee_address,
        reward_amount, transaction_type, timestamp, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (transaction_hash, referrer_address) DO NOTHING
    `;

    const values = [
      eventData.transactionHash,
      eventData.args.referrer,
      eventData.args.referee,
      eventData.args.amount?.toString(),
      eventData.args.transactionType,
      new Date(eventData.timestamp * 1000),
      JSON.stringify(eventData)
    ];

    await this.db.query(query, values);
  }

  async storeAgentRegistration(eventData) {
    const query = `
      INSERT INTO agent_registrations (
        agent_address, agent_id, name, registration_block,
        transaction_hash, timestamp, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (agent_address) DO NOTHING
    `;

    const values = [
      eventData.args.agent,
      eventData.args.agentId,
      eventData.args.name,
      eventData.blockNumber,
      eventData.transactionHash,
      new Date(eventData.timestamp * 1000),
      JSON.stringify(eventData)
    ];

    await this.db.query(query, values);
  }

  async storeFeedback(eventData) {
    const query = `
      INSERT INTO agent_feedback (
        agent_address, client_address, task_id, accuracy, timeliness,
        reliability, feedback_text, transaction_hash, timestamp, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (transaction_hash, task_id) DO NOTHING
    `;

    const values = [
      eventData.args.agent,
      eventData.args.client,
      eventData.args.taskId?.toString(),
      eventData.args.accuracy,
      eventData.args.timeliness,
      eventData.args.reliability,
      eventData.args.comment || '',
      eventData.transactionHash,
      new Date(eventData.timestamp * 1000),
      JSON.stringify(eventData)
    ];

    await this.db.query(query, values);
  }

  async getBlockTimestamp(blockNumber) {
    try {
      const block = await this.provider.getBlock(blockNumber);
      return block.timestamp;
    } catch (error) {
      logger.error(`Failed to get timestamp for block ${blockNumber}:`, error);
      return Math.floor(Date.now() / 1000); // Fallback to current time
    }
  }

  stop() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
    this.isRunning = false;
    logger.info('Indexer stopped');
  }
}

module.exports = { AttributionIndexer };

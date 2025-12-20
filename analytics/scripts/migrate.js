/**
 * Database migration script
 * Creates necessary tables for analytics
 */

require('dotenv').config();
const { Database } = require('../src/database');
const logger = require('../src/logger');

async function migrate() {
  const db = new Database();

  try {
    await db.connect();
    logger.info('Starting database migration...');

    // Create attribution_events table
    await db.query(`
      CREATE TABLE IF NOT EXISTS attribution_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        block_number BIGINT NOT NULL,
        transaction_hash VARCHAR(66) NOT NULL,
        log_index INTEGER NOT NULL DEFAULT 0,
        token_id VARCHAR(100),
        user_address VARCHAR(42),
        agent_address VARCHAR(42),
        transaction_value VARCHAR(100),
        action_type VARCHAR(100),
        attribution_codes JSONB DEFAULT '[]'::jsonb,
        timestamp TIMESTAMP NOT NULL,
        raw_data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),

        UNIQUE(transaction_hash, log_index)
      );

      CREATE INDEX IF NOT EXISTS idx_attribution_events_timestamp ON attribution_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_attribution_events_type ON attribution_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_attribution_events_user ON attribution_events(user_address);
      CREATE INDEX IF NOT EXISTS idx_attribution_events_codes ON attribution_events USING gin(attribution_codes);
    `);

    // Create referral_rewards table
    await db.query(`
      CREATE TABLE IF NOT EXISTS referral_rewards (
        id SERIAL PRIMARY KEY,
        transaction_hash VARCHAR(66) NOT NULL,
        referrer_address VARCHAR(42) NOT NULL,
        referee_address VARCHAR(42) NOT NULL,
        reward_amount VARCHAR(100) NOT NULL,
        transaction_type SMALLINT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        raw_data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),

        UNIQUE(transaction_hash, referrer_address)
      );

      CREATE INDEX IF NOT EXISTS idx_referral_rewards_timestamp ON referral_rewards(timestamp);
      CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_address);
    `);

    // Create agent_registrations table
    await db.query(`
      CREATE TABLE IF NOT EXISTS agent_registrations (
        id SERIAL PRIMARY KEY,
        agent_address VARCHAR(42) PRIMARY KEY,
        agent_id VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        registration_block BIGINT,
        transaction_hash VARCHAR(66),
        timestamp TIMESTAMP NOT NULL,
        raw_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_agent_registrations_agent_id ON agent_registrations(agent_id);
    `);

    // Create agent_feedback table
    await db.query(`
      CREATE TABLE IF NOT EXISTS agent_feedback (
        id SERIAL PRIMARY KEY,
        agent_address VARCHAR(42) NOT NULL,
        client_address VARCHAR(42) NOT NULL,
        task_id VARCHAR(100) NOT NULL,
        accuracy SMALLINT NOT NULL,
        timeliness SMALLINT NOT NULL,
        reliability SMALLINT NOT NULL,
        feedback_text TEXT,
        transaction_hash VARCHAR(66) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        raw_data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),

        UNIQUE(transaction_hash, task_id)
      );

      CREATE INDEX IF NOT EXISTS idx_agent_feedback_agent ON agent_feedback(agent_address);
      CREATE INDEX IF NOT EXISTS idx_agent_feedback_timestamp ON agent_feedback(timestamp);
    `);

    logger.info('Database migration completed successfully');

  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrate };

/**
 * Database connection and queries for analytics
 */

const { Pool } = require('pg');
const logger = require('./logger');

class Database {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'onchainrugs_analytics',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected database error:', err);
    });
  }

  async connect() {
    try {
      await this.pool.query('SELECT NOW()');
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug(`Query executed in ${duration}ms: ${text}`);
      return res;
    } catch (error) {
      logger.error('Database query error:', error);
      throw error;
    }
  }

  async close() {
    await this.pool.end();
    logger.info('Database connection closed');
  }

  // Analytics queries
  async getAttributionOverview() {
    const query = `
      SELECT
        COUNT(*) as total_events,
        COUNT(CASE WHEN array_length(attribution_codes, 1) > 0 THEN 1 END) as attributed_events,
        ROUND(
          COUNT(CASE WHEN array_length(attribution_codes, 1) > 0 THEN 1 END)::decimal /
          NULLIF(COUNT(*), 0) * 100, 2
        ) as attribution_rate,
        COUNT(DISTINCT CASE WHEN event_type = 'mint' THEN transaction_hash END) as mint_events,
        COUNT(DISTINCT CASE WHEN event_type = 'marketplace' THEN transaction_hash END) as marketplace_events,
        COUNT(DISTINCT CASE WHEN event_type = 'maintenance' THEN transaction_hash END) as maintenance_events
      FROM attribution_events
      WHERE timestamp >= NOW() - INTERVAL '30 days'
    `;

    const result = await this.query(query);
    return result.rows[0];
  }

  async getTopReferrers(limit = 10) {
    const query = `
      SELECT
        referrer_address,
        COUNT(*) as total_rewards,
        SUM(reward_amount) as total_amount,
        AVG(reward_amount) as avg_reward,
        MAX(timestamp) as last_reward
      FROM referral_rewards
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY referrer_address
      ORDER BY total_amount DESC
      LIMIT $1
    `;

    const result = await this.query(query, [limit]);
    return result.rows;
  }

  async getReferralCodeStats() {
    const query = `
      SELECT
        COUNT(DISTINCT referrer_address) as total_referrers,
        COUNT(*) as total_rewards,
        SUM(reward_amount) as total_distributed,
        AVG(reward_amount) as avg_reward_amount,
        MIN(timestamp) as first_reward,
        MAX(timestamp) as last_reward
      FROM referral_rewards
    `;

    const result = await this.query(query);
    return result.rows[0];
  }

  async getAttributionTrends(days = 7) {
    const query = `
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as total_events,
        COUNT(CASE WHEN array_length(attribution_codes, 1) > 0 THEN 1 END) as attributed_events,
        ROUND(
          COUNT(CASE WHEN array_length(attribution_codes, 1) > 0 THEN 1 END)::decimal /
          NULLIF(COUNT(*), 0) * 100, 2
        ) as attribution_rate
      FROM attribution_events
      WHERE timestamp >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `;

    const result = await this.query(query);
    return result.rows;
  }

  async getPopularCodes(limit = 20) {
    const query = `
      SELECT
        unnest(attribution_codes) as code,
        COUNT(*) as usage_count,
        COUNT(DISTINCT transaction_hash) as unique_transactions,
        MAX(timestamp) as last_used
      FROM attribution_events
      WHERE array_length(attribution_codes, 1) > 0
      GROUP BY unnest(attribution_codes)
      ORDER BY usage_count DESC
      LIMIT $1
    `;

    const result = await this.query(query, [limit]);
    return result.rows;
  }

  // Agent analytics (ERC-8004)
  async getAgentOverview() {
    const query = `
      SELECT
        COUNT(DISTINCT agent_address) as total_agents,
        COUNT(*) as total_feedback,
        AVG(accuracy + timeliness + reliability)::decimal / 3 as avg_rating,
        COUNT(DISTINCT task_id) as total_tasks
      FROM agent_feedback
    `;

    const result = await this.query(query);
    return result.rows[0];
  }

  async getTopAgents(limit = 10) {
    const query = `
      SELECT
        a.agent_address,
        a.agent_id,
        a.name,
        COUNT(f.*) as feedback_count,
        ROUND(AVG(f.accuracy + f.timeliness + f.reliability)::decimal / 3, 2) as avg_rating,
        MAX(f.timestamp) as last_feedback
      FROM agent_registrations a
      LEFT JOIN agent_feedback f ON a.agent_address = f.agent_address
      GROUP BY a.agent_address, a.agent_id, a.name
      ORDER BY avg_rating DESC NULLS LAST
      LIMIT $1
    `;

    const result = await this.query(query, [limit]);
    return result.rows;
  }
}

module.exports = { Database };

/**
 * REST API for analytics dashboard
 */

const express = require('express');
const logger = require('./logger');

class AnalyticsAPI {
  constructor(database, indexer) {
    this.db = database;
    this.indexer = indexer;
    this.router = express.Router();

    this.setupRoutes();
  }

  setupRoutes() {
    // Overview metrics
    this.router.get('/overview', this.getOverview.bind(this));

    // Attribution analytics
    this.router.get('/attribution/trends', this.getAttributionTrends.bind(this));
    this.router.get('/attribution/codes', this.getPopularCodes.bind(this));

    // Referral analytics
    this.router.get('/referrals/overview', this.getReferralOverview.bind(this));
    this.router.get('/referrals/top', this.getTopReferrers.bind(this));
    this.router.get('/referrals/stats', this.getReferralStats.bind(this));

    // Agent analytics (ERC-8004)
    this.router.get('/agents/overview', this.getAgentOverview.bind(this));
    this.router.get('/agents/top', this.getTopAgents.bind(this));

    // Real-time data
    this.router.get('/realtime/events', this.getRecentEvents.bind(this));

    // System status
    this.router.get('/status', this.getSystemStatus.bind(this));
  }

  async getOverview(req, res) {
    try {
      const [attrOverview, referralStats, agentOverview] = await Promise.all([
        this.db.getAttributionOverview(),
        this.db.getReferralCodeStats(),
        this.db.getAgentOverview()
      ]);

      const overview = {
        attribution: {
          totalEvents: parseInt(attrOverview.total_events) || 0,
          attributedEvents: parseInt(attrOverview.attributed_events) || 0,
          attributionRate: parseFloat(attrOverview.attribution_rate) || 0,
          mintEvents: parseInt(attrOverview.mint_events) || 0,
          marketplaceEvents: parseInt(attrOverview.marketplace_events) || 0,
          maintenanceEvents: parseInt(attrOverview.maintenance_events) || 0
        },
        referrals: {
          totalReferrers: parseInt(referralStats.total_referrers) || 0,
          totalRewards: parseInt(referralStats.total_rewards) || 0,
          totalDistributed: referralStats.total_distributed || '0',
          avgReward: referralStats.avg_reward_amount || '0'
        },
        agents: {
          totalAgents: parseInt(agentOverview.total_agents) || 0,
          totalFeedback: parseInt(agentOverview.total_feedback) || 0,
          avgRating: parseFloat(agentOverview.avg_rating) || 0,
          totalTasks: parseInt(agentOverview.total_tasks) || 0
        },
        timestamp: new Date().toISOString()
      };

      res.json(overview);
    } catch (error) {
      logger.error('Error getting overview:', error);
      res.status(500).json({ error: 'Failed to get overview data' });
    }
  }

  async getAttributionTrends(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const trends = await this.db.getAttributionTrends(days);
      res.json(trends);
    } catch (error) {
      logger.error('Error getting attribution trends:', error);
      res.status(500).json({ error: 'Failed to get attribution trends' });
    }
  }

  async getPopularCodes(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const codes = await this.db.getPopularCodes(limit);
      res.json(codes);
    } catch (error) {
      logger.error('Error getting popular codes:', error);
      res.status(500).json({ error: 'Failed to get popular codes' });
    }
  }

  async getReferralOverview(req, res) {
    try {
      const stats = await this.db.getReferralCodeStats();
      res.json(stats);
    } catch (error) {
      logger.error('Error getting referral overview:', error);
      res.status(500).json({ error: 'Failed to get referral overview' });
    }
  }

  async getTopReferrers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const referrers = await this.db.getTopReferrers(limit);
      res.json(referrers);
    } catch (error) {
      logger.error('Error getting top referrers:', error);
      res.status(500).json({ error: 'Failed to get top referrers' });
    }
  }

  async getReferralStats(req, res) {
    try {
      const [overview, topReferrers, trends] = await Promise.all([
        this.db.getReferralCodeStats(),
        this.db.getTopReferrers(5),
        this.db.getAttributionTrends(30)
      ]);

      res.json({
        overview,
        topReferrers,
        trends: trends.filter(t => t.attributed_events > 0) // Only show days with referrals
      });
    } catch (error) {
      logger.error('Error getting referral stats:', error);
      res.status(500).json({ error: 'Failed to get referral stats' });
    }
  }

  async getAgentOverview(req, res) {
    try {
      const overview = await this.db.getAgentOverview();
      res.json(overview);
    } catch (error) {
      logger.error('Error getting agent overview:', error);
      res.status(500).json({ error: 'Failed to get agent overview' });
    }
  }

  async getTopAgents(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const agents = await this.db.getTopAgents(limit);
      res.json(agents);
    } catch (error) {
      logger.error('Error getting top agents:', error);
      res.status(500).json({ error: 'Failed to get top agents' });
    }
  }

  async getRecentEvents(req, res) {
    try {
      // This would be implemented with a real-time cache
      // For now, return a placeholder
      res.json({
        message: 'Real-time events endpoint - implement with Redis/WebSocket',
        events: []
      });
    } catch (error) {
      logger.error('Error getting recent events:', error);
      res.status(500).json({ error: 'Failed to get recent events' });
    }
  }

  async getSystemStatus(req, res) {
    try {
      const status = {
        indexer: {
          running: this.indexer.isRunning,
          lastBlock: 'TBD', // Would track last processed block
          queueSize: 0
        },
        database: {
          connected: true, // Would check actual connection
          lastUpdate: new Date().toISOString()
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: '1.0.0'
        }
      };

      res.json(status);
    } catch (error) {
      logger.error('Error getting system status:', error);
      res.status(500).json({ error: 'Failed to get system status' });
    }
  }
}

module.exports = { AnalyticsAPI };

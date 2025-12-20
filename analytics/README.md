# OnchainRugs Analytics Dashboard

Analytics service for tracking ERC-8021 attribution and ERC-8004 agent activity.

## Features

- **Real-time Event Indexing**: Automatically indexes all attribution events
- **Referral Analytics**: Track referral program performance
- **Agent Reputation**: Monitor ERC-8004 agent feedback and ratings
- **REST API**: Comprehensive analytics endpoints
- **Dashboard Ready**: Structured data for frontend visualization

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Access to Base Sepolia RPC

### Installation

```bash
cd analytics
npm install
cp .env.example .env
# Edit .env with your configuration
```

### Database Setup

```bash
# Create database
createdb onchainrugs_analytics

# Run migrations
npm run migrate
```

### Start Service

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Service will be available at `http://localhost:3001`

## API Endpoints

### Overview
- `GET /api/overview` - Complete analytics overview

### Attribution
- `GET /api/attribution/trends?days=7` - Attribution trends over time
- `GET /api/attribution/codes?limit=20` - Most popular attribution codes

### Referrals
- `GET /api/referrals/overview` - Referral program overview
- `GET /api/referrals/top?limit=10` - Top referrers by rewards
- `GET /api/referrals/stats` - Comprehensive referral statistics

### Agents (ERC-8004)
- `GET /api/agents/overview` - Agent ecosystem overview
- `GET /api/agents/top?limit=10` - Top-rated agents

### System
- `GET /api/status` - Service health and status
- `GET /health` - Basic health check

## Data Schema

### Attribution Events
```sql
CREATE TABLE attribution_events (
  event_type VARCHAR(50),        -- 'mint', 'marketplace', 'maintenance'
  block_number BIGINT,
  transaction_hash VARCHAR(66),
  token_id VARCHAR(100),
  user_address VARCHAR(42),
  attribution_codes JSONB,       -- Array of attribution codes
  timestamp TIMESTAMP
);
```

### Referral Rewards
```sql
CREATE TABLE referral_rewards (
  transaction_hash VARCHAR(66),
  referrer_address VARCHAR(42),
  reward_amount VARCHAR(100),
  transaction_type SMALLINT,     -- 0=mint, 1=marketplace
  timestamp TIMESTAMP
);
```

### Agent Data (ERC-8004)
```sql
CREATE TABLE agent_registrations (
  agent_address VARCHAR(42),
  agent_id VARCHAR(255),
  name VARCHAR(255),
  timestamp TIMESTAMP
);

CREATE TABLE agent_feedback (
  agent_address VARCHAR(42),
  task_id VARCHAR(100),
  accuracy SMALLINT,             -- 1-5 rating
  timeliness SMALLINT,           -- 1-5 rating
  reliability SMALLINT,          -- 1-5 rating
  timestamp TIMESTAMP
);
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Blockchain    │───▶│   Event Indexer  │───▶│   PostgreSQL    │
│   (Base Sepolia)│    │   (Real-time)    │    │   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Analytics API  │    │   Dashboard UI  │
                       │   (Express.js)   │    │   (React/Next)   │
                       └──────────────────┘    └─────────────────┘
```

## Development

### Adding New Metrics

1. **Database Schema**: Add new table/query in `database.js`
2. **API Endpoint**: Add route in `api.js`
3. **Indexer Support**: Add event processing in `indexer.js`

### Testing

```bash
npm test
```

### Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console (development)

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables

See `.env.example` for required configuration.

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## License

MIT License - see LICENSE file for details.

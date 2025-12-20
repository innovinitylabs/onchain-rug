# Analytics Dashboard for ERC-8021 Attribution

## Status: Planning Phase

---

## 🎯 What We Need to Build

An analytics dashboard to track and visualize ERC-8021 attribution data from our deployed contracts.

### Key Metrics to Track

1. **Traffic Attribution**
   - Total transactions with attribution
   - Attribution rate (transactions with vs without codes)
   - Popular attribution codes

2. **Referral System Analytics**
   - Total referral codes registered
   - Successful referrals (codes that generated rewards)
   - Total referral rewards distributed
   - Top referrers by volume/rewards

3. **Platform Attribution**
   - Base traffic attribution (when enabled)
   - Other platform codes used
   - Cross-platform attribution tracking

4. **User Behavior**
   - Attribution by transaction type (mint vs marketplace vs maintenance)
   - Geographic distribution of attributed users
   - Time-based attribution trends

---

## 🏗️ Technical Architecture

### Data Sources

1. **On-Chain Events**
   - `MintAttributed(tokenId, minter, codes[])`
   - `TransactionAttributed(tokenId, buyer, price, codes[])`
   - `MaintenanceAttributed(tokenId, agent, action, codes[])`
   - `ReferralRewardDistributed(referrer, amount, transactionType)`

2. **Off-Chain Storage**
   - PostgreSQL or MongoDB for aggregated data
   - Redis for real-time caching
   - IPFS/Arweave for historical archives

### Data Pipeline

#### 1. Event Indexing
```typescript
// Indexer service (Node.js + Ethers.js)
const indexer = new AttributionIndexer({
  rpcUrl: "https://sepolia.base.org",
  contractAddress: "0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff",
  startBlock: 35000000 // Deployment block
});

indexer.on('MintAttributed', (event) => {
  // Store attribution data
  storeAttributionEvent({
    type: 'mint',
    tokenId: event.tokenId,
    user: event.minter,
    codes: event.codes,
    timestamp: event.timestamp,
    txHash: event.txHash
  });
});
```

#### 2. Data Processing
```typescript
// Process and aggregate data
const processor = new AttributionProcessor();

processor.processReferralCodes = (codes) => {
  return codes.filter(code => code.startsWith('ref-'));
};

processor.calculateReferralRewards = (attributionData) => {
  // Calculate rewards based on transaction type and configured percentages
  const rewards = [];
  for (const attr of attributionData) {
    if (attr.referralCode) {
      const reward = calculateReward(attr);
      rewards.push({
        referrer: extractReferrer(attr.referralCode),
        amount: reward,
        transaction: attr.txHash
      });
    }
  }
  return rewards;
};
```

#### 3. API Layer
```typescript
// REST API for dashboard
app.get('/api/analytics/overview', async (req, res) => {
  const data = await db.getAttributionOverview();
  res.json({
    totalTransactions: data.totalTx,
    attributedTransactions: data.attributedTx,
    attributionRate: (data.attributedTx / data.totalTx) * 100,
    totalReferralRewards: data.totalRewards,
    activeReferralCodes: data.activeCodes
  });
});

app.get('/api/analytics/referrals/top', async (req, res) => {
  const topReferrers = await db.getTopReferrers(10);
  res.json(topReferrers);
});
```

---

## 🎨 Dashboard Features

### Overview Dashboard
- **Key Metrics Cards**
  - Total attributed transactions
  - Attribution success rate
  - Total referral rewards distributed
  - Active referral codes

- **Charts**
  - Attribution rate over time
  - Transaction types breakdown
  - Referral rewards distribution

### Referral Analytics
- **Top Referrers Table**
  - Referrer address/code
  - Total referrals
  - Total rewards earned
  - Conversion rate

- **Referral Performance**
  - Referral code registration trends
  - Successful referral conversion funnel
  - Reward distribution by transaction type

### Platform Attribution
- **Base Traffic Metrics** (when enabled)
  - Transactions attributed to "onchainrugs"
  - Base ecosystem contribution
  - Potential reward eligibility

### Real-time Updates
- **Live Transaction Feed**
  - Recent attributed transactions
  - New referral rewards
  - System status

---

## 🛠️ Implementation Plan

### Phase 1: Basic Indexer (Week 1)
- [ ] Set up indexer service
- [ ] Index all attribution events
- [ ] Store in database
- [ ] Basic API endpoints

### Phase 2: Analytics API (Week 2)
- [ ] Data aggregation functions
- [ ] Referral reward calculations
- [ ] Performance metrics
- [ ] Caching layer

### Phase 3: Dashboard UI (Week 3)
- [ ] React dashboard components
- [ ] Charts and visualizations
- [ ] Real-time updates
- [ ] Mobile responsive

### Phase 4: Advanced Features (Week 4)
- [ ] Geographic analytics
- [ ] User behavior insights
- [ ] Export functionality
- [ ] Alert system

---

## 📊 Sample Dashboard Data

### Current Status (From Base Sepolia)
- **Total Supply**: 7 NFTs
- **Deployment Block**: ~35M (Base Sepolia)
- **Referral System**: Enabled with 5% rewards
- **Expected Growth**: More transactions as users test

### Projected Metrics (Month 1)
- **Daily Transactions**: 10-50 (conservative)
- **Attribution Rate**: 60-80% (with good UX)
- **Referral Conversions**: 20-30% of attributed tx
- **Monthly Rewards**: $50-500+ (depending on volume)

---

## 🔧 Technical Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Indexing**: Custom event indexer

### Frontend
- **Framework**: Next.js/React
- **Charts**: Chart.js or Recharts
- **Styling**: Tailwind CSS
- **State**: Zustand or Redux

### Infrastructure
- **Hosting**: Vercel/Netlify (frontend) + Railway/Render (backend)
- **Monitoring**: Sentry for error tracking
- **Analytics**: Custom events + Google Analytics

---

## 📈 Success Metrics

### Technical Success
- ✅ **Data Accuracy**: 99%+ event indexing accuracy
- ✅ **Performance**: <2s dashboard load times
- ✅ **Uptime**: 99%+ availability
- ✅ **Real-time**: <10s data freshness

### Business Success
- 📊 **Insights**: Actionable attribution insights
- 💰 **ROI Tracking**: Clear referral program ROI
- 📈 **Growth**: Data-driven optimization
- 🎯 **Attribution**: Platform reward qualification

---

## 🎯 Next Steps

1. **Set up Indexer**: Basic event indexing service
2. **Database Schema**: Design attribution data models
3. **API Development**: Core analytics endpoints
4. **Dashboard MVP**: Basic visualization dashboard

---

**Status**: Analytics dashboard planned and ready for development. Will provide insights into ERC-8021 attribution effectiveness and referral program performance.


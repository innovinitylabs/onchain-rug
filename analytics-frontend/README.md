# OnchainRugs Analytics Dashboard

A modern React dashboard for visualizing ERC-8021 attribution and ERC-8004 agent analytics.

## Features

- **Real-time Analytics**: Live data from OnchainRugs smart contracts
- **Comprehensive Metrics**: Attribution rates, referral performance, agent ratings
- **Interactive Charts**: Built with Recharts for beautiful visualizations
- **Multi-tab Interface**: Organized views for different data types
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React icons
- **UI Components**: Custom component library

## Getting Started

### Prerequisites
- Node.js 18+
- Access to analytics API (analytics service running)

### Installation

```bash
cd analytics-frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Build for Production

```bash
npm run build
npm start
```

## Dashboard Sections

### Overview Tab
- Key performance metrics
- Transaction type breakdown (pie chart)
- Attribution trends over time
- Top-level statistics cards

### Referrals Tab
- Referral program performance
- Top referrers leaderboard
- Reward distribution metrics
- Program effectiveness stats

### Agents Tab
- ERC-8004 agent ecosystem overview
- Agent rating distributions
- Top-rated agents table
- Capability breakdown

### Attribution Tab
- Detailed attribution analytics
- Popular codes analysis
- Base builder integration status
- ERC-8021 compliance metrics

## Data Sources

The dashboard connects to the analytics API endpoints:

- `/api/analytics/overview` - Main dashboard data
- `/api/analytics/referrals/*` - Referral program data
- `/api/analytics/agents/*` - AI agent ecosystem data
- `/api/analytics/attribution/*` - Attribution analytics

## Component Architecture

```
components/
├── Dashboard.tsx          # Main dashboard component
├── tabs/                  # Tab-specific components
│   ├── OverviewTab.tsx
│   ├── ReferralsTab.tsx
│   ├── AgentsTab.tsx
│   └── AttributionTab.tsx
└── ui/                    # Reusable UI components
    ├── card.tsx
    ├── tabs.tsx
    ├── table.tsx
    └── badge.tsx
```

## Styling

The dashboard uses a custom design system built on Tailwind CSS:

- **Color Palette**: Blue primary with accent colors for different data types
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent spacing using Tailwind's spacing scale
- **Components**: Reusable UI components for consistency

## Performance

- **Lazy Loading**: Components load data as needed
- **Real-time Updates**: Auto-refresh every 30 seconds
- **Optimized Charts**: Efficient rendering with Recharts
- **Responsive Images**: Proper scaling for all screen sizes

## Contributing

1. Follow the existing component structure
2. Use TypeScript for type safety
3. Follow Tailwind CSS class naming conventions
4. Add proper error handling for API calls
5. Test on multiple screen sizes

## Deployment

The dashboard can be deployed to Vercel, Netlify, or any static hosting service:

```bash
npm run build
# Deploy the .next folder contents
```

Make sure to configure the API endpoints for your deployment environment.

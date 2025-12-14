# 🎮 Rug Flight Trials: Complete Implementation Plan

## 📋 **Context & Instructions for Chat Agents**

**This is a living document** - update it as we build. When changes are made:
- ~~Strike out~~ old content
- Add new content with timestamp
- Keep all changes logged at bottom

**Project**: Build a gambling-enabled flying rug racing game in Next.js using Three.js
**Tech Stack**: Next.js, Three.js, Wagmi, Solidity (new facet), On-chain storage
**Timeline**: 6-7 weeks total development
**Goal**: Production-ready crypto gaming with NFT integration

---

## 🎯 **Core Requirements**

### **Game Concept**
- **3D flying rug racing** using NFT rugs as textures and traits for stats
- **Gambling mechanics** with 8% house edge
- **Multiple game modes**: Solo practice, betting races, tournaments
- **Mobile-first** with virtual joystick controls
- **Clean rugs = better performance** (maintenance encouraged)

### **Technical Constraints**
- **Budget-friendly**: Serverless, free/hobby tier hosting
- **Lightweight**: 60fps desktop, 30fps mobile target
- **On-chain heavy**: Leaderboards, betting, results stored on-chain
- **NFT integration**: HTML-generated rugs as Three.js textures

---

## 🏗️ **Technical Architecture**

### **Three.js Integration**
- Dynamic import in Next.js to avoid SSR issues
- Canvas rendering with WebGL2 fallback
- Texture loading from NFT HTML files
- Procedural course generation with seeded PRNG

### **Smart Contract Architecture**
- **New Facet**: `RugFlightBettingFacet.sol`
- **Betting**: Native ETH with 8% house edge
- **Settlement**: Immediate after race completion
- **Leaderboards**: Top 100 scores per course type (on-chain)

### **Data Storage**
- **Replays**: IPFS with on-chain hash references
- **Leaderboards**: On-chain structs (gas-optimized)
- **Daily Seeds**: On-chain seeded PRNG for courses

---

## 🎮 **Game Mechanics**

### **Trait-to-Stats Mapping**
```javascript
const TRAIT_MULTIPLIERS = {
  dirtLevel: { 0: 1.0, 1: 0.75, 2: 0.5 },      // Clean = best
  agingLevel: { 0: 1.0, 5: 0.9, 10: 0.8 },     // Young = better
  frameLevel: { 0: 1.0, 2: 1.1, 4: 1.2 },      // Higher frames = better
  maintenanceScore: score => 1.0 + (score / 1000) * 0.1, // Maintenance = better
  cleaningCount: count => 1.0 + (count / 10) * 0.05,     // More cleanings = better
  warpThickness: thickness => 1.0 + (thickness - 2) * 0.02, // Micro-adjustments
  stripeCount: count => 1.0 + (count / 20) * 0.01,        // Micro-adjustments
  characterCount: count => 1.0 + (count / 500) * 0.02,    // Micro-adjustments
  paletteComplexity: complexity => 1.0 + complexity * 0.01 // Micro-adjustments
}
```

### **Course Types (Procedural, Daily Seeded)**
1. **Desert Dunes** - Open flying with ring gates
2. **Monsoon Sky** - Turbulent weather effects
3. **Night Palace** - Intricate architecture
4. **Mountain Mist** - Vertical challenges

### **Betting Modes**
- **Quick Race**: 1v1 with random opponent (ghost replay)
- **Time Trial Stakes**: All players bet, fastest time wins
- **Handicap Duel**: Dirty rugs get better odds
- **Tournament**: 8-player bracket with entry fees

### **Prize Distribution**
- **1st Place**: 50% of pot
- **2nd Place**: 30% of pot
- **3rd Place**: 20% of pot
- **House Edge**: 8% of total pot

---

## 📱 **UI/UX Design**

### **Page Structure**
```
┌─────────────────────────────────────────────────┐
│ 🎮 GAME OF RUGS                                │
├─────────────────────────────────────────────────┤
│ 🏁 Flight Trials    🧹 Cleaning Sim    ⚔️ Combat │
├─────────────────────────────────────────────────┤
│ [Flight Racing Game Canvas]                     │
│                                                 │
│ 🏜️ Desert Course                               │
│ 🎯 Free Play          💰 Bet 0.001 ETH         │
│                                                 │
│ [Your Rug Selection]                            │
│ [Stats Display]                                 │
│ [Virtual Joystick]                              │
└─────────────────────────────────────────────────┘
```

### **Game States**
1. **Rug Selection** - Choose from owned NFTs, view stats
2. **Betting Lobby** - Set wager amount, choose mode
3. **Race Preparation** - Course preview, countdown
4. **Active Race** - HUD with timer, speed, boost bar
5. **Results** - Final time, placement, winnings

### **Mobile Controls**
- **Virtual Joystick**: HTML5 touch events for steering
- **Boost Button**: Discrete boost activation
- **Responsive Canvas**: Adapts to screen size

---

## 🔄 **Development Roadmap**

### **Phase 1: Core Game (Week 1-2)**
- [x] Three.js scene setup and basic flight physics
- [x] NFT texture loading from HTML files (procedural fallback)
- [x] Basic course generation (Desert Dunes with rings)
- [x] Desktop controls (keyboard)
- [x] Game UI integration into Game Of Rugs page
- [x] Rug trait integration and stat calculation
- [x] Visual effects based on rug condition

### **Phase 2: Polish & Features (Week 3-4)**
- [ ] All course types with procedural generation
- [ ] Mobile controls and optimization
- [ ] Ghost replay system and recording
- [ ] In-game cleaning integration
- [ ] Visual effects and particle systems

### **Phase 3: Betting Integration (Week 5-6)**
- [ ] `RugFlightBettingFacet.sol` contract
- [ ] Wallet integration for betting
- [ ] Leaderboard system (on-chain)
- [ ] Tournament mechanics
- [ ] Oracle integration for result verification

### **Phase 4: Game Hub & Launch (Week 7)**
- [ ] Multiple games in single page interface
- [ ] Achievement and progression system
- [ ] Social features and sharing
- [ ] Performance optimization and testing
- [ ] Production deployment

---

## 📊 **Success Metrics**

### **Technical**
- **60fps** on desktop, **30fps** on mobile
- **< 2MB** bundle size
- **< 100ms** input latency
- **Deterministic** replays within 0.01s accuracy

### **Engagement**
- **15-25 second** race duration for dopamine loops
- **Daily active users** through daily challenges
- **Gambling revenue** with 8% house edge
- **NFT maintenance** encouragement through stat bonuses

### **Crypto Integration**
- **On-chain leaderboards** for trust
- **Immediate settlements** for fast payouts
- **NFT trait integration** for deeper utility
- **Cross-platform compatibility**

---

## ⚠️ **Technical Challenges & Solutions**

### **NFT Texture Loading**
- **Challenge**: HTML files with embedded JS canvas rendering
- **Solution**: Hidden iframe loading + canvas extraction as Three.js texture
- **Fallback**: Recreate p5.js rendering logic in Three.js

### **Mobile Performance**
- **Challenge**: Maintaining 30fps on Android devices
- **Solution**: LOD system, reduced draw calls, optimized shaders
- **Testing**: Benchmark on iPhone 12 simulator and Android devices

### **On-Chain Storage**
- **Challenge**: Gas costs for leaderboards
- **Solution**: Struct packing, batch updates, weekly tournaments
- **Architecture**: Separate facet with optimized data structures

### **Deterministic Replays**
- **Challenge**: Exact replay reproduction across devices
- **Solution**: Seeded PRNG, fixed time steps, input event recording
- **Verification**: Client-side validation with oracle confirmation

---

## 🧪 **Testing & QA Checklist**

### **Performance Testing**
- [ ] FPS measurement on target devices
- [ ] Memory usage monitoring
- [ ] Bundle size analysis
- [ ] Network request optimization

### **Gameplay Testing**
- [ ] Deterministic replay accuracy
- [ ] Trait calculations verification
- [ ] Mobile control responsiveness
- [ ] Betting flow end-to-end

### **Integration Testing**
- [ ] NFT loading from various sources
- [ ] Smart contract interactions
- [ ] Wallet connection flows
- [ ] Error handling and fallbacks

---

## 🎯 **Launch Checklist**

- [ ] Smart contract deployment and verification
- [ ] Frontend deployment to production
- [ ] NFT integration testing
- [ ] Mobile device testing
- [ ] Beta testing with community
- [ ] Marketing and user acquisition
- [ ] Monitoring and analytics setup

---

## 📝 **Change Log**

### **2025-01-XX** - Initial Plan Creation
- ✅ Core requirements defined
- ✅ Technical architecture outlined
- ✅ Game mechanics specified
- ✅ Development roadmap created
- ✅ Testing and launch checklists added

### **2025-01-XX** - Phase 1 Started
- ✅ Began Three.js scene setup and basic flight physics implementation

### **2025-01-XX** - Phase 1 Core Complete
- ✅ Created RugFlightGame component with Three.js scene, camera, lighting
- ✅ Implemented basic flight physics with steering, speed, boost mechanics
- ✅ Added procedural NFT texture generation (fallback for HTML loading)
- ✅ Created basic Desert Dunes course with ring obstacles
- ✅ Integrated game into Game Of Rugs page with tab interface
- ✅ Added keyboard controls (Arrow keys + Space for boost)

### **2025-01-XX** - Trait Mapping Complete
- ✅ Created traitCalculator.ts with comprehensive stat mapping
- ✅ All rug traits affect flight performance (dirt, aging, frames, maintenance)
- ✅ Clean rugs = best performance (encourages maintenance)
- ✅ Visual effects based on rug condition (glow, brightness)
- ✅ Debug logging for trait calculations
- ✅ UI displays rug stats and condition

### **2025-01-XX** - Rug Selection Bug Fix
- ✅ Fixed rug collection not loading properly in Flight Trials
- ✅ Added proper validation for rug count (exactly 1 for flight, 2-4 for others)
- ✅ Improved game start validation and error messaging
- ✅ Added clear UI feedback for incorrect rug selection

### **2025-01-XX** - Chain-based NFT Loading
- ✅ Replaced API-based loading with direct chain queries (like dashboard)
- ✅ Implemented Alchemy API integration for owned NFT discovery
- ✅ Added proper error handling and contract address validation
- ✅ Fixed "games before initialization" error by moving definitions
- ✅ Enhanced loading with detailed logging and fallback handling

### **2025-01-XX** - Rug Preview & Loading Fixes COMPLETED
- ✅ Added RugPreviewCanvas component for visual rug previews in selection grid
- ✅ **FIXED LOADING ISSUE**: Added proper error handling, fallback timeout, and async initialization
- ✅ Implemented hardcoded sample rug data for testing (based on sample_token_uri files)
- ✅ Added high-quality procedural textures with real color palettes, dirt effects, frame glows
- ✅ Game starts immediately with detailed rug textures
- ✅ Previews show vibrant, accurate rug colors and patterns for immediate testing
- ✅ Sample rugs: Red RUG (tokenId 1), Blue SKY (tokenId 2), Gold SUN (tokenId 3)
- ✅ **RCA COMPLETED**: Root cause was async Three.js initialization timing + missing error handling

---

**This document will be updated as we build. New chat agents should read this first to understand the complete project context.**

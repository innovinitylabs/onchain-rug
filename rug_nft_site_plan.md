# 🧶 Rug/Doormat NFT Project – Build Specification

This document defines the **stack, architecture, and development flow** for building the Rug/Doormat NFT project, deployable on **Shape L2 (EVM-compatible)** with a **frontend hosted on Vercel** and **backend + DB hosted on Railway**.

---

## 🎯 Goals

- Generative art rugs/doormats with unique text.
- 1111 max supply.
- Free mint **or** user-selected pay-what-you-want mint price.
- Each text string must be unique (no duplicates).
- Support for **multiple rows of text**, where extra rows add an additional cost.
- Launch on **Shape L2** (Ethereum-based L2).
- **Hybrid uniqueness checks** (backend DB + smart contract mapping).

---

## 🏗️ Architecture

### Frontend (Vercel)

- Static site: Next.js + TailwindCSS + Three.js (for interactive doors + rugs).
- Wallet integration: wagmi + viem + RainbowKit.
- Calls backend API for word availability.
- Calls smart contract for actual minting.

### Backend (Railway)

- Node.js (Express) service.
- Connects to Railway Postgres.
- API routes:
  - `GET /status/:word` → check if word claimed.
  - `POST /claim` → lock word before mint.
- Ensures frontend shows real-time availability.

### Database (Postgres)

```sql
CREATE TABLE claims (
  id SERIAL PRIMARY KEY,
  word TEXT UNIQUE NOT NULL,
  rows INT DEFAULT 1,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

### Smart Contract (Solidity, Shape L2)

- Based on **ERC721A** or **ERC7160TL-inspired** contract.
- Mapping of `word → tokenId` to enforce uniqueness.
- Mint function:
  - Input: `word`, `rows`, `msg.value` (optional tip/payment).
  - Require: word not already claimed.
  - If `rows > 1`, require `msg.value >= basePrice + extraRowFee * (rows-1)`.
  - If `msg.value == 0`, still allow (free mint).
  - Mint NFT with metadata JSON pointing to rug generator URL.

---

## 🔑 Contract Specification

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RugNFT is ERC721Enumerable, Ownable {
    uint256 public constant MAX_SUPPLY = 1111;
    uint256 public basePrice = 0.001 ether; // optional tip baseline
    uint256 public extraRowFee = 0.0005 ether;

    mapping(string => uint256) public wordToTokenId;
    mapping(uint256 => string) public tokenIdToWord;
    mapping(uint256 => uint8) public tokenIdToRows;

    constructor() ERC721("Doormat Rugs", "RUG") {}

    function mint(string memory word, uint8 rows) external payable {
        require(totalSupply() < MAX_SUPPLY, "Max supply reached");
        require(wordToTokenId[word] == 0, "Word already claimed");

        uint256 price = 0;
        if (rows > 1) {
            price = basePrice + extraRowFee * (rows - 1);
        }
        require(msg.value >= price, "Insufficient payment");

        uint256 tokenId = totalSupply() + 1;
        _safeMint(msg.sender, tokenId);

        wordToTokenId[word] = tokenId;
        tokenIdToWord[tokenId] = word;
        tokenIdToRows[tokenId] = rows;
    }

    function tokenWord(uint256 tokenId) external view returns (string memory) {
        return tokenIdToWord[tokenId];
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
```

---

## 🌍 Development Workflow

1. **Initialize Repo (Cursor-ready)**

   ```bash
   npx create-next-app rug-nft
   cd rug-nft
   npm install three @wagmi/core viem @rainbow-me/rainbowkit tailwindcss
   ```

2. **Frontend Pages**

   - `/` = Interactive homepage with doors (Three.js).
   - `/mint` = Rug generator + claim form.
   - `/status` = Word availability check.

3. **Backend Setup (Railway)**

   - `index.js` Express app.
   - Connects to Postgres via `pg`.
   - API routes as described above.

4. **Database Setup (Railway Postgres)**

   ```bash
   railway run psql
   CREATE TABLE claims (...);
   ```

5. **Smart Contract Deployment (Shape L2)**

   - Use **Hardhat** or **Foundry**.
   - Deploy contract to Shape L2 RPC.
   - Save `contractAddress` + ABI to `/contracts/RugNFT.json`.

6. **Frontend ↔ Contract Integration**

   - Use wagmi + viem hooks for minting.
   - Call `contract.mint(word, rows, { value })`.
   - Update DB after successful tx.

7. **Metadata + Rug Renderer**

   - Metadata URI points to dynamic API endpoint: `/api/metadata/:tokenId`.
   - That endpoint returns JSON with generator parameters (word, rows).
   - Rug rendering handled in-browser with your existing HTML/CSS generator.

---

## 🛠️ Deployment

- **Frontend** → push repo to GitHub, link to Vercel, set env vars (`NEXT_PUBLIC_CONTRACT_ADDRESS`, `NEXT_PUBLIC_RPC_URL`).
- **Backend** → deploy to Railway, link Postgres.
- **Smart Contract** → deploy via Hardhat/Foundry to Shape L2.

---

## 🔮 Future Extensions

- **Cross-chain minting (like Transient Labs)** → integrate TL-style router contract that lets users pay from any chain.
- **Secondary market royalties** → ERC2981.
- **Dynamic metadata** → Rugs update live with generator.
- **Multiple rug styles** → add generative backgrounds, patterns.

---

## ✅ Next Step

- Build the frontend + backend scaffolding first.
- Deploy contract last.
- Ensure DB + contract stay in sync with hybrid uniqueness check.


# Onchain Rugs

Generative on-chain rug NFTs: a Next.js application for minting, previewing, maintaining, and exploring rugs tied to EVM smart contracts, with server-side rendering helpers and marketplace-oriented APIs.

## Innovative features and resume highlights

Points below summarize what is relatively unusual or strong interview material in this codebase. Use them on a resume or portfolio only for parts you actually shipped or maintain.

### Distinctive technical choices

1. **On-chain-first generative NFTs** — Core product story avoids depending on IPFS for metadata and art delivery (see the in-app whitepaper). That differentiates the stack from the common “NFT + JSON on IPFS” pattern.
2. **Deterministic rendering across environments** — A minimal p5-compatible runtime (`rug-p5.js` under `public/data/` and `data/`) keeps rug output consistent in the **browser**, **export paths**, and **server-side** flows (for example Open Graph generation), instead of maintaining separate renderers that can drift.
3. **HTTP 402 / x402-style paid resources** — Integration with `@x402/core`, `@x402/evm`, `@x402/fetch`, and `@x402/paywall` for payment-required maintenance and API-style flows is still uncommon in production portfolios.
4. **Event-driven cache coherence** — `POST /api/webhooks/maintenance` updates **Redis / Vercel KV** when chain-relevant events occur, reducing reliance on long TTLs or batch-only refresh jobs.
5. **Dynamic social previews from generative UI** — **Puppeteer** drives headless rendering so share cards can reflect generated rug output, not only static assets.

### Strong supporting work (typical for senior web3 or full-stack roles)

- **Multi-chain** wallet stack: **wagmi**, **viem**, **RainbowKit** across **Base**, **Shape**, and **Ethereum** testnets (see `lib/networks.ts`).
- **Server-side Alchemy** usage: proxied NFT API (`/api/alchemy`) and RPC-backed **gas estimation** with the key kept off the client where possible.
- **Foundry**-oriented contracts with **OpenZeppelin** and common NFT libraries (for example **ERC721A**).
- **Next.js App Router** with a wide `app/api` surface for metadata, market helpers, maintenance, and diagnostics.

### Optional depth for interviews

- **ERC-8021 attribution** and the **`analytics/`** service (Express, PostgreSQL, Redis, chain-oriented jobs) if you own the full data path, not only the UI.
- **`standalone-ai-agent/`** when you can describe a concrete outcome (for example automated reads, signing, or integration with site APIs), not only repository structure.

### Example one-line resume bullet

Built an on-chain generative NFT system with a **deterministic cross-environment renderer** (browser and server), **Redis-backed metadata** with **webhook-driven invalidation**, **multi-chain** wallet integration, and **x402-style paid HTTP APIs** for maintenance flows; **Open Graph** images via **headless rendering**.

## Tech stack

### Application core

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 18+ |
| Framework | [Next.js](https://nextjs.org/) 16 (App Router), **webpack** build (`next dev/build --webpack`; Turbopack avoided for compatibility) |
| UI library | [React](https://react.dev/) 19 |
| Language | [TypeScript](https://www.typescriptlang.org/) 5 |
| Linting | ESLint 9 with `eslint-config-next` and `@typescript-eslint` |

### Styling and UI components

| Item | Role |
| --- | --- |
| [Tailwind CSS](https://tailwindcss.com/) 4 | Utility-first styling (`@tailwindcss/postcss`, PostCSS, Autoprefixer) |
| [Lightning CSS](https://lightningcss.dev/) | CSS tooling (postinstall check) |
| [Radix UI](https://www.radix-ui.com/) (`@radix-ui/react-tabs`) | Accessible tab primitives |
| [Framer Motion](https://www.framer.com/motion/) | Animation |
| [Lucide React](https://lucide.dev/) | Icons |

### Web3 and wallets

| Item | Role |
| --- | --- |
| [wagmi](https://wagmi.sh/) 2 | React hooks for Ethereum |
| [viem](https://viem.sh/) 2 | Typescript Ethereum library (clients, ABIs, utilities) |
| [RainbowKit](https://www.rainbowkit.com/) 2 | Connect-wallet UI |
| [WalletConnect](https://walletconnect.com/) | Via RainbowKit (`NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`) |
| Connectors | MetaMask, WalletConnect, injected wallets (`wagmi/connectors`) |

Networks and contract addresses are centralized in `lib/networks.ts` and related config. Supported chains include Ethereum Sepolia, Shape (Sepolia and mainnet), Base (Sepolia and mainnet), plus a configurable test network placeholder.

### Payments and agent flows (HTTP 402)

| Package | Role |
| --- | --- |
| `@x402/core`, `@x402/evm`, `@x402/fetch`, `@x402/paywall` | x402 V2-style payment requirements and paywall integration for paid resources (e.g. maintenance actions) |

Configuration uses env such as `X402_PAY_TO_ADDRESS`, `X402_NETWORK`, and `RPC_URL` (see `lib/x402.ts`).

### Data fetching and state on the client

| Item | Role |
| --- | --- |
| [@tanstack/react-query](https://tanstack.com/query) 5 | Server/async state |
| [SWR](https://swr.vercel.app/) | Additional fetch caching patterns |

### Visualization and 3D

| Item | Role |
| --- | --- |
| [Three.js](https://threejs.org/) | 3D rendering |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) | React renderer for Three.js |
| [@react-three/drei](https://github.com/pmndrs/drei) | Helpers (controls, loaders, etc.) |
| [Recharts](https://recharts.org/) | Charts |
| [date-fns](https://date-fns.org/) | Date formatting and manipulation |

### Generative art (rugs)

| Item | Role |
| --- | --- |
| [p5.js](https://p5js.org/) **1.11.10** | Loaded from `https://cdn.jsdelivr.net/npm/p5@1.11.10/lib/p5.min.js` in the generator UI |
| Custom `rug-p5.js` | Minimal p5-like runtime shipped under `public/data/` and `data/` for deterministic rug rendering and exports |

### Server-side and infrastructure (Next.js)

| Item | Role |
| --- | --- |
| [@upstash/redis](https://upstash.com/docs/redis/overall/getstarted) | Redis client |
| Vercel KV / Upstash REST | `KV_REST_API_URL`, `KV_REST_API_TOKEN` (see `lib/redis.ts`) for metadata and rug-market caching |
| [Puppeteer](https://pptr.dev/) | Headless Chrome for Open Graph / social preview image routes |
| [ethers](https://docs.ethers.org/) v6 | Used in API routes (e.g. gas estimation) alongside viem |
| [pino-pretty](https://github.com/pinojs/pino-pretty) | Log formatting where used |
| [@vercel/analytics](https://vercel.com/docs/analytics), [@vercel/speed-insights](https://vercel.com/docs/speed-insights) | Production analytics (see `app/layout.tsx`) |

### Smart contracts and Solidity tooling

| Item | Role |
| --- | --- |
| [Foundry](https://book.getfoundry.sh/) | `foundry.toml`: Solidity **0.8.27**, optimizer, `via_ir`, remappings |
| [OpenZeppelin Contracts](https://openzeppelin.com/contracts/) | Via `lib/openzeppelin-contracts` |
| Limit Break creator-token-contracts | Via `lib/creator-token-contracts` |
| [Solady](https://github.com/Vectorized/solady), [sstore2](https://github.com/0xsequence/sstore2), [ERC721A](https://github.com/chiru-labs/ERC721A) | Libraries under `lib/` |
| [forge-std](https://github.com/foundry-rs/forge-std) | Test and script utilities |

`package.json` also includes **Hardhat** 3 and **ethers** as dev dependencies for tooling or scripts that expect them; primary on-repo contract workflow is Foundry-oriented.

### Testing and asset tooling (development)

| Item | Role |
| --- | --- |
| [Jest](https://jestjs.io/) | Unit tests (`@types/jest`) |
| [canvas](https://github.com/Automattic/node-canvas) (Node) | Server-side canvas utilities where used |
| [jsdom](https://github.com/jsdom/jsdom) | DOM-like test environment |
| [gif-encoder](https://www.npmjs.com/package/gif-encoder) | GIF generation utilities |

### Auxiliary services in this repository

| Path | Stack |
| --- | --- |
| `analytics/` | Node.js, [Express](https://expressjs.com/), [PostgreSQL](https://www.postgresql.org/) (`pg`), [Redis](https://redis.io/), [ethers](https://docs.ethers.org/) v6, [Winston](https://github.com/winstonjs/winston), [node-cron](https://github.com/node-cron/node-cron), optional [Helmet](https://helmetjs.github.io/) / [CORS](https://github.com/expressjs/cors) |
| `standalone-ai-agent/` | Separate Node tooling that can talk to a local [Ollama](http://localhost:11434) instance and site APIs via env-driven base URLs; uses viem-style signing patterns for agent keys |

---

## External APIs and integrations

These are used or intended by the app and server routes (keys and URLs come from environment variables).

| Service | Usage |
| --- | --- |
| **Alchemy** | Server: `ALCHEMY_API_KEY` for proxied NFT endpoints (`/api/alchemy`) and RPC-backed gas estimation (`/api/gas-estimate`, ethers). Client: `NEXT_PUBLIC_ALCHEMY_API_KEY` for client-side gas estimation fallbacks in some flows. Network slugs align with `lib/networks.ts` (`eth-sepolia`, `base-sepolia`, `shape-sepolia`, etc.). |
| **JSON-RPC providers** | Per-chain HTTP RPCs (`NEXT_PUBLIC_*_RPC`, `RPC_URL`, `MULTICALL_ADDRESS` override). Defaults include public endpoints (e.g. `publicnode`, `sepolia.base.org`, Shape RPCs). |
| **Block explorer APIs** | URLs in `NetworkConfig` for Etherscan, Basescan, Shape explorers (`explorerApiUrl`) for verification or future indexer use. |
| **WalletConnect** | Relay and wallet pairing through RainbowKit (`NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`). |
| **Upstash / Vercel KV** | REST Redis for cached metadata, rug-market aggregation, and webhook-driven cache updates. |
| **Social / Open Graph** | Preview images generated by the app (Puppeteer); sharing may use `NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_APP_URL` (e.g. `https://www.onchainrugs.xyz` as fallback in code). |

Marketplace-related routes under `/api/marketplace/*` are structured for listings, offers, activity, and floor price; some responses are placeholders until wired to live marketplace data.

---

## First-party HTTP API surface (Next.js `app/api`)

High-level map of route groups (see each `route.ts` for methods and parameters).

| Area | Routes (examples) |
| --- | --- |
| Alchemy proxy | `GET /api/alchemy` |
| Collection and contract | `/api/collection`, `/api/contract` |
| Metadata cache | `/api/metadata/[id]` |
| Open Graph / images | `/api/og/rug`, `/api/rug-image/...` (token image, OG image, upload helper) |
| Rug analysis | `/api/rugs/analyze` |
| Holdings | `/api/user/nfts`, `/api/owner/rugs` |
| Rug market | `/api/rug-market/collection`, `.../stats`, `.../nft/[tokenId]`, buy/refresh/update |
| Marketplace (UI-oriented) | `/api/marketplace/listings/[address]`, `.../offers/...`, `.../activity`, `.../floor-price` |
| Maintenance + x402 | `/api/maintenance/quote/...`, `.../status/...`, `.../action/...` |
| Webhooks | `POST /api/webhooks/maintenance` |
| Gas | `POST /api/gas-estimate` |
| Agent | `/api/agent/stats` |
| Refresh jobs | `/api/refresh-metadata`, `/api/refresh-one` |
| Diagnostics | `/api/test-env`, `/api/test-redis`, `/api/test-rpc`, and similar test routes |

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js dev server (webpack) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run config-server` | Runs `config-server.js` (local config helper) |

---

## Environment variables (overview)

Configure deployment with the variables referenced across `lib/networks.ts`, `lib/redis.ts`, `lib/x402.ts`, `components/providers.tsx`, and API routes. Commonly needed names include:

- `NEXT_PUBLIC_*_RPC`, `NEXT_PUBLIC_*_CONTRACT`, `NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT`, `NEXT_PUBLIC_DEFAULT_CHAIN_ID`
- `ALCHEMY_API_KEY`, `NEXT_PUBLIC_ALCHEMY_API_KEY`
- `KV_REST_API_URL`, `KV_REST_API_TOKEN`
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`
- `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_APP_URL`
- `X402_PAY_TO_ADDRESS`, `X402_NETWORK`, `RPC_URL` (x402 / maintenance)
- Agent and indexer subprojects use their own `.env` patterns (`analytics/`, `standalone-ai-agent/`)

See each subdirectory and route for the exact set required for a given feature.

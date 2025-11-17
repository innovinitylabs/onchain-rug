Nice — I’ll give you a single, production-ready .md file you can drop into Cursor. It’s a complete implementation blueprint for Seasons + Clans + Chronicles + reliable Sale Recording + Platinum-Royalty Pooling that:
	•	is fully on-chain where it must be, and off-chain where it needs to be (indexer / adapters)
	•	explains exact storage additions, contract changes, events and callers (who triggers what and when)
	•	gives copy-pasteable Solidity snippets for LibRugStorage additions and concrete functions to add into the facets you already sent (RugNFTFacet, RugMaintenanceFacet, RugAgingFacet)
	•	explains how to handle marketplaces that don’t cooperate and a secure relayer + signed-report pattern so you can always record sale prices reliably
	•	shows the royalty pooling pattern for platinum holders using a gas-efficient cumulative-per-share dividend model (pull payments)
	•	lists edge cases, exploits and hardenings, testing checklist, and rollout plan

I kept the contract changes minimal and localized so you can add them fast. Paste the whole content below into a file named:

/Users/valipokkann/Developer/onchain_rugs_working/DESIGN_SEASONS_CLANS_CHRONICLES.md

— start of file —

OnchainRugs — Seasons · Clans · Chronicles · Sale Recording · Platinum Royalty Pool (Implementation Spec)

Author: assistant (for valipokkann)
Date: 2025-11-17

This document describes a complete, implementable design and code snippets to add Seasons, Clans, Chronicles, robust sale-price recording across marketplaces, and a platinum-holder royalty sharing pool to your diamond-based OnchainRugs project. It targets the codebase you provided (facets RugNFTFacet.sol, RugMaintenanceFacet.sol, RugAgingFacet.sol) and prescribes minimal, gas-conscious changes.

⸻

TL;DR (short executive summary)
	•	Seasons: deterministic global phases computed from block.number / SEASON_BLOCK_LENGTH. Each season modifies aging/dirt/maintenance economics. Implemented purely on-chain; effects applied at action-time (clean/restore/transfer) or visible via tokenURI.
	•	Clans: emergent behavioral tribes assigned by a scoring function computed after relevant actions; stored per token. No UI choice by user.
	•	Chronicles: small on-chain log (circular buffer) of human-readable short codes (e.g., 0x01 = cleaned during DustStorm); store compressed entry (32 bytes). Show last N entries in metadata via off-chain composition.
	•	Sale Recording: canonical recordSale(tokenId, buyer, price, marketplace, saleTx, signatures...) function + relayer approach, plus marketplace adapters (Seaport, Blur, LooksRare) for automatic reporting; fallback to indexer that watches marketplace contracts and calls recordSale.
	•	Royalty Pool for Platinum: use cumulative-per-share dividend pattern to distribute royalty deposits to platinum-frame owners equally; withdrawable by each holder (pull model). Add function notifyRoyaltyReceived(amount) to be called by your own marketplace or relayer when royalties hit your contract.
	•	Minimal UI & UX: show season name, current clan, last 3 chronicle lines; keep users from cognitive overload.
	•	Gas: store small arrays, compress chronicle entries, avoid iterating over platinum holders; use pull-payment model for royalty distribution.

⸻

Design goals / constraints
	1.	Must be fully feasible on EVM (no centralized off-chain trust required for core state).
	2.	Make feature work reliably even if arbitrary marketplaces ignore your special logic. Provide an external indexer + relayer pattern.
	3.	Avoid heavy on-chain loops (no for over all platinum holders). Use standard cumulative distribution model (magnified-per-share).
	4.	Minimal changes to artwork: visuals unchanged; metadata exposes additional state.
	5.	Keep UX simple: show season, clan, most recent chronicles.
	6.	Keep gas usage reasonable on common actions (mint, clean, transfer, restore). Chronicle writes are small and bounded.

⸻

Table of contents
	1.	Storage changes (LibRugStorage)
	2.	Events (new)
	3.	Seasons — rules, on-chain functions, sample YAML-like season table
	4.	Clans — scoring function, triggers, migration rules
	5.	Chronicles — structure, compression, writing rules, read path
	6.	Sale recording — market adapters, relayer + signed-report pattern, recordSale(...) function, oracle/indexer recommendations
	7.	Platinum royalty pool — deposit mechanics, cumulative-per-share accounting, claims
	8.	Changes to your facets — exact patches & where to insert code (RugNFTFacet, RugMaintenanceFacet, RugAgingFacet)
	9.	UX & metadata changes (tokenURI)
	10.	Anti-abuse, security, edge cases & mitigations
	11.	Gas-cost reasoning & optimisations
	12.	Testing checklist & rollout plan
	13.	Appendix: full code snippets (Lib additions, facet functions, helpers)

⸻

1) Storage additions (LibRugStorage)

Goal: add compact fields for seasons/clans/chronicles, sale-recording, platinum pool accounting. These go into your LibRugStorage (you told me your project uses it). Add the following carefully.

// In LibRugStorage.sol — add to RugConfig / AgingData / a new global struct

// Global config additions
uint256 constant SEASON_BLOCK_LENGTH = 200000; // ~30 days (adjustable)
uint256 constant CHRONICLE_BUFFER_SIZE = 16;   // last 16 entries stored on-chain

struct SeasonConfig {
    // define numeric multipliers or flags per season index; you can keep a small on-chain LUT or compute by formula
    // leave room to keep some config on-chain; for simpler initial implementation, compute season index and use switch-case
    // no storage necessary here in first pass
}

// Per-token additions (extend your RugData or AgingData)
struct ChronEntry {
    bytes32 hashOrCode;    // compressed event code + block number hash (store as 32 bytes)
    uint32 ts;             // timestamp truncated to 32-bit (fits until year ~2106)
    // 32 + 4 = 36 => will be packed into storage struct; consider using bytes32 only to save writes
}

struct OnchainRugExtras {
    uint8 clan;                // enum index for clan (0 = None, 1 = Guardian, 2 = Nomad, etc.)
    uint8 seasonAtLastAction;  // season index % 256 when last action occurred (helps compute delta)
    uint8 chronWriteCursor;    // ring buffer cursor 0..CHRONICLE_BUFFER_SIZE-1
    bytes32[CHRONICLE_BUFFER_SIZE] chronicles; // compressed 32-byte entries (best: 32-byte compact)
    uint256 lastRecordedSalePrice; // last sale price recognized on-chain
    address lastBuyer;             // last buyer recorded
    uint256 lastSaleBlock;         // block number of last recorded sale
    // Platinum royalty accounting: cumulative-per-share model
    uint256 platinumSharesTotal;   // total active platinum shares (increment when someone becomes platinum)
    uint256 magnifiedRoyaltyPerShare; // scaled by MAGNITUDE
    mapping(address => uint256) magnifiedRoyaltyCorrections; // per-account correction
    mapping(address => uint256) withdrawnRoyalties;         // per-account withdrawn amount
    // [Note: mapping inside struct is ok in solidity, but LibRugStorage must expose helpers]
}

Important notes:
	•	Because your repo uses LibRugStorage.rugStorage().agingData[tokenId] etc., you should extend the central storage struct to include these new fields in a compact way.
	•	Use bytes32[16] chronicles to avoid dynamic arrays and extra gas unpredictability.
	•	For per-account royalty corrections and withdrawals, store them in top-level mappings in LibRugStorage (not inside token struct) for gas clarity:

mapping(address => uint256) public magnifiedRoyaltyCorrections;
mapping(address => uint256) public withdrawnRoyalties;
uint256 public platinumSharesTotal;
uint256 public magnifiedRoyaltyPerShare;
uint256 constant MAGNITUDE = 2**128;
mapping(uint256 => bool) public tokenIsPlatinum; // per-token platinum boolean or check via frameLevel
mapping(uint256 => address) public tokenOwnerSnapshot; // optional: snapshot owner at platinum entry


	•	If platinum status is per-token (frameLevel >= PLATINUM_LEVEL), treat each platinum token as 1 share. If you want per-owner rather than per-token, change accordingly. I recommend per-token equal shares: each platinum token = 1 share.

⸻

2) Events (new)

Add these events to your facets:

event SeasonChanged(uint256 indexed seasonIndex, string seasonName);
event ClanChanged(uint256 indexed tokenId, uint8 previousClan, uint8 newClan);
event ChronicleAppended(uint256 indexed tokenId, bytes32 entry, uint32 timestamp);
event SaleRecorded(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price, address marketplace, uint256 blockNumber);
event RoyaltyDeposited(address indexed from, uint256 amount);
event RoyaltyWithdrawn(address indexed holder, uint256 amount);

You already have good events for minting etc. These are crucial for off-chain indexers.

⸻

3) Seasons — on-chain rules, how/when they trigger

Computation

function currentSeasonIndex() public view returns (uint256) {
    return block.number / LibRugStorage.SEASON_BLOCK_LENGTH;
}

Why block-number based: deterministic and doesn’t need oracles. You already use block.timestamp for aging — seasons are compatible with block-based timing. Use block number to avoid timezone ambiguity.

Season effects are applied at action-time, not by a cron job. Example actions that can be affected:
	•	cleanRug, restoreRug, masterRestoreRug — compute effect before applying cost.
	•	transfer — affect clan scoring or create seasonal chronicle entry.
	•	mintRug — initial season snapshot.

Example Season Table (initial)
	•	0: "Neap" — neutral
	•	1: "DustStorm" — dirt multiplier x2, age multiplier x1.5
	•	2: "Monsoon" — cleaningCost -50%, dirt slower x0.5
	•	3: "Eclipse" — aging frozen for its duration
	•	4: "Festival" — maintenance gives bonus chronicle and small maintenanceScore bonus

You can implement season logic either in code switch-case inside RugMaintenanceFacet and RugAgingFacet or store a small on-chain LUT (array of structs) if you want dynamic configurability.

When to apply season-based modifications
	•	Actions triggered by user/agent (clean, restore, transfer, mint) must compute uint256 season = currentSeasonIndex(); and then apply season’s multipliers to cost/dirt/aging adjustments and write a chronicle entry about the action and the season.

Edge case: action at exact boundary
	•	If action happens during block k where season flips, compute season using currentSeasonIndex() (block number division). Treat that season as action-season. Document this in UI.

Implementation tip: Expose one helper in RugAgingFacet:

function _applySeasonModifiers(uint256 tokenId, uint256 baseCost) internal view returns (uint256 adjustedCost, bytes32 seasonCode)


⸻

4) Clans — scoring function, triggers, migration

Philosophy: Clans are emergent — derived from behavior over a recent sliding window (e.g., last 30 days/ CLAN_WINDOW_BLOCKS). The contract must not store full history — instead derive from counters tracked in AgingData & token fields.

Representative clan enum

enum Clan {
  None,
  Guardian,
  Nomad,
  Restorer,
  Purist,
  Lazy,
  Pilgrim
}

Scoring inputs (all available on-chain or computed on action):
	•	cleaningCount (total or in window)
	•	restorationCount
	•	transferCount or lastSaleBlock delta
	•	timeHeld (block difference since last transfer)
	•	maintenanceScore (you already compute this)

Implementation approach (cheap):
	•	After each significant action (clean, restore, transfer, masterRestore), run recomputeClan(tokenId):

function recomputeClan(uint256 tokenId) internal {
    // read counts and recent timestamps from agingData
    // compute simple heuristics:
    // if maintenanceScore high && cleaningCount recent -> Guardian
    // else if transferCount recent > X -> Nomad
    // else if restorationCount / actions > threshold -> Restorer
    // else if restorationCount == 0 && timeHeldLarge -> Purist
    // else if timeSinceLastClean > bigThreshold -> Lazy
    // else if holdDuration > hugeThreshold -> Pilgrim
    // store new clan and emit ClanChanged if changed
}

Why recompute on action only: avoids expensive per-block processing.

Edge cases & mitigations
	•	Users can self-transfer between owned addresses to simulate transferCount — mitigate by counting transfers only where from != to and optionally ignore transfers where both addresses are controlled by same EOA cluster (off-chain relayer can detect). On-chain perfect detection of same-owner wallets is impossible; treat this as acceptable noise or limit transfers counted to those where salePrice > 0 or where recordSale is present (marketplace sale). That creates more honest clan detection.

Persistence & migration
	•	Store clan (uint8) in token extras. When a token’s frame level crosses Platinum, optionally enforce clan = Guardian (design choice).

⸻

5) Chronicles — logbook for each rug

Purpose: small compressed human-readable life events that are append-only and bounded.

Design
	•	Keep a bytes32[16] chronicles circular buffer per token.
	•	Each chronicle entry is a compact encoded 32-byte value that contains:
	•	1 byte eventType (e.g., 0x01 = Cleaned, 0x02 = Restored, 0x03 = Seasonal Event, 0x04 = Clan Change, 0x05 = Sale Recorded, etc.)
	•	4 bytes blockNumber or truncated timestamp (or both)
	•	1 byte seasonIndexLow (if useful)
	•	26 bytes extra compressed data (e.g., small flags, masked price bucket index, user-code)
	•	Simpler approach: store keccak256(abi.encodePacked(codeString)) in bytes32 and keep an indexing map off-chain to render the actual text (cheaper than storing full text). But for simplicity we will store bytes32 which you can decode off-chain.

Write rules
	•	Append a chronicle entry in _performClean, _performRestore, _performMasterRestore, in _beforeTokenTransfer (on transfer only if recordSale exists or transfer is not mint/burn), and inside recordSale when sale price recorded.
	•	Each append updates chronWriteCursor = (chronWriteCursor + 1) % CHRONICLE_BUFFER_SIZE.

Event: emit ChronicleAppended(tokenId, entry, uint32(block.timestamp)).

Off-chain rendering: subgraph / indexer translates bytes32 codes into human text for displays. For convenience, include in your repo a mapping of codes -> strings used by the UI.

⸻

6) Sale recording — the hard nut (marketplace diversity)

Problem

Many marketplaces do not call collection-specific hooks on sale; transfers alone do not reliably carry sale price. Marketplaces have different contract stacks (Seaport, Wyvern, Blur matchers, LooksRare, Rarible). You must either integrate with each marketplace (hard) or use a hybrid pattern:

Pattern we use (recommended)
	1.	On-chain canonical path
	•	Add function recordSale(uint256 tokenId, address buyer, address seller, uint256 price, address marketplace, bytes calldata marketplaceProof) external;
	•	This function accepts either:
	•	direct call from a marketplace contract (marketplace address in an allowlist), OR
	•	a call by a relayer that includes a pair of ECDSA signatures from buyer and seller over {tokenId, price, marketplace, saleTxHash, nonce} — contract verifies both signatures and accepts the report.
	2.	Off-chain indexer/adapter layer
	•	Write small adapters that watch marketplace contracts (Seaport/Blur/LooksRare/Wyvern). On OrderFulfilled/OrdersMatched/protocol-specific event, adapter decodes event, extracts effective price, buyer, seller, and calls recordSale(...) on your contract either directly or via relayer.
	•	Adapters can be open-sourced and run by you or the community.
	3.	Fallback detection
	•	If a transfer occurs without sale reporting, your indexer will attempt to decode txReceipt of the transfer; many marketplaces have internal transfers and logs that reveal price. If decoding fails, leave lastRecordedSalePrice 0; certain clan logic (Nomad) should be tolerant.

Security for recordSale
	•	Marketplace allowlist: include trusted marketplace contract addresses that may call recordSale directly (gas-efficient path). Example: Seaport contract, LooksRare aggregator, Blur contract addresses. (You will need to populate addresses per chain/network.)
	•	Signed-report fallback: require both buyer and seller signatures (off-chain ECDSA) so a malicious relayer can’t invent prices. Message structure idea:

bytes32 message = keccak256(abi.encodePacked(address(this), tokenId, buyer, seller, price, marketplace, saleTxHash, nonce));
(recover from signature) == buyer && (recover from signature) == seller

	•	Nonce per saleTxHash to prevent replay. Use mapping(bytes32 => bool) saleReported[saleTxHash] to prevent duplicate reports.

Advantages
	•	Works even if marketplaces don’t call you.
	•	Prevents fake prices (both parties sign).
	•	Allows community-run indexers to submit reliable sale data.

Disadvantages
	•	Requires buyer and seller cooperation for signed-report path. But since most marketplace purchases are atomic, the off-chain adapter can produce buyer signature rarely (buyer not interacting). The practical approach: adapters will be the primary reporters. For manual p2p sales, you can require both signatures.

Implementation snippet for recordSale:

function recordSaleByMarketplace(
    uint256 tokenId,
    address buyer,
    address seller,
    uint256 price,
    address marketplace,
    bytes calldata marketplaceProof
) external {
    // only allowed if msg.sender is trusted marketplace address OR adapter owner with proof
    require(isMarketplaceAllowed[msg.sender], "marketplace not allowed");
    _applySale(tokenId, buyer, seller, price, marketplace);
}

function recordSaleSigned(
    uint256 tokenId,
    address buyer,
    address seller,
    uint256 price,
    address marketplace,
    bytes32 saleTxHash,
    uint256 nonce,
    bytes calldata buyerSig,
    bytes calldata sellerSig
) external {
    bytes32 message = keccak256(abi.encodePacked(address(this), tokenId, buyer, seller, price, marketplace, saleTxHash, nonce));
    require(!saleReported[saleTxHash], "already reported");
    require(_recoverSigner(message, buyerSig) == buyer, "buyer signature invalid");
    require(_recoverSigner(message, sellerSig) == seller, "seller signature invalid");
    saleReported[saleTxHash] = true;
    _applySale(tokenId, buyer, seller, price, marketplace);
}

_applySale does:
	•	write lastRecordedSalePrice
	•	update recentSalePrices ring buffer (you already have recentSalePrices: [uint256,0,0])
	•	update lastBuyer and lastSaleBlock
	•	append Chronicle entry “SaleRecorded price=… (compressed)”
	•	emit SaleRecorded

Which transactions trigger recordSale
	•	Marketplace adapter calls (immediately after sale tx is mined)
	•	Relayer calling recordSaleSigned after fetching buyer/seller signatures (rare)
	•	Your own marketplace contract when it executes sale: call recordSaleByMarketplace internally

Adapter list (must implement)
	•	Seaport: decode OrderFulfilled or OrdersMatched events and compute consideration value. Seaport emits OrderFulfilled(...) with consideration list — sum ETH / ERC20 in consideration for recipient equals price. (See Seaport docs; decode structures.)
	•	Blur: monitor Blur contracts (Blend / Match) events (they expose sale events).
	•	LooksRare: decode match events and calculate price.
	•	Rarible/OpenSea legacy: decode atomicMatch or atomicMatch_ internal logic. (Legacy Wyvern variants)

Note: decoding is best done off-chain with known ABIs. For reliability, create a simple Node.js adapter for each marketplace that calls recordSaleByMarketplace on detection.

⸻

7) Platinum royalty pool — cumulative-per-share dividend model

Requirement: when royalty revenue (the portion you want to share) enters your project, it should be distributed to current platinum token holders fairly and gas-efficiently.

Pattern: maintain magnifiedRoyaltyPerShare and per-account corrections. This is a standard approach used in dividend tokens / reflection.

Key variables (global in LibRugStorage)

uint256 public platinumSharesTotal; // number of platinum tokens (each token = 1 share)
uint256 public magnifiedRoyaltyPerShare; // scaled by MAGNITUDE
uint256 constant MAGNITUDE = 2**128;
mapping(address => uint256) public magnifiedRoyaltyCorrections; // per-holder correction
mapping(address => uint256) public withdrawnRoyalties; // per-holder withdrawn amount
mapping(uint256 => bool) public tokenIsPlatinum; // per-token boolean
mapping(uint256 => address) public ownerOfToken; // available via ownerOf()

Deposit path
	•	When your marketplace or royalty router receives royalty (native ETH or WETH), call distributeRoyalties() on the contract with msg.value or amount parameter. Implementation:

function distributeRoyalties() external payable {
    require(msg.value > 0, "no amount");
    uint256 amount = msg.value;
    if (platinumSharesTotal == 0) {
        // store in dormant pool or forward to project beneficiary
        retainedRoyalties += amount;
        emit RoyaltyDeposited(msg.sender, amount);
        return;
    }
    magnifiedRoyaltyPerShare += (amount * MAGNITUDE) / platinumSharesTotal;
    emit RoyaltyDeposited(msg.sender, amount);
}

Per-owner claimable calculation
	•	For owner account, compute:

function withdrawableRoyaltyOf(address account) public view returns (uint256) {
    uint256 holderShares = countPlatinumTokensOwned(account); // number of platinum tokens they own
    uint256 magnified = magnifiedRoyaltyPerShare * holderShares;
    uint256 corrected = magnified + magnifiedRoyaltyCorrections[account];
    return (corrected / MAGNITUDE) - withdrawnRoyalties[account];
}

Handling transfers — adjust magnifiedRoyaltyCorrections on token transfer to keep accounting correct:
	•	When a token becomes platinum (frameLevel crosses threshold), call _increasePlatinumForAccount(owner, tokenId) which increments platinumSharesTotal and sets tokenIsPlatinum[tokenId] = true; and also updates owner’s magnifiedRoyaltyCorrections[owner] -= magnifiedRoyaltyPerShare;
	•	When a platinum token is transferred, call _transferPlatinumToken(from, to, tokenId):

function _onPlatinumTransfer(address from, address to) internal {
    // adjust corrections so that previous owner doesn't keep future distributions
    magnifiedRoyaltyCorrections[from] += magnifiedRoyaltyPerShare;
    magnifiedRoyaltyCorrections[to] -= magnifiedRoyaltyPerShare;
}

Claim
	•	function claimRoyalties() allows msg.sender to withdraw withdrawable amount; sends ETH (or WETH) and updates withdrawnRoyalties[account].

Edge cases
	•	If platinumSharesTotal changes between distributions, the magnified model preserves correctness.
	•	Avoid iterating over accounts.

Gas tip: counting holderShares requires knowing how many platinum tokens an address owns. Use an index mapping ownerPlatinumCount[address] that gets incremented / decremented when tokens change platinum status or are transferred.

⸻

8) Changes / Patches to your facets

Below I list precise edits and code snippets to add. These are designed to be non-invasive.

8.1 LibRugStorage.sol — Additions

Add the new global constants, mappings and fields described in section 1. Provide helper functions like isPlatinumFrame(frameLevel).

(I didn’t receive your LibRugStorage file contents, so paste the exact struct additions and helpers into the file where storage types are defined.)

Suggested code to paste into LibRugStorage (adapt to file layout):

// top of file additions
uint256 constant SEASON_BLOCK_LENGTH = 200000;
uint8 constant PLATINUM_FRAME_LEVEL = 4; // adapt to your frame numbering
uint256 constant MAGNITUDE = 2**128;
uint256 constant CHRONICLE_BUFFER_SIZE = 16;

// in RugConfig or top-level storage struct
uint256 platinumSharesTotal;
uint256 magnifiedRoyaltyPerShare;
mapping(address => uint256) magnifiedRoyaltyCorrections;
mapping(address => uint256) withdrawnRoyalties;
mapping(uint256 => bool) tokenIsPlatinum;
mapping(address => uint256) ownerPlatinumCount;
mapping(bytes32 => bool) saleReported; // saleTxHash => bool

// extend AgingData or create PerTokenExtras
struct RugExtras {
    uint8 clan;
    uint8 chronCursor;
    bytes32[CHRONICLE_BUFFER_SIZE] chronicles;
    uint256 lastRecordedSalePrice;
    address lastBuyer;
    uint256 lastSaleBlock;
}
mapping(uint256 => RugExtras) rugExtras;

Add helper function prototypes you will call from facets:

function isPlatinumFrame(uint8 frameLevel) internal pure returns (bool) {
    return frameLevel >= PLATINUM_FRAME_LEVEL;
}


⸻

8.2 RugMaintenanceFacet.sol changes

Where: inside _performClean, _performRestore, _performMasterRestore append chronicle entry and call recomputeClan(tokenId).

Add chronicle write helper:

function _appendChronicle(uint256 tokenId, bytes32 code) internal {
    LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
    LibRugStorage.RugExtras storage e = rs.rugExtras[tokenId];
    e.chronCursor = uint8((e.chronCursor + 1) % CHRONICLE_BUFFER_SIZE);
    e.chronicles[e.chronCursor] = code;
    emit ChronicleAppended(tokenId, code, uint32(block.timestamp));
}

Callpoints:
	•	At end of _performClean before returning, do:

bytes32 code = keccak256(abi.encodePacked("CLEAN", currentSeasonIndex(), block.number));
_appendChronicle(tokenId, code);
recomputeClan(tokenId);


	•	In _performRestore and _performMasterRestore similar codes "REST", "MASTER".

Notes:
	•	Keep codes 32-byte hashed values so they are human-readable off-chain but cheap on-chain.

⸻

8.3 RugNFTFacet.sol and transfer hooks

Where: _beforeTokenTransfer — on transfers, call sale-related logic and clan recomputation.
	1.	Transfer behavior:
	•	If from != address(0) && to != address(0) && from != to, then:
	•	do not assume sale price present. Instead:
	•	Append a chronicle entry "TRANSFER" with season index.
	•	Call recomputeClan(tokenId).
	•	If there is a lastRecordedSalePrice recently written (via recordSale), update recentSalePrices as needed or leave unchanged.
	2.	Marketplace transfer path: you already have marketplaceTransfer. Modify it to optionally accept marketplaceSaleData or to be called by your marketplace only. But don’t rely on third-party marketplaces.
	3.	Add recordSale functions: Add both recordSaleByMarketplace (allowlist) and recordSaleSigned (signed buyer+seller). See the code sample in section 6.
	4.	_applySale function (internal):

function _applySale(uint256 tokenId, address buyer, address seller, uint256 price, address marketplace) internal {
    LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
    LibRugStorage.RugExtras storage e = rs.rugExtras[tokenId];

    // update buffer of recentSalePrices stored in agingData
    LibRugStorage.AgingData storage aging = rs.agingData[tokenId];
    // rotate recentSalePrices (existing array [3])
    aging.recentSalePrices[0] = price;
    aging.recentSalePrices[1] = aging.lastSalePrice;
    aging.recentSalePrices[2] = aging.recentSalePrices[1]; // simple shift or implement properly

    aging.lastSalePrice = price;
    e.lastRecordedSalePrice = price;
    e.lastBuyer = buyer;
    e.lastSaleBlock = block.number;

    // append chronicle
    bytes32 code = keccak256(abi.encodePacked("SALE", price, marketplace, block.number));
    _appendChronicle(tokenId, code);

    emit SaleRecorded(tokenId, buyer, seller, price, marketplace, block.number);
}

(You should implement recentSalePrices properly as a ring.)

Important: Keep recordSale gas-light. The heavy decoding belongs to adapters.

⸻

8.4 Add recomputeClan helper function (can live in RugAgingFacet or an independent Facet)

Suggested placement: RugAgingFacet because its domain is aging/dirt/frames and you already compute maintenanceScore there.

function recomputeClan(uint256 tokenId) public {
    LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
    LibRugStorage.AgingData storage aging = rs.agingData[tokenId];
    LibRugStorage.RugExtras storage extras = rs.rugExtras[tokenId];

    uint8 previous = extras.clan;
    uint8 newClan = 0;

    uint256 maintenanceScore = LibRugStorage.calculateMaintenanceScore(aging);
    uint256 cleans = aging.cleaningCount;
    uint256 restores = aging.restorationCount;
    uint256 timeHeld = block.timestamp - aging.lastCleaned; // crude proxy; refine if you track lastTransfer
    uint256 transfersRecent = (aging.lastSaleBlock > 0 && block.number - aging.lastSaleBlock < 200000) ? 1 : 0; // crude

    // heuristic ranking
    if (maintenanceScore >= 800 && cleans >= 3) {
        newClan = 1; // Guardian
    } else if (transfersRecent > 0 && transfersRecent >= 1 && cleans < 2) {
        newClan = 2; // Nomad
    } else if (restores >= 2) {
        newClan = 3; // Restorer
    } else if (restores == 0 && timeHeld > 200 days) {
        newClan = 4; // Purist
    } else if (timeHeld > 90 days && cleans == 0) {
        newClan = 5; // Lazy
    } else if (timeHeld > 180 days) {
        newClan = 6; // Pilgrim
    } else {
        newClan = 0;
    }

    if (previous != newClan) {
        extras.clan = newClan;
        emit ClanChanged(tokenId, previous, newClan);
        // append chronicle describing clan change
        bytes32 code = keccak256(abi.encodePacked("CLAN", previous, newClan, block.number));
        _appendChronicle(tokenId, code);
    }
}

Note: refine thresholds and scoring to your needs — keep them conservative to prevent spam migration.

⸻

9) UX & metadata (tokenURI)

Update tokenURI to add three new attributes for front-end simplicity:
	•	"season":"DustStorm" (name derived from currentSeasonIndex())
	•	"clan":"Guardian"
	•	"chronicles":[<last three decoded strings or code hashes>]

Implementation: in tokenURI (RugNFTFacet) before building JSON, fetch extras:

LibRugStorage.RugExtras memory extras = rs.rugExtras[tokenId];
string memory clanName = LibRugStorage.getClanName(extras.clan);
string memory seasonName = LibRugStorage.getSeasonName(currentSeasonIndex());

Use the last 3 chronicle bytes32 entries; include them as code strings (prefer off-chain translation).

⸻

10) Anti-abuse & hardenings
	•	Spam cleaning to game Guardian clan: impose a rate limit in _performClean (e.g., minimum blocks between cleans > CLEAN_MIN_INTERVAL) to stop micro-clean spam. Use cleaningCount and lastCleaned.
	•	Fake sales: require signed reports or known marketplace allowlist to prevent fake sale price injection.
	•	Chronicle bloating: circular buffer size fixed to 16.
	•	Platinum churn attack: token owners may flip frames to game platinum shares; ensure platinum status is derived from frame and frameAchievedTime and require frameHeldMinimumBlocks for platinum with benefits (e.g., must hold platinum for at least N blocks before eligible for that distribution).
	•	Re-entrancy / ETH transfers: guard royalty withdrawal functions with nonReentrant.
	•	Overflow & Magnitude: chosen MAGNITUDE = 2**128 to avoid precision issues with large numbers. Use SafeMath (sol 0.8 has builtin).

⸻

11) Gas-cost reasoning & optimizations
	•	Chronicle writes: 32-byte writes, ring buffer avoids dynamic array costs. Expect ~20k-40k gas per chronicle append (write to one storage slot + emit).
	•	recordSale: minimize storage writes; prefer single write to lastRecordedSalePrice + emit. Avoid iterating recentSalePrices; use fixed 3-slot rotation if needed.
	•	platinum royalty deposit: only writes to magnifiedRoyaltyPerShare (on deposit) — O(1). Withdrawals are per-holder and only write for that holder.
	•	recomputeClan: only called after user-triggered actions — O(1) reads & conditional writes.
	•	Transfer path: ensure _beforeTokenTransfer small overhead; append chronicle only on real transfers not on mint/burn.
	•	If gas is tight, you can move chronicle emission to off-chain (indexer reconstructing events), but on-chain chronicle is more robust.

⸻

12) Testing checklist & rollout plan

Unit tests
	•	Add tests for:
	•	Season boundaries: action at boundary uses correct season index.
	•	Clan migration: simulate sequences of actions and validate clan state transitions.
	•	Chronicle buffer rotation: append > CHRONICLE_BUFFER_SIZE items and ensure oldest overwritten.
	•	recordSaleByMarketplace and recordSaleSigned: signature verification and saleReported guard.
	•	Platinum royalty deposit/distribution: distribute multiple deposits, ensure withdrawable calculations are correct when platinum shares change.
	•	Transfer & platinum token transfer adjustment: test magnified corrections when transfer occurs between owners.

Integration tests
	•	Run adapter simulate event from Seaport — adapter calls recordSaleByMarketplace — check chronicle & recentSalePrices updated.
	•	Marketplace fallback: transfer without recordSale — indexer decodes tx and calls signed-report or uses marketplace proof.

Deployment rollout
	1.	Add storage changes via an upgradeable diamond upgrade patch (maintain storage layout). Deploy to testnet.
	2.	Deploy adapters for Seaport / Blur / LooksRare to indexer infrastructure.
	3.	Run tests & staging with your own marketplace doing internal recordSale calls.
	4.	Announce to community the change and provide adapter code so other indexers can run it.
	5.	Launch on mainnet once stable.

⸻

13) Appendix — full code snippets (ready to paste)

13.1 LibRugStorage additions (paste near your storage struct definitions)

// constants
uint256 constant SEASON_BLOCK_LENGTH = 200000;
uint8 constant PLATINUM_FRAME_LEVEL = 4; // adapt to your numeric frame level
uint256 constant MAGNITUDE = 2**128;
uint8 constant CHRONICLE_BUFFER_SIZE = 16;

// in your main RugConfig or Lib storage root
uint256 public platinumSharesTotal;
uint256 public magnifiedRoyaltyPerShare;
mapping(address => uint256) public magnifiedRoyaltyCorrections;
mapping(address => uint256) public withdrawnRoyalties;
mapping(uint256 => bool) public tokenIsPlatinum;
mapping(address => uint256) public ownerPlatinumCount;
mapping(bytes32 => bool) public saleReported;

// per-token extras
struct RugExtras {
    uint8 clan;
    uint8 chronCursor;
    bytes32[CHRONICLE_BUFFER_SIZE] chronicles;
    uint256 lastRecordedSalePrice;
    address lastBuyer;
    uint256 lastSaleBlock;
}

mapping(uint256 => RugExtras) public rugExtras;

Add helpers:

function isPlatinumFrame(uint8 frameLevel) internal pure returns (bool) {
    return frameLevel >= PLATINUM_FRAME_LEVEL;
}

function currentSeasonIndex() internal view returns (uint256) {
    return block.number / SEASON_BLOCK_LENGTH;
}

function getSeasonName(uint256 seasonIdx) internal pure returns (string memory) {
    // small switch or map for known seasons
    if (seasonIdx % 5 == 0) return "Neap";
    if (seasonIdx % 5 == 1) return "DustStorm";
    if (seasonIdx % 5 == 2) return "Monsoon";
    if (seasonIdx % 5 == 3) return "Eclipse";
    return "Festival";
}

function getClanName(uint8 clanId) internal pure returns (string memory) {
    if (clanId == 1) return "Guardian";
    if (clanId == 2) return "Nomad";
    if (clanId == 3) return "Restorer";
    if (clanId == 4) return "Purist";
    if (clanId == 5) return "Lazy";
    if (clanId == 6) return "Pilgrim";
    return "None";
}

13.2 RugMaintenanceFacet — chronicle helper & calls

Paste inside RugMaintenanceFacet:

function _appendChronicle(uint256 tokenId, bytes32 code) internal {
    LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
    LibRugStorage.RugExtras storage e = rs.rugExtras[tokenId];
    e.chronCursor = uint8((e.chronCursor + 1) % CHRONICLE_BUFFER_SIZE);
    e.chronicles[e.chronCursor] = code;
    emit ChronicleAppended(tokenId, code, uint32(block.timestamp));
}

And at end of _performClean before return:

uint256 season = LibRugStorage.currentSeasonIndex();
bytes32 chrono = keccak256(abi.encodePacked("CLEAN", tokenId, season, block.number));
_appendChronicle(tokenId, chrono);

Add similar lines to _performRestore and _performMasterRestore. Also call recomputeClan(tokenId); after append.

13.3 RugNFTFacet — recordSale functions & _applySale

Add these near other marketplace functions:

mapping(address => bool) public isMarketplaceAllowed;

// owner only management function
function setMarketplaceAllowed(address m, bool allowed) external {
    LibDiamond.enforceIsContractOwner();
    isMarketplaceAllowed[m] = allowed;
}

// marketplace direct report
function recordSaleByMarketplace(
    uint256 tokenId,
    address buyer,
    address seller,
    uint256 price,
    address marketplace
) external {
    require(isMarketplaceAllowed[msg.sender], "not allowed marketplace");
    _applySale(tokenId, buyer, seller, price, marketplace);
}

// signed-report fallback
mapping(bytes32 => bool) public saleReported; // add in Lib or here

function recordSaleSigned(
    uint256 tokenId,
    address buyer,
    address seller,
    uint256 price,
    address marketplace,
    bytes32 saleTxHash,
    uint256 nonce,
    bytes calldata buyerSig,
    bytes calldata sellerSig
) external {
    require(!saleReported[saleTxHash], "sale reported");
    bytes32 message = keccak256(abi.encodePacked(address(this), tokenId, buyer, seller, price, marketplace, saleTxHash, nonce));
    require(_recoverSigner(message, buyerSig) == buyer, "buyer sig invalid");
    require(_recoverSigner(message, sellerSig) == seller, "seller sig invalid");
    saleReported[saleTxHash] = true;
    _applySale(tokenId, buyer, seller, price, marketplace);
}

function _applySale(uint256 tokenId, address buyer, address seller, uint256 price, address marketplace) internal {
    LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
    LibRugStorage.RugExtras storage e = rs.rugExtras[tokenId];
    LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

    // rotate recentSalePrices (simple shift — adjust per your array)
    aging.recentSalePrices[2] = aging.recentSalePrices[1];
    aging.recentSalePrices[1] = aging.recentSalePrices[0];
    aging.recentSalePrices[0] = price;

    aging.lastSalePrice = price;
    e.lastRecordedSalePrice = price;
    e.lastBuyer = buyer;
    e.lastSaleBlock = block.number;

    bytes32 chrono = keccak256(abi.encodePacked("SALE", tokenId, price, marketplace, block.number));
    _appendChronicle(tokenId, chrono);

    emit SaleRecorded(tokenId, buyer, seller, price, marketplace, block.number);
}

function _recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address) {
    bytes32 ethSigned = ECDSA.toEthSignedMessageHash(message);
    return ECDSA.recover(ethSigned, sig);
}

Note: import ECDSA from OpenZeppelin at top.

13.4 Platinum royalty functions

Add to an appropriate facet (e.g., RugNFTFacet or new RoyaltyFacet):

function distributeRoyalties() external payable {
    require(msg.value > 0, "No royalty");
    LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
    uint256 totalShares = rs.platinumSharesTotal;
    if (totalShares == 0) {
        // keep retained royalties (or send to feeRecipient)
        rs.retainedRoyalties += msg.value;
        emit RoyaltyDeposited(msg.sender, msg.value);
        return;
    }
    rs.magnifiedRoyaltyPerShare += (msg.value * LibRugStorage.MAGNITUDE) / totalShares;
    emit RoyaltyDeposited(msg.sender, msg.value);
}

function withdrawRoyalties() external nonReentrant {
    LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
    uint256 withdrawable = withdrawableRoyaltyOf(msg.sender);
    require(withdrawable > 0, "No funds");
    rs.withdrawnRoyalties[msg.sender] += withdrawable;
    (bool ok, ) = payable(msg.sender).call{value: withdrawable}("");
    require(ok, "transfer failed");
    emit RoyaltyWithdrawn(msg.sender, withdrawable);
}

function withdrawableRoyaltyOf(address owner) public view returns (uint256) {
    LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
    uint256 holderShares = rs.ownerPlatinumCount[owner];
    if (holderShares == 0) return 0;
    uint256 accumulated = rs.magnifiedRoyaltyPerShare * holderShares;
    uint256 corrected = accumulated + rs.magnifiedRoyaltyCorrections[owner];
    uint256 total = corrected / LibRugStorage.MAGNITUDE;
    uint256 withdrawn = rs.withdrawnRoyalties[owner];
    if (total <= withdrawn) return 0;
    return total - withdrawn;
}

Remember to update ownerPlatinumCount and magnifiedRoyaltyCorrections when:
	•	a token’s frame becomes platinum (increase ownerPlatinumCount[owner]++ and magnifiedRoyaltyCorrections[owner] -= magnifiedRoyaltyPerShare)
	•	a platinum token is transferred (in _beforeTokenTransfer detect tokenIsPlatinum and adjust corrections for from & to as described earlier)
	•	a token loses platinum (ownerPlatinumCount–, tokenIsPlatinum=false, adjust correction)

⸻

14) Off-chain indexer & adapters (practical steps)

Primary responsibilities
	•	watch Ethereum blocks for marketplace events
	•	decode price / buyer / seller for each sale event
	•	call recordSaleByMarketplace on your contract (using an RPC signer) or sign buyer/seller messages and submit recordSaleSigned (prefer direct adapter call to your contract)

Implementation
	•	Build adapters in Node.js or Python using ethers.js:
	•	Seaport: listen for OrderFulfilled events and sum consideration items to compute sale price. Use ABI from Seaport docs.
	•	Blur: listen for Match / StartAuction / TakeBid events depending on contract. Blur docs and ABI are necessary.
	•	LooksRare: listen for TakerBid/TakerAsk events on LooksRare protocol.
	•	After decoding sale, send recordSaleByMarketplace(tokenId, buyer, seller, price, marketplaceAddress) from a relayer account.
	•	Maintain an allowlist mapping in the contract and add your relayer(s) or adapters’ addresses to it if desired.

Indexing approach
	•	Easiest: use The Graph / subgraph to watch collection transfers and protocol-specific events. When an order is fulfilled, act.
	•	Simpler to iterate: run a block-watcher service that queries getLogs for target events and processes them.

⸻

15) Edge cases, tradeoffs & final notes
	•	Marketplaces that obfuscate price: Some aggregators pack multiple transfers in a single transaction. Adapters must decode tx receipts (internal transfers) and sum ETH sent to seller. This is doable but requires marketplace familiarity.
	•	Privacy vs accuracy: requiring buyer/seller signatures for price validation is safest but not always practical. The adapter approach is practical.
	•	Gas vs on-chain preservation: storing full human text is expensive — use compressed codes or hashes for chronicles, and render human text off-chain.
	•	Onchain fairness: your platinum royalty model is pull-based and fair; it’s gas-efficient for deposits but gas costs for withdrawals are on holders.
	•	Upgradeable diamond: carefully slot new storage fields to avoid collisions. Ensure LibRugStorage layout ordering remains identical.

⸻

16) Test matrix (detailed)
	1.	Mint -> verify initial extras and season snapshot.
	2.	Clean -> chronicle appended, maintenanceScore increases, possible clan change.
	3.	Restore -> aging decreases, chronicle appended.
	4.	Transfer without recordSale -> chronicle transfer event appended; lastRecordedSalePrice unchanged.
	5.	Simulate Seaport sale with adapter -> adapter calls recordSaleByMarketplace -> lastRecordedSalePrice updated, chronicle appended.
	6.	Simulate signed-report recordSaleSigned -> verify signature checks & saleRecorded flag.
	7.	Platinum entry -> update ownerPlatinumCount & magnifiedRoyaltyCorrections; deposit royalties; claim from two owners.
	8.	Transfer platinum token -> corrections update; ensure correct withdrawable values after transfer.
	9.	Season boundary -> action right on boundary uses new season’s rules & chronicle code.
	10.	Gas regression tests: compute gas per call for clean/restore/recordSale/distributeRoyalties.

⸻

17) Rollout plan
	1.	Implement Lib changes on testnet via diamond upgrade; add automated tests.
	2.	Deploy adapters for Seaport and Blur on testnet; run integrated tests.
	3.	Run limited mainnet deployment on a small set of tokens or staging collection if possible.
	4.	After stable tests, full mainnet release. Announce adapter code for community.

⸻

18) Final pragmatic notes
	•	Start small: enable only a small set of seasons/clans at first, keep scoring conservative and tweak after live feedback.
	•	Adapters are everything: robust sale recording depends mostly on adapters; build them well and open-source them.
	•	Conservative defaults: keep platinum-share benefits time-gated to prevent flash-churn attacks: e.g., a token must be platinum for MIN_PLATINUM_HOLD_BLOCKS before its owner’s ownerPlatinumCount is incremented for royalty distribution. Otherwise malicious actors could temporarily gain shares.

⸻

19) If you want I can (next steps I can produce for you)
	•	Provide exact patch edits for the exact source files you pasted (line-level edits in the facets) — I can produce a multi-file patch you can apply in Cursor.
	•	Generate full adapter code for Seaport and Blur (Node.js + ethers) with recordSaleByMarketplace call prepared.
	•	Write unit tests (Hardhat/Foundry) covering all flows above.

Tell me which of the three you want next and I will produce it as code you can paste into your repo.

— end of file —

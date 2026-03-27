# Key Decisions

Running log of meaningful technical choices and why they were made.

---

## 2025-01 — Initial Build

### DexScreener over other price APIs
**Decision:** Use DexScreener API (free, no key)  
**Alternatives considered:** CoinGecko (rate limited), Moralis (paid), Birdeye (Solana only)  
**Why:** Multi-chain, completely free, no auth, returns liquidity + mcap + dex link in one call. Perfect fit.

---

### Polling over Streaming
**Decision:** Poll user timelines every 90s instead of using filtered stream  
**Why:** Filtered stream on Basic tier has very limited filter rules and is complex to set up per-user. Polling `userTimeline` is simpler, reliable, and stays within rate limits at 90s interval.  
**Trade-off:** Up to 90s delay between call and bot reply. Acceptable for v1.

---

### ESM over CommonJS
**Decision:** `"type": "module"` in package.json, use `import/export` everywhere  
**Why:** Modern Node.js standard. `twitter-api-v2` fully supports it. No transpilation needed.

---

### Pick highest-liquidity pair from DexScreener
**Decision:** When DexScreener returns multiple pairs for a CA, pick the one with highest `liquidity.usd`  
**Why:** Most volume and price data is on the highest-liq pair. Index 0 is not guaranteed to be best.  
**Edge case:** New tokens may have multiple low-liq pairs — filter out pairs where `priceUsd` is null or 0 first.

---

### EVM chain detection order: ethereum → base → bsc
**Decision:** Try chains in this order when chain is "evm"  
**Why:** ETH is most common, Base is growing fast (Coinbase ecosystem), BSC is lower quality but still widely used for memecoins.  
**Note:** Could be smarter (detect address format patterns) but not worth complexity for v1.

---

### In-memory state only (no DB)
**Decision:** `lastSeenIds` and `repliedTweets` stored in Maps/Sets in memory  
**Why:** Simplest possible v1. Downside is state resets on restart.  
**When to change:** Once deploying to a VPS and having 10+ subscribers, migrate to SQLite.

---

### No TypeScript
**Decision:** Plain JS only  
**Why:** This is a small single-purpose bot. TypeScript adds build step complexity with minimal benefit at this scale. Add later if project grows significantly.

---

## DexScreener Edge Cases (discovered during build)

- Response is a **raw array**, not `{ pairs: [] }` — unlike what old docs showed
- `marketCap` is frequently null for new tokens — always fall back to `fdv`
- Solana base58 addresses overlap with random English strings — need heuristic filter (43-44 chars + upper + lower + digit)
- `priceUsd` is returned as a **string**, not a number — must `parseFloat()` before math
# Architecture — CA Caller Tracker Bot

## Data Flow (end-to-end)

```
Every 90s
    │
    ▼
bot.js: pollAll()
    │   loops through SUBSCRIBERS array
    │
    ▼
rwClient.v2.userTimeline(userId)   ← twitter-api-v2
    │   fetches last 10 tweets, filtered by since_id
    │   excludes retweets
    │
    ▼
detector.js: detectAddresses(tweet.text)
    │   EVM regex:    /\b(0x[a-fA-F0-9]{40})\b/g
    │   Solana regex: /\b([1-9A-HJ-NP-Za-km-z]{43,44})\b/g
    │   returns: [{ address, chain }]
    │   deduplicates within single tweet
    │
    ▼
dexscreener.js: lookupToken(address, chain)
    │   Solana: GET /token-pairs/v1/solana/{address}
    │   EVM:    tries ethereum → base → bsc in order
    │   picks pair with highest liquidity.usd
    │   returns: { name, symbol, priceUsd, liquidity, marketCap, dexUrl, ... }
    │
    ▼
formatter.js: formatCallCard(token, callerHandle)
    │   builds ≤280 char reply string
    │   chain emoji: ◎ Solana | ⟠ ETH | 🔵 Base | 🟡 BSC
    │
    ▼
rwClient.v2.reply(text, tweetId)   ← posts reply
```

---

## State Management

| State | Where | Survives restart? |
|---|---|---|
| Last seen tweet ID per user | `Map<userId, tweetId>` in bot.js | ❌ No |
| Already-replied tweet IDs | `Set<tweetId>` in bot.js | ❌ No |
| Subscriber list | `src/subscribers.js` (static) | ✅ Yes |

**Known gap:** Bot will re-process old tweets after restart. Fix: persist `lastSeenIds` to SQLite or a flat JSON file.

---

## DexScreener API Details

Base URL: `https://api.dexscreener.com`

Key endpoint: `GET /token-pairs/v1/{chainId}/{tokenAddress}`

- Returns array of pair objects (not a wrapped `{pairs:[]}` — raw array)
- `priceUsd` can be null for very new/low-liq tokens
- `marketCap` preferred over `fdv` — fall back to fdv if marketCap is null
- Rate limit: generous for casual use, no key needed

---

## Twitter API Details

Library: `twitter-api-v2`  
Tier required: **Basic ($100/mo)**

Key calls used:
- `rwClient.v2.userTimeline(userId, params)` — reads timeline
- `rwClient.v2.reply(text, tweetId)` — posts reply
- `rwClient.v2.me()` — auth check on startup

Params for timeline:
- `max_results: 10`
- `exclude: ["retweets"]`
- `since_id: lastSeenId` (set after first fetch)
- `tweet.fields: ["created_at", "author_id"]`

---

## Planned Improvements (not yet built)

- [ ] Persist `lastSeenIds` to SQLite so bot survives restarts
- [ ] Track P&L: store price at call, re-check at 1h/24h and reply with update
- [ ] Web dashboard for subscribers to self-register
- [ ] Handle multiple CAs in one tweet (currently only processes first)
- [ ] Deploy to Railway or Fly.io for 24/7 uptime
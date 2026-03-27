# Session Log

Rolling log of meaningful work done each session. Most recent first.

---

## Session 001 — Initial Build

**What we built:**
- Full bot from scratch: `bot.js`, `detector.js`, `dexscreener.js`, `formatter.js`, `subscribers.js`
- Multi-chain CA detection (Solana + EVM regex)
- DexScreener price lookup with chain auto-detection for EVM (eth → base → bsc)
- Formatted reply card with chain emoji, price at call, mcap, liq, 24h change, dex link
- Polling loop with configurable interval (default 90s), per-account staggering
- Startup auth check via `rwClient.v2.me()`
- `README.md` with full setup guide
- `CLAUDE.md` + `.claude/rules/` memory system

**Files created:**
- `src/bot.js`
- `src/detector.js`
- `src/dexscreener.js`
- `src/formatter.js`
- `src/subscribers.js`
- `package.json`
- `.env.example`
- `README.md`
- `CLAUDE.md`
- `.claude/rules/architecture.md`
- `.claude/rules/memory-decisions.md`
- `.claude/rules/memory-sessions.md`

**Known gaps left for next session:**
- `lastSeenIds` not persisted — bot loses state on restart
- Only first CA per tweet processed
- No deploy config (Railway/Fly.io)
- No P&L tracking (price at call → check again 1h/24h later)

---

<!-- Add new sessions above this line -->
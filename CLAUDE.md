# CA Caller Tracker Bot — Project Memory

> Routing file. Keep under 150 lines. Details live in `.claude/rules/`.

---

## What This Is

A Node.js Twitter/X bot that monitors subscribed CT callers. When they post a
contract address, the bot auto-replies with price at call, mcap, and liquidity
pulled from DexScreener (free API, no key).

**Chains:** Solana, Ethereum, Base, BSC  
**Stack:** Node.js ESM, `twitter-api-v2`, DexScreener API, dotenv  
**Twitter requirement:** X API Basic tier ($100/mo) — needed for timeline reads

---

## File Map

```
ca-bot/
├── CLAUDE.md                  ← you are here (routing)
├── .claude/
│   └── rules/
│       ├── architecture.md    ← how the bot works end-to-end
│       ├── memory-decisions.md← key choices made and why
│       └── memory-sessions.md ← rolling log of work done
├── src/
│   ├── bot.js                 ← main polling loop + Twitter client
│   ├── subscribers.js         ← list of watched CT caller accounts
│   ├── detector.js            ← regex CA detection (Solana + EVM)
│   ├── dexscreener.js         ← price/mcap/liq lookup
│   └── formatter.js           ← reply tweet builder
├── .env.example
└── package.json
```

→ See `.claude/rules/architecture.md` for full data flow  
→ See `.claude/rules/memory-decisions.md` for key technical choices

---

## Commands

```bash
npm install          # install deps
npm start            # run bot
npm run dev          # run with --watch (auto-restart on save)
```

---

## Coding Style

- **ESM only** — `import/export`, no `require()`
- **No TypeScript** — plain JS, keep it simple
- **Async/await** — no raw `.then()` chains
- **console.log** for logging — format: `[ModuleName] message`
- **No external DB yet** — state is in-memory Maps/Sets
- Prefer small focused files over large ones

---

## Constraints & Watch-Outs

- **X API rate limits:** 15 user timeline reads per 15 min per user. Poll interval defaults to 90s. Do NOT lower it below 60s.
- **DexScreener:** No auth needed. Returns array of pairs — always pick highest liquidity pair, not index 0.
- **Solana CA detection** is tricky (base58 = false positives). Current heuristic: 43-44 chars + must have upper + lower + digit mix.
- **Replied tweet tracking** is in-memory only — resets on restart. Future: move to SQLite.
- Tweet replies must be ≤280 chars.

---

## Auto-Update Memory (MANDATORY)

Update memory files **as you go**, not at the end.

| Trigger | File to update |
|---|---|
| Key architectural decision made | `.claude/rules/memory-decisions.md` |
| Bug found + fixed | `.claude/rules/memory-sessions.md` |
| New feature added | `.claude/rules/architecture.md` |
| Pattern discovered (e.g. DexScreener edge case) | `.claude/rules/memory-decisions.md` |

**DO NOT ASK. Just update when something meaningful happens.**

---

## Current Status

→ See `.claude/rules/memory-sessions.md` for latest session log
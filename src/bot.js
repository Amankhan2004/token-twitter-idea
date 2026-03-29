import 'dotenv/config';
import { TwitterApi } from 'twitter-api-v2';
import { initDb } from './db.js';
import { getSubscribers } from './subscribers.js';
import { detectAddresses } from './detector.js';
import { lookupToken } from './dexscreener.js';
import { formatCallCard } from './formatter.js';
import { createApi } from './api.js';

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS || '90000', 10);
const API_PORT = parseInt(process.env.API_PORT || '3000', 10);
const SKIP_TWITTER = ['1', 'true', 'yes'].includes(
  (process.env.SKIP_TWITTER || '').toLowerCase()
);

/** @type {import('twitter-api-v2').TwitterApiReadWrite | null} */
let rwClient = null;

// In-memory state
const lastSeenIds = new Map();   // userId → latest tweet ID
const repliedTweets = new Set(); // tweet IDs we already replied to

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pollSubscriber(sub, isFirstRun) {
  if (!rwClient) return;

  const params = {
    max_results: 10,
    exclude: ['retweets'],
    'tweet.fields': ['created_at', 'author_id'],
  };

  const sinceId = lastSeenIds.get(sub.userId);
  if (sinceId) params.since_id = sinceId;

  const timeline = await rwClient.v2.userTimeline(sub.userId, params);
  const tweets = timeline.data?.data;

  if (!tweets || tweets.length === 0) return;

  // Update lastSeenIds with newest tweet (first in array = most recent)
  lastSeenIds.set(sub.userId, tweets[0].id);

  // First run: seed only, don't reply (prevents spamming old tweets on restart)
  if (isFirstRun) {
    console.log(`[Bot] Initialized @${sub.handle}, latest tweet: ${tweets[0].id}`);
    return;
  }

  // Process oldest first
  const ordered = [...tweets].reverse();

  for (const tweet of ordered) {
    if (repliedTweets.has(tweet.id)) continue;

    const addresses = detectAddresses(tweet.text);
    if (addresses.length === 0) continue;

    // Process first detected CA for v1
    const { address, chain } = addresses[0];
    const token = await lookupToken(address, chain);

    if (!token) {
      console.log(`[Bot] No DexScreener data for ${address} from @${sub.handle}`);
      continue;
    }

    const replyText = formatCallCard(token);

    try {
      await rwClient.v2.reply(replyText, tweet.id);
      repliedTweets.add(tweet.id);
      console.log(`[Bot] Replied to @${sub.handle} tweet ${tweet.id} for $${token.symbol}`);
    } catch (err) {
      console.log(`[Bot] Failed to reply to ${tweet.id}: ${err.message}`);
    }
  }
}

async function pollAll(isFirstRun = false) {
  const subscribers = await getSubscribers();

  if (subscribers.length === 0) {
    if (isFirstRun) console.log('[Bot] No subscribers yet — add some via the API');
    return;
  }

  if (isFirstRun) {
    console.log(`[Bot] Monitoring ${subscribers.length} account(s), polling every ${POLL_INTERVAL / 1000}s`);
  }

  for (const sub of subscribers) {
    try {
      await pollSubscriber(sub, isFirstRun);
    } catch (err) {
      console.log(`[Bot] Error polling @${sub.handle}: ${err.message}`);
    }
    // Stagger requests between subscribers
    await sleep(1000);
  }
}

let intervalId;

async function main() {
  // Initialize database
  await initDb();

  if (SKIP_TWITTER) {
    console.log(
      '[Bot] SKIP_TWITTER is set — API + DB only (no timeline reads or replies)'
    );
  }

  const app = createApi();
  const server = app.listen(API_PORT, () => {
    console.log(`[API] Listening on http://localhost:${API_PORT}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `[API] Port ${API_PORT} is already in use — change API_PORT in .env`
      );
    }
    throw err;
  });

  if (SKIP_TWITTER) return;

  rwClient = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY,
    appSecret: process.env.TWITTER_APP_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  }).readWrite;

  try {
    const { data: me } = await rwClient.v2.me();
    console.log(`[Bot] Authenticated as @${me.username} (${me.id})`);
  } catch (err) {
    console.error('[Bot] Auth failed — check your .env credentials:', err.message);
    process.exit(1);
  }

  // First poll: seed lastSeenIds without replying
  await pollAll(true);

  // Start polling loop
  intervalId = setInterval(() => pollAll(), POLL_INTERVAL);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Bot] Shutting down...');
  if (intervalId) clearInterval(intervalId);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Bot] Shutting down...');
  if (intervalId) clearInterval(intervalId);
  process.exit(0);
});

main().catch(err => {
  console.error('[Bot] Fatal error:', err);
  process.exit(1);
});

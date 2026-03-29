const BASE_URL = 'https://api.dexscreener.com';
const EVM_CHAINS = ['ethereum', 'base', 'bsc'];

function pickBestPair(pairs) {
  const valid = pairs.filter(p => p.priceUsd && parseFloat(p.priceUsd) > 0);
  if (valid.length === 0) return null;
  return valid.reduce((best, p) =>
    (p.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) ? p : best
  );
}

function formatPair(pair, chainId) {
  return {
    name: pair.baseToken.name,
    symbol: pair.baseToken.symbol,
    priceUsd: parseFloat(pair.priceUsd),
    liquidity: pair.liquidity?.usd ?? 0,
    marketCap: pair.marketCap ?? pair.fdv ?? null,
    priceChange24h: pair.priceChange?.h24 ?? null,
    dexUrl: pair.url,
    chain: chainId,
    pairAddress: pair.pairAddress,
  };
}

async function fetchPairs(chainId, address) {
  const url = `${BASE_URL}/token-pairs/v1/${chainId}/${address}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function lookupToken(address, chain) {
  try {
    if (chain === 'solana') {
      const pairs = await fetchPairs('solana', address);
      const best = pickBestPair(pairs);
      return best ? formatPair(best, 'solana') : null;
    }

    // EVM: try ethereum → base → bsc
    for (const chainId of EVM_CHAINS) {
      const pairs = await fetchPairs(chainId, address);
      const best = pickBestPair(pairs);
      if (best) return formatPair(best, chainId);
    }

    return null;
  } catch (err) {
    console.log(`[DexScreener] Error looking up ${address}: ${err.message}`);
    return null;
  }
}

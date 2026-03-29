const EVM_REGEX = /\b(0x[a-fA-F0-9]{40})\b/g;
const SOLANA_REGEX = /\b([1-9A-HJ-NP-Za-km-z]{43,44})\b/g;

function hasMixedChars(str) {
  return /[A-Z]/.test(str) && /[a-z]/.test(str) && /[0-9]/.test(str);
}

export function detectAddresses(text) {
  // Strip URLs to avoid false positives from paths like dexscreener.com/solana/abc...
  const cleaned = text.replace(/https?:\/\/\S+/g, '');

  const seen = new Set();
  const results = [];

  // EVM addresses
  for (const match of cleaned.matchAll(EVM_REGEX)) {
    const address = match[1];
    if (!seen.has(address)) {
      seen.add(address);
      results.push({ address, chain: 'evm' });
    }
  }

  // Solana addresses (with heuristic filter)
  for (const match of cleaned.matchAll(SOLANA_REGEX)) {
    const address = match[1];
    if (!seen.has(address) && hasMixedChars(address)) {
      seen.add(address);
      results.push({ address, chain: 'solana' });
    }
  }

  return results;
}

const CHAIN_EMOJI = {
  solana: '◎',
  ethereum: '⟠',
  base: '🔵',
  bsc: '🟡',
};

function fmtNum(n) {
  if (n == null) return 'N/A';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtPrice(p) {
  if (p == null) return 'N/A';
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  // For very small prices, show full precision up to 10 decimals
  return `$${p.toFixed(10).replace(/0+$/, '')}`;
}

function fmtChange(change) {
  if (change == null) return '';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

export function formatCallCard(token) {
  const emoji = CHAIN_EMOJI[token.chain] || '🔗';
  const change = fmtChange(token.priceChange24h);
  const changeLine = change ? `\n24h: ${change}` : '';

  // Full version
  let text = `${emoji} ${token.name} (${token.symbol})\nPrice: ${fmtPrice(token.priceUsd)}\nMCap: ${fmtNum(token.marketCap)} | Liq: ${fmtNum(token.liquidity)}${changeLine}\n${token.dexUrl}`;

  if (text.length <= 280) return text;

  // Truncated: drop name, keep symbol only
  text = `${emoji} ${token.symbol}\nPrice: ${fmtPrice(token.priceUsd)}\nMCap: ${fmtNum(token.marketCap)} | Liq: ${fmtNum(token.liquidity)}${changeLine}\n${token.dexUrl}`;

  if (text.length <= 280) return text;

  // Further truncated: drop 24h change
  text = `${emoji} ${token.symbol}\nPrice: ${fmtPrice(token.priceUsd)}\nMCap: ${fmtNum(token.marketCap)} | Liq: ${fmtNum(token.liquidity)}\n${token.dexUrl}`;

  return text.slice(0, 280);
}

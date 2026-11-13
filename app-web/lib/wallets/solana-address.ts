import { ed25519 } from '@noble/curves/ed25519.js';

export const SOLANA_USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const reserved = new Set([SOLANA_USDC_MINT, '11111111111111111111111111111111',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL']);
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
// Solana Pay requires the wallet owner, never its associated token account.
// Limit this release to ordinary keypair wallets, rejecting off-curve ATAs/PDAs.
// This cannot identify every on-curve exchange or token account.
export function isSolanaWalletAddress(value: string): boolean {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value) || reserved.has(value)) return false;
  let n = 0n;
  for (const char of value) n = n * 58n + BigInt(alphabet.indexOf(char));
  const bytes: number[] = [];
  while (n) { bytes.unshift(Number(n & 255n)); n >>= 8n; }
  for (const char of value) { if (char !== '1') break; bytes.unshift(0); }
  if (bytes.length !== 32) return false;
  try {
    const point = ed25519.Point.fromBytes(Uint8Array.from(bytes), false);
    return !point.isSmallOrder() && point.isTorsionFree();
  } catch { return false; }
}

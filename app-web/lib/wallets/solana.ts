import { ASSETS, IntentsError, validatePaymentQuote, type PaymentQuoteRequest, type VerifiedQuote } from '../providers/intents';
import { isSolanaWalletAddress, SOLANA_USDC_MINT } from './solana-address';

// Solana Pay SPL transfer request: the signed provider destination is the
// owner address; the wallet derives its USDC ATA. No signing occurs here.
// Reject memos rather than dropping provider instructions in this first route.
export function solanaPaymentUri(saved: VerifiedQuote, now = Date.now()): string {
  const quote = validatePaymentQuote(saved, saved.quoteRequest as PaymentQuoteRequest, {historic:true});
  const q = quote.quote;
  if (quote.quoteRequest.dry !== false || quote.quoteRequest.originAsset !== ASSETS.solanaUsdc ||
      quote.quoteRequest.destinationAsset !== ASSETS.usdc || quote.quoteRequest.recipientType !== 'CONFIDENTIAL_INTENTS' ||
      quote.quoteRequest.depositType !== 'ORIGIN_CHAIN' || quote.quoteRequest.refundType !== 'ORIGIN_CHAIN' ||
      q.depositMemo || !q.depositAddress || !isSolanaWalletAddress(q.depositAddress) ||
      !q.deadline || !q.timeWhenInactive || typeof quote.quoteRequest.deadline !== 'string' ||
      !Number.isFinite(Date.parse(quote.quoteRequest.deadline)) ||
      Math.min(Date.parse(q.deadline),Date.parse(q.timeWhenInactive),Date.parse(quote.quoteRequest.deadline)) <= now) {
    throw new IntentsError('invalid_quote', 'This Solana payment instruction is not supported.');
  }
  const amount = BigInt(q.amountIn);
  const decimal = `${amount / 1000000n}.${(amount % 1000000n).toString().padStart(6, '0')}`;
  const params = new URLSearchParams({amount:decimal,'spl-token':SOLANA_USDC_MINT});
  return `solana:${q.depositAddress}?${params}`;
}

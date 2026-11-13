import { ASSETS, IntentsError, isTransparentZcashAddress, validatePaymentQuote, type PaymentQuoteRequest, type VerifiedQuote } from '../providers/intents';

// A single ZIP-321 request for a verified, unexpired executable ZEC quote.
// Transparent deposit addresses cannot carry a shielded memo. Refuse rather
// than silently dropping provider instructions or inventing address support.
export async function zcashPaymentUri(saved: VerifiedQuote, now = Date.now()): Promise<string> {
  const quote = validatePaymentQuote(saved, saved.quoteRequest as PaymentQuoteRequest, {historic:true});
  if (quote.quoteRequest.dry !== false || quote.quoteRequest.originAsset !== ASSETS.zec ||
      quote.quoteRequest.depositType !== 'ORIGIN_CHAIN' || quote.quote.depositMemo ||
      !quote.quote.depositAddress || !await isTransparentZcashAddress(quote.quote.depositAddress) ||
      !quote.quote.deadline || !quote.quote.timeWhenInactive ||
      typeof quote.quoteRequest.deadline !== 'string' ||
      !Number.isFinite(Date.parse(quote.quoteRequest.deadline)) ||
      Math.min(Date.parse(quote.quote.deadline), Date.parse(quote.quote.timeWhenInactive), Date.parse(quote.quoteRequest.deadline)) <= now) {
    throw new IntentsError('invalid_quote', 'This Zcash payment instruction is not supported.');
  }
  const amount = BigInt(quote.quote.amountIn);
  const decimal = `${amount / 100000000n}.${(amount % 100000000n).toString().padStart(8, '0')}`;
  return `zcash:${quote.quote.depositAddress}?amount=${decimal}`;
}

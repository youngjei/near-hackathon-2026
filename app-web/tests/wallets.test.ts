import {expect, test, vi} from 'vitest';
vi.mock('@defuse-protocol/one-click-sdk-typescript', () => ({verifyQuoteSignature: () => true}));
import {paymentQuoteRequest, type VerifiedQuote} from '../lib/providers/intents';
import {zcashPaymentUri} from '../lib/wallets/zcash';
import {paymentReadiness} from '../lib/providers/near';
const address = 't1NYKoZGziMsyMvgK9K5b2qZGym3UQsw3Tz';
function quote(): VerifiedQuote {
  const now = Date.now();
  return {correlationId:'test',timestamp:new Date(now).toISOString(),signature:'test',
    quoteRequest:paymentQuoteRequest({method:'zcash',recipient:'0x'+'33'.repeat(20),refundTo:address,amountUnits:'15000000'},false,now),
    quote:{amountIn:'1234567',minAmountIn:'1200000',amountOut:'15000000',minAmountOut:'15000000',
      amountInFormatted:'0.01234567',amountInUsd:'15',amountOutFormatted:'15',amountOutUsd:'15',
      depositAddress:address,deadline:new Date(now+300000).toISOString(),timeWhenInactive:new Date(now+300000).toISOString()}};
}
test('ZIP-321 request uses exact zatoshis and refuses unsupported deposit instructions', async () => {
  const saved = quote();
  expect(await zcashPaymentUri(saved)).toBe(`zcash:${address}?amount=0.01234567`);
  await expect(zcashPaymentUri({...saved,quote:{...saved.quote,depositMemo:'memo'}})).rejects.toThrow();
  await expect(zcashPaymentUri({...saved,quote:{...saved.quote,depositAddress:'u1unsupported'}})).rejects.toThrow();
  await expect(zcashPaymentUri(saved,Date.now()+600000)).rejects.toThrow();
});
test('route activation needs independent switches and acceptance; confidential stays disabled', () => {
  expect(paymentReadiness({NEAR_INTENTS_API_KEY:'configured'}).enabled).toBe(false);
  const settings={NEAR_INTENTS_API_KEY:'configured',LIVE_PAYMENTS_ENABLED:'true',LIVE_ZCASH_ENABLED:'true',ZCASH_ACCEPTANCE_VERIFIED:'true',LIVE_CONFIDENTIAL_ENABLED:'true'};
  expect(paymentReadiness(settings).methods).toEqual({zcash:true,confidential:false});
  expect(paymentReadiness({...settings,CONFIDENTIAL_ACCEPTANCE_VERIFIED:'true'}).methods.confidential).toBe(true);
  expect(paymentReadiness({...settings,ZCASH_ACCEPTANCE_VERIFIED:'false'}).enabled).toBe(false);
});

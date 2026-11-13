import { expect, test, vi } from 'vitest';
vi.mock('@defuse-protocol/one-click-sdk-typescript', () => ({verifyQuoteSignature: () => true}));
import { ASSETS, intentsProvider, paymentQuoteRequest, type VerifiedQuote } from '../lib/providers/intents';
import { paymentReadiness } from '../lib/providers/near';
import { solanaPaymentUri } from '../lib/wallets/solana';
import { isSolanaWalletAddress, SOLANA_USDC_MINT } from '../lib/wallets/solana-address';
// Deterministic, unfunded test key; never a production payout/refund account.
const address = 'GmaDrppBC7P5ARKV8g3djiwP89vz1jLK23V2GBjuAEGB';
const route = {method:'solana' as const,recipient:'receiver.near',refundTo:address,amountUnits:'15000000'};
function quote(): VerifiedQuote {
  const now=Date.now(), deadline=new Date(now+300000).toISOString();
  return {timestamp:new Date(now).toISOString(),signature:'synthetic',quoteRequest:paymentQuoteRequest(route,false,now),quote:{amountIn:'15123456',minAmountIn:'15123456',amountOut:'15000000',minAmountOut:'15000000',amountInFormatted:'15.123456',amountInUsd:'15',amountOutFormatted:'15',amountOutUsd:'15',depositAddress:address,deadline,timeWhenInactive:deadline}};
}
test('Solana routes only mainnet USDC through origin chain into confidential USDC',()=>{
  expect(paymentQuoteRequest(route)).toMatchObject({dry:true,originAsset:ASSETS.solanaUsdc,destinationAsset:ASSETS.usdc,depositType:'ORIGIN_CHAIN',refundType:'ORIGIN_CHAIN',recipientType:'CONFIDENTIAL_INTENTS',confidentiality:'basic'});
  expect(isSolanaWalletAddress(address)).toBe(true);
  for(const bad of ['0x'+'11'.repeat(20),'11111111111111111111111111111111',SOLANA_USDC_MINT,'1'.repeat(44),'bad!','TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA']) {
    expect(isSolanaWalletAddress(bad)).toBe(false);
    expect(()=>paymentQuoteRequest({...route,refundTo:bad})).toThrow();
  }
});
test('Solana Pay specifies exact USDC mint and base units; refuses unsafe instructions',()=>{
  const q=quote();
  expect(solanaPaymentUri(q)).toBe(`solana:${address}?amount=15.123456&spl-token=${SOLANA_USDC_MINT}`);
  for(const patch of [{depositMemo:'memo'},{depositAddress:SOLANA_USDC_MINT},{depositAddress:'11111111111111111111111111111111'},{deadline:new Date(0).toISOString()}])
    expect(()=>solanaPaymentUri({...q,quote:{...q.quote,...patch}})).toThrow();
  for(const patch of [{dry:true},{originAsset:ASSETS.usdc},{recipientType:'ORIGIN_CHAIN'},{refundType:'INTENTS'}])
    expect(()=>solanaPaymentUri({...q,quoteRequest:{...q.quoteRequest,...patch}})).toThrow();
  expect(()=>solanaPaymentUri(q,Date.now()+600000)).toThrow();
});
test('invalid Solana refund is rejected before allocation or preview network request',async()=>{
  const transport=vi.fn(),provider=intentsProvider('synthetic',transport);
  await expect(provider.allocate({...route,refundTo:SOLANA_USDC_MINT})).rejects.toMatchObject({code:'unsupported_refund'});
  await expect(provider.preview({...route,refundTo:'11111111111111111111111111111111'})).rejects.toMatchObject({code:'unsupported_refund'});
  expect(transport).not.toHaveBeenCalled();
});
test('Solana activation needs global, credential, route and acceptance gates independently',()=>{
  const enabled={NEAR_INTENTS_API_KEY:'synthetic',LIVE_PAYMENTS_ENABLED:'true',LIVE_SOLANA_ENABLED:'true',SOLANA_ACCEPTANCE_VERIFIED:'true'};
  expect(paymentReadiness({}).methods.solana).toBe(false);
  expect(paymentReadiness(enabled)).toMatchObject({enabled:true,methods:{solana:true,zcash:false,confidential:false}});
  for(const key of Object.keys(enabled))expect(paymentReadiness({...enabled,[key]:undefined}).methods.solana).toBe(false);
});

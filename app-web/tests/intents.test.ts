import {readFileSync} from 'node:fs';
import {expect,test,vi} from 'vitest';
import {verifyQuoteSignature,type QuoteResponse} from '@defuse-protocol/one-click-sdk-typescript';
import {ASSETS,assessSettlement,intentsProvider,isTransparentZcashAddress,paymentQuoteRequest,quotePreview,validatePaymentQuote,type VerifiedQuote} from '../lib/providers/intents';
const evidence=JSON.parse(readFileSync(new URL('../../docs/technical/evidence/probe-results.json',import.meta.url),'utf8'));
const saved=evidence['unfunded-public'].response as VerifiedQuote;
const route={method:'zcash' as const,amountUnits:'15000000',recipient:'0x'+'33'.repeat(20),refundTo:'t1WpZWUJcC8FdKUJH6JjKQ7qCFoHiUkBHBX'};
const now=Date.now();
function fixture() {
 const expected=paymentQuoteRequest(route,true,now);
 return {expected,response:{correlationId:'test',timestamp:new Date(now).toISOString(),signature:'synthetic-not-a-provider-signature',quoteRequest:structuredClone(expected),quote:{amountIn:'1234567',minAmountIn:'1200000',amountOut:'15000000',minAmountOut:'15000000',amountInFormatted:'0.01234567',amountInUsd:'15.1',amountOutFormatted:'15',amountOutUsd:'15',timeEstimate:400}}};
}
const semanticsOnly={now,verify:()=>true};
test('only the two beta routes and cent-precision USDC output can be requested',()=>{
 const z=paymentQuoteRequest(route);expect(z).toMatchObject({dry:true,swapType:'EXACT_OUTPUT',recipientType:'CONFIDENTIAL_INTENTS',confidentiality:'basic',originAsset:ASSETS.zec});
 const c=paymentQuoteRequest({...route,method:'confidential',refundTo:'44'.repeat(32)});
 expect(c.depositType).toBe('CONFIDENTIAL_INTENTS');expect(c.refundType).toBe('CONFIDENTIAL_INTENTS');expect(c.originAsset).toBe(ASSETS.usdc);
 for(const amountUnits of ['0','-1','1.2','15000001','1e6'])expect(()=>paymentQuoteRequest({...route,amountUnits})).toThrow();
});
test('real historical provider signatures verify; changing a signed amount fails',()=>{
 expect(verifyQuoteSignature(saved as unknown as QuoteResponse)).toBe(true);
 const tampered=structuredClone(saved);tampered.quote.amountOut='99999999';
 expect(verifyQuoteSignature(tampered as unknown as QuoteResponse)).toBe(false);
});
test('signed quote projection does not cover confidentiality; exact expected fields do',()=>{
 const {expected,response}=fixture();
 response.quoteRequest.confidentiality='public' as 'basic';
 expect(()=>validatePaymentQuote(response,expected,semanticsOnly)).toThrow();
});
test.each(['recipient','amount','originAsset','refundTo','recipientType','dry'])('rejects altered %s even if signature verification reports success',(key)=>{
 const {expected,response}=fixture();
 const altered=structuredClone(response);(altered.quoteRequest as Record<string,unknown>)[key]='wrong';
 expect(()=>validatePaymentQuote(altered,expected,semanticsOnly)).toThrow();
});
test('rejects stale quotes, unsigned payloads and payment instructions inside previews',()=>{
 const {expected,response}=fixture();
 expect(()=>validatePaymentQuote(response,expected,{now})).toThrow();
 expect(()=>validatePaymentQuote({...response,timestamp:new Date(now-180000).toISOString()},expected,semanticsOnly)).toThrow();
 expect(()=>validatePaymentQuote({...response,quote:{...response.quote,depositAddress:'t1fake'}},expected,semanticsOnly)).toThrow();
 expect(()=>validatePaymentQuote({...response,quote:{...response.quote,amountOut:'14999999'}},expected,semanticsOnly)).toThrow();
});
test('safe preview excludes recipient, refund, raw provider data and payment address',()=>{
 const {expected,response}=fixture();const safe=quotePreview(validatePaymentQuote(response,expected,semanticsOnly));
 expect(safe.inputAmount).toBe('0.01234567');expect(safe.outputUnits).toBe('15000000');
 expect(JSON.stringify(safe)).not.toMatch(/recipient|refundTo|depositAddress|signature|correlationId/);
});
test('expired quote can still be reconciled; success needs enough actually delivered output',()=>{
 const raw={status:'SUCCESS',updatedAt:new Date().toISOString(),quoteResponse:saved,swapDetails:{amountOut:'15000000'}};
 expect(assessSettlement(raw,saved).state).toBe('paid');
 expect(assessSettlement({...raw,swapDetails:{amountOut:'14999999'}},saved).state).toBe('review');
 expect(assessSettlement({...raw,swapDetails:{}},saved).state).toBe('review');
 expect(assessSettlement({...raw,swapDetails:{amountOut:'0'}},saved).state).toBe('review');
 expect(assessSettlement({...raw,swapDetails:{amountOut:null}},saved).state).toBe('review');
 expect(assessSettlement({...raw,status:'PENDING_DEPOSIT',swapDetails:{amountOut:null}},saved).state).toBe('pending');
 for(const status of ['PROCESSING','KNOWN_DEPOSIT_TX','INCOMPLETE_DEPOSIT','PENDING_DEPOSIT']) expect(assessSettlement({...raw,status},saved).state).toBe('pending');
 expect(assessSettlement({...raw,status:'REFUNDED'},saved).state).toBe('refunded');
 expect(assessSettlement({...raw,status:'SOMETHING_NEW'},saved).state).toBe('review');
});
test('status must match the saved quote, including deposit memo',()=>{
 const other=structuredClone(saved);other.quote.depositMemo='different';
 expect(()=>assessSettlement({status:'SUCCESS',updatedAt:new Date().toISOString(),quoteResponse:other,swapDetails:{amountOut:'15000000'}},saved)).toThrow();
});
test('Zcash refund checksum is validated before any network call',async()=>{
 expect(await isTransparentZcashAddress('t1'+'1'.repeat(33))).toBe(false);
 expect(await isTransparentZcashAddress('u1shielded')).toBe(false);
 const transport=vi.fn();const provider=intentsProvider('test-key',transport);
 await expect(provider.preview({...route,refundTo:'u1shielded'})).rejects.toMatchObject({code:'unsupported_refund'});
 expect(transport).not.toHaveBeenCalled();
});
test('provider errors never return sensitive upstream payloads or redirect credentials',async()=>{
 const transport=vi.fn<typeof fetch>(async()=>Response.json({message:'secret key and private account contents'},{status:403}));
 const provider=intentsProvider('test-key',transport);
 await expect(provider.preview({...route,method:'confidential',refundTo:'44'.repeat(32)})).rejects.toThrow('The payment route is unavailable');
 expect(transport.mock.calls[0]?.[1]).toMatchObject({redirect:'error',cache:'no-store'});
});

test('status lookup preserves the deposit memo and never accepts a dry quote',async()=>{
 const transport=vi.fn<typeof fetch>(async()=>Response.json({}, {status:503}));
 const provider=intentsProvider('test-key',transport);
 const withMemo=structuredClone(saved);withMemo.quote.depositMemo='a+memo/&';
 await expect(provider.status(withMemo)).rejects.toMatchObject({code:'unavailable'});
 const url=new URL(String(transport.mock.calls[0][0]));
 expect(url.searchParams.get('depositMemo')).toBe('a+memo/&');
 expect(url.searchParams.get('depositAddress')).toBe(saved.quote.depositAddress);
 const {expected,response}=fixture();
 await expect(provider.status(validatePaymentQuote(response,expected,semanticsOnly))).rejects.toMatchObject({code:'invalid_quote'});
 expect(transport).toHaveBeenCalledTimes(1);
});
test('executable allocation uses the saved route and refuses unverified provider responses',async()=>{
 const transport=vi.fn<typeof fetch>(async()=>Response.json({message:'not a quote'}));
 const provider=intentsProvider('test-key',transport);
 await expect(provider.allocate({...route,refundTo:'t1NYKoZGziMsyMvgK9K5b2qZGym3UQsw3Tz'})).rejects.toMatchObject({code:'invalid_quote'});
 const body=JSON.parse(String(transport.mock.calls[0][1]?.body));
 expect(body).toMatchObject({dry:false,amount:'15000000',recipient:route.recipient,recipientType:'CONFIDENTIAL_INTENTS',originAsset:ASSETS.zec});
});
test('status accepts omitted correlation and provider defaults but still binds route and amount',()=>{
 const response=structuredClone(saved);
 delete response.correlationId;
 for(const key of ['quoteWaitingTimeMs','insured','appFees']) delete response.quoteRequest[key];
 const status={status:'SUCCESS',updatedAt:new Date().toISOString(),quoteResponse:response,swapDetails:{amountOut:saved.quote.amountOut}};
 expect(assessSettlement(status,saved).state).toBe('paid');
 const altered=structuredClone(response);altered.quoteRequest.recipient='wrong';
 expect(()=>assessSettlement({...status,quoteResponse:altered},saved)).toThrow();
 altered.quoteRequest.recipient=response.quoteRequest.recipient;altered.quote.amountOut='1';
 expect(()=>assessSettlement({...status,quoteResponse:altered},saved)).toThrow();
});

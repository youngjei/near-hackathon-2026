import {expect,test,vi} from 'vitest';
const verify=vi.hoisted(()=>vi.fn((q:{quoteRequest:{quoteWaitingTimeMs?:number}})=>q.quoteRequest.quoteWaitingTimeMs===3000));
vi.mock('@defuse-protocol/one-click-sdk-typescript',()=>({verifyQuoteSignature:verify}));
import {assessSettlement,paymentQuoteRequest,type VerifiedQuote} from '../lib/providers/intents';
test('status restores only omitted signed provider wait time from independently verified saved quote',()=>{
 const now=Date.now(),deadline=new Date(now+300000).toISOString();const req=paymentQuoteRequest({method:'zcash',recipient:'receiver.near',refundTo:'t1test',amountUnits:'5000000'},false,now);
 const saved:VerifiedQuote={correlationId:'test',timestamp:new Date(now).toISOString(),signature:'test',quoteRequest:{...req,quoteWaitingTimeMs:3000},quote:{amountIn:'123',minAmountIn:'100',amountOut:'5000000',minAmountOut:'5000000',amountInFormatted:'0.00000123',amountInUsd:'5',amountOutFormatted:'5',amountOutUsd:'5',depositAddress:'deposit',deadline,timeWhenInactive:deadline}};
 const statusQuote=structuredClone(saved);delete statusQuote.correlationId;delete statusQuote.quoteRequest.quoteWaitingTimeMs;
 const status={status:'PENDING_DEPOSIT',updatedAt:new Date(now).toISOString(),quoteResponse:statusQuote,swapDetails:{}};
 expect(assessSettlement(status,saved,now).state).toBe('pending');
 statusQuote.quoteRequest.quoteWaitingTimeMs=4000;expect(()=>assessSettlement(status,saved,now)).toThrow();
});

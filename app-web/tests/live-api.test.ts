import { beforeEach, expect, test, vi } from 'vitest';
import { createHandler } from '../lib/server/api';
import { hash } from '../lib/server/security';
import type { Bill, Share, Store } from '../lib/server/store';
import type { LivePaymentProvider } from '../lib/server/live-payments';

const calls=vi.hoisted(()=>({create:vi.fn(),prepare:vi.fn(),submit:vi.fn(),reconcile:vi.fn()}));
vi.mock('../lib/server/live-payments',()=>({
 createLivePayment:calls.create,prepareConfidentialPayment:calls.prepare,submitConfidentialPayment:calls.submit,
 reconcileLivePayments:calls.reconcile,livePaymentView:vi.fn(),
}));
const origin='https://split.test',token='aa'.repeat(32),id='22222222-2222-4222-8222-222222222222',billId='11111111-1111-4111-8111-111111111111';
const readiness={enabled:true,reason:'Configured',methods:{zcash:true,confidential:true}};
let store:Store,provider:LivePaymentProvider,bill:Bill,share:Share;
beforeEach(async()=>{
 vi.clearAllMocks();calls.reconcile.mockResolvedValue({checked:1,updated:1,unavailable:0});calls.prepare.mockResolvedValue({intent:{},signer:'payer.near',state:'prepared'});
 bill={id:billId,owner_hash:await hash(token),create_key:crypto.randomUUID(),merchant:'Synthetic',currency:'USD',original_total:'10',extra:'0',diners:2,total_units:'10000000',fx_rate:'1',fx_date:'2026-11-11',fx_source:'USD reference',mode:'live',receipt_id:null,recipient_account:'receiver.near',created_at:Date.now()};
 share={id,bill_id:billId,position:1,amount_units:'5000000',token_hash:await hash(token)};
 store={kind:'d1',bill:vi.fn(async()=>bill),share:vi.fn(async()=>share),attempts:vi.fn(async()=>[]),incrementLimit:vi.fn(async()=>1),expireDemo:vi.fn()} as unknown as Store;
 provider={allocate:vi.fn(),status:vi.fn()};
});
function request(path:string,body:unknown,authorized=true,requestOrigin=origin){return new Request(origin+'/api/'+path,{method:'POST',headers:{Origin:requestOrigin,'Content-Type':'application/json',...(authorized?{Cookie:`sdb_s_${id}=${token}`}:{})},body:JSON.stringify(body)});}
test('live allocation requires capability and same origin before provider work',async()=>{
 const handle=createHandler(store,undefined,{provider,readiness});
 const body={method:'zcash',refundAddress:'test',requestKey:crypto.randomUUID()};
 expect((await handle(request(`shares/${id}/attempts`,body,false))).status).toBe(404);
 expect((await handle(request(`shares/${id}/attempts`,body,true,'https://evil.test'))).status).toBe(403);
 expect(calls.create).not.toHaveBeenCalled();
});
test('API uses server share, bill and route gates rather than client amount/recipient',async()=>{
 const handle=createHandler(store,undefined,{provider,readiness});
 const key=crypto.randomUUID();
 expect((await handle(request(`shares/${id}/attempts`,{method:'zcash',requestKey:key,refundAddress:'test',amountUnits:'1',recipient:'attacker.near'}))).status).toBe(201);
 expect(calls.create).toHaveBeenCalledWith(store,provider,share,bill,{method:'zcash',requestKey:key,refundAddress:'test'},readiness.methods);
});
test('live bills never accept simulated settlement',async()=>{
 const handle=createHandler(store,undefined,{provider,readiness});
 expect((await handle(request(`shares/${id}/simulate`,{attemptId:crypto.randomUUID(),status:'paid'}))).status).toBe(403);
});
test('wallet endpoints require capability, active route and signature-only strict body',async()=>{
 const handle=createHandler(store,undefined,{provider,readiness});const attemptId=crypto.randomUUID();
 expect((await handle(request(`shares/${id}/prepare`,{attemptId,signer:'payer.near'},false))).status).toBe(404);
 expect((await handle(request(`shares/${id}/prepare`,{attemptId,signer:'payer.near'}))).status).toBe(200);
 expect(calls.prepare).toHaveBeenCalledWith(store,provider,id,attemptId,'payer.near',readiness.methods);
 expect((await handle(request(`shares/${id}/submit`,{attemptId,accountId:'payer.near',publicKey:'key',signature:'proof',intent:{amount:'1'}}))).status).toBe(400);
 expect(calls.submit).not.toHaveBeenCalled();
 const disabled=createHandler(store,undefined,{provider,readiness:{...readiness,enabled:false,methods:{zcash:false,confidential:false}}});
 expect((await disabled(request(`shares/${id}/prepare`,{attemptId,signer:'payer.near'}))).status).toBe(503);
});
test('refresh is scoped to the diner and cron is authorized separately even with allocation gate off',async()=>{
 const handle=createHandler(store,'cron-test',{provider});
 expect((await handle(request(`shares/${id}/refresh`,{}))).status).toBe(200);
 expect(calls.reconcile.mock.calls[0][2].shareId).toBe(id);
 expect((await handle(request('reconcile',{}))).status).toBe(401);
 const req=new Request(origin+'/api/reconcile',{method:'POST',headers:{Authorization:'Bearer cron-test'}});
 expect((await handle(req)).status).toBe(200);expect(calls.reconcile).toHaveBeenCalledTimes(2);
});

import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { supabaseStore } from '../lib/server/supabase-store';
import { d1Store } from '../lib/server/d1-store';
import type { Store, Bill, Share, Attempt } from '../lib/server/store';
import { ASSETS, paymentQuoteRequest, type VerifiedQuote, type PaymentRoute, type ConfidentialIntent } from '../lib/providers/intents';
import { createLivePayment, livePaymentView, reconcileLivePayments, prepareConfidentialPayment, submitConfidentialPayment, type LivePaymentProvider } from '../lib/server/live-payments';
import { hash } from '../lib/server/security';
// These synthetic service/storage tests exercise binding and transactional behavior.
// Real provider signature verification is covered separately in intents.test.ts.
vi.mock('@defuse-protocol/one-click-sdk-typescript', async (original) => ({...await original<object>(),verifyQuoteSignature:()=>true}));
vi.mock('../lib/providers/intents',async(original)=>({...await original<object>(),validateConfidentialSignature:async()=>({})}));
const pg=new PGlite(),sqlite=new DatabaseSync(':memory:');
const stores:Store[]=[];
function sqliteD1() {
 function prepare(sql:string) {
  function bind(...args:unknown[]) {
   const statement=sqlite.prepare(sql);
   const executeSync=()=>{statement.run(...args as []);return {success:true};};
   return {bind,executeSync,run:async()=>executeSync(),first:async()=>statement.get(...args as [])??null,all:async()=>({results:statement.all(...args as [])})};
  } return bind();
 }
 return {prepare,batch:async(statements:{executeSync:()=>unknown}[])=>{
  sqlite.exec('BEGIN IMMEDIATE');
  try {const result=statements.map(s=>s.executeSync());sqlite.exec('COMMIT');return result;}
  catch(e){sqlite.exec('ROLLBACK');throw e;}
 }} as unknown as D1Database;
}
beforeAll(async()=>{
 await pg.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
 for(const filename of ['202611100001_beta.sql','202611100002_application_modes.sql','202611100003_server_adapter.sql','202611100004_receiving_account.sql','202611110005_durable_live_payments.sql','202611130006_solana_usdc_method.sql','202611130007_unique_live_deposit.sql']) await pg.exec(await readFile(new URL('../supabase/migrations/'+filename,import.meta.url),'utf8'));
 for(const filename of ['0000_organic_jimmy_woo.sql','0001_complete_bruce_banner.sql','0002_durable_live_payments.sql','0003_unique_live_deposit.sql']) sqlite.exec(await readFile(new URL('../drizzle/'+filename,import.meta.url),'utf8'));
 vi.stubGlobal('fetch',async(input:string|URL|Request,init?:RequestInit)=>{
  const request=new Request(input,init),name=new URL(request.url).pathname.split('/').pop()!;
  const args=await request.json() as Record<string,unknown>;
  if(!/^sdb_[a-z_]+$/.test(name))throw new Error('Unexpected RPC');
  try {
   const {rows}=await pg.query<{value:unknown}>(`select public.${name}(${Object.keys(args).map((key,i)=>`${key}=>$${i+1}`).join(',')}) as value`,Object.values(args));
   return Response.json(rows[0].value);
  } catch(e){return Response.json({code:(e as {code:string}).code,message:'Database operation failed'},{status:400});}
 });
 stores.push(supabaseStore('https://database.test','test-server-key'),d1Store(sqliteD1()));
},30000);
beforeEach(async()=>{ await pg.exec('UPDATE public.live_payment_attempts SET quote=NULL'); sqlite.exec('UPDATE live_payment_attempts SET quote_json=NULL'); });
afterAll(async()=>{vi.unstubAllGlobals();await pg.close();sqlite.close();});
function quote(expires:number):VerifiedQuote {
 return {correlationId:'synthetic',timestamp:new Date().toISOString(),signature:'not-a-provider-signature',quoteRequest:{dry:false,deadline:new Date(expires).toISOString()},quote:{amountIn:'1000000',minAmountIn:'1000000',amountOut:'10000000',minAmountOut:'10000000',amountInFormatted:'0.01',amountInUsd:'10',amountOutFormatted:'10',amountOutUsd:'10',depositAddress:'synthetic-address-'+crypto.randomUUID(),deadline:new Date(expires).toISOString(),timeWhenInactive:new Date(expires).toISOString()}};
}
async function dinner(store:Store,mode:'live'|'demo'='live') {
 const b:Bill={id:crypto.randomUUID(),owner_hash:crypto.randomUUID(),create_key:crypto.randomUUID(),merchant:'Synthetic',currency:'USD',original_total:'20',extra:'0',diners:2,total_units:'20000000',fx_rate:'1',fx_date:'2026-11-11',fx_source:'test',mode,receipt_id:null,recipient_account:'synthetic.near',created_at:Date.now()};
 const s:Share={id:crypto.randomUUID(),bill_id:b.id,position:1,amount_units:'10000000',token_hash:'test-hash'};
 await store.createBill(b,[s]);return {b,s};
}
function reservation(s:Share) {
 const attempt:Attempt={id:crypto.randomUUID(),share_id:s.id,request_key:crypto.randomUUID(),method:'zcash',status:'pending',created_at:Date.now(),expires_at:Date.now()+900000,mode:'live'};
 return {attempt,route_fingerprint:'synthetic-fingerprint'};
}
for(const kind of ['supabase','d1'])describe(kind,()=>{
 const store=()=>stores.find(s=>s.kind===kind)!;
 test('atomically rejects a reused deposit identity across shares',async()=>{
  const db=store(),a=await dinner(db),b=await dinner(db),ra=await db.reserveLiveAttempt(reservation(a.s)),rb=await db.reserveLiveAttempt(reservation(b.s));
  const shared=quote(Date.now()+60000);
  const outcomes=await Promise.allSettled([db.saveLiveQuote(ra.attempt.id,shared),db.saveLiveQuote(rb.attempt.id,shared)]);
  expect(outcomes.map(result=>result.status).sort()).toEqual(['fulfilled','rejected']);
  const attempts=await Promise.all([db.liveAttempt(ra.attempt.id),db.liveAttempt(rb.attempt.id)]);
  expect(attempts.filter(attempt=>attempt?.allocation_state==='ready')).toHaveLength(1);
  expect(attempts.filter(attempt=>attempt?.quote)).toHaveLength(1);
  const loser=attempts.find(attempt=>attempt?.allocation_state==='allocating')!;
  await db.markLiveAllocationUnknown(loser.id);
  expect((await db.liveAttempt(loser.id))?.allocation_state).toBe('unknown');
  await expect(db.reserveLiveAttempt(reservation(loser.share_id===a.s.id?a.s:b.s))).rejects.toThrow();
 });
 test('atomic winner for concurrent retries; conflicting keys/routes and uncertain retries fail',async()=>{
  const db=store(),{s}=await dinner(db),r=reservation(s);
  const [first,retry]=await Promise.all([db.reserveLiveAttempt(r),db.reserveLiveAttempt({...r,attempt:{...r.attempt,id:crypto.randomUUID()}})]);
  expect([first.acquired,retry.acquired].sort()).toEqual([false,true]);expect(first.attempt.id).toBe(retry.attempt.id);
  await expect(db.reserveLiveAttempt({...r,route_fingerprint:'changed'})).rejects.toMatchObject({status:409});
  await expect(db.reserveLiveAttempt(reservation(s))).rejects.toMatchObject({status:409});expect(await db.attempts(s.id)).toHaveLength(1);
  await db.markLiveAllocationUnknown(first.attempt.id);
  await expect(db.reserveLiveAttempt(reservation(s))).rejects.toMatchObject({status:409});
  expect((await db.liveAttempt(first.attempt.id))?.allocation_state).toBe('unknown');
 });
 test('bill idempotency never changes mode, including concurrent demo/live creation',async()=>{
  const db=store(),{b,s}=await dinner(db);await expect(db.createBill({...b,id:crypto.randomUUID(),mode:'demo'},[{...s,id:crypto.randomUUID()}])).rejects.toMatchObject({status:409});
  const first={...b,id:crypto.randomUUID(),create_key:crypto.randomUUID()},second={...first,id:crypto.randomUUID(),mode:'demo' as const};
  const responses=await Promise.allSettled([db.createBill(first,[{...s,id:crypto.randomUUID(),bill_id:first.id}]),db.createBill(second,[{...s,id:crypto.randomUUID(),bill_id:second.id}])]);
  expect(responses.map(r=>r.status).sort()).toEqual(['fulfilled','rejected']);
 });
 test('demo records cannot allocate live quotes; private payload never enters base attempts',async()=>{
  const db=store(),demo=await dinner(db,'demo');await expect(db.reserveLiveAttempt(reservation(demo.s))).rejects.toThrow();
  const {s}=await dinner(db),r=await db.reserveLiveAttempt(reservation(s)),q=quote(Date.now()+30000);
  await db.saveLiveQuote(r.attempt.id,q);expect((await db.liveAttempt(r.attempt.id))?.quote).toEqual(q);
  expect(JSON.stringify(await db.attempts(s.id))).not.toMatch(/quote|depositAddress|synthetic-address|signature/);
  expect((await db.reconcilableLiveAttempts(100,s.id)).map(a=>a.id)).toEqual([r.attempt.id]);
 });
 test('expired quotes reconcile late output; stale status cannot undo paid; later refund can',async()=>{
  const db=store(),{s}=await dinner(db),r=await db.reserveLiveAttempt(reservation(s)),now=Date.now();
  await db.saveLiveQuote(r.attempt.id,quote(now-10000));
  await db.recordLiveSettlement(r.attempt.id,{state:'pending',providerStatus:'PENDING_DEPOSIT',updatedAt:new Date(now-3000).toISOString()},now);
  expect((await db.attempts(s.id))[0].status).toBe('expired');await expect(db.reserveLiveAttempt(reservation(s))).rejects.toThrow();
  await db.recordLiveSettlement(r.attempt.id,{state:'paid',providerStatus:'SUCCESS',updatedAt:new Date(now-2000).toISOString()},now);
  await db.recordLiveSettlement(r.attempt.id,{state:'pending',providerStatus:'PROCESSING',updatedAt:new Date(now-2500).toISOString()},now);
  expect((await db.attempts(s.id))[0].status).toBe('paid');
  await db.recordLiveSettlement(r.attempt.id,{state:'pending',providerStatus:'PROCESSING',updatedAt:new Date(now-1000).toISOString()},now);
  expect((await db.attempts(s.id))[0].status).toBe('paid');
  await db.recordLiveSettlement(r.attempt.id,{state:'refunded',providerStatus:'REFUNDED',updatedAt:new Date(now).toISOString()},now);
  expect((await db.attempts(s.id))[0].status).toBe('refunded');expect(await db.reconcilableLiveAttempts(100,s.id)).toHaveLength(1);
  await expect(db.reserveLiveAttempt(reservation(s))).rejects.toMatchObject({status:409});
 });
 test('failed real quotes cannot be replaced without verified provider cancellation/finality',async()=>{
  const db=store(),{s}=await dinner(db),input=reservation(s),r=await db.reserveLiveAttempt(input),now=Date.now();
  await db.saveLiveQuote(r.attempt.id,quote(now+60000));
  await db.recordLiveSettlement(r.attempt.id,{state:'failed',providerStatus:'FAILED',updatedAt:new Date(now).toISOString()},now);
  await expect(db.reserveLiveAttempt(reservation(s))).rejects.toMatchObject({status:409});
  const same=await db.reserveLiveAttempt({...input,attempt:{...input.attempt,id:crypto.randomUUID()}});
  expect(same.acquired).toBe(false);expect(same.attempt.id).toBe(r.attempt.id);
 });
 test('review never counts as paid; failed polls preserve durable state',async()=>{
  const db=store(),{s}=await dinner(db),r=await db.reserveLiveAttempt(reservation(s)),now=Date.now();
  await db.saveLiveQuote(r.attempt.id,quote(now+60000));
  await db.recordLiveSettlement(r.attempt.id,{state:'review',providerStatus:'SUCCESS_UNDERPAID',updatedAt:new Date(now).toISOString()},now);
  await db.recordLiveSettlement(r.attempt.id,null,now+1000);
  const a=await db.liveAttempt(r.attempt.id);expect(a?.allocation_state).toBe('review');expect(a?.status).toBe('pending');expect(a?.last_checked_at).toBe(now+1000);
  await expect(db.reserveLiveAttempt(reservation(s))).rejects.toThrow();
 });
 test('confidential payload signer is immutable; exactly one submission reservation survives retries',async()=>{
  const db=store(),{s}=await dinner(db),input=reservation(s);input.attempt.method='confidential';
  const r=await db.reserveLiveAttempt(input),now=Date.now();await db.saveLiveQuote(r.attempt.id,quote(now+60000));
  const intent:ConfidentialIntent={standard:'nep413',payload:{message:'synthetic',nonce:'nonce',recipient:'intents.far'}};
  const prepared=await db.prepareConfidentialIntent(r.attempt.id,'payer.near',intent);
  const repeated=await db.prepareConfidentialIntent(r.attempt.id,'payer.near',{...intent,payload:{...intent.payload,nonce:'other'}});
  expect(repeated.signed_intent).toEqual(prepared.signed_intent);
  await expect(db.prepareConfidentialIntent(r.attempt.id,'different.near',intent)).rejects.toThrow();
  const [a,b]=await Promise.all([db.reserveConfidentialSubmit(r.attempt.id,now),db.reserveConfidentialSubmit(r.attempt.id,now)]);
  expect([a.acquired,b.acquired].sort()).toEqual([false,true]);
  await db.finishConfidentialSubmit(r.attempt.id,'unknown');
  expect((await db.reserveConfidentialSubmit(r.attempt.id,now)).acquired).toBe(false);
  expect((await db.liveAttempt(r.attempt.id))?.submission_state).toBe('unknown');
 });

});
test('browser roles cannot read/execute private live operations',async()=>{
 const {rows}=await pg.query(`select has_table_privilege('anon','public.live_payment_attempts','select') as readable,has_function_privilege('authenticated','public.sdb_live_read(uuid)','execute') as executable,has_function_privilege('service_role','public.sdb_live_read(uuid)','execute') as server`);
 expect(rows[0]).toEqual({readable:false,executable:false,server:true});
});

const refund='t1NYKoZGziMsyMvgK9K5b2qZGym3UQsw3Tz';
function executable(route:PaymentRoute):VerifiedQuote {
 const now=Date.now(),q=quote(now+14*60000);
 q.quoteRequest=paymentQuoteRequest(route,false,now);q.quote.amountOut=route.amountUnits;q.quote.minAmountOut=route.amountUnits;
 q.quote.depositAddress=route.method==='zcash'?refund:route.method==='solana'?'GmaDrppBC7P5ARKV8g3djiwP89vz1jLK23V2GBjuAEGB':'synthetic.deposit';return q;
}
const makeProvider=()=>({allocate:vi.fn(async(route:PaymentRoute)=>executable(route)),status:vi.fn(async()=>({state:'pending' as const,providerStatus:'PENDING_DEPOSIT',updatedAt:new Date().toISOString()}))});
for(const kind of ['supabase','d1'])describe(kind+' synthetic service',()=>{
 const store=()=>stores.find(s=>s.kind===kind)!;
 test('gates prevent allocation; concurrent capability retries allocate once and project only safe instructions',async()=>{
  const db=store(),{b,s}=await dinner(db),provider=makeProvider(),input={method:'zcash' as const,requestKey:crypto.randomUUID(),refundAddress:refund};
  await expect(createLivePayment(db,provider,s,b,input,{zcash:false,confidential:false})).rejects.toMatchObject({status:503});
  expect(provider.allocate).not.toHaveBeenCalled();expect(await db.attempts(s.id)).toHaveLength(0);
  await Promise.all([createLivePayment(db,provider,s,b,input,{zcash:true,confidential:false}),createLivePayment(db,provider,s,b,input,{zcash:true,confidential:false})]);
  expect(provider.allocate).toHaveBeenCalledTimes(1);const a=(await db.reconcilableLiveAttempts(1,s.id))[0];
  const view=await livePaymentView(db,a);expect(view?.uri).toBe('zcash:'+refund+'?amount=0.01000000');
  expect(JSON.stringify(view)).not.toMatch(/recipient|refundTo|signature|correlationId|synthetic.near/);
 });
 test('a collision never exposes a second payment instruction',async()=>{
  const db=store(),a=await dinner(db),b=await dinner(db),provider=makeProvider();
  const input={method:'zcash' as const,requestKey:crypto.randomUUID(),refundAddress:refund};
  const gates={zcash:true,confidential:false};
  await createLivePayment(db,provider,a.s,a.b,input,gates);
  const second={...input,requestKey:crypto.randomUUID()};
  await expect(createLivePayment(db,provider,b.s,b.b,second,gates)).rejects.toMatchObject({status:503});
  const retry=await createLivePayment(db,provider,b.s,b.b,second,gates);
  expect(retry.allocation_state).toBe('unknown');
  expect((await livePaymentView(db,retry))?.address).toBeUndefined();
  expect(provider.allocate).toHaveBeenCalledTimes(2);
 });
 test('Solana persists once, projects USDC URI, hides it after deposit and reconciles credit',async()=>{
  const db=store(),{b,s}=await dinner(db),provider=makeProvider();
  const input={method:'solana' as const,requestKey:crypto.randomUUID(),refundAddress:'GmaDrppBC7P5ARKV8g3djiwP89vz1jLK23V2GBjuAEGB'};
  const gates={zcash:false,confidential:false,solana:true};
  await expect(createLivePayment(db,provider,s,b,input,{...gates,solana:false})).rejects.toMatchObject({status:503});
  const a=await createLivePayment(db,provider,s,b,input,gates);
  expect((await createLivePayment(db,provider,s,b,input,gates)).id).toBe(a.id);
  expect(provider.allocate).toHaveBeenCalledTimes(1);
  expect(await livePaymentView(db,a)).toMatchObject({symbol:'USDC',uri:'solana:'+input.refundAddress+'?amount=1.000000&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'});
  expect(JSON.stringify(await livePaymentView(db,a))).not.toMatch(/recipient|refundTo|signature|synthetic.near/);
  await expect(createLivePayment(db,provider,s,b,{...input,requestKey:crypto.randomUUID()},gates)).rejects.toMatchObject({status:409});
  const now=Date.now();
  await db.recordLiveSettlement(a.id,{state:'pending',providerStatus:'KNOWN_DEPOSIT_TX',updatedAt:new Date(now).toISOString()},now);
  expect((await livePaymentView(db,(await db.liveAttempt(a.id))!))?.uri).toBeUndefined();
  const status=vi.fn(async()=>({state:'paid' as const,providerStatus:'SUCCESS',updatedAt:new Date(now+1000).toISOString()}));
  await reconcileLivePayments(db,{...provider,status},{shareId:s.id,now:now+1000});
  expect(status).toHaveBeenCalledTimes(1);expect((await db.attempts(s.id))[0].status).toBe('paid');
 });
 test('unsupported Solana memo leaves an unknown lock and no fundable instructions',async()=>{
  const db=store(),{b,s}=await dinner(db),provider=makeProvider();
  provider.allocate.mockImplementation(async(route)=>{const q=executable(route);q.quote.depositMemo='required';return q;});
  await expect(createLivePayment(db,provider,s,b,{method:'solana',requestKey:crypto.randomUUID(),refundAddress:'GmaDrppBC7P5ARKV8g3djiwP89vz1jLK23V2GBjuAEGB'},{zcash:false,confidential:false,solana:true})).rejects.toMatchObject({status:503});
  const attempt=(await db.reconcilableLiveAttempts(1,s.id))[0];
  // Unknown allocations without a persisted quote are kept locked for review.
  const saved=attempt??await db.liveAttempt((await db.attempts(s.id))[0].id);
  expect(saved?.allocation_state).toBe('unknown');expect((await livePaymentView(db,saved!))?.uri).toBeUndefined();
 });
 test('unknown provider result never causes automatic second allocation',async()=>{
  const db=store(),{b,s}=await dinner(db),provider=makeProvider();provider.allocate.mockRejectedValue(new Error('private upstream error'));
  const input={method:'zcash' as const,requestKey:crypto.randomUUID(),refundAddress:refund};
  await expect(createLivePayment(db,provider,s,b,input,{zcash:true,confidential:false})).rejects.toMatchObject({status:503});
  const retry=await createLivePayment(db,provider,s,b,input,{zcash:true,confidential:false});expect(retry.allocation_state).toBe('unknown');
  expect(provider.allocate).toHaveBeenCalledTimes(1);expect((await livePaymentView(db,retry))?.uri).toBeUndefined();
 });
 test('persisted quote tampering is quarantined before provider calls or browser instructions',async()=>{
  const db=store(),{b,s}=await dinner(db),route:PaymentRoute={method:'zcash',recipient:b.recipient_account!,refundTo:refund,amountUnits:s.amount_units};
  const r=reservation(s);r.route_fingerprint=await hash(JSON.stringify([route.method,route.recipient,route.refundTo,route.amountUnits]));
  const a=await db.reserveLiveAttempt(r),q=executable(route);q.quoteRequest.recipient='attacker.near';await db.saveLiveQuote(a.attempt.id,q);
  const provider=makeProvider();await reconcileLivePayments(db,provider,{shareId:s.id});expect(provider.status).not.toHaveBeenCalled();
  const saved=(await db.liveAttempt(a.attempt.id))!;expect(saved.allocation_state).toBe('review');expect(saved.status).not.toBe('paid');
  expect((await livePaymentView(db,saved))?.uri).toBeUndefined();
 });
 test('detected or partial deposits hide instructions; processing survives expiry and late delivery settles once',async()=>{
  const db=store(),{b,s}=await dinner(db),provider=makeProvider();
  const a=await createLivePayment(db,provider,s,b,{method:'zcash',requestKey:crypto.randomUUID(),refundAddress:refund},{zcash:true,confidential:false});
  const later=Date.now()+20*60000;
  await db.recordLiveSettlement(a.id,{state:'pending',providerStatus:'INCOMPLETE_DEPOSIT',updatedAt:new Date(later-1000).toISOString()},later);
  await db.recordLiveSettlement(a.id,{state:'pending',providerStatus:'PENDING_DEPOSIT',updatedAt:new Date(later-500).toISOString()},later);
  const processing=(await db.liveAttempt(a.id))!;expect(processing.status).toBe('pending');expect(processing.deposit_observed).toBe(true);
  expect(await livePaymentView(db,processing,later)).toMatchObject({state:'processing'});expect((await livePaymentView(db,processing,later))?.uri).toBeUndefined();
  const status=vi.fn(async()=>({state:'paid' as const,providerStatus:'SUCCESS',updatedAt:new Date(later).toISOString()}));
  await reconcileLivePayments(db,{...provider,status},{shareId:s.id,now:later});expect(status).toHaveBeenCalledTimes(1);expect((await db.attempts(s.id))[0].status).toBe('paid');
 });
 test('confidential preparation returns durable exact intent; duplicate or uncertain spending submits once',async()=>{
  const db=store(),{b,s}=await dinner(db),base=makeProvider();
  const provider:LivePaymentProvider={...base,generateIntent:vi.fn(async(q:VerifiedQuote,signer:string):Promise<ConfidentialIntent>=>({standard:'nep413',payload:{recipient:'intents.far',nonce:btoa('n'.repeat(32)),message:JSON.stringify({signer_id:signer,deadline:q.quote.deadline,intents:[{intent:'transfer',receiver_id:q.quote.depositAddress,tokens:{['imt:51e8f94d77b5e90dc9852ca6113771e11e8382ce69473a75e313e41665de7cbe:'+ASSETS.usdc]:q.quote.amountIn}}]})}})),submitIntent:vi.fn(async()=>{throw new Error('uncertain');})};
  const a=await createLivePayment(db,provider,s,b,{method:'confidential',requestKey:crypto.randomUUID(),refundAddress:'payer.near'},{zcash:false,confidential:true});
  const prepared=await prepareConfidentialPayment(db,provider,s.id,a.id,'payer.near',{confidential:true});
  expect((await prepareConfidentialPayment(db,provider,s.id,a.id,'payer.near',{confidential:true})).intent).toEqual(prepared.intent);
  const signature={accountId:'payer.near',publicKey:'synthetic',signature:'synthetic'};
  await expect(submitConfidentialPayment(db,provider,s.id,a.id,signature,{confidential:true})).rejects.toMatchObject({status:503});
  expect(await submitConfidentialPayment(db,provider,s.id,a.id,signature,{confidential:true})).toEqual({state:'unknown'});
  expect(provider.submitIntent).toHaveBeenCalledTimes(1);
  expect((await livePaymentView(db,(await db.liveAttempt(a.id))!))?.state).toBe('unknown');
 });
});

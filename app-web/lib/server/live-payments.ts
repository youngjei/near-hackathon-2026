import { paymentQuoteRequest, validatePaymentQuote, isTransparentZcashAddress, validateConfidentialIntent, validateConfidentialSignature, type ConfidentialIntent, type PaymentRoute, type PaymentQuoteRequest, type VerifiedQuote, type Settlement } from '../providers/intents';
import { zcashPaymentUri } from '../wallets/zcash';
import { hash, HttpError } from './security';
import type { Store, Bill, Share, LiveAttempt } from './store';

export type LivePaymentProvider = {
  allocate(route: PaymentRoute): Promise<VerifiedQuote>;
  status(saved: VerifiedQuote): Promise<Settlement>;
  generateIntent?(saved: VerifiedQuote, signer: string): Promise<ConfidentialIntent>;
  submitIntent?(saved: VerifiedQuote, signer: string, stored: ConfidentialIntent, signature: ConfidentialSignature): Promise<{intentHash:string}>;
};
export type ConfidentialSignature = {accountId:string;publicKey:string;signature:string};
export type LivePaymentInput = {method:'zcash'|'confidential';requestKey:string;refundAddress:string};
export type PaymentInstructions = {
  amount:string; symbol:'ZEC'|'USDC'; address?:string; uri?:string; walletUrl?:string;
  statusMessage:string; state:string;
};
function fingerprint(route: PaymentRoute) {
  return hash(JSON.stringify([route.method,route.recipient,route.refundTo,route.amountUnits]));
}
function routeFor(share: Share, bill: Bill, method: PaymentRoute['method'], refundTo: string): PaymentRoute {
  if (bill.mode!=='live' || share.bill_id!==bill.id || !bill.recipient_account)
    throw new HttpError(409,'This bill is not ready for live payment.');
  return {method,recipient:bill.recipient_account,refundTo,amountUnits:share.amount_units};
}
// Validate persisted records against the immutable bill, not against their own echo.
async function boundQuote(store: Store, a: LiveAttempt, historic: boolean, now: number) {
  const share = await store.share(a.share_id);
  const bill = share ? await store.bill(share.bill_id) : null;
  if (!share || !bill || !a.quote || !['zcash','confidential'].includes(a.method)) throw new Error('Unbound quote');
  const route = routeFor(share,bill,a.method as PaymentRoute['method'],String(a.quote.quoteRequest.refundTo ?? ''));
  if (await fingerprint(route)!==a.route_fingerprint) throw new Error('Unbound quote');
  const expected = paymentQuoteRequest(route,false,a.created_at);
  // Allocation happens after the durable reservation, so its exact request deadline may differ slightly.
  const deadline = a.quote.quoteRequest.deadline;
  if (typeof deadline!=='string' || !Number.isFinite(Date.parse(deadline)) || Date.parse(deadline)<a.created_at || Date.parse(deadline)>a.created_at+16*60000) throw new Error('Invalid deadline');
  return validatePaymentQuote(a.quote,{...expected,deadline} as PaymentQuoteRequest,{historic,now});
}

export async function createLivePayment(
  store: Store, provider: LivePaymentProvider, share: Share, bill: Bill,
  input: LivePaymentInput, gates: {zcash:boolean;confidential:boolean},
): Promise<LiveAttempt> {
  if (!gates[input.method]) throw new HttpError(503,'This payment method is awaiting funded acceptance testing.');
  const savedShare = await store.share(share.id);
  const savedBill = savedShare ? await store.bill(savedShare.bill_id) : null;
  if (!savedShare || !savedBill || savedBill.id!==bill.id) throw new HttpError(404,'Payment request not found.');
  const prior=await store.attempts(savedShare.id);
  if (!prior.some(a=>a.request_key===input.requestKey) && prior.some(a=>a.mode==='live'))
    throw new HttpError(409,'This share already has a real payment request. Refresh its status; ask the organizer to review before any replacement.');
  const route = routeFor(savedShare,savedBill,input.method,input.refundAddress.trim());
  paymentQuoteRequest(route,false);
  if (route.method==='zcash' && !await isTransparentZcashAddress(route.refundTo))
    throw new HttpError(400,'Use a valid transparent Zcash refund address (t1 or t3).');
  const now = Date.now();
  const reservation = await store.reserveLiveAttempt({
    attempt:{id:crypto.randomUUID(),share_id:share.id,request_key:input.requestKey,method:input.method,status:'pending',created_at:now,expires_at:now+15*60000,mode:'live'},
    route_fingerprint:await fingerprint(route),
  });
  if (!reservation.acquired) return reservation.attempt;
  try {
    const quote = await provider.allocate(route);
    const candidate = {...reservation.attempt,quote};
    await boundQuote(store,candidate,false,Date.now());
    // Refuse unsupported wallet instructions before persisting a fundable checkout.
    if (route.method==='zcash') await zcashPaymentUri(quote);
    await store.saveLiveQuote(candidate.id,quote);
    const saved = await store.liveAttempt(candidate.id);
    if (!saved || saved.allocation_state!=='ready') throw new Error('Allocation not saved');
    return saved;
  } catch {
    // A timeout or crash may occur after provider allocation. Never re-issue it automatically.
    await store.markLiveAllocationUnknown(reservation.attempt.id).catch(()=>{});
    throw new HttpError(503,'The payment request could not be confirmed. Refresh its status before trying again.');
  }
}

// Call only after capability authorization. Do not spread a private LiveAttempt into JSON.
export async function livePaymentView(store: Store, a: LiveAttempt, now = Date.now()): Promise<PaymentInstructions | null> {
  let quote = a.quote;
  if (!quote) return {amount:'',symbol:a.method==='zcash'?'ZEC':'USDC',state:a.allocation_state,statusMessage:a.allocation_state==='unknown'?'The payment request is unconfirmed. Do not send funds; contact the organizer.':'Preparing the payment request. Refresh its status.'};
  try { quote=await boundQuote(store,a,true,now); }
  catch { return {amount:'',symbol:a.method==='zcash'?'ZEC':'USDC',state:'review',statusMessage:'Payment instructions could not be verified. Do not send funds.'}; }
  const decimals = a.method==='zcash'?8:6;
  const n = BigInt(quote.quote.amountIn), scale=10n**BigInt(decimals);
  const amount = `${n/scale}.${(n%scale).toString().padStart(decimals,'0')}`;
  const view:PaymentInstructions={amount,symbol:decimals===8?'ZEC':'USDC',state:a.allocation_state,statusMessage:'Checking the payment with the provider.'};
  if (a.status==='paid') return {...view,state:'paid',statusMessage:'Payment confirmed.'};
  if (a.status==='refunded') return {...view,state:'refunded',statusMessage:'The provider reports a refund.'};
  if (a.status==='failed') return {...view,state:'failed',statusMessage:'This payment failed. Check your wallet for any refund.'};
  if ((await store.attempts(a.share_id)).some(other=>other.status==='paid')) return {...view,state:'paid',statusMessage:'This share was paid by an earlier request. Do not pay again.'};
  if ((await store.attempts(a.share_id)).some(other=>other.id!==a.id && other.status==='pending')) return {...view,state:'review',statusMessage:'An earlier payment request is still processing. Do not send another payment.'};
  if (a.allocation_state!=='ready') return {...view,statusMessage:'This payment needs review. Do not send another payment.'};
  if (a.submission_state==='submitting' || a.submission_state==='accepted' || a.submission_state==='unknown') return {...view,state:a.submission_state,statusMessage:a.submission_state==='unknown'?'Spending submission is unconfirmed. Do not sign or submit another payment.':'Spending was submitted. Waiting for settlement; do not send another payment.'};
  if (a.deposit_observed || (a.provider_status && a.provider_status!=='PENDING_DEPOSIT')) return {...view,state:'processing',statusMessage:a.provider_status==='INCOMPLETE_DEPOSIT'?'The provider detected an incomplete deposit. Do not send another payment; wait for settlement or refund.':'A deposit was detected. Waiting for settlement; do not send another payment.'};
  if (a.expires_at<=now || Date.parse(String(quote.quoteRequest.deadline))<=now) return {...view,state:'expired',statusMessage:'Payment instructions expired. Checking for late payment. A replacement remains blocked because the old payment address may still receive funds. Ask the organizer to review.'};
  if (a.method==='zcash') {
    try {
      const uri=await zcashPaymentUri(quote,now);
      return {...view,address:quote.quote.depositAddress,uri,statusMessage:'Send the exact ZEC amount from your wallet before this request expires.'};
    } catch { return {...view,state:'review',statusMessage:'Payment instructions could not be verified. Do not send funds.'}; }
  }
  return {...view,statusMessage:'Confidential balance spending requires a verified wallet handoff.'};
}

export async function reconcileLivePayments(store: Store, provider: LivePaymentProvider, options:{limit?:number;now?:number;shareId?:string}={}) {
  const now=options.now??Date.now();
  const attempts=await store.reconcilableLiveAttempts(options.limit??50,options.shareId);
  let updated=0,unavailable=0;
  async function reconcile(a:LiveAttempt) {
    let quote:VerifiedQuote;
    try { quote=await boundQuote(store,a,true,now); }
    catch {
      await store.recordLiveSettlement(a.id,{state:'review',providerStatus:'INVALID_SAVED_BINDING',updatedAt:new Date(now).toISOString()},now);
      unavailable++; return;
    }
    try {
      const settlement=await provider.status(quote);
      if (!Number.isFinite(Date.parse(settlement.updatedAt)) || Date.parse(settlement.updatedAt)>now+60000) throw new Error('Invalid status time');
      await store.recordLiveSettlement(a.id,settlement,now);
      updated++;
    } catch {
      await store.recordLiveSettlement(a.id,null,now);
      unavailable++;
    }
  }
  // Bound provider concurrency so one slow lookup does not block every other share.
  let cursor=0;
  await Promise.all(Array.from({length:Math.min(3,attempts.length)},async()=>{
    while(cursor<attempts.length) { const a=attempts[cursor++]; await reconcile(a); }
  }));
  return {checked:attempts.length,updated,unavailable};
}

async function confidentialAttempt(store:Store,shareId:string,attemptId:string,gate:boolean) {
  if (!gate) throw new HttpError(503,'Confidential payments are awaiting funded acceptance testing.');
  const a=await store.liveAttempt(attemptId);
  if (!a || a.share_id!==shareId || a.method!=='confidential') throw new HttpError(404,'Payment request not found.');
  const now=Date.now(),quote=await boundQuote(store,a,true,now);
  if ((await store.attempts(a.share_id)).some(other=>other.status==='paid')) throw new HttpError(409,'This share is already paid.');
  if ((await store.attempts(a.share_id)).some(other=>other.id!==a.id && other.status==='pending')) throw new HttpError(409,'An earlier payment is still processing. Refresh its status.');
  if (a.allocation_state!=='ready' || a.status!=='pending' || a.deposit_observed || a.expires_at<=now || Date.parse(String(quote.quoteRequest.deadline))<=now || (a.provider_status && a.provider_status!=='PENDING_DEPOSIT'))
    throw new HttpError(409,'This payment can no longer be signed. Refresh its status.');
  return {a,quote};
}
export async function prepareConfidentialPayment(store:Store,provider:LivePaymentProvider,shareId:string,attemptId:string,signer:string,gates:{confidential:boolean}) {
  const {a,quote}=await confidentialAttempt(store,shareId,attemptId,gates.confidential);
  if (quote.quoteRequest.refundTo!==signer) throw new HttpError(409,'Use the same confidential account selected for this payment.');
  if (a.submission_state && a.submission_state!=='prepared') throw new HttpError(409,'Spending was already submitted. Refresh its status.');
  if (!provider.generateIntent) throw new HttpError(503,'Wallet signing is unavailable.');
  const generated=a.signed_intent??await provider.generateIntent(quote,signer);
  const intent=validateConfidentialIntent(generated,quote,signer);
  const saved=await store.prepareConfidentialIntent(a.id,signer,intent);
  // Concurrent preparations return the first durable payload, not a discarded nonce.
  return {intent:validateConfidentialIntent(saved.signed_intent,quote,signer),signer,state:saved.submission_state};
}
export async function submitConfidentialPayment(store:Store,provider:LivePaymentProvider,shareId:string,attemptId:string,signature:ConfidentialSignature,gates:{confidential:boolean}) {
  const {a,quote}=await confidentialAttempt(store,shareId,attemptId,gates.confidential);
  if (!a.signer_account || !a.signed_intent || !provider.submitIntent) throw new HttpError(409,'Prepare the wallet payment before signing.');
  const intent=validateConfidentialIntent(a.signed_intent,quote,a.signer_account);
  await validateConfidentialSignature(intent,a.signer_account,signature);
  const reserved=await store.reserveConfidentialSubmit(a.id,Date.now());
  if (!reserved.acquired) return {state:reserved.attempt.submission_state??'unavailable'};
  try {
    const result=await provider.submitIntent(quote,a.signer_account,intent,signature);
    await store.finishConfidentialSubmit(a.id,'accepted',result.intentHash);
    return {state:'accepted'};
  } catch {
    await store.finishConfidentialSubmit(a.id,'unknown').catch(()=>{});
    throw new HttpError(503,'Spending submission could not be confirmed. Refresh its status; do not submit another payment.');
  }
}

// Enabling a route is a separate operator action from configuring an API key.
// The acceptance switch represents completed real-wallet and funded testing,
// including refund and settlement checks. It is not set by this repository.
export type PaymentReadiness = {enabled:boolean;testing?:boolean;reason:string;methods:{zcash:boolean;confidential:boolean;solana:boolean}};
export function paymentReadiness(settings: Record<string, string | undefined>, liveTestOwnerAuthorized = false): PaymentReadiness {
  // The runtime must verify the owner's server-authenticated session. Environment
  // flags and client-supplied identity headers alone never establish that proof.
  const testingRequested = settings.LIVE_PAYMENT_TESTING === 'true';
  const testing = testingRequested && liveTestOwnerAuthorized;
  const enabled = settings.LIVE_PAYMENTS_ENABLED === 'true' && !!settings.NEAR_INTENTS_API_KEY &&
    (!testingRequested || liveTestOwnerAuthorized);
  const zcash = enabled && settings.LIVE_ZCASH_ENABLED === 'true' && (settings.ZCASH_ACCEPTANCE_VERIFIED === 'true' || testing);
  const confidential = enabled && settings.LIVE_CONFIDENTIAL_ENABLED === 'true' && settings.CONFIDENTIAL_ACCEPTANCE_VERIFIED === 'true';
  const solana = enabled && settings.LIVE_SOLANA_ENABLED === 'true' && (settings.SOLANA_ACCEPTANCE_VERIFIED === 'true' || testing);
  return {
    enabled: zcash || confidential || solana,
    testing,
    reason: testing ? 'Pilot testing uses real funds. Wallet, refund and settlement acceptance is incomplete; this is not a verified rollout.' : zcash || confidential || solana ? 'Enabled payment methods require payer authorization.' : 'Live payments need wallet authorization, supported refunds and verified settlement.',
    methods: {zcash, confidential, solana},
  };
}
export const liveReadiness = paymentReadiness({});
export function requireLiveReadiness(): never {
  throw new Error(liveReadiness.reason);
}

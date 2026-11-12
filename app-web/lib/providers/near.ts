// Enabling a route is a separate operator action from configuring an API key.
// The acceptance switch represents completed real-wallet and funded testing,
// including refund and settlement checks. It is not set by this repository.
export type PaymentReadiness = {enabled:boolean;reason:string;methods:{zcash:boolean;confidential:boolean;solana:boolean}};
export function paymentReadiness(settings: Record<string, string | undefined>): PaymentReadiness {
  const enabled = settings.LIVE_PAYMENTS_ENABLED === 'true' && !!settings.NEAR_INTENTS_API_KEY;
  const zcash = enabled && settings.LIVE_ZCASH_ENABLED === 'true' && settings.ZCASH_ACCEPTANCE_VERIFIED === 'true';
  const confidential = enabled && settings.LIVE_CONFIDENTIAL_ENABLED === 'true' && settings.CONFIDENTIAL_ACCEPTANCE_VERIFIED === 'true';
  const solana = enabled && settings.LIVE_SOLANA_ENABLED === 'true' && settings.SOLANA_ACCEPTANCE_VERIFIED === 'true';
  return {
    enabled: zcash || confidential || solana,
    reason: zcash || confidential || solana ? 'Enabled payment methods require payer authorization.' : 'Live payments need wallet authorization, supported refunds and verified settlement.',
    methods: {zcash, confidential, solana},
  };
}
export const liveReadiness = paymentReadiness({});
export function requireLiveReadiness(): never {
  throw new Error(liveReadiness.reason);
}

// The beta intentionally cannot execute live payments. Add a verified wallet
// adapter and funded acceptance evidence before enabling this boundary.
export const liveReadiness = {
  enabled: false,
  reason:
    "Live payments need wallet authorization, supported refunds and verified settlement.",
} as const;
export function requireLiveReadiness(): never {
  throw new Error(liveReadiness.reason);
}
// Verified quote and status adapters live in intents.ts.
// They are not wired to live bill creation or settlement yet.

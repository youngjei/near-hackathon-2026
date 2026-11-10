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
// Read-only integration boundary. Per-request credentials, never a mutable SDK singleton.
export async function inspectExecution(
  depositAddress: string,
  partnerKey: string,
) {
  if (!partnerKey) throw new Error("Partner access is not configured.");
  const url = new URL("https://1click.chaindefuser.com/v0/status");
  url.searchParams.set("depositAddress", depositAddress);
  const r = await fetch(url, {
    headers: { "X-API-Key": partnerKey },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error("Payment status is unavailable.");
  return r.json();
}

export type Status = "pending" | "paid" | "expired" | "failed" | "refunded";
export function transition(current: Status, next: Status): Status {
  if (current === next) return current;
  if (next === "paid" && ["pending", "expired", "failed"].includes(current))
    return next;
  if (
    next === "refunded" &&
    ["pending", "paid", "expired", "failed"].includes(current)
  )
    return next;
  if (current === "pending" && ["expired", "failed"].includes(next))
    return next;
  throw new Error("This payment cannot change to that state.");
}
export function shareStatus(
  attempts: { status: string; expires_at: number }[],
  now = Date.now(),
): Status | "unpaid" {
  if (attempts.some((a) => a.status === "paid")) return "paid";
  if (attempts.some((a) => a.status === "pending" && a.expires_at > now))
    return "pending";
  const latest = attempts[0];
  if (!latest) return "unpaid";
  return latest.status === "pending" ? "expired" : (latest.status as Status);
}
// Never call this in demo mode: a demo has no fundable destination.
export function zip321(address: string, zec: string) {
  if (!/^t[13][1-9A-HJ-NP-Za-km-z]{33}$/.test(address))
    throw new Error("Unsupported deposit address");
  if (!/^\d+(\.\d{1,8})?$/.test(zec) || Number(zec) <= 0)
    throw new Error("Invalid ZEC amount");
  return `zcash:${address}?amount=${zec}`;
}

import { useEffect, useRef } from "react";
import type { Checkout } from "./client";

export function shouldRefreshLivePayment(data: Checkout): boolean {
  if (data.bill.mode !== "live" || ["paid", "refunded"].includes(data.share.status)) return false;
  return data.attempts.some((attempt) => attempt.mode === "live" &&
    !["paid", "failed", "refunded"].includes(attempt.status));
}

// The visibility callback makes the browser policy independently testable.
// The interval is fixed: application settings cannot accelerate provider polling.
export function scheduleLivePaymentRefresh(
  refresh: () => Promise<void>,
  isVisible: () => boolean = () => document.visibilityState === "visible",
) {
  let running = false;
  let stopped = false;
  const timer = setInterval(() => {
    if (stopped || running || !isVisible()) return;
    running = true;
    Promise.resolve().then(refresh).catch(() => {}).finally(() => { running = false; });
  }, 15_000);
  return () => { stopped = true; clearInterval(timer); };
}

export function useLivePaymentRefresh(data: Checkout, refresh: () => Promise<void>, paused: boolean) {
  const current = useRef({ refresh, paused });
  useEffect(() => { current.current = { refresh, paused }; }, [refresh, paused]);
  const enabled = shouldRefreshLivePayment(data);
  useEffect(() => {
    if (!enabled) return;
    return scheduleLivePaymentRefresh(async () => {
      if (!current.current.paused) await current.current.refresh();
    });
  }, [enabled, data.share.id]);
}

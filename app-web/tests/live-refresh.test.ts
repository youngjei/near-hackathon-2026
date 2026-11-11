import { afterEach, describe, expect, it, vi } from "vitest";
import { scheduleLivePaymentRefresh, shouldRefreshLivePayment } from "../lib/live-refresh";
import type { Checkout } from "../lib/client";

function checkout(mode = "live", status = "pending", attemptStatus = "pending"): Checkout {
  return { bill: { mode }, share: { status }, attempts: [{ mode, status: attemptStatus }] } as Checkout;
}
afterEach(() => { vi.useRealTimers(); });

describe("live payment reconciliation polling", () => {
  it("tracks unresolved live attempts, including expired and older attempts, and stops at settled share outcomes", () => {
    expect(shouldRefreshLivePayment(checkout())).toBe(true);
    expect(shouldRefreshLivePayment(checkout("live", "expired", "expired"))).toBe(true);
    expect(shouldRefreshLivePayment(checkout("demo"))).toBe(false);
    expect(shouldRefreshLivePayment(checkout("live", "paid"))).toBe(false);
    expect(shouldRefreshLivePayment(checkout("live", "refunded"))).toBe(false);
    expect(shouldRefreshLivePayment(checkout("live", "failed", "failed"))).toBe(false);
    const earlier = checkout("live", "failed", "failed");
    earlier.attempts.push({ ...earlier.attempts[0], status: "pending" });
    expect(shouldRefreshLivePayment(earlier)).toBe(true);
  });
  it("waits 15 seconds, skips hidden pages, and stops after cleanup", async () => {
    vi.useFakeTimers();
    let visible = false;
    const refresh = vi.fn(async () => {});
    const stop = scheduleLivePaymentRefresh(refresh, () => visible);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(refresh).not.toHaveBeenCalled();
    visible = true;
    await vi.advanceTimersByTimeAsync(14_999);
    expect(refresh).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    stop();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("allows one request in flight and resumes after completion or rejection", async () => {
    vi.useFakeTimers();
    let complete: (() => void) | undefined;
    const refresh = vi.fn(() => new Promise<void>((resolve) => { complete = resolve; }));
    const stop = scheduleLivePaymentRefresh(refresh, () => true);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(refresh).toHaveBeenCalledTimes(1);
    complete!();
    await vi.advanceTimersByTimeAsync(15_000);
    expect(refresh).toHaveBeenCalledTimes(2);
    complete!();
    refresh.mockImplementationOnce(async () => { throw new Error("Temporary provider failure"); });
    await vi.advanceTimersByTimeAsync(15_000);
    expect(refresh).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(refresh).toHaveBeenCalledTimes(4);
    stop();
  });
});

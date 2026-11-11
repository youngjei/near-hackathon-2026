"use client";
import { useEffect, useRef, useState } from "react";
import { Shell, ErrorMessage, Loading } from "@/components/shell";
import { LivePayment } from "@/components/live-payment";
import { Receipt } from "@/components/receipt";
import { api, redeem, Checkout } from "@/lib/client";
import { formatAmount } from "@/lib/money";
export default function Pay() {
  const [data, setData] = useState<Checkout>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [method, setMethod] = useState<"zcash" | "confidential">("zcash"),
    [now, setNow] = useState(Date.now());
  const boot = useRef<Promise<void> | null>(null);
  useEffect(() => {
    let cancelled = false;
    const id = new URLSearchParams(location.search).get("id") || "";
    async function load() {
      try {
        const d = await api<Checkout>("shares/" + id);
        if (!cancelled) {
          setData(d);
          setError("");
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }
    if (!boot.current) boot.current = redeem("shares", id);
    const ready = boot.current.then(load).catch((e) => {
      if (!cancelled) setError(e.message);
    });
    const timer = setInterval(() => {
      setNow(Date.now());
      if (document.visibilityState === "visible") ready.then(load);
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);
  async function start() {
    if (!data) return;
    setBusy(true);
    setError("");
    try {
      setData(
        await api("shares/" + data.share.id + "/attempts", {
          method,
          requestKey: crypto.randomUUID(),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function simulate(status: string, attemptId: string) {
    if (!data) return;
    setBusy(true);
    setError("");
    try {
      setData(
        await api("shares/" + data.share.id + "/simulate", {
          attemptId,
          status,
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <Shell>
        <div className="flow">
          <ErrorMessage message={error} />
          {!error && <Loading />}
        </div>
      </Shell>
    );
  const active = data.attempts[0];
  const state = data.share.status;
  const pending = state === "pending" && active && active.expiresAt > now;
  const minutes = active
    ? Math.max(0, Math.ceil((active.expiresAt - now) / 60000))
    : 0;
  return (
    <Shell notice={data.bill.mode === "live" ? "Payment checkout · Review requests in your wallet" : undefined}>
      <div className="flow">
        <div className="intro compact">
          <h1>{state === "paid" ? "Your share is settled." : "Your share."}</h1>
          <p>
            {data.bill.merchant} · Friend {data.share.position}
          </p>
        </div>
        <div className="amount-hero">
          <div className="big-amount">
            {formatAmount(data.share.amountUnits)}
            <span>USDC</span>
          </div>
          <p className="muted">An equal share for {data.bill.diners} people</p>
        </div>
        <Receipt bill={data.bill} kind="shares" id={data.share.id} />
        {data.bill.mode === "live" ? (
          <LivePayment data={data} onChange={setData} />
        ) : state === "paid" ? (
          <div className="payment-result">
            <span className="check-mark" aria-hidden="true">
              ✓
            </span>
            <h2>Paid in demo</h2>
            <p>
              Your friend’s progress page has been updated.
              <br />
              No money was moved.
            </p>
            <a href="/" className="text-button">
              Split another bill →
            </a>
          </div>
        ) : pending ? (
          <section className="payment-result">
            <span className="pending-mark" aria-hidden="true">
              ···
            </span>
            <h2>Waiting for payment</h2>
            <p>
              This is a simulated{" "}
              {active.method === "zcash" ? "Zcash" : "confidential balance"}{" "}
              request.
              <br />
              There is no wallet address to fund.
            </p>
            <p className="field-hint">Demo request expires in {minutes} min.</p>
            <button
              className="button primary full"
              disabled={busy}
              onClick={() => simulate("paid", active.id)}
            >
              {busy ? "Updating…" : "Simulate successful payment"}
            </button>
          </section>
        ) : (
          <>
            <div className="method-heading">
              <h2>How would you like to pay?</h2>
            </div>
            {["failed", "expired", "refunded"].includes(state) && (
              <p className="inline-note" role="status">
                {state === "expired"
                  ? "This request expired. Create a new one below."
                  : state === "failed"
                    ? "The simulated payment failed. You can try again."
                    : "The demo payment was refunded. No real funds were moved."}
              </p>
            )}
            <div
              className="methods"
              role="radiogroup"
              aria-label="Payment method"
            >
              <label
                className={`method ${method === "zcash" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="method"
                  value="zcash"
                  checked={method === "zcash"}
                  onChange={() => setMethod("zcash")}
                />
                <span>
                  <strong>Zcash</strong>
                  <small>VIZOR or Zodl (formerly Zashi)</small>
                </span>
                <span className="radio-visual" aria-hidden="true" />
              </label>
              <label
                className={`method ${method === "confidential" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="method"
                  value="confidential"
                  checked={method === "confidential"}
                  onChange={() => setMethod("confidential")}
                />
                <span>
                  <strong>Confidential balance</strong>
                  <small>Pay with USDC</small>
                </span>
                <span className="radio-visual" aria-hidden="true" />
              </label>
            </div>
            <p className="field-hint">
              Live payments aren’t connected yet. You can try the payment flow
              without opening a wallet.
            </p>
            <button
              className="button primary full"
              disabled={busy}
              onClick={start}
            >
              {busy
                ? "Preparing…"
                : `Try ${method === "zcash" ? "Zcash" : "USDC"} demo`}
              <span aria-hidden="true">→</span>
            </button>
          </>
        )}
        {data.bill.mode !== "live" && data.attempts.length > 0 && (
          <details className="demo-controls">
            <summary>Test another outcome</summary>
            <p className="field-hint">
              These controls affect this demo share only.
            </p>
            {data.attempts.map((a, i) => (
              <div key={a.id} className="attempt-controls">
                <span>
                  Request {data.attempts.length - i} · {a.status}
                </span>
                <div>
                  {a.status !== "refunded" && (
                    <>
                      {a.status !== "paid" && (
                        <button
                          disabled={busy}
                          className="text-button"
                          onClick={() => simulate("paid", a.id)}
                        >
                          {i === 0 ? "Simulate paid" : "Simulate late payment"}
                        </button>
                      )}
                      {a.status === "pending" && (
                        <>
                          <button
                            disabled={busy}
                            className="text-button"
                            onClick={() => simulate("expired", a.id)}
                          >
                            Expire
                          </button>
                          <button
                            disabled={busy}
                            className="text-button"
                            onClick={() => simulate("failed", a.id)}
                          >
                            Fail
                          </button>
                        </>
                      )}
                      <button
                        disabled={busy}
                        className="text-button"
                        onClick={() => simulate("refunded", a.id)}
                      >
                        Refund
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </details>
        )}
        <ErrorMessage message={error} />
      </div>
    </Shell>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { Shell, ErrorMessage, Loading } from "@/components/shell";
import { LivePayment } from "@/components/live-payment";
import { PaymentMethods, PaymentMethod } from "@/components/payment-methods";
import { Receipt } from "@/components/receipt";
import { api, redeem, Checkout } from "@/lib/client";
import { formatAmount } from "@/lib/money";
import { TaskFrame, SuccessMark } from "@/components/task-frame";
export default function Pay() {
  const [data, setData] = useState<Checkout>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [method, setMethod] = useState<PaymentMethod>("zcash"),
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
        <div className="flow payment-flow">
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
    <Shell notice={data.bill.mode === "live" ? null : undefined}>
      <TaskFrame className="checkout-layout" context={<>
        <div className="intro compact">
          <h1>Your share</h1>
          <p>
            {data.bill.merchant} · Friend {data.share.position}
          </p>
        </div>
        <div className="amount-hero">
          <div className="big-amount">
            {formatAmount(data.share.amountUnits)}
            <span>USDC</span>
          </div>
        </div>
        <Receipt bill={data.bill} kind="shares" id={data.share.id} />
      </>}>
        <div className="payment-flow" aria-busy={busy}>
        {data.bill.mode === "live" ? (
          <LivePayment data={data} onChange={setData} />
        ) : state === "paid" ? (
          <div className="payment-result" role="status">
            <SuccessMark />
            <h2>Paid in demo</h2>
            <p>
              No money was moved.
            </p>
            <a href="/" className="text-button">
              Split another bill →
            </a>
          </div>
        ) : pending ? (
          <section className="payment-result">
            <span className="pending-mark" aria-hidden="true"><i /><i /><i /></span>
            <h2>Demo payment</h2>
            <p>
              Simulated{" "}
              {active.method === "zcash" ? "Zcash" : active.method === "solana" ? "Solana USDC" : "confidential balance"}{" "}
              request. No money will move.
            </p>
            <p className="field-hint">Demo request expires in {minutes} min.</p>
            <button
              className="button primary full"
              aria-busy={busy}
              disabled={busy}
              onClick={() => simulate("paid", active.id)}
            >
              {busy ? "Updating…" : "Simulate successful payment"}
            </button>
          </section>
        ) : (
          <>
            <div className="method-heading">
              <h2>Payment method</h2>
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
            <PaymentMethods method={method} onChange={setMethod} name="method" />
            <button
              className="button primary full"
              aria-busy={busy}
              disabled={busy}
              onClick={start}
            >
              {busy
                ? "Preparing…"
                : `Try ${method === "zcash" ? "Zcash" : method === "solana" ? "Solana USDC" : "USDC"} demo`}
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
      </TaskFrame>
    </Shell>
  );
}

"use client";
import { useEffect, useState, useRef } from "react";
import { Shell, ErrorMessage, Loading, CopyButton } from "@/components/shell";
import { QR } from "@/components/qr";
import { Receipt } from "@/components/receipt";
import { api, redeem, link, Dashboard } from "@/lib/client";
import { formatAmount } from "@/lib/money";
const labels: Record<string, string> = {
  paid: "Paid in demo",
  pending: "Waiting",
  unpaid: "Not paid",
  expired: "Expired",
  failed: "Failed",
  refunded: "Refunded in demo",
};
export default function Bill() {
  const [data, setData] = useState<Dashboard>(),
    [error, setError] = useState(""),
    [selected, setSelected] = useState("");
  const boot = useRef<Promise<void> | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("id") || "";
    let cancelled = false;
    async function load() {
      try {
        const d = await api<Dashboard>("bills/" + id);
        if (!cancelled) {
          setData(d);
          setError("");
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }
    if (!boot.current) boot.current = redeem("bills", id);
    const ready = boot.current.then(load).catch((e) => {
      if (!cancelled) setError(e.message);
    });
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") ready.then(load);
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);
  if (!data)
    return (
      <Shell>
        <div className="flow">
          <ErrorMessage message={error} />
          {!error && <Loading />}
          {error && (
            <a href="/" className="text-button">
              Start a new bill →
            </a>
          )}
        </div>
      </Shell>
    );
  const isLive = data.bill.mode === "live";
  const statusLabels = isLive ? {...labels, paid: "Paid", refunded: "Refunded"} : labels;
  const total = data.shares.reduce((v, s) => v + BigInt(s.amountUnits), 0n);
  const received = data.shares
    .filter((s) => s.status === "paid")
    .reduce((v, s) => v + BigInt(s.amountUnits), 0n);
  const paid = data.shares.filter((s) => s.status === "paid").length;
  const share = data.shares.find((s) => s.id === selected);
  return (
    <Shell notice={isLive ? null : undefined}>
      <div className="flow">
        <div className="intro compact">
          <h1>{data.bill.merchant}</h1>
          <p>{data.bill.diners} people</p>
        </div>
        <div className="amount-hero">
          <span className="muted">{isLive ? "Received" : "Received in demo"}</span>
          <div className="big-amount">
            {formatAmount(received.toString())}
            <span>USDC</span>
          </div>
          <p className="muted">
            of {formatAmount(total.toString())} USDC requested
          </p>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Reimbursement progress"
          aria-valuenow={paid}
          aria-valuemin={0}
          aria-valuemax={data.shares.length}
        >
          <div
            style={{ width: `${(Number(received) * 100) / Number(total)}%` }}
          />
        </div>
        <div className="progress-caption">
          <span>
            {paid} of {data.shares.length} paid
          </span>
          <span>{formatAmount((total - received).toString())} USDC left</span>
        </div>
        <div className="share-list">
          {data.shares.map((s) => (
            <div className="share-row" key={s.id}>
              <div className="share-main">
                <strong>Friend {s.position}</strong>
                <span
                  className={s.status === "paid" ? "status paid" : "status"}
                >
                  {statusLabels[s.status] || s.status}
                </span>
              </div>
              <div className="share-end">
                <span className="share-amount">
                  {formatAmount(s.amountUnits)} <small>USDC</small>
                </span>
                <button
                  className="text-button"
                  onClick={() => setSelected(selected === s.id ? "" : s.id)}
                >
                  {selected === s.id ? "Close link" : "Share link"}
                </button>
              </div>
            </div>
          ))}
        </div>
        {share && (
          <section
            className="share-panel"
            aria-label={`Share request for friend ${share.position}`}
          >
            <h2>Request for friend {share.position}</h2>
            <p>Send this link only to the person paying this share.</p>
            <QR value={link("pay", share.id, share.token!)} />
            <div className="share-panel-actions">
              <CopyButton value={link("pay", share.id, share.token!)} />
              <a
                className="button primary"
                href={link("pay", share.id, share.token!)}
                target="_blank"
                rel="noreferrer"
              >
                Open checkout ↗
              </a>
            </div>
            <p className="field-hint">
              {isLive ? "Opens this person’s checkout." : "Opens this person’s demo checkout. No real payments."}
            </p>
          </section>
        )}
        {data.receivingAddress && (
          <section className="receiving-summary" aria-label="Receiving address">
            <h2>Your receiving address</h2>
            <p className="address-value">{data.receivingAddress}</p>
            <p className="field-hint">Fixed for this bill.</p>
          </section>
        )}
        <Receipt bill={data.bill} kind="bills" id={data.bill.id} />
        <p className="small-note left">
          Bookmark this page on this device to return to all requests.
        </p>
        <ErrorMessage message={error} />
      </div>
    </Shell>
  );
}

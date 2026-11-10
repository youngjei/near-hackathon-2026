"use client";
import { useEffect, useRef, useState } from "react";
import { Shell, ErrorMessage } from "@/components/shell";
import { api, link, Dashboard } from "@/lib/client";
import { allocation, currencies, formatAmount, billInput } from "@/lib/money";
import Decimal from "decimal.js";
type FX = { rate: string; date: string; source: string; fixture: boolean };
export default function CreateBill() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const [step, setStep] = useState<"start" | "details" | "review">("start");
  const [merchant, setMerchant] = useState(""),
    [total, setTotal] = useState(""),
    [extra, setExtra] = useState("0"),
    [currency, setCurrency] = useState("AED"),
    [diners, setDiners] = useState(4);
  const [receiptId, setReceiptId] = useState<string>(),
    [preview, setPreview] = useState(""),
    [note, setNote] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [fx, setFx] = useState<FX>();
  const input = useRef<HTMLInputElement>(null),
    requestKey = useRef("");
  function sample() {
    setMerchant("Dinner in Dubai");
    setTotal("200.00");
    setExtra("0");
    setCurrency("AED");
    setDiners(4);
    setPreview("/sample-receipt.svg");
    setNote("Sample receipt · Synthetic data, ready to edit.");
    setReceiptId(undefined);
    setStep("details");
    setError("");
  }
  async function upload(file: File) {
    setError("");
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }
    setBusy(true);
    try {
      await api("session", {});
      const r = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const d = (await r.json()) as {
        error?: string;
        receiptId: string;
        message: string;
      };
      if (!r.ok) throw new Error(d.error);
      setReceiptId(d.receiptId);
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(file));
      setNote(d.message);
      setStep("details");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function review(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!requestKey.current) requestKey.current = crypto.randomUUID();
      billInput.parse({
        merchant,
        total,
        extra,
        currency,
        diners,
        receiptId,
        requestKey: requestKey.current,
        approvedRate: "1",
        approvedDate: "2026-11-10",
      });
      await api("session", {});
      const rate = await api<FX>("fx?currency=" + currency);
      allocation(total, extra, rate.rate, diners);
      setFx(rate);
      setStep("review");
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (e) {
      setError(
        "issues" in (e as object)
          ? "Check the bill name, amount and diner count."
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  async function create() {
    if (!fx) return;
    setBusy(true);
    setError("");
    try {
      const d = await api<Dashboard>("bills", {
        merchant,
        total,
        extra,
        currency,
        diners,
        receiptId,
        requestKey: requestKey.current,
        approvedRate: fx.rate,
        approvedDate: fx.date,
      });
      location.assign(link("bill", d.bill.id, d.organizerToken!));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const split =
    step === "review" && fx ? allocation(total, extra, fx.rate, diners) : null;
  return (
    <Shell>
      <div className="flow">
        {step === "start" ? (
          <>
            <div className="intro">
              <h1>Dinner, divided.</h1>
              <p>
                You got the bill.
                <br />
                Let’s work out everyone’s share.
              </p>
            </div>
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="sr-only"
              aria-label="Upload receipt"
              disabled={!hydrated || busy}
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            <button
              className="upload-area"
              disabled={busy || !hydrated}
              onClick={() => input.current?.click()}
            >
              <svg
                className="receipt-mark"
                width="54"
                height="66"
                viewBox="0 0 54 66"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9 5 15 9 21 5 27 9 33 5 39 9 45 5V60L39 56 33 60 27 56 21 60 15 56 9 60Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M18 24H36M18 31H36M18 43H26M32 43H36"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <span className="upload-title">
                {busy ? "Saving receipt…" : "Add your receipt"}
              </span>
              <span className="muted">Take a photo or choose an image</span>
              <span className="file-hint">JPG, PNG or WebP · up to 5 MB</span>
            </button>
            <div className="start-actions">
              <button
                className="text-button"
                disabled={busy || !hydrated}
                onClick={() => {
                  setStep("details");
                  setNote("");
                }}
              >
                Enter details manually <span aria-hidden="true">→</span>
              </button>
              <button
                className="text-button sample-link"
                disabled={busy || !hydrated}
                onClick={sample}
              >
                Try a sample bill
              </button>
            </div>
            <p className="small-note">
              Split equally. Request USDC. Let friends choose how to pay.
            </p>
          </>
        ) : null}
        {step === "details" ? (
          <>
            <button className="back" onClick={() => setStep("start")}>
              ← Back
            </button>
            <div className="intro compact">
              <h1>Check the bill.</h1>
              <p>A quick look before we split it.</p>
            </div>
            {preview && (
              <details className="receipt-details">
                <summary>View receipt</summary>
                <img
                  className="receipt-image"
                  src={preview}
                  alt="Receipt to review"
                />
              </details>
            )}
            {note && <p className="inline-note">{note}</p>}
            <form onSubmit={review}>
              <label className="field">
                Bill name
                <input
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Dinner in Dubai"
                  maxLength={80}
                  required
                  autoComplete="off"
                />
              </label>
              <div className="field-row">
                <label className="field amount-field">
                  Receipt total
                  <input
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    required
                  />
                </label>
                <label className="field currency-field">
                  Currency
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    {currencies.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field">
                Extra tip or charge
                <input
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  inputMode="decimal"
                  required
                />
                <span className="field-hint">
                  Only add amounts not already included in the receipt total.
                </span>
              </label>
              <div className="diner-row">
                <div>
                  <label htmlFor="diners">How many people?</label>
                  <p className="field-hint">Include yourself.</p>
                </div>
                <div className="stepper">
                  <button
                    type="button"
                    aria-label="One fewer diner"
                    disabled={diners <= 2}
                    onClick={() => setDiners(diners - 1)}
                  >
                    −
                  </button>
                  <input
                    id="diners"
                    type="number"
                    min="2"
                    max="20"
                    value={diners}
                    onChange={(e) =>
                      setDiners(
                        Math.max(2, Math.min(20, Number(e.target.value) || 2)),
                      )
                    }
                  />
                  <button
                    type="button"
                    aria-label="One more diner"
                    disabled={diners >= 20}
                    onClick={() => setDiners(diners + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                className="button primary full"
                disabled={busy || !hydrated}
              >
                {busy ? "Calculating…" : "Review split"}
                <span aria-hidden="true">→</span>
              </button>
            </form>
          </>
        ) : null}
        {step === "review" && fx && split ? (
          <>
            <button className="back" onClick={() => setStep("details")}>
              ← Edit bill
            </button>
            <div className="intro compact">
              <h1>Here’s the split.</h1>
              <p>
                {merchant} · {diners} people
              </p>
            </div>
            <div className="amount-hero">
              <span className="muted">
                {split.shares.slice(1).every((s) => s === split.shares[1])
                  ? "Each friend pays"
                  : "Friends pay from"}
              </span>
              <div className="big-amount">
                {formatAmount(split.shares[split.shares.length - 1])}
                <span>USDC</span>
              </div>
            </div>
            <dl className="ledger">
              <div>
                <dt>Bill total</dt>
                <dd>
                  {new Decimal(total).plus(extra).toFixed(2)} {currency}
                </dd>
              </div>
              <div>
                <dt>Converted total</dt>
                <dd>{formatAmount(split.totalUnits)} USDC</dd>
              </div>
              <div>
                <dt>Your share</dt>
                <dd>{formatAmount(split.shares[0])} USDC</dd>
              </div>
              <div className="ledger-total">
                <dt>To be reimbursed</dt>
                <dd>
                  {formatAmount(
                    (
                      BigInt(split.totalUnits) - BigInt(split.shares[0])
                    ).toString(),
                  )}{" "}
                  USDC
                </dd>
              </div>
            </dl>
            <p className="field-hint">
              {fx.source} · {fx.date}. We use 1 USD = 1 USDC for this split.
              Payment fees are separate.
            </p>
            {new Set(split.shares).size > 1 && (
              <p className="field-hint">
                A one-cent difference keeps the total exact.
              </p>
            )}
            <div className="receiving-note">
              <strong>Try the complete flow</strong>
              <p>
                Live receiving isn’t connected. These links demonstrate the flow
                and cannot accept money.
              </p>
            </div>
            <button
              className="button primary full"
              disabled={busy || !hydrated}
              onClick={create}
            >
              {busy ? "Creating…" : `Create ${diners - 1} demo requests`}
              <span aria-hidden="true">→</span>
            </button>
          </>
        ) : null}
        <ErrorMessage message={error} />
      </div>
    </Shell>
  );
}

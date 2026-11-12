"use client";
import { useEffect, useRef, useState } from "react";
import { Shell, ErrorMessage } from "@/components/shell";
import { api, link, Dashboard } from "@/lib/client";
import { allocation, currencies, formatAmount, billInput } from "@/lib/money";
import Decimal from "decimal.js";
import { receivingAddress as addressSchema } from "@/lib/receiving";
import { ReceivingHelp } from "@/components/receiving-help";
import { TaskFrame, WorkflowSteps, ReceiptIcon, SplitGraphic } from "@/components/task-frame";
type FX = { rate: string; date: string; source: string; fixture: boolean };
export default function CreateBill() {
  const [hydrated, setHydrated] = useState(false);
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [sampleMode, setSampleMode] = useState(false);
  const mode = liveEnabled && !sampleMode ? "live" : "demo";
  useEffect(() => {
    let cancelled = false;
    api<{live: {enabled: boolean}}>("config").then(config => {
      if (!cancelled) setLiveEnabled(config.live.enabled);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  useEffect(() => setHydrated(true), []);
  const [step, setStep] = useState<"start" | "details" | "review">("start");
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current !== step) {
      heading.current?.focus({ preventScroll: true });
      previousStep.current = step;
    }
  }, [step]);
  const [merchant, setMerchant] = useState(""),
    [total, setTotal] = useState(""),
    [extra, setExtra] = useState("0"),
    [currency, setCurrency] = useState("AED"),
    [diners, setDiners] = useState(4);
  const [recipient, setRecipient] = useState("");
  const [recipientError, setRecipientError] = useState("");
  const recipientInput = useRef<HTMLInputElement>(null);
  const [receiptId, setReceiptId] = useState<string>(),
    [preview, setPreview] = useState(""),
    [note, setNote] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [fx, setFx] = useState<FX>();
  const input = useRef<HTMLInputElement>(null),
    requestKey = useRef("");
  function sample() {
    setSampleMode(true);
    requestKey.current = "";
    setMerchant("Dinner in Dubai");
    setTotal("200.00");
    setExtra("0");
    setCurrency("AED");
    setDiners(4);
    setPreview("/sample-receipt.svg");
    setNote("Sample receipt · Synthetic data.");
    setReceiptId(undefined);
    setStep("details");
    setError("");
  }
  async function upload(file: File) {
    setSampleMode(false);
    requestKey.current = "";
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
    const address = addressSchema.safeParse(recipient);
    if (!address.success) {
      setRecipientError(address.error.issues[0].message);
      recipientInput.current?.focus();
      return;
    }
    setRecipient(address.data);
    setRecipientError("");
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
        receivingAddress: recipient,
        requestKey: requestKey.current,
        approvedRate: "1",
        approvedDate: "2026-11-10",
      });
      await api("session", {});
      const rate = await api<FX>("fx?currency=" + currency + "&mode=" + mode);
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
        mode,
        merchant,
        total,
        extra,
        currency,
        diners,
        receiptId,
        receivingAddress: recipient,
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
    <Shell notice={mode === "live" ? null : undefined}>
      <TaskFrame className={`create-layout step-${step}`} context={<>
        {step === "start" && <div className="intro start-intro">
          <h1 ref={heading} tabIndex={-1}>Split a bill</h1>
          <p>Split the total equally in USDC. Send each friend a payment link.</p>
        </div>}
        <SplitGraphic key={step} split={step === "review"} />
        <WorkflowSteps current={step === "start" ? 0 : 1} />
      </>}>
        <div key={step} className="step-content" aria-busy={busy}>
        {step === "start" ? (
          <>
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
              aria-busy={busy}
              disabled={busy || !hydrated}
              onClick={() => input.current?.click()}
            >
              <ReceiptIcon />
              <span className="upload-title">
                {busy ? "Saving receipt…" : "Upload receipt"}
              </span>
              <span className="file-hint">JPG, PNG or WebP · up to 5 MB</span>
            </button>
            <div className="start-actions">
              <button
                className="text-button"
                disabled={busy || !hydrated}
                onClick={() => {
                  setSampleMode(false);
                  requestKey.current = "";
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
          </>
        ) : null}
        {step === "details" ? (
          <>
            <button className="back" onClick={() => setStep("start")}>
              ← Back
            </button>
            <div className="intro compact">
              <h1 ref={heading} tabIndex={-1}>Bill details</h1>
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
                  <label htmlFor="diners">People, including you</label>
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
              <div className="receiving-field">
                <label className="field" htmlFor="receiving-address">
                  Your near.com receiving address
                  <input id="receiving-address" ref={recipientInput}
                    value={recipient} onChange={event => { setRecipient(event.target.value); setRecipientError(""); }}
                    placeholder="nearcom:0x…" autoComplete="off" autoCapitalize="none" spellCheck={false}
                    maxLength={80} aria-required="true" aria-invalid={!!recipientError}
                    aria-describedby={recipientError ? "receiving-hint receiving-error" : "receiving-hint"}
                  />
                </label>
                <p id="receiving-hint" className="field-hint">Paste your internal address with the nearcom: prefix.</p>
                {recipientError && <p id="receiving-error" className="field-error" role="alert">{recipientError}</p>}
                <ReceivingHelp />
              </div>
              <button
                className="button primary full"
                aria-busy={busy}
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
              <h1 ref={heading} tabIndex={-1}>Review split</h1>
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
            {fx.fixture && <p className="field-hint">Demo exchange rate · {fx.date}. This reference rate is not a payment quote.</p>}
            <details className="receipt-details">
              <summary>Exchange rate and fees</summary>
              <p className="field-hint">{fx.source} · {fx.date}. This split uses 1 USD = 1 USDC. Payment fees are separate.</p>
              {new Set(split.shares).size > 1 && <p className="field-hint">A one-cent difference keeps the total exact.</p>}
            </details>
            <section className="receiving-summary" aria-label="Receiving address">
              <h2>Your receiving address</h2>
              <p className="address-value">{recipient}</p>
              <p className="field-hint">Check it before creating requests. It stays fixed for this bill.</p>
            </section>
            <button
              className="button primary full"
              aria-busy={busy}
              disabled={busy || !hydrated}
              onClick={create}
            >
              {busy ? "Creating…" : `Create ${diners - 1} ${mode === "demo" ? "demo " : ""}requests`}
              <span aria-hidden="true">→</span>
            </button>
          </>
        ) : null}
        <ErrorMessage message={error} />
        </div>
      </TaskFrame>
    </Shell>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useLivePaymentRefresh } from "@/lib/live-refresh";
import { api, Checkout, PreparedConfidentialPayment } from "@/lib/client";
import { connectConfidentialWallet, disconnectConfidentialWallet, signConfidentialIntent } from "@/lib/wallets/confidential-client";
import { CopyButton, ErrorMessage } from "@/components/shell";

/** This component only consumes the server's capability-scoped payment projection. */
export function LivePayment({ data, onChange }: { data: Checkout; onChange: (data: Checkout) => void }) {
  const [method, setMethod] = useState<"zcash" | "confidential">("zcash");
  const [refundAddress, setRefundAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [qr, setQr] = useState("");
  const [walletAccount, setWalletAccount] = useState("");
  const [prepared, setPrepared] = useState<PreparedConfidentialPayment>();
  const [submissionStarted, setSubmissionStarted] = useState(false);
  const refreshing = useRef(false);
  // Keep the same idempotency key after an interrupted request until its outcome is known.
  const [requestKey, setRequestKey] = useState("");
  const active = data.attempts[0];
  const payment = active?.mode === "live" ? active.payment : undefined;
  const expired = !!active && (active.expiresAt <= now || payment?.state === "expired");
  const paid = data.share.status === "paid";
  const unresolved = !!active && !["failed", "refunded", "paid"].includes(active.status) && ["allocating", "unknown", "review", "processing", "incomplete", "deposit_received", "submitting", "accepted"].includes(payment?.state || "");
  const canCreate = !!data.live?.enabled && !!data.live.methods[method] && !paid && data.attempts.length === 0;
  const instructions = !paid && !expired && active?.status === "pending" && payment?.state === "ready" ? payment : undefined;
  useEffect(() => { setPrepared(undefined); setSubmissionStarted(false); }, [active?.id]);
  const uri = instructions?.uri?.startsWith("zcash:") ? instructions.uri : undefined;
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let cancelled = false;
    setQr("");
    if (uri) QRCode.toDataURL(uri, { width: 232, margin: 2, errorCorrectionLevel: "M" })
      .then((value) => { if (!cancelled) setQr(value); })
      .catch(() => { if (!cancelled) setError("The QR could not be displayed. Use the address and exact amount below."); });
    return () => { cancelled = true; };
  }, [uri]);
  async function refresh() {
    if (refreshing.current) return;
    refreshing.current = true;
    setBusy(true); setError("");
    try { onChange(await api<Checkout>(`shares/${data.share.id}/refresh`, {})); }
    catch (e) { setError((e as Error).message); }
    finally { refreshing.current = false; setBusy(false); }
  }
  useLivePaymentRefresh(data, refresh, busy);
  useEffect(() => {
    if (active && ["failed", "refunded"].includes(active.status)) {
      setPrepared(undefined);
      setSubmissionStarted(false);
      setError("");
    }
  }, [active?.id, active?.status]);
  async function start() {
    if (!canCreate) return;
    setBusy(true); setError("");
    const key = requestKey || crypto.randomUUID();
    setRequestKey(key);
    try {
      onChange(await api<Checkout>(`shares/${data.share.id}/attempts`, { method, requestKey: key, refundAddress: method === "confidential" ? walletAccount : refundAddress.trim() }));
      setRequestKey("");
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function connectWallet() {
    setBusy(true); setError("");
    try { const connected = await connectConfidentialWallet(); setWalletAccount(connected.accountId); setPrepared(undefined); }
    catch (e) { setWalletAccount(""); setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function disconnectWallet() {
    setBusy(true); setError("");
    try { await disconnectConfidentialWallet(); setWalletAccount(""); setPrepared(undefined); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function preparePayment() {
    if (!active || !walletAccount || expired || !data.live?.methods.confidential) return;
    setBusy(true); setError("");
    try {
      const result = await api<PreparedConfidentialPayment>(`shares/${data.share.id}/prepare`, { attemptId: active.id, signer: walletAccount });
      if (result.signer !== walletAccount) throw new Error("Reconnect the wallet account used for this quote.");
      setPrepared(result);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function signPayment() {
    if (!active || !prepared || expired || submissionStarted || !data.live?.methods.confidential || prepared.signer !== walletAccount) return;
    setBusy(true); setError("");
    try {
      const signature = await signConfidentialIntent(prepared.intent, prepared.signer);
      setSubmissionStarted(true);
      onChange(await api<Checkout>(`shares/${data.share.id}/submit`, { attemptId: active.id, ...signature }));
      setPrepared(undefined);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  const walletControls = <section className="confidential-wallet" aria-label="Confidential USDC wallet">
    <p className="field-hint">Use the external NEAR wallet account that already owns your confidential USDC. near.com-created passkey accounts cannot sign here. Connecting does not create or fund a balance.</p>
    {walletAccount ? <>
      <p className="address-value">Connected account: {walletAccount}</p>
      <button className="text-button" disabled={busy || submissionStarted} onClick={disconnectWallet}>Disconnect wallet</button>
    </> : <button className="button quiet full" disabled={busy || !data.live?.methods.confidential} onClick={connectWallet}>{busy ? "Opening wallet…" : "Connect NEAR wallet"}</button>}
    <p className="field-hint">Connecting selects an account. A separate payment signature authorizes spending. No balance is read or transferred on connection.</p>
  </section>;
  return <section className="live-payment" aria-label="Payment checkout">
    {paid ? <div className="payment-result" role="status">
      <span className="check-mark" aria-hidden="true">✓</span>
      <h2>Payment received</h2><p>Your friend’s progress page has been updated.</p>
    </div> : <>
      {!data.live?.enabled && <p className="inline-note" role="status">{data.live?.reason || "Live payments are not enabled. No payment request can be created yet."}</p>}
      {active && <section className="live-attempt" aria-label="Current payment request">
        <h2>{unresolved ? "Checking your payment request" : expired && active.status === "pending" ? "This quote has expired" : active.status === "pending" ? "Review your payment request" : `Payment ${active.status}`}</h2>
        {payment?.statusMessage && <p className="inline-note" role="status">{payment.statusMessage}</p>}
        {instructions && <>
          <p className="field-hint">{active.method === "confidential" ? "Payment authorization amount" : "Send exactly"}</p>
          <p className="payment-exact">{instructions.amount} <span>{instructions.symbol}</span></p>
          <p className="field-hint">Quote expires in {Math.max(1, Math.ceil((active.expiresAt - now) / 1000))} seconds. Review the amount and destination in your wallet before approving.</p>
          {uri && <>
            {qr && <img className="qr" src={qr} width={232} height={232} alt="Zcash payment request with the exact amount" />}
            <a className="button primary full" href={uri}>Open Zcash wallet <span aria-hidden="true">↗</span></a>
            <p className="field-hint">Open in VIZOR or Zodl if your installed version supports payment requests. Wallet and device compatibility must be checked. The network fee is additional.</p>
          </>}
          {active.method === "confidential" && <>
            {walletControls}
            {submissionStarted ? <p className="inline-note" role="status">Spending was submitted or its outcome is unconfirmed. Refresh payment status. Do not sign another payment.</p> : prepared ? <section className="confidential-review" aria-label="Review spending authorization">
              <h2>Review spending authorization</h2>
              <p className="inline-note">Authorize {instructions.amount} USDC from {prepared.signer} for this bill payment. This spends funds from your existing confidential balance. Confirm the account, amount and destination in your wallet.</p>
              <details><summary>View the exact signed message</summary><pre className="intent-message">{prepared.intent.payload.message}</pre></details>
              <button className="button primary full" disabled={busy || expired || !data.live?.methods.confidential} onClick={signPayment}>{busy ? "Waiting for wallet…" : "Sign and submit payment"}</button>
            </section> : <button className="button primary full" disabled={busy || !walletAccount || !data.live?.methods.confidential} onClick={preparePayment}>{busy ? "Preparing review…" : "Review USDC payment"}</button>}
          </>}
          {instructions.walletUrl && <a className="button primary full" href={instructions.walletUrl} target="_blank" rel="noopener noreferrer">Review in wallet <span aria-hidden="true">↗</span></a>}
          {instructions.address && <div className="payment-copy">
            <label className="field">Payment address<input readOnly value={instructions.address} onFocus={(e) => e.target.select()} /></label>
            <div className="payment-copy-actions"><CopyButton value={instructions.address} label="Copy address" /><CopyButton value={instructions.amount} label="Copy exact amount" /></div>
            <p className="field-hint">If opening or scanning fails, paste the address and exact amount in your wallet. Do not start a separate swap.</p>
          </div>}
        </>}
        {expired && <p className="inline-note">Do not send to this expired request. Refresh its status to check for a late payment. Ask the organizer to review the previous payment before arranging another request.</p>}
        {unresolved && <p className="field-hint">Do not send again or create another request while the previous outcome is being checked. If the deposit was insufficient, wait for the provider’s outcome; do not top up this request.</p>}
      </section>}
      {active && ["failed", "refunded"].includes(active.status) && <p className="inline-note" role="status">This request is closed. Ask the organizer to review the previous payment before arranging another request.</p>}
      {data.attempts.length === 0 && <>
        <div className="method-heading"><h2>How would you like to pay?</h2></div>
        <div className="methods" role="radiogroup" aria-label="Payment method">
          {([ ["zcash", "Zcash", "VIZOR or Zodl (formerly Zashi)"], ["confidential", "Confidential balance", "Existing confidential USDC"] ] as const).map(([value, label, hint]) => <label key={value} className={`method ${method === value ? "selected" : ""}`}>
            <input type="radio" name="live-method" value={value} checked={method === value} disabled={busy} onChange={() => { setMethod(value); setRefundAddress(""); setRequestKey(""); }} />
            <span><strong>{label}</strong><small>{hint}{!data.live?.methods[value] ? " · Not available yet" : ""}</small></span><span className="radio-visual" aria-hidden="true" />
          </label>)}
        </div>
        {method === "zcash" ? <label className="field">Your Zcash refund address
          <input value={refundAddress} disabled={busy} autoComplete="off" spellCheck={false} maxLength={128} onChange={(e) => { setRefundAddress(e.target.value); setRequestKey(""); }} aria-describedby="refund-help" />
          <span className="field-hint" id="refund-help">Use a transparent t1 or t3 address you control, with a valid checksum. Unified and shielded addresses are not supported for refunds. A refund may be publicly visible. Confirm that your wallet can receive at this address before continuing.</span>
        </label> : <>{!data.live?.methods.confidential && <p className="inline-note">Confidential USDC needs a verified wallet authorization flow. This payment method is not available until that integration is confirmed.</p>}{walletControls}</>}
        <button className="button primary full" disabled={busy || !canCreate || (method === "zcash" && !refundAddress.trim()) || (method === "confidential" && !walletAccount)} onClick={start}>{busy ? "Preparing quote…" : requestKey ? "Retry payment request" : "Get payment quote"}<span aria-hidden="true">→</span></button>
      </>}
    </>}
    {data.attempts.length > 0 && <>
      <button className="text-button" disabled={busy} onClick={refresh}>{busy ? "Checking…" : "Refresh payment status"}</button>
      <details className="demo-controls"><summary>Payment request history ({data.attempts.length})</summary>
        <p className="field-hint">Earlier attempts stay tracked for late payments. Ask the organizer to review the outcome before arranging another request.</p>
        {data.attempts.map((a, i) => <div key={a.id} className="attempt-controls"><span>Request {data.attempts.length - i} · {a.method === "zcash" ? "Zcash" : "USDC"} · {a.status}</span>{a.payment?.statusMessage && <p>{a.payment.statusMessage}</p>}</div>)}
      </details>
    </>}
    <ErrorMessage message={error} />
  </section>;
}

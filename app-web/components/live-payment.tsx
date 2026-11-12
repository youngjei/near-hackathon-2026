"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useLivePaymentRefresh } from "@/lib/live-refresh";
import { api, Checkout, PreparedConfidentialPayment } from "@/lib/client";
import { connectConfidentialWallet, disconnectConfidentialWallet, signConfidentialIntent } from "@/lib/wallets/confidential-client";
import { CopyButton, ErrorMessage } from "@/components/shell";
import { SuccessMark } from "@/components/task-frame";
import { PaymentMethods, PaymentMethod } from "@/components/payment-methods";

/** This component only consumes the server's capability-scoped payment projection. */
export function LivePayment({ data, onChange }: { data: Checkout; onChange: (data: Checkout) => void }) {
  const [method, setMethod] = useState<PaymentMethod>("zcash");
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
  const uri = ((active?.method === "zcash" && instructions?.uri?.startsWith("zcash:")) || (active?.method === "solana" && instructions?.uri?.startsWith("solana:"))) ? instructions?.uri : undefined;
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
    <p className="field-hint">Connect the NEAR wallet holding your confidential USDC. near.com passkey accounts are not supported.</p>
    {walletAccount ? <>
      <p className="address-value">Connected account: {walletAccount}</p>
      <button className="text-button" aria-busy={busy} disabled={busy || submissionStarted} onClick={disconnectWallet}>Disconnect wallet</button>
    </> : <button className="button quiet full" aria-busy={busy} disabled={busy || !data.live?.methods.confidential} onClick={connectWallet}>{busy ? "Opening wallet…" : "Connect NEAR wallet"}</button>}
  </section>;
  return <section className="live-payment" aria-label="Payment checkout" aria-busy={busy}>
    {paid ? <div className="payment-result" role="status">
      <SuccessMark />
      <h2>Payment complete</h2>
    </div> : <>
      {!data.live?.enabled && <p className="inline-note" role="status">{data.live?.reason || "Live payments are not enabled. No payment request can be created yet."}</p>}
      {active && <section className="live-attempt" aria-label="Current payment request">
        {!instructions && <h2>{unresolved ? "Checking payment" : expired && active.status === "pending" ? "Quote expired" : active.status === "pending" ? "Payment details" : `Payment ${active.status}`}</h2>}
        {!instructions && payment?.statusMessage && <p className="inline-note" role="status">{payment.statusMessage}</p>}
        {instructions && <>
          <p className="field-hint">{active.method === "confidential" ? "Amount to authorize" : "Send exactly"}</p>
          <p className="payment-exact">{instructions.amount} <span>{instructions.symbol}</span></p>
          <p className="field-hint">Expires in {Math.max(1, Math.ceil((active.expiresAt - now) / 1000))} seconds. Check the amount and destination in your wallet.</p>
          {uri && <>
            <a className="button primary full" href={uri}>Open {active.method === "solana" ? "Solana" : "Zcash"} wallet <span aria-hidden="true">↗</span></a>
            <p className="field-hint">{active.method === "solana" ? "Use a wallet that supports Solana Pay requests. You need SOL for network fees and possible token account creation." : "Use VIZOR or Zodl if your version supports payment requests. Network fees are additional."}</p>
            {qr && <details className="payment-copy"><summary>Scan with another device</summary><img className="qr" src={qr} width={232} height={232} alt={`${active.method === "solana" ? "Solana" : "Zcash"} payment request with the exact amount`} /></details>}
          </>}
          {active.method === "confidential" && <>
            {walletControls}
            {submissionStarted ? <p className="inline-note" role="status">Submission is pending or unconfirmed. Refresh the status; do not sign again.</p> : prepared ? <section className="confidential-review" aria-label="Review spending authorization">
              <h2>Review payment</h2>
              <p className="inline-note">Authorize {instructions.amount} USDC from {prepared.signer}. Check the details in your wallet before signing.</p>
              <details><summary>View the exact signed message</summary><pre className="intent-message">{prepared.intent.payload.message}</pre></details>
              <button className="button primary full" aria-busy={busy} disabled={busy || expired || !data.live?.methods.confidential} onClick={signPayment}>{busy ? "Waiting for wallet…" : "Sign and submit payment"}</button>
            </section> : <button className="button primary full" aria-busy={busy} disabled={busy || !walletAccount || !data.live?.methods.confidential} onClick={preparePayment}>{busy ? "Preparing review…" : "Review USDC payment"}</button>}
          </>}
          {instructions.walletUrl && <a className="button primary full" href={instructions.walletUrl} target="_blank" rel="noopener noreferrer">Review in wallet <span aria-hidden="true">↗</span></a>}
          {instructions.address && <details className="payment-copy"><summary>Copy payment details</summary>
            <label className="field">Payment address<input readOnly value={instructions.address} onFocus={(e) => e.target.select()} /></label>
            <div className="payment-copy-actions"><CopyButton value={instructions.address} label="Copy address" /><CopyButton value={instructions.amount} label="Copy exact amount" /></div>
            <p className="field-hint">If scanning fails, paste the address and exact amount{active.method === "solana" ? " and select USDC on Solana" : ""}. Do not start a separate swap.</p>
          </details>}
        </>}
        {expired && <p className="inline-note">Do not send to this expired request. Refresh for late payments and ask the organizer before paying again.</p>}
        {unresolved && <p className="field-hint">Do not pay again while this is being checked. If the deposit was insufficient, wait for the outcome; do not top it up.</p>}
      </section>}
      {active && ["failed", "refunded"].includes(active.status) && <p className="inline-note" role="status">Ask the organizer to review this payment before paying again.</p>}
      {data.attempts.length === 0 && <>
        <div className="method-heading"><h2>Payment method</h2></div>
        <PaymentMethods method={method} name="live-method" disabled={busy} available={data.live?.methods} onChange={(value) => { setMethod(value); setRefundAddress(""); setRequestKey(""); }} />
        {method === "zcash" ? <><label className="field">Refund address
          <input value={refundAddress} aria-busy={busy} disabled={busy} autoComplete="off" spellCheck={false} maxLength={128} onChange={(e) => { setRefundAddress(e.target.value); setRequestKey(""); }} placeholder="t1… or t3…" aria-describedby="refund-help" />
          <span className="field-hint" id="refund-help">Unused ZEC is returned here. Refunds are publicly visible.</span>
        </label><details className="payment-help"><summary>Which address should I use?</summary><p className="field-hint">Copy a transparent receive address from your Zcash wallet, starting with t1 or t3. Confirm your wallet can receive at it. Unified and shielded addresses are not supported for refunds.</p></details></> : method === "confidential" ? <>{!data.live?.methods.confidential && <p className="inline-note">Confidential USDC is not available yet.</p>}{walletControls}</> : <><label className="field">Refund address
          <input value={refundAddress} aria-busy={busy} disabled={busy} autoComplete="off" spellCheck={false} maxLength={128} onChange={(e) => { setRefundAddress(e.target.value); setRequestKey(""); }} placeholder="Solana wallet address" />
          <span className="field-hint">Use your Solana wallet address that can receive USDC, not a token account address. Refunds are publicly visible.</span>
        </label></>}
        <button className="button primary full" aria-busy={busy} disabled={busy || !canCreate || (method !== "confidential" && !refundAddress.trim()) || (method === "confidential" && !walletAccount)} onClick={start}>{busy ? "Preparing quote…" : requestKey ? "Retry payment request" : "Get payment quote"}<span aria-hidden="true">→</span></button>
      </>}
    </>}
    {data.attempts.length > 0 && <>
      <button className="text-button" aria-busy={busy} disabled={busy} onClick={refresh}>{busy ? "Checking…" : "Refresh payment status"}</button>
      <details className="demo-controls"><summary>Payment request history ({data.attempts.length})</summary>
        <p className="field-hint">Ask the organizer to review the outcome before paying again.</p>
        {data.attempts.map((a, i) => <div key={a.id} className="attempt-controls"><span>Request {data.attempts.length - i} · {a.method === "zcash" ? "Zcash" : a.method === "solana" ? "Solana USDC" : "USDC"} · {a.status}</span>{a.payment?.statusMessage && <p>{a.payment.statusMessage}</p>}</div>)}
      </details>
    </>}
    <ErrorMessage message={error} />
  </section>;
}

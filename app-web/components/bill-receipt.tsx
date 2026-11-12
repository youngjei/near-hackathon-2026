import type { Dashboard } from "@/lib/client";
import { formatAmount } from "@/lib/money";
import { BrandWordmark } from "./brand-wordmark";
import { SuccessMark } from "./task-frame";

export function BillReceipt({ bill, shares }: Pick<Dashboard, "bill" | "shares">) {
  const requested = shares.reduce((sum, share) => sum + BigInt(share.amountUnits), 0n);
  const received = shares.filter(share => share.status === "paid").reduce((sum, share) => sum + BigInt(share.amountUnits), 0n);
  const remaining = requested - received;
  const paid = shares.filter(share => share.status === "paid").length;
  const live = bill.mode === "live";
  const complete = shares.length > 0 && paid === shares.length;
  const created = new Date(bill.createdAt);
  const date = created.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
  return <article className="bill-receipt" aria-label="Bill receipt">
    <header className="bill-receipt-header">
      <span className="bill-receipt-brand"><BrandWordmark /></span>
      <h1>{bill.merchant}</h1>
      <p>Created <time dateTime={created.toISOString()}>{date}</time></p>
    </header>
    <dl className="bill-receipt-lines">
      <div><dt>Receipt total</dt><dd>{bill.originalTotal} <span>{bill.currency}</span></dd></div>
      {Number(bill.extra) > 0 && <div><dt>Extra tip or charge</dt><dd>{bill.extra} <span>{bill.currency}</span></dd></div>}
      <div><dt>Split between</dt><dd>{bill.diners} people</dd></div>
      <div className="receipt-converted"><dt>Converted total</dt><dd>{formatAmount(bill.totalUnits)} <span>USDC</span></dd></div>
      <div><dt>Your share</dt><dd>{formatAmount((BigInt(bill.totalUnits) - requested).toString())} <span>USDC</span></dd></div>
      <div><dt>Requested from friends</dt><dd>{formatAmount(requested.toString())} <span>USDC</span></dd></div>
    </dl>
    <section className="bill-receipt-payment" aria-label="Repayment summary">
      <div className="receipt-received-label">{live ? "Received" : "Received in demo"}</div>
      <div className="receipt-received" aria-live="polite" aria-atomic="true">
        {formatAmount(received.toString())}<span>USDC</span>
      </div>
      <div className="progress-track" role="progressbar" aria-label="Reimbursement progress" aria-valuenow={paid} aria-valuemin={0} aria-valuemax={shares.length}>
        <div style={{ transform: `scaleX(${requested > 0n ? Number(received) / Number(requested) : 0})` }} />
      </div>
      <div className="receipt-payment-status"><span>{paid} of {shares.length} paid</span><strong>{formatAmount(remaining.toString())} USDC left</strong></div>
      {complete && <div className="all-paid" role="status"><SuccessMark /><span>{live ? "Everyone has paid" : "Everyone has paid in demo"}</span></div>}
    </section>
    <footer className="bill-receipt-footer">
      <details className="conversion-details">
        <summary>Conversion details</summary>
        <dl>
          <div><dt>Exchange rate</dt><dd>1 {bill.currency} = {bill.fxRate} USD</dd></div>
          <div><dt>Source</dt><dd>{bill.fxSource}</dd></div>
          <div><dt>Rate date</dt><dd><time dateTime={bill.fxDate}>{bill.fxDate}</time></dd></div>
        </dl>
        <p>This bill counts 1 USDC as 1 USD.</p>
      </details>
      {!live && <p className="receipt-demo-note">Demo record · No real payments</p>}
    </footer>
    {bill.hasReceipt && <details className="receipt-original"><summary>View original receipt</summary><img className="receipt-image" src={`/api/bills/${bill.id}/receipt`} alt="Original bill receipt" /></details>}
  </article>;
}

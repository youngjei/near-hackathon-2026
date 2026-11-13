"use client";
import { BillView } from "@/lib/client";
export function Receipt({
  bill,
  kind,
  id,
}: {
  bill: BillView;
  kind: "bills" | "shares";
  id: string;
}) {
  return (
    <details className="receipt-details">
      <summary>Bill details{bill.hasReceipt ? " & receipt" : ""}</summary>
      <dl className="ledger small">
        <div>
          <dt>Receipt total</dt>
          <dd>
            {bill.originalTotal} {bill.currency}
          </dd>
        </div>
        {Number(bill.extra) > 0 && (
          <div>
            <dt>Extra tip or charge</dt>
            <dd>
              {bill.extra} {bill.currency}
            </dd>
          </div>
        )}
        <div>
          <dt>Split between</dt>
          <dd>{bill.diners} people</dd>
        </div>
        <div>
          <dt>Reference rate</dt>
          <dd>{bill.fxDate}</dd>
        </div>
      </dl>
      <p className="field-hint">
        {bill.fxSource}. 1 USD = 1 USDC for the agreed split.
      </p>
      {bill.hasReceipt && (
        <img
          className="receipt-image"
          src={`/api/${kind}/${id}/receipt`}
          alt="Shared dinner receipt"
        />
      )}
    </details>
  );
}

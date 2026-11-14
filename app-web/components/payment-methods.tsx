"use client";

export type PaymentMethod = "zcash" | "confidential" | "solana";

const options: { value: PaymentMethod; label: string; privacy: string }[] = [
  { value: "zcash", label: "Zcash (VIZOR or Zodl)", privacy: "Your shielded balance hides your sending address. The quote routes to confidential USDC for the recipient. Deposit amounts remain public." },
  { value: "confidential", label: "NEAR Confidential balance", privacy: "Pay USDC from your confidential balance. Both balances and internal transfers stay off the public ledger." },
  { value: "solana", label: "Solana wallet (USDC)", privacy: "Pay USDC on Solana. Standard transfers reveal your wallet and amount; privacy depends on how you send." },
];

export function PaymentMethods({ method, onChange, disabled, available, name }: { method: PaymentMethod; onChange: (method: PaymentMethod) => void; disabled?: boolean; available?: Partial<Record<PaymentMethod, boolean>>; name: string }) {
  return <> <div className="methods" role="radiogroup" aria-label="Payment method">
    {options.map(({ value, label, privacy }) => <label key={value} className={`method ${method === value ? "selected" : ""}`}>
      <input type="radio" name={name} value={value} checked={method === value} disabled={disabled} onChange={() => onChange(value)} />
      <span><strong>{label}</strong><small>{privacy}{available && !available[value] ? " · Not available yet" : ""}</small></span><span className="radio-visual" aria-hidden="true" />
    </label>)}
  </div><details className="payment-help"><summary>About payment privacy</summary><p className="field-hint">Each route is quoted to deliver confidential USDC to the recipient; actual credit has not yet been verified. Providers still process the route, and public deposit amounts and timing can be linked. A wallet’s branding alone does not shield a public transfer.</p></details></>;
}

"use client";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/shell";
import { link, type Dashboard } from "@/lib/client";
import { rememberBill } from "@/lib/saved-bills";

export function BillRecovery({ dashboard }: { dashboard: Dashboard }) {
  const [recoveryLink, setRecoveryLink] = useState("");
  const [saved, setSaved] = useState<boolean>();
  useEffect(() => {
    if (!dashboard.organizerToken) return;
    // Browser origin and storage are available only after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecoveryLink(link("bill", dashboard.bill.id, dashboard.organizerToken));
    setSaved(rememberBill(dashboard.bill, dashboard.organizerToken));
    // Do not resave on polling: a forgotten entry must stay forgotten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard.bill.id, dashboard.bill.merchant, dashboard.organizerToken]);
  if (!recoveryLink) return null;
  return (
    <details className="bill-recovery" open={saved === false}>
      <summary>Keep your organizer link</summary>
      <p className="field-hint">
        {saved ? "Saved in Your bills on this browser. Clearing browser data removes saved access." :
          "This browser cannot save this bill. Keep the private organizer link to return."}
      </p>
      <p className="field-hint">Save this link somewhere private to open the bill on another device. Anyone with it can manage this bill and see all requests. Send friends their individual payment links.</p>
      <label className="field recovery-link">
        Private organizer link
        <input value={recoveryLink} readOnly onFocus={event => event.currentTarget.select()}
          autoComplete="off" spellCheck={false} />
      </label>
      <CopyButton value={recoveryLink} label="Copy organizer link" />
    </details>
  );
}

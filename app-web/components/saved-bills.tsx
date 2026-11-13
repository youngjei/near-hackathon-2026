"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Dashboard } from "@/lib/client";
import { forgetBill, readSavedBills, type SavedBill } from "@/lib/saved-bills";
import { ErrorMessage } from "@/components/shell";
import { formatAmount } from "@/lib/money";

type Entry = { saved: SavedBill; dashboard?: Dashboard; error?: string };
export function SavedBills() {
  const [entries, setEntries] = useState<Entry[]>();
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const current = readSavedBills();
    // Read browser storage after hydration before fetching current statuses.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailable(current.available);
    setEntries(current.bills.map(saved => ({ saved })));
    // The local index stores access only. Payment progress always comes from the server.
    for (const saved of current.bills) {
      api<Dashboard>(`bills/${saved.id}`, undefined, { remember: false }).then(dashboard => {
        if (!cancelled) setEntries(previous => previous?.map(entry =>
          entry.saved.id === saved.id ? { saved: entry.saved, dashboard } : entry));
      }).catch(() => {
        if (!cancelled) setEntries(previous => previous?.map(entry =>
          entry.saved.id === saved.id ? { saved: entry.saved, error: "Status unavailable. Try opening the bill or retry." } : entry));
      });
    }
    return () => { cancelled = true; };
  }, [refresh]);
  function remove(id: string) {
    if (!forgetBill(id)) { setError("This browser could not remove the saved entry. Please try again."); return; }
    setError("");
    setEntries(previous => previous?.filter(entry => entry.saved.id !== id));
  }
  return (
    <>
      <div className="intro compact">
        <h1>Your bills</h1>
        <p>Saved on this browser.</p>
      </div>
      <p className="field-hint">Keep each bill’s private organizer link to return on another device.</p>
      <details className="bill-recovery">
        <summary>How saved bills work</summary>
        <p className="field-hint">Bills you created or opened as organizer are saved in this browser. No login needed. Clearing browser data removes saved access. A receiving address cannot recover bills.</p>
        <p className="field-hint">Up to 50 bills are saved; the oldest saved entry is replaced when full. Keep private organizer links for older bills.</p>
        <p className="field-hint">Removing an entry does not delete the bill or revoke existing browser access or copied private links.</p>
      </details>
      {!available && <p role="status" className="inline-note">This browser cannot access saved bills. Open a private organizer link you saved, or create a new bill and keep its organizer link.</p>}
      {!entries && <p role="status">Opening your saved bills…</p>}
      {entries?.length === 0 && available && (
        <p>No bills saved here yet. Create a bill or open a private organizer link to add one.</p>
      )}
      {!!entries?.length && (
        <>
          <button className="text-button" onClick={() => setRefresh(value => value + 1)}>Refresh status</button>
          <ul className="saved-bills-list">
            {entries.map(({ saved, dashboard, error: statusError }) => {
              const paid = dashboard?.shares.filter(share => share.status === "paid");
              const received = paid?.reduce((total, share) => total + BigInt(share.amountUnits), 0n);
              return (
                <li className="saved-bill-row" key={saved.id}>
                  <div className="saved-bill-main">
                    <h2><a href={`/bill?id=${saved.id}`}>{dashboard?.bill.merchant || saved.title}</a></h2>
                    <p className="saved-bill-status" role="status">
                      {dashboard ? `${paid!.length} of ${dashboard.shares.length} paid${dashboard.bill.mode === "demo" ? " in demo" : ""} · ${formatAmount(received!.toString())} USDC received` :
                        statusError || "Checking current status…"}
                    </p>
                  </div>
                  <div className="saved-bill-actions">
                    <a className="text-button" href={`/bill?id=${saved.id}`}>Open bill →</a>
                    <button className="text-button" onClick={() => remove(saved.id)} aria-label={`Remove ${saved.title} from list`}>Remove from list</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <ErrorMessage message={error} />
      <Link href="/" className="button primary">Split a new bill →</Link>
    </>
  );
}

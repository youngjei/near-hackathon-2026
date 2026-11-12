"use client";

import { ReceiptIcon } from "./task-frame";
import { BrandWordmark } from "./brand-wordmark";
import { useState } from "react";
import { usePathname } from "next/navigation";
export function Shell({ children, notice = "Demo · No real payments" }: { children: React.ReactNode; notice?: string | null }) {
  const pathname = usePathname();
  return (
    <>
      <header className="site-header">
        <a className="header-link bills-link" href="/bills" aria-current={pathname === "/bills" ? "page" : undefined}>Your bills</a>
        <a className="wordmark" href="/" aria-label="split/d/bill home">
          <BrandWordmark />
        </a>
        <a className="header-link new-bill-link" href="/" aria-current={pathname === "/" ? "page" : undefined}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg> New bill</a>
      </header>
      {notice && <div className="demo-notice">{notice}</div>}
      <main id="main">{children}</main>
    </>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p className="error" role="alert">
      {message}
    </p>
  ) : null;
}
export function CopyButton({
  value,
  label = "Copy link",
}: {
  value: string;
  label?: string;
}) {
  const [state, setState] = useState("");
  return (
    <button
      type="button"
      className={`button quiet ${state === "Copied" ? "copy-confirmed" : ""}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setState("Copied");
          setTimeout(() => setState(""), 2000);
        } catch {
          setState("Copy unavailable");
        }
      }}
    >
      <span aria-live="polite">{state || label}</span>
    </button>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status" aria-live="polite">
      <ReceiptIcon className="loading-receipt" />
      <span>Opening your bill…</span>
      <div className="loading-skeleton" aria-hidden="true"><i /><i /><i /></div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="split/d/bill home">
          split<span>/</span>d<span>/</span>bill
        </a>
        {pathname !== "/" && (
          <a className="header-link" href="/">
            New bill <span aria-hidden="true">↗</span>
          </a>
        )}
      </header>
      <div className="demo-notice">Demo · No real payments</div>
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
      className="button quiet"
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
      {state || label}
    </button>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      Opening your bill…
    </div>
  );
}

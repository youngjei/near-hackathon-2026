"use client";
import { useEffect, useRef } from "react";

export function ReceivingHelp() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef("");
  function restore() {
    document.body.style.overflow = previousOverflow.current;
    trigger.current?.focus();
  }
  useEffect(() => {
    const element = dialog.current;
    return () => { if (element?.open) document.body.style.overflow = previousOverflow.current; };
  }, []);
  function open() {
    previousOverflow.current = document.body.style.overflow;
    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
  }
  return (
    <>
      <button ref={trigger} type="button" className="text-button receiving-help-link" onClick={open}>
        Where do I find this?
      </button>
      <dialog ref={dialog} className="receiving-dialog" aria-labelledby="receiving-help-title" onClose={restore}
        onClick={event => { if (event.target === dialog.current) dialog.current?.close(); }}>
        <div className="receiving-dialog-content">
          <div className="dialog-heading">
            <h2 id="receiving-help-title">Find your near.com address</h2>
            <button type="button" className="dialog-close" aria-label="Close address help" autoFocus onClick={() => dialog.current?.close()}>×</button>
          </div>

          <ol className="receiving-steps">
            <li>Sign in to near.com.</li>
            <li>Open your account menu and choose <strong>My address</strong>.</li>
            <li>Read the internal-use notice and choose <strong>Show address</strong>.</li>
            <li>Copy the full address starting with <strong>nearcom:</strong>, then paste it here.</li>
          </ol>

          <p className="field-hint">Use the internal address, not a token’s blockchain deposit address.</p>
          <p className="field-hint">Never send a blockchain transfer directly to this internal address.</p>
          <div className="dialog-actions">
            <a className="button secondary" href="https://near.com" target="_blank" rel="noreferrer">Open near.com ↗</a>
            <button type="button" className="button primary" onClick={() => dialog.current?.close()}>Done</button>
          </div>
        </div>
      </dialog>
    </>
  );
}

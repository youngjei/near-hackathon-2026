import type { ReactNode } from "react";

export function TaskFrame({ context, children, className = "" }: { context: ReactNode; children: ReactNode; className?: string }) {
  return <div className={`task-layout ${className}`}>
    <aside className="task-context">{context}</aside>
    <div className="flow task-document">{children}</div>
  </div>;
}

export function WorkflowSteps({ current }: { current: number }) {
  return <ol className="workflow-steps" aria-label="Create a bill">
    {["Add receipt", "Check the split", "Share requests"].map((label, index) =>
      <li key={label} className={index === current ? "current" : index < current ? "complete" : ""} aria-current={index === current ? "step" : undefined}>
        <span className="step-index" aria-hidden="true">{index < current ? <svg viewBox="0 0 20 20"><path d="m5 10 3 3 7-7" /></svg> : index + 1}</span>
        <span>{label}</span>
      </li>)}
  </ol>;
}

export function ReceiptIcon() {
  return <svg className="receipt-icon" viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M7 3h18v29l-3-2-3 2-3-2-3 2-3-2-3 2V3Z" /><path d="M11 10h10M11 15h10M11 20h4M19 20h2" /></svg>;
}

export function SuccessMark() {
  return <span className="check-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m6 12 4 4 8-8" /></svg></span>;
}

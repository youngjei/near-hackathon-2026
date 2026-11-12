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

const receiptCells = [
  "1111111111", "1111111111", "1100000011", "1111111111",
  "1100000011", "1111111111", "1100110011", "1111111111",
  "1111111111", "1101101101", "0100100100",
];
function PixelReceipt({ x = 0, y = 0, cell = 3, gap = 1 }: { x?: number; y?: number; cell?: number; gap?: number }) {
  return <g fill="currentColor">{receiptCells.flatMap((row, rowIndex) =>
    [...row].map((value, column) => value === "1" ? <rect key={`${rowIndex}-${column}`}
      x={x + column * (cell + gap)} y={y + rowIndex * (cell + gap)} width={cell} height={cell}
      opacity={column === 0 || rowIndex === 0 ? .55 : 1} /> : null))}</g>;
}
export function ReceiptIcon() {
  return <svg className="receipt-icon" viewBox="0 0 40 44" fill="none" shapeRendering="crispEdges" aria-hidden="true"><PixelReceipt /></svg>;
}

export function SplitGraphic({ split = false }: { split?: boolean }) {
  return <svg className={`split-graphic ${split ? "is-split" : ""}`} viewBox="0 0 320 150" fill="none" shapeRendering="crispEdges" aria-hidden="true">
    <g className="graphic-receipt"><PixelReceipt x={8} y={18} cell={6} gap={2}/></g>
    {[{x: 148, y: 72}, {x: 204, y: 48}, {x: 260, y: 24}].map(({x, y}, index) =>
      <g key={index} className={`graphic-share graphic-share-${index}`}><PixelReceipt x={x} y={y}/></g>)}
  </svg>;
}

export function SuccessMark() {
  return <span className="check-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m6 12 4 4 8-8" /></svg></span>;
}

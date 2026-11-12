import { ReceiptIcon } from "./task-frame";

function PixelSlash() {
  return <svg className="brand-slash" viewBox="0 0 40 72" aria-hidden="true" shapeRendering="crispEdges">
    {Array.from({ length: 8 }, (_, index) => <rect key={index} x={(7 - index) * 4} y={index * 9} width="10" height="9" fill="currentColor" />)}
  </svg>;
}

export function BrandWordmark() {
  return <span className="brand-wordmark">
    <span className="sr-only">split/d/bill</span>
    <ReceiptIcon className="brand-receipt" />
    <span className="brand-lettering" aria-hidden="true"><span>split</span><PixelSlash /><span>d</span><PixelSlash /><span>bill</span></span>
  </span>;
}

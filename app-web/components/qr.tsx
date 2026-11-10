"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
export function QR({ value }: { value: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: 224,
      margin: 2,
      color: { dark: "#182b25", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then((v) => active && setSrc(v));
    return () => {
      active = false;
    };
  }, [value]);
  return src ? (
    <img
      className="qr"
      width="224"
      height="224"
      src={src}
      alt="Scan to open this individual bill invitation"
    />
  ) : (
    <p>Preparing invitation QR…</p>
  );
}

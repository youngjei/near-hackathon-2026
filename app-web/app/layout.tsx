import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "splitdbill",
  description:
    "Split a receipt and track reimbursements in USDC. Private demo.",
  referrer: "no-referrer",
  icons: {icon: "/favicon.svg"},
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

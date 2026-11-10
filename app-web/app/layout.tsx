import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "split/d/bill — dinner, divided",
  description:
    "Turn a shared receipt into simple reimbursement requests. Private beta demo.",
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

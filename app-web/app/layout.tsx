import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "split/d/bill",
  description:
    "Split a receipt and track reimbursements in USDC. Private demo.",
  referrer: "no-referrer",
  applicationName: "split/d/bill",
  manifest: "/site.webmanifest?v=petrol-1",
  icons: {
    icon: [
      { url: "/favicon.ico?v=petrol-1", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/favicon-32x32.png?v=petrol-1", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg?v=petrol-1", sizes: "any", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=petrol-1", sizes: "180x180", type: "image/png" }],
  },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#14645e" };
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

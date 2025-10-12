import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Longshot Odds maker",
  description: "Created with v0",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
        <footer className="pt-6 pb-8 text-center bg-zinc-800">
          <p className="text-sm text-white">
            Please bet responsibly and send me a few bucks if you hit the big
            one.
          </p>
        </footer>
      </body>
    </html>
  );
}

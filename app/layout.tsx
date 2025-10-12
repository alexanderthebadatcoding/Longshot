import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Longshot | Live Sports Odds & Betting Lines",
  description:
    "Track live odds for upcoming games across all major sports — NFL, NBA, MLB, NHL, and more. Stay ahead with real-time betting lines, point spreads, and over/unders from top sportsbooks.",
  generator: "v0.app",
  keywords: [
    "sports betting odds",
    "live odds",
    "moneyline",
    "point spreads",
    "totals",
    "Longshot app",
    "sportsbook comparison",
  ],
  authors: [{ name: "Longshot" }],
  openGraph: {
    title: "Longshot — Live Odds Across All Sports",
    description:
      "Compare live betting lines, spreads, and totals in real time. Your edge starts here.",
    url: "https://looongshot.vercel.app",
    siteName: "Longshot",
    images: [
      {
        url: "https://looongshot.vercel.app/og_image.png",
        width: 1200,
        height: 630,
        alt: "Longshot Odds Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Longshot — Live Sports Odds & Betting Lines",
    description:
      "Real-time odds and spreads for every major sport. Know before you bet.",
    images: ["https://looongshot.vercel.app/og_image.png"],
    creator: "@alexgilbertson",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/og_image.png",
  },
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
        <footer className="flex items-center justify-center pt-6 pb-8 text-center bg-zinc-800">
          <p className="text-sm text-white text-pretty">
            Please bet responsibly and send me a few bucks if you hit the big
            one.
          </p>
        </footer>
      </body>
    </html>
  );
}

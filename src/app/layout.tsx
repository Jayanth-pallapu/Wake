import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "StakeForge — Crypto Casino & Sportsbook",
  description:
    "Provably fair crypto casino & sportsbook. Crash, Dice, Plinko, Mines, Limbo, Wheel, live sports betting, VIP rewards, and live chat.",
  keywords: [
    "crypto casino", "bitcoin casino", "provably fair", "crash", "dice", "plinko",
    "mines", "sportsbook", "live betting", "VIP",
  ],
  authors: [{ name: "StakeForge" }],
  icons: {
    icon: "https://api.dicebear.com/7.x/bottts/svg?seed=stakeforge",
  },
  openGraph: {
    title: "StakeForge — Crypto Casino & Sportsbook",
    description: "Provably fair crypto casino & sportsbook with live chat, VIP rewards, and instant payouts.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f212e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased bg-background text-foreground dark`}
      >
        {children}
        <Toaster />
        <SonnerToaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a2c38",
              color: "#fff",
              border: "1px solid #2f4553",
            },
          }}
        />
      </body>
    </html>
  );
}

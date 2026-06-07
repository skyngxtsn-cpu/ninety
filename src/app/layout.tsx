import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "../components/BottomNav";
import { ServiceWorkerRegistrar } from "../components/ServiceWorkerRegistrar";
import { SpoilerOnboarding } from "../components/SpoilerOnboarding";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "90 — W杯の意味を、90秒で。",
    template: "%s",
  },
  description:
    "W杯 2026 を 90 秒で。推しチームの試合だけ通知、結果ネタバレなしの観戦サポート PWA。",
  applicationName: "90",
  appleWebApp: {
    capable: true,
    title: "90",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.svg",
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  openGraph: {
    type: "website",
    siteName: "90",
    title: "90 — W杯の意味を、90秒で。",
    description:
      "推しチームの試合だけ通知、結果ネタバレなし。W杯 2026 の観戦サポート PWA。",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "90 — W杯の意味を、90秒で。",
    description:
      "推しチームの試合だけ通知、結果ネタバレなし。W杯 2026 の観戦サポート PWA。",
  },
};

export const viewport: Viewport = {
  themeColor: "#07080c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="mx-auto w-full max-w-[480px] flex-1 pb-safe">
          {children}
        </div>
        <BottomNav />
        <ServiceWorkerRegistrar />
        <SpoilerOnboarding />
      </body>
    </html>
  );
}

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

export const metadata: Metadata = {
  title: "90 — W杯の意味を、90秒で。",
  description:
    "サッカーを知らなくてもW杯が楽しめる。なぜ注目なのか、何が起きたのかを30秒で。",
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

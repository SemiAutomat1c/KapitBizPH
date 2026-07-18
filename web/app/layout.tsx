import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KapitBiz Relay",
  description: "Regional operating-capacity rescue for Davao MSMEs",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "KapitBiz Relay",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#006d77",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable}`}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

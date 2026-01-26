import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "어른의 숲 (Forest of Calm)",
  description: "부모의 자책감을 성장의 데이터로 바꾸는 AI 감정 회고 플랫폼",
  manifest: "/manifest.json",
  themeColor: "#34d399",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "어른의 숲",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

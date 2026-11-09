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
  title: "NCU Explorer | 國立中央大學校園生活與學習資源平台",
  description: "探索中央大學校園生活、課程資訊、3D 地圖與生活指南。",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#faf8ff] text-stone-800 selection:bg-violet-600/20 selection:text-violet-900">
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}

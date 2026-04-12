import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalAuthGuard from "@/components/GlobalAuthGuard";
import LayoutClientWrapper from "@/components/LayoutClientWrapper";
import FeedbackOverlay from "@/components/FeedbackOverlay";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Playgrounds | 인공지능 미래 연구소",
  description: "고등학생을 위한 8차시 통합 인공지능 학습 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen relative overflow-x-hidden bg-[#FDFAEF] text-[#2F3D4A]`}
      >
        <GlobalAuthGuard />
        <FeedbackOverlay />
        <LayoutClientWrapper>{children}</LayoutClientWrapper>
      </body>
    </html>
  );
}

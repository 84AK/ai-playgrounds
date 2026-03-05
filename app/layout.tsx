import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import GlobalAuthGuard from "@/components/GlobalAuthGuard";

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
    <html lang="ko" className="dark">
      <body
        className={`dark ${geistSans.variable} ${geistMono.variable} antialiased min-h-screen relative overflow-x-hidden`}
      >
        <GlobalAuthGuard />

        {/* Background Decorative Elements */}
        <div className="fixed inset-0 -z-10 bg-background">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: "-2s" }} />
        </div>

        <Navbar />

        <main className="pt-12 pb-20 px-6 max-w-7xl mx-auto">
          {children}
        </main>

        <footer className="w-full border-t border-border bg-background py-16 px-6 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 opacity-80">
            <div className="flex flex-col items-center md:items-start gap-1">
              <h2 className="text-2xl font-black italic tracking-tighter">AI Playgrounds<span className="text-primary">.</span></h2>
              <p className="text-xs font-bold text-muted-foreground mt-2">© 2026 AI Innovation Lab. Built for Advanced AI Education.</p>
              <a href="https://litt.ly/aklabs" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:text-primary/70 transition-colors mt-1 hover:underline underline-offset-4">
                https://litt.ly/aklabs
              </a>
            </div>

            <div className="flex gap-10 text-sm font-black uppercase tracking-widest text-muted-foreground">
              <Link href="/curriculum" className="hover:text-primary transition-colors cursor-pointer">Curriculum</Link>
              <Link href="/showcase" className="hover:text-primary transition-colors cursor-pointer">Showcase</Link>
              <Link href="/guide" className="hover:text-primary transition-colors cursor-pointer">Guide</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

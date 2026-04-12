"use client";

import Link from "next/link";

interface FooterProps {
  onOpenPrivacyPolicy: () => void;
}

export default function Footer({ onOpenPrivacyPolicy }: FooterProps) {
  return (
    <footer className="w-full border-t border-border bg-background py-16 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 opacity-80">
        <div className="flex flex-col items-center md:items-start gap-1">
          <h2 className="text-2xl font-black italic tracking-tighter">
            AI Playgrounds<span className="text-primary">.</span>
          </h2>
          <p className="text-xs font-bold text-muted-foreground mt-2">
            © 2026 AI Innovation Lab. Built for Advanced AI Education.
          </p>
          <a
            href="https://litt.ly/aklabs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-primary hover:text-primary/70 transition-colors mt-1 hover:underline underline-offset-4"
          >
            https://litt.ly/aklabs
          </a>
        </div >

        <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm font-black uppercase tracking-widest text-muted-foreground">
          <Link href="/curriculum" className="hover:text-primary transition-colors cursor-pointer">
            Curriculum
          </Link>
          <Link href="/showcase" className="hover:text-primary transition-colors cursor-pointer">
            Showcase
          </Link>
          <Link href="/guide" className="hover:text-primary transition-colors cursor-pointer">
            Guide
          </Link>
          <Link href="/admin" className="hover:text-primary transition-colors cursor-pointer">
            Admin
          </Link>
          <button
            onClick={onOpenPrivacyPolicy}
            className="hover:text-primary transition-colors cursor-pointer text-sm font-black uppercase tracking-widest text-muted-foreground"
          >
            Privacy
          </button>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import UserSettingsModal from "./UserSettingsModal";
import useLocalProfile from "@/hooks/useLocalProfile";

const navItems = [
  { name: "🏠 홈", path: "/" },
  { name: "👤 마이페이지", path: "/my" },
  { name: "🚀 My Study Lab", path: "/study-lab" },
  { name: "🧪 MBTI 메이커", path: "/mbti" },
  { name: "🎮 AI 포즈 게임", path: "/game" },
  { name: "✨ 쇼케이스", path: "/showcase" },
];

export default function Navbar() {
  const pathname = usePathname();
  const profile = useLocalProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (navRef.current && target && !navRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav ref={navRef} className="mt-6 mx-auto w-[95%] max-w-5xl z-50 relative">
        <div className="glass rounded-[2rem] px-6 sm:px-8 py-4 flex items-center justify-between border-white/20 shadow-2xl relative z-50">
          {/* Logo Section */}
          <Link href="/" className="font-extrabold text-2xl tracking-tighter flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white text-sm shadow-lg shadow-primary/30 group-hover:rotate-12 transition-transform">AI</div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 block">Playgrounds</span>
          </Link>

          {/* Right Action Section */}
          <div className="flex items-center gap-3 shrink-0">
            {/* User Profile / Login */}
            {isMounted && profile ? (
              <Link
                href="/my"
                className="flex items-center gap-2 bg-secondary/80 hover:bg-secondary px-3 py-1.5 rounded-full border border-white/5 hover:border-white/20 transition-all shrink-0"
              >
                <span className="text-xl leading-none">{profile.avatar}</span>
                <span className="text-sm font-bold hidden sm:block pr-1">{profile.name}</span>
              </Link>
            ) : isMounted ? (
              <Link
                href="/my"
                className="text-sm font-bold bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full transition-all border border-primary/20"
              >
                로그인
              </Link>
            ) : (
              <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
            )}

            {/* Unified Menu Button */}
            <button
              type="button"
              aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className={`min-w-[80px] h-10 rounded-full flex items-center justify-between px-4 border transition-all duration-300 ${isMobileMenuOpen
                ? "bg-white text-primary border-white shadow-xl scale-95"
                : "bg-secondary/80 border-white/10 hover:border-white/20 hover:bg-secondary"
                }`}
            >
              <div className="flex flex-col gap-1 w-4">
                <span className={`h-0.5 w-full bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                <span className={`h-0.5 w-full bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`} />
                <span className={`h-0.5 w-full bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
              </div>
              <span className="text-[11px] font-black tracking-widest ml-2">
                {isMobileMenuOpen ? "CLOSE" : "MENU"}
              </span>
            </button>
          </div>
        </div>

        {/* Glassmorphic Dropdown Menu */}
        {isMounted && isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-3 glass rounded-[2rem] border border-white/10 p-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 z-40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {navItems.map((item, index) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center justify-between rounded-2xl px-5 py-4 text-sm font-bold transition-all duration-200 group ${isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="opacity-70 group-hover:scale-110 transition-transform">{item.name.split(' ')[0]}</span>
                      <span>{item.name.split(' ').slice(1).join(' ')}</span>
                    </span>
                    <span className={`text-[10px] font-black tracking-widest opacity-0 group-hover:opacity-100 transition-all ${isActive ? "opacity-100" : ""}`}>
                      ENTER
                    </span>
                  </Link>
                );
              })}
            </div>
            {/* Quick Footer inside menu */}
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-center">
              <p className="text-[10px] text-muted-foreground font-medium tracking-tight">
                © 2026 AI Playgrounds by <Link href="https://litt.ly/aklabs" className="hover:text-primary transition-colors">AK Labs</Link>
              </p>
            </div>
          </div>
        )}
      </nav>

      {/* Modal removed as we now navigate to /my */}
    </>
  );
}

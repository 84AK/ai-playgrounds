"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import UserSettingsModal from "./UserSettingsModal";
import useLocalProfile from "@/hooks/useLocalProfile";

const navItems = [
  { name: "🏠 홈", path: "/" },
  { name: "🧪 MBTI 메이커", path: "/mbti" },
  { name: "🎮 AI 포즈 게임", path: "/game" },
  { name: "✨ 쇼케이스", path: "/showcase" },
];

export default function Navbar() {
  const pathname = usePathname();
  const profile = useLocalProfile();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
      <nav ref={navRef} className="mt-6 mx-auto w-[95%] max-w-5xl z-40 relative">
        <div className="glass rounded-[2rem] px-8 py-4 flex items-center justify-between border-white/20 shadow-2xl">
          <Link href="/" className="font-extrabold text-2xl tracking-tighter flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white text-sm shadow-lg shadow-primary/30 group-hover:rotate-12 transition-transform">AI</div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 hidden sm:block">Playgrounds</span>
          </Link>
          <ul className="hidden md:flex items-center gap-2 p-1 bg-secondary/50 rounded-2xl border border-white/5">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${pathname === item.path
                    ? "bg-white dark:bg-primary shadow-lg text-primary dark:text-white"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            {isMounted && profile ? (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 bg-secondary/80 hover:bg-secondary px-3 py-1.5 rounded-full border border-white/5 hover:border-white/20 transition-all"
              >
                <span className="text-xl leading-none">{profile.avatar}</span>
                <span className="text-sm font-bold hidden sm:block pr-1">{profile.name}</span>
              </button>
            ) : (
              <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
            )}
            <button
              type="button"
              aria-label={isMobileMenuOpen ? "모바일 메뉴 닫기" : "모바일 메뉴 열기"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className={`md:hidden min-w-[60px] h-9 rounded-full flex items-center justify-center px-3 border transition-all ${
                isMobileMenuOpen
                  ? "bg-white text-primary border-white"
                  : "bg-secondary border-white/5 hover:border-white/20"
              }`}
            >
              <span className="text-[10px] font-black tracking-[0.12em]">
                {isMobileMenuOpen ? "CLOSE" : "MENU"}
              </span>
            </button>
          </div>
        </div>

        {isMounted && isMobileMenuOpen && (
          <div className="md:hidden mt-3 glass rounded-[1.75rem] border border-white/10 p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                        isActive
                          ? "bg-white text-primary"
                          : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{item.name}</span>
                      <span className={`text-[10px] font-black tracking-[0.18em] ${isActive ? "text-primary/80" : "text-white/35"}`}>
                        GO
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      <UserSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}

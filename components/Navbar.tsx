"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import UserSettingsModal from "./UserSettingsModal";
import type { UserProfile } from "./GlobalAuthGuard";

const navItems = [
  { name: "🏠 홈", path: "/" },
  { name: "🧪 MBTI 메이커", path: "/mbti" },
  { name: "🎮 AI 포즈 게임", path: "/game" },
  { name: "✨ 쇼케이스", path: "/showcase" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const syncProfile = () => {
      const saved = localStorage.getItem("lab_user_profile");
      if (!saved) {
        setProfile(null);
        return;
      }
      try {
        setProfile(JSON.parse(saved));
      } catch {
        setProfile(null);
      }
    };

    syncProfile();
    window.addEventListener("auth:changed", syncProfile);
    window.addEventListener("storage", syncProfile);
    return () => {
      window.removeEventListener("auth:changed", syncProfile);
      window.removeEventListener("storage", syncProfile);
    };
  }, []);

  return (
    <>
      <nav className="mt-6 mx-auto w-[95%] max-w-5xl z-40 relative">
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
            {profile ? (
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
            {/* Mobile menu toggle */}
            <div className="md:hidden w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-[10px] font-black">MENU</span>
            </div>
          </div>
        </div>
      </nav>

      <UserSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}

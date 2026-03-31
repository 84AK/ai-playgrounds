"use client";

import React from "react";
import Link from "next/link";

interface MaintenanceOverlayProps {
  isVisible: boolean;
}

export default function MaintenanceOverlay({ isVisible }: MaintenanceOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-2xl transition-all duration-500 overflow-hidden">
      <div className="relative max-w-lg w-full mx-4 p-12 rounded-[4rem] bg-white border-4 border-[#2F3D4A] shadow-[20px_20px_0px_0px_#2F3D4A] text-center space-y-8 animate-in zoom-in-95 duration-500 overflow-hidden">
        
        {/* Background Decorative Circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col items-center gap-4">
          <div className="relative inline-flex items-center justify-center w-32 h-32 text-7xl animate-float">
            👨‍🔧
            <div className="absolute -bottom-2 -right-2 text-4xl animate-bounce">⚡</div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border-2 border-[#2F3D4A] shadow-[2px_2px_0px_0px_#2F3D4A]">
            <span className="text-xs font-black text-[#2F3D4A] uppercase tracking-wider">🚧 System Maintenance</span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tighter text-[#2F3D4A] leading-tight">
            연구소 서비스를<br />
            업그레이드 중입니다!
          </h1>
          <p className="text-lg font-bold text-slate-600 leading-relaxed bread-keep px-4">
            더 나은 연구 환경을 위해 시스템을 정비하고 있습니다.<br />
            잠시 후 다시 방문해 주시면 더욱 놀라운 경험을 선사해 드릴게요! 🚀
          </p>
        </div>

        <div className="pt-8 border-t-2 border-slate-100 flex flex-col items-center gap-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Always Improving For Future Creators
          </p>
          <Link
            href="https://litt.ly/aklabs"
            target="_blank"
            className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-sm border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] hover:bg-primary/90 transition-all flex items-center gap-2"
          >
             아크랩스(AK LABS) 문의하기 👋
          </Link>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-sky-500 to-amber-500" />
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
            animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

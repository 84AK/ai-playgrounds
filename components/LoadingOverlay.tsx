"use client";

import React from "react";

interface LoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

export default function LoadingOverlay({
  message = "데이터를 동기화 중입니다...",
  isVisible
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/40 backdrop-blur-md transition-all duration-500 animate-in fade-in">
      <div className="relative p-10 rounded-[3rem] bg-white/80 border-2 border-[#2F3D4A] shadow-[8px_8px_0px_0px_#2F3D4A] flex flex-col items-center gap-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300">
        
        {/* Animated Mascot or Icon Wrapper */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <div className="relative flex items-center justify-center w-full h-full bg-white border-4 border-[#2F3D4A] rounded-full shadow-inner overflow-hidden">
            <span className="text-5xl animate-bounce">🔬</span>
          </div>
          
          {/* Scanning Line Effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 animate-[progress-scan_2s_infinite] blur-sm" />
        </div>

        <div className="space-y-2 text-center">
          <h3 className="text-xl font-black text-[#2F3D4A] tracking-tight">AI 연구소 동기화 중</h3>
          <p className="text-sm font-bold text-slate-500 break-keep leading-relaxed italic">
            "{message}"
          </p>
        </div>

        {/* Custom Progress Animation */}
        <div className="w-full h-3 bg-slate-100 border-2 border-[#2F3D4A] rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-primary animate-[loading-bar_1.5s_infinite] w-1/3 rounded-full" />
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">
          Syncing with Google AI Lab
        </p>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes progress-scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(96px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

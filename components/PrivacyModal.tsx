"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PrivacyModalProps {
  onOpenPolicy: () => void;
}

export default function PrivacyModal({ onOpenPolicy }: PrivacyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    const hideUntil = localStorage.getItem("hidePrivacyModalUntil");
    if (!hideUntil || new Date(hideUntil) < new Date()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true);
    }
  }, []);

  const handleConfirm = () => {
    if (dontShowToday) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // 자정 만료
      localStorage.setItem("hidePrivacyModalUntil", tomorrow.toISOString());
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-lg bg-zinc-900/90 border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden relative"
        >
          {/* Decorative Gradient Background inside card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-10" />

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <h2 className="text-xl font-black tracking-tight text-white leading-none">
                개인정보 수집 및 이용 안내
              </h2>
            </div>

            <p className="text-sm text-zinc-400 font-medium leading-relaxed">
              **AI Playgrounds**는 교육 목적으로 원활한 학습 관리를 위해 로컬 웹 저장소(Local Profile)를 사용합니다. 
              수집되는 정보는 여러분의 학습 환경 개선만을 위해 사용됩니다.
            </p>

            {/* Bento-style Box Detail inside modal */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-bold">수집 항목</span>
                <span className="text-zinc-200 font-semibold">성명, 학교, 학년, 반</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3">
                <span className="text-zinc-500 font-bold">수집 목적</span>
                <span className="text-zinc-200 font-semibold">학습 데이터 저장 및 대시보드 관리</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3">
                <span className="text-zinc-500 font-bold">보관 기간</span>
                <span className="text-zinc-200 font-semibold">학습 종료 시 즉시 파기</span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 leading-snug">
              본 웹사이트를 계속 이용할 경우, 위 내용에 동의한 것으로 간주합니다. 
              상세한 내용은 하단의 버튼을 눌러 확인하실 수 있습니다.
            </p>

            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setDontShowToday(!dontShowToday)}>
                <input
                  type="checkbox"
                  checked={dontShowToday}
                  onChange={() => {}} // Click handled by parent div for larger area
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-primary focus:ring-primary/50 cursor-pointer"
                />
                <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors font-medium">
                  오늘 하루 보지 않기
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onOpenPolicy}
                  className="flex-1 py-3 text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all"
                >
                  자세히 보기
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 text-xs font-black bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  확인했습니다
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

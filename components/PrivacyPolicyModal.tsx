"use client";

import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { PrivacyPolicyContent } from "./PrivacyPolicyContent";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-2xl bg-zinc-900/95 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[80vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()} // Prevent close on card click
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              📜 <span className="text-lg">상세 개인정보 처리방침</span>
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all text-xs"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto py-6 pr-2 custom-scrollbar">
            <article className="prose prose-invert prose-sm max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary prose-strong:text-white prose-hr:border-white/5">
              <ReactMarkdown>{PrivacyPolicyContent}</ReactMarkdown>
            </article>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-xs font-black bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white rounded-xl transition-all"
            >
              닫기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

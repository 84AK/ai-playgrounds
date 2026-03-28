"use client";

import { useState, useEffect } from "react";
import useLocalProfile from "@/hooks/useLocalProfile";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function FeedbackOverlay() {
    const profile = useLocalProfile();
    const [isVisible, setIsVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // profile이 로드되지 않았거나 피드백이 없으면 표시 안 함
        if (!profile?.feedback || profile.feedback.trim() === "") {
            setIsVisible(false);
            return;
        }

        // localStorage에서 이 피드백을 이미 확인했는지 검사
        // 피드백 내용이 바뀌면 다시 보여주기 위해 내용을 키값처럼 활용
        const lastSeen = localStorage.getItem("last_seen_feedback");
        
        if (lastSeen === profile.feedback || dismissed) {
            setIsVisible(false);
        } else {
            setIsVisible(true);
        }
    }, [profile?.feedback, dismissed]);

    const handleConfirm = () => {
        if (profile?.feedback) {
            localStorage.setItem("last_seen_feedback", profile.feedback);
        }
        setDismissed(true);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white rounded-[40px] border-4 border-[#2F3D4A] p-8 md:p-10 max-w-lg w-full shadow-[12px_12px_0px_0px_#2F3D4A] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 relative flex flex-col max-h-[85vh]">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col h-full overflow-hidden">
                    <div className="flex items-center gap-4 mb-6 shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-3xl shadow-lg border-2 border-[#2F3D4A]">
                            📢
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-0.5">Teacher's Message</span>
                            <h2 className="text-2xl font-black text-[#2F3D4A]">선생님 피드백 도착! 👩‍🏫</h2>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 mb-8 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                        <div className="bg-orange-50/50 border-2 border-orange-100 rounded-[32px] p-6 md:p-8 min-h-[120px]">
                            <div className="prose prose-slate prose-sm max-w-none prose-p:leading-relaxed prose-p:text-[#2F3D4A] prose-strong:text-primary prose-strong:font-black">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {profile?.feedback}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 shrink-0">
                        <p className="text-center text-slate-400 text-[11px] font-bold">
                            피드백을 확인했다면 아래 버튼을 눌러주세요!
                        </p>
                        <button
                            onClick={handleConfirm}
                            className="w-full py-4 bg-primary text-white text-lg font-black rounded-2xl border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#2F3D4A] transition-all active:translate-y-[1px]"
                        >
                            확인했습니다! 👍
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

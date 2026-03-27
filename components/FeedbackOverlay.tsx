"use client";

import { useState, useEffect } from "react";
import useLocalProfile from "@/hooks/useLocalProfile";

export default function FeedbackOverlay() {
    const profile = useLocalProfile();
    const [isVisible, setIsVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // 프로필에 피드백이 있고, 아직 이번 세션에서 닫지 않았을 때 노출
        if (profile?.feedback && profile.feedback.trim() !== "" && !dismissed) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [profile, dismissed]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white rounded-[40px] border-4 border-[#2F3D4A] p-8 md:p-12 max-w-lg w-full shadow-[12px_12px_0px_0px_#2F3D4A] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16" />
                
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-3xl shadow-lg border-2 border-[#2F3D4A]">
                            📢
                        </div>
                        <div>
                            <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">Teacher's Message</span>
                            <h2 className="text-3xl font-black text-[#2F3D4A]">선생님의 피드백 👩‍🏫</h2>
                        </div>
                    </div>

                    <div className="bg-orange-50 border-2 border-orange-100 rounded-[32px] p-8 min-h-[150px] flex items-center justify-center">
                        <p className="text-xl font-bold text-[#2F3D4A] text-center leading-relaxed break-keep">
                            "{profile?.feedback}"
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <p className="text-center text-slate-400 text-sm font-medium">
                            피드백을 확인했다면 아래 버튼을 눌러주세요!
                        </p>
                        <button
                            onClick={() => setDismissed(true)}
                            className="w-full py-5 bg-primary text-white text-xl font-black rounded-2xl border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#2F3D4A] transition-all active:translate-y-[1px]"
                        >
                            네, 확인했습니다! 👍
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

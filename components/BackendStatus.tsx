"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import useBackendStatus from "@/hooks/useBackendStatus";

export default function BackendStatus() {
    const { isCustom, teacherName } = useBackendStatus();
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // 세션 내에서 닫았는지 확인
        const dismissed = sessionStorage.getItem("backend_status_dismissed");
        if (dismissed === "true") {
            setIsDismissed(true);
            return;
        }

        if (isCustom) {
            // 약간의 지연 후 표시 (부드러운 효과)
            setTimeout(() => setIsVisible(true), 500);
        } else {
            setIsVisible(false);
        }
    }, [isCustom]);

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        sessionStorage.setItem("backend_status_dismissed", "true");
    };

    const handleReset = () => {
        if (!confirm("모든 커스텀 설정을 초기화하고 시스템 기본(Demo) 환경으로 돌아가시겠습니까?")) return;
        
        const cookiesToClear = [
            "custom_gs_url", "custom_folder_id", "custom_admin_password", 
            "custom_teacher_name", "custom_notion_key", "custom_notion_db_id", "custom_notion_priority"
        ];
        
        cookiesToClear.forEach(c => {
            document.cookie = `${c}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        });

        setIsVisible(false);
        sessionStorage.removeItem("backend_status_dismissed"); // 초기화 시 가림 상태도 해제
        alert("기본 설정으로 복구되었습니다. 페이지를 새로고침합니다.");
        window.location.reload();
    };

    const isAdmin = pathname.startsWith("/admin");

    if (!isCustom || isDismissed) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-lg"
                >
                    <div className="bg-[#2F3D4A]/90 border-2 border-white/20 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                                <span className="animate-pulse">📡</span>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1 shrink-0">External Lab Active</p>
                                <h4 className="text-sm font-bold text-white truncate max-w-[200px]">
                                    {teacherName ? `${teacherName} 연구소` : "개인 연구소"}
                                </h4>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {isAdmin && (
                                <button 
                                    onClick={handleReset}
                                    className="whitespace-nowrap px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-black transition-all border border-white/10"
                                >
                                    SYSTEM RESET
                                </button>
                            )}
                            <button 
                                onClick={handleDismiss}
                                className="p-2 text-white/40 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

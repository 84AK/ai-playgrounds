"use client";

import { useEffect, useState } from "react";
import { ProgressData, getCachedProgress, fetchAndCacheProgress, isCacheStale } from "@/lib/progressSync";

interface HomeworkDashboardProps {
    nickname: string;
}

const mbtiSteps = [
    { id: 0, label: "0주차: MBTI 메이커", key: "mbti_week0" },
    { id: 1, label: "1주차: 기획 & 뼈대", key: "mbti_week1" },
    { id: 2, label: "2주차: 디자인 꾸미기", key: "mbti_week2" },
    { id: 3, label: "3주차: JS 인공지능 로직", key: "mbti_week3" },
    { id: 4, label: "4주차: 배포 및 완성", key: "mbti_week4" },
];

const poseSteps = [
    { id: 1, label: "1주차: AI 연동", key: "pose_week1" },
    { id: 2, label: "2주차: 게임 뼈대 제작", key: "pose_week2" },
    { id: 3, label: "3주차: 물리 및 효과", key: "pose_week3" },
    { id: 4, label: "4주차: 완성 및 배포", key: "pose_week4" },
];

export default function HomeworkDashboard({ nickname }: HomeworkDashboardProps) {
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!nickname) return;

        const syncProgress = async () => {
            // SWR 패턴: 캐시를 먼저 확인
            const cached = getCachedProgress(nickname);
            if (cached) {
                setProgress(cached.data);
                if (isCacheStale(cached)) {
                    refreshProgress();
                }
            } else {
                refreshProgress();
            }
        };

        const refreshProgress = async () => {
            setIsLoading(true);
            try {
                const freshData = await fetchAndCacheProgress(nickname);
                if (freshData) {
                    setProgress(freshData);
                }
            } finally {
                setIsLoading(false);
            }
        };

        syncProgress();
    }, [nickname]);

    const renderStep = (step: typeof mbtiSteps[0], isCompleted: boolean, downloadUrl?: string) => (
        <div key={step.key} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-background/40">
            <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${isCompleted ? "bg-emerald-500 text-white" : "bg-white/10 text-white/40"}`}>
                    {isCompleted ? "✓" : "○"}
                </div>
                <span className={`text-sm font-bold ${isCompleted ? "text-white" : "text-white/40"}`}>{step.label}</span>
            </div>

            {isCompleted ? (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase">Submitted</span>
                    {downloadUrl && (
                        <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg uppercase hover:bg-primary hover:text-white transition-colors">
                            Download
                        </a>
                    )}
                </div>
            ) : (
                <span className="text-[10px] font-black text-white/20 uppercase">Pending</span>
            )}
        </div>
    );

    if (isLoading) return <div className="h-48 flex items-center justify-center text-muted-foreground animate-pulse">데이터 불러오는 중...</div>;

    return (
        <div className="space-y-6 relative">
            {/* 동기화 상태 플로팅 배지 */}
            {isLoading && (
                <div className="absolute -top-10 right-0 bg-primary/20 backdrop-blur-md border border-primary/30 px-4 py-2 rounded-full flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 z-10">
                    <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-xs font-black text-primary uppercase tracking-tight">Syncing with Lab Server...</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bento-item p-6 border-white/5 bg-secondary/5 relative overflow-hidden group">
                    {/* 로딩 중일 때 카드 상단에 흐르는 선 효과 */}
                    {isLoading && (
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/30 overflow-hidden">
                            <div className="w-full h-full animate-[progress-scan_2s_infinite] bg-gradient-to-r from-transparent via-primary to-transparent" />
                        </div>
                    )}
                    <h4 className="text-sm font-black mb-4 flex items-center gap-2">
                        <span className="text-primary italic">01</span> MBTI Maker 과제
                    </h4>
                    <div className="space-y-2">
                        {mbtiSteps.map(step => renderStep(step, !!progress?.[step.key as keyof ProgressData], (progress as any)?.[`${step.key}_url`]))}
                    </div>
                </div>

                <div className="bento-item p-6 border-white/5 bg-secondary/5 relative overflow-hidden group">
                    {/* 로딩 중일 때 카드 상단에 흐르는 선 효과 */}
                    {isLoading && (
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500/30 overflow-hidden">
                            <div className="w-full h-full animate-[progress-scan_2s_infinite] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                        </div>
                    )}
                    <h4 className="text-sm font-black mb-4 flex items-center gap-2">
                        <span className="text-blue-500 italic">02</span> Pose Game 과제
                    </h4>
                    <div className="space-y-2">
                        {poseSteps.map(step => renderStep(step, !!progress?.[step.key as keyof ProgressData], (progress as any)?.[`${step.key}_url`]))}
                    </div>
                </div>
            </div>
        </div>
    );
}

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
        <div key={step.key} className="flex items-center justify-between p-4 rounded-xl border-2 border-[#2F3D4A] bg-white shadow-[2px_2px_0px_0px_#2F3D4A]">
            <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 border-[#2F3D4A] flex items-center justify-center text-[11px] font-black ${isCompleted ? "bg-emerald-400 text-white" : "bg-white text-[#2F3D4A]"}`}>
                    {isCompleted ? "✓" : "○"}
                </div>
                <span className={`text-sm font-black ${isCompleted ? "text-slate-400 line-through decoration-[#2F3D4A]/30" : "text-[#2F3D4A]"}`}>{step.label}</span>
            </div>

            {isCompleted ? (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#2F3D4A] bg-amber-200 border border-[#2F3D4A] px-2 py-0.5 rounded-md uppercase">완료</span>
                    {downloadUrl && (
                        <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-amber-900 bg-amber-300 border border-amber-900 px-2 py-0.5 rounded-md uppercase hover:bg-amber-400 transition-colors">
                            다운로드
                        </a>
                    )}
                </div>
            ) : (
                <span className="text-[10px] font-black text-slate-400 uppercase">대기 중</span>
            )}
        </div>
    );

    if (isLoading) return <div className="h-48 flex items-center justify-center text-[#2F3D4A] font-black animate-pulse">데이터 불러오는 중...</div>;

    return (
        <div className="space-y-6 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bento-item p-6 border-2 border-[#2F3D4A] bg-white relative overflow-hidden group">
                    <h4 className="text-base font-black mb-4 flex items-center gap-2 text-[#2F3D4A]">
                        <span className="text-primary italic">01</span> MBTI Maker 과제
                    </h4>
                    <div className="space-y-2">
                        {mbtiSteps.map(step => renderStep(step, !!progress?.[step.key as keyof ProgressData], (progress as any)?.[`${step.key}_url`]))}
                    </div>
                </div>

                <div className="bento-item p-6 border-2 border-[#2F3D4A] bg-white relative overflow-hidden group">
                    <h4 className="text-base font-black mb-4 flex items-center gap-2 text-[#2F3D4A]">
                        <span className="text-sky-500 italic">02</span> Pose Game 과제
                    </h4>
                    <div className="space-y-2">
                        {poseSteps.map(step => renderStep(step, !!progress?.[step.key as keyof ProgressData], (progress as any)?.[`${step.key}_url`]))}
                    </div>
                </div>
            </div>
        </div>
    );
}

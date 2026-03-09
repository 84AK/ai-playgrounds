"use client";

import { useEffect, useState } from "react";
import { APPS_SCRIPT_URL } from "@/app/constants";

interface HomeworkDashboardProps {
    nickname: string;
}

interface ProgressData {
    mbti_week0?: boolean;
    mbti_week1?: boolean;
    mbti_week2?: boolean;
    mbti_week3?: boolean;
    mbti_week4?: boolean;
    pose_week1?: boolean;
    pose_week2?: boolean;
    pose_week3?: boolean;
    pose_week4?: boolean;
    // Download URLs potential extension
    mbti_week1_url?: string;
    mbti_week2_url?: string;
    mbti_week3_url?: string;
    mbti_week4_url?: string;
    pose_week1_url?: string;
    pose_week2_url?: string;
    pose_week3_url?: string;
    pose_week4_url?: string;
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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProgress = async () => {
            if (!nickname) return;
            try {
                const response = await fetch(`${APPS_SCRIPT_URL}?action=getProgress&user_id=${encodeURIComponent(nickname)}`);
                const result = await response.json();
                if (result?.status === "success") {
                    setProgress(result.data);
                }
            } catch (err) {
                console.error("Failed to fetch homework progress", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProgress();
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bento-item p-6 border-white/5 bg-secondary/5">
                <h4 className="text-sm font-black mb-4 flex items-center gap-2">
                    <span className="text-primary italic">01</span> MBTI Maker 과제
                </h4>
                <div className="space-y-2">
                    {mbtiSteps.map(step => renderStep(step, !!progress?.[step.key as keyof ProgressData], (progress as any)?.[`${step.key}_url`]))}
                </div>
            </div>

            <div className="bento-item p-6 border-white/5 bg-secondary/5">
                <h4 className="text-sm font-black mb-4 flex items-center gap-2">
                    <span className="text-blue-500 italic">02</span> Pose Game 과제
                </h4>
                <div className="space-y-2">
                    {poseSteps.map(step => renderStep(step, !!progress?.[step.key as keyof ProgressData], (progress as any)?.[`${step.key}_url`]))}
                </div>
            </div>
        </div>
    );
}

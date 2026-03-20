"use client";

import { useEffect, useState } from "react";
import { ProgressData, getCachedProgress, fetchAndCacheProgress, isCacheStale } from "@/lib/progressSync";
import { postAppsScript, delay } from "@/lib/appsScriptClient";

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
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

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

    const handleDelete = async (courseType: "MBTI" | "POSE", week: number, key: string) => {
        if (!confirm(`${week}주차 과제를 삭제하시겠습니까?\n관련 파일도 함께 삭제됩니다.`)) return;

        setIsDeleting(key);
        try {
            const payload = {
                action: "deleteHomework",
                user_id: nickname,
                course_type: courseType,
                week: week
            };
            
            await postAppsScript(payload);
            await delay(2500); // 스프레드시트 반영 버퍼
            
            alert("과제가 삭제되었습니다.");
            
            const freshData = await fetchAndCacheProgress(nickname);
            if (freshData) {
                setProgress(freshData);
            }
        } catch (err) {
            console.error(err);
            alert("삭제 중 오류가 발생했습니다.");
        } finally {
            setIsDeleting(null);
        }
    };

    const renderStep = (step: typeof mbtiSteps[0], isCompleted: boolean, downloadUrl?: string, courseType: "MBTI" | "POSE" = "MBTI") => {
        const loadingKey = `${courseType.toLowerCase()}_week${step.id}`;
        const isCurrentDeleting = isDeleting === loadingKey;

        return (
            <div key={step.key} className="flex items-center justify-between p-4 rounded-xl border-2 border-[#2F3D4A] bg-white shadow-[2px_2px_0px_0px_#2F3D4A]">
                <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 border-[#2F3D4A] flex items-center justify-center text-[11px] font-black ${isCompleted ? "bg-emerald-400 text-white" : "bg-white text-[#2F3D4A]"}`}>
                        {isCompleted ? "✓" : "○"}
                    </div>
                    <span className={`text-sm font-black ${isCompleted ? "text-slate-400 line-through decoration-[#2F3D4A]/30" : "text-[#2F3D4A]"}`}>{step.label}</span>
                </div>

                {isCompleted ? (
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-[#2F3D4A] bg-amber-200 border border-[#2F3D4A] px-2 py-0.5 rounded-md uppercase">완료</span>
                        {downloadUrl && (
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-amber-900 bg-amber-300 border border-amber-900 px-2 py-0.5 rounded-md uppercase hover:bg-amber-400 transition-colors">
                                다운로드
                            </a>
                        )}
                        {step.id > 0 && (
                            <button 
                                onClick={() => handleDelete(courseType, step.id, loadingKey)}
                                disabled={!!isDeleting}
                                className="text-[10px] font-black text-rose-900 bg-rose-100 border border-rose-900 px-2 py-0.5 rounded-md uppercase hover:bg-rose-200 disabled:opacity-50 transition-colors flex items-center gap-1"
                            >
                                {isCurrentDeleting && (
                                    <svg className="animate-spin h-3 w-3 text-rose-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {isCurrentDeleting ? "삭제 중" : "삭제"}
                            </button>
                        )}
                    </div>
                ) : (
                    <span className="text-[10px] font-black text-slate-400 uppercase">대기 중</span>
                )}
            </div>
        );
    };

    if (isLoading) return <div className="h-48 flex items-center justify-center text-[#2F3D4A] font-black animate-pulse">데이터 불러오는 중...</div>;

    return (
        <div className="space-y-6 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bento-item p-6 border-2 border-[#2F3D4A] bg-white relative overflow-hidden group">
                    <h4 className="text-base font-black mb-4 flex items-center gap-2 text-[#2F3D4A]">
                        <span className="text-primary italic">01</span> MBTI Maker 과제
                    </h4>
                    <div className="space-y-2">
                        {mbtiSteps.map(step => renderStep(step, !!progress?.[step.key as keyof ProgressData], (progress as any)?.[`${step.key}_url`], "MBTI"))}
                    </div>
                </div>

                <div className="bento-item p-6 border-2 border-[#2F3D4A] bg-white relative overflow-hidden group">
                    <h4 className="text-base font-black mb-4 flex items-center gap-2 text-[#2F3D4A]">
                        <span className="text-sky-500 italic">02</span> Pose Game 과제
                    </h4>
                    <div className="space-y-2">
                        {poseSteps.map(step => renderStep(step, !!progress?.[step.key as keyof ProgressData], (progress as any)?.[`${step.key}_url`], "POSE"))}
                    </div>
                </div>
            </div>
        </div>
    );
}

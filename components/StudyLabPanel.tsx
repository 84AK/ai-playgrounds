"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { APPS_SCRIPT_URL } from "@/app/constants";
import useLocalProfile from "@/hooks/useLocalProfile";

interface StudyLabPanelProps {
  highlighted?: boolean;
  className?: string;
}

const mbtiLabels = [
  "0주차: MBTI 메이커 & 쇼케이스 (실습)",
  "1주차: 기획 & 뼈대 잡기",
  "2주차: 나만의 디자인 꾸미기",
  "3주차: 숨 불어넣기 (JS 로직)",
  "4주차: 세상에 보여주기 (배포)",
];

const poseLabels = [
  "1주차: 티처블 머신 AI 연동",
  "2주차: 캔버스 게임 로직 뼈대",
  "3주차: 충돌 처리 & 파티클",
  "4주차: 게임 완성 및 카카오 공유",
];

export default function StudyLabPanel({ highlighted = false, className = "" }: StudyLabPanelProps) {
  const router = useRouter();
  const profile = useLocalProfile();
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [mbtiProgress, setMbtiProgress] = useState([false, false, false, false, false]);
  const [poseProgress, setPoseProgress] = useState([false, false, false, false]);
  const [activeTab, setActiveTab] = useState<"MBTI" | "POSE">("MBTI");

  useEffect(() => {
    if (!profile?.name) return;
    fetchUserProgress(profile.name);
  }, [profile]);

  useEffect(() => {
    const handleMbtiSaved = () => {
      if (profile?.name) {
        fetchUserProgress(profile.name);
      }
    };

    const handleFocus = () => {
      if (profile?.name) {
        fetchUserProgress(profile.name);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && profile?.name) {
        fetchUserProgress(profile.name);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "mbti_week0_force_refresh" && profile?.name) {
        fetchUserProgress(profile.name);
      }
    };

    window.addEventListener("mbti:save-complete", handleMbtiSaved);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("mbti:save-complete", handleMbtiSaved);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [profile]);

  const hasMbtiMakerSaveRecord = async (userName: string) => {
    const readTextField = (row: unknown, keyA: string, keyB: string) => {
      if (!row || typeof row !== "object") return "";
      const record = row as Record<string, unknown>;
      return String(record[keyA] ?? record[keyB] ?? "").trim();
    };

    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getAllMbtiData`);
      const result = await response.json();

      const normalizedName = userName.trim();
      if (!normalizedName) return false;

      if (result?.status === "success" && result?.data) {
        const questionRows = Array.isArray(result.data.questions) ? result.data.questions : [];
        const hasQuestionRecord = questionRows.some((item: unknown) => {
          const author = readTextField(item, "Author", "author");
          return author === normalizedName;
        });
        if (hasQuestionRecord) return true;

        const showcaseRows = Array.isArray(result.data.showcase_links) ? result.data.showcase_links : [];
        return showcaseRows.some((item: unknown) => {
          const author = readTextField(item, "Author", "author");
          const url = readTextField(item, "Url", "url");
          return author === normalizedName && url.includes("/mbti/play?author=");
        });
      }

      if (Array.isArray(result)) {
        return result.some((item: unknown) => {
          const author = readTextField(item, "author", "Author");
          return author === normalizedName;
        });
      }
    } catch (err) {
      console.error("Failed to verify MBTI week0 by showcase data", err);
    }
    return false;
  };

  const fetchUserProgress = async (userName: string) => {
    setIsLoadingProgress(true);
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getProgress&user_id=${encodeURIComponent(userName)}`);
      const result = await response.json();
      if (result && result.data) {
        let isMbtiWeek0Completed = Boolean(result.data.mbti_week0);
        if (!isMbtiWeek0Completed) {
          isMbtiWeek0Completed = await hasMbtiMakerSaveRecord(userName);
        }

        setMbtiProgress([
          isMbtiWeek0Completed,
          result.data.mbti_week1,
          result.data.mbti_week2,
          result.data.mbti_week3,
          result.data.mbti_week4,
        ]);
        setPoseProgress([
          result.data.pose_week1,
          result.data.pose_week2,
          result.data.pose_week3,
          result.data.pose_week4,
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch progress", err);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const navigateToCourse = (track: "MBTI" | "POSE", weekIndex: number) => {
    if (!profile) return;
    if (track === "MBTI") {
      if (weekIndex === 0) {
        router.push("/mbti");
      } else {
        router.push(`/course/${weekIndex}`);
      }
    } else {
      router.push(`/pose/week${weekIndex + 1}`);
    }
  };

  const activeProgress = activeTab === "MBTI" ? mbtiProgress : poseProgress;
  const activeLabels = activeTab === "MBTI" ? mbtiLabels : poseLabels;
  const progressPercentage = (activeProgress.filter(Boolean).length / activeProgress.length) * 100;

  return (
    <div
      id="my-study-lab"
      className={`bento-item min-h-[380px] flex flex-col relative overflow-hidden transition-all duration-500 bg-secondary/30 ${
        highlighted ? "ring-4 ring-primary ring-offset-4 ring-offset-background shadow-[0_0_40px_rgba(var(--primary),0.5)] scale-[1.02]" : ""
      } ${className}`}
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6 gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-primary/70">Study Dashboard</p>
            <h3 className="mt-2 text-2xl font-black uppercase tracking-tight italic">🚀 My Study Lab</h3>
          </div>
          {profile && (
            <div className="flex items-center gap-2 bg-background/50 border border-white/5 pl-1 pr-3 py-1 rounded-full text-xs font-bold">
              <span className="text-lg leading-none">{profile.avatar}</span>
              <span className="truncate max-w-[100px] text-foreground">{profile.name}</span>
            </div>
          )}
        </div>

        <div className="mb-6 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          <p className="text-sm leading-7 text-white/72">
            지금까지 얼마나 진행했는지 확인하고, 원하는 주차를 바로 눌러 학습 페이지로 이동할 수 있습니다.
          </p>
        </div>

        <div className="flex gap-2 mb-4 bg-background/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("MBTI")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "MBTI" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-white"}`}
          >
            MBTI Maker
          </button>
          <button
            onClick={() => setActiveTab("POSE")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "POSE" ? "bg-blue-600 text-white shadow-md" : "text-muted-foreground hover:text-white"}`}
          >
            Pose Game
          </button>
        </div>

        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar flex-1 mb-4">
          {activeLabels.map((title, i) => (
            <button
              key={i}
              onClick={() => navigateToCourse(activeTab, i)}
              className={`w-full text-left flex items-center justify-between p-3.5 rounded-2xl border transition-all font-sans group cursor-pointer hover:border-primary/40 ${activeProgress[i] ? "bg-primary/5 border-primary/20" : "bg-background/50 border-border/50"}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${activeProgress[i] ? "bg-primary border-primary" : "border-muted-foreground/30 group-hover:border-primary/50"}`}>
                  {activeProgress[i] && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm font-bold transition-colors truncate pr-2 ${activeProgress[i] ? "text-muted-foreground line-through decoration-primary/50" : "text-foreground group-hover:text-primary"}`}>
                  {title}
                </span>
              </div>

              {activeProgress[i] ? (
                <span className="text-primary font-black text-[10px] bg-primary/10 px-2 py-1 rounded-md shrink-0">완료</span>
              ) : (
                <div className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0" />
              )}
            </button>
          ))}
        </div>

        <div className="relative z-10 space-y-2 pt-4 border-t border-border/50 shrink-0">
          <div className="flex justify-between items-end text-[9px] font-black tracking-widest uppercase text-muted-foreground">
            <span>{activeTab} Progress</span>
            <span className={`${activeTab === "MBTI" ? "text-primary" : "text-blue-500"} italic font-black`}>
              {isLoadingProgress ? "연동 중..." : `${Math.round(progressPercentage)}% COMPLETE`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 shadow-sm delay-300 ease-out ${activeTab === "MBTI" ? "bg-primary shadow-primary/30" : "bg-blue-500 shadow-blue-500/30"}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

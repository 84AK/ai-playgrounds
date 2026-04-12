"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAppsScriptJson } from "@/lib/appsScriptClient";
import useLocalProfile from "@/hooks/useLocalProfile";
import { fetchAndCacheProgress, getCachedProgress, isCacheStale } from "@/lib/progressSync";
import LoadingOverlay from "@/components/LoadingOverlay";

interface StudyLabPanelProps {
  highlighted?: boolean;
  className?: string;
}

interface CourseStructureItem {
  track: string;
  week: number;
  title: string;
}

export default function StudyLabPanel({ highlighted = false, className = "" }: StudyLabPanelProps) {
  const router = useRouter();
  const profile = useLocalProfile();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [structure, setStructure] = useState<CourseStructureItem[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>("MBTI");
  const [detailedStatus, setDetailedStatus] = useState<Record<string, { status: string, fileName: string }>>({});

  const applyProgressData = (data: any, detailed: any = {}) => {
    const pMap: Record<string, boolean> = {};
    for (let i = 1; i <= 12; i++) {
      pMap[`week${i}`] = !!data[`week${i}`];
    }
    setProgress(pMap);
    setDetailedStatus(detailed || {});
  };

  useEffect(() => {
    const fetchStructure = async () => {
      try {
        const res = await fetch("/api/course/structure");
        const result = await res.json();
        if (result.success) {
          setStructure(result.data);
          if (result.data.length > 0) setActiveTab(result.data[0].track);
        }
      } catch (err) {
        console.error("Failed to load structure", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStructure();
  }, []);

  // [NEW] 컴포넌트가 열리거나 이름이 로드되면 자동으로 진도 새로고침
  useEffect(() => {
    if (profile?.name) {
      fetchUserProgress(profile.name);
    }
  }, [profile?.name]);

  const fetchUserProgress = async (userName: string) => {
    setIsLoadingProgress(true);
    try {
      const res = await getAppsScriptJson<any>(new URLSearchParams({
        action: "getProgress",
        user_id: userName
      }));
      if (res.status === "success") {
        applyProgressData(res.data, res.detailed);
      }
    } catch (err) {
      console.error("Failed to fetch progress", err);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const navigateToCourse = (track: string, week: number) => {
    if (!profile) return;
    // 모든 트랙이 선생님의 개인 설정을 따를 수 있도록 범용 커리큘럼 라우트로 통합 연결
    router.push(`/curriculum/${encodeURIComponent(track)}/week${week}`);
  };

  const tabs = Array.from(new Set(structure.map(s => s.track)));
  const currentWeeks = structure.filter(s => s.track === activeTab);
  
  const activeProgressCount = currentWeeks.filter(s => progress[`week${s.week}`]).length;
  const progressPercentage = currentWeeks.length > 0 ? (activeProgressCount / currentWeeks.length) * 100 : 0;

  const getWeekStatusFromData = (week: number) => {
    const key = `week${week}`;
    const detailed = detailedStatus[key];
    const baseProgress = progress[key];

    if (!baseProgress) return { icon: null, text: "미제출", color: "text-slate-300" };
    if (detailed?.status === "format_mismatch") return { icon: "⚠️", text: "형식 오류", color: "text-amber-500 bg-amber-50 border-amber-200" };
    return { icon: "✅", text: "완료", color: "text-green-600 bg-green-50 border-green-200" };
  };

  return (
    <>
      <LoadingOverlay isVisible={isLoadingProgress} message={`${profile?.name || "연구원"}님의 진도 데이터를 동기화하고 있습니다...`} />
      <div
        id="my-study-lab"
        className={`bento-item min-h-[380px] flex flex-col relative overflow-hidden transition-all duration-500 bg-white ${highlighted ? "ring-4 ring-primary ring-offset-4 ring-offset-background scale-[1.02]" : ""
          } ${className}`}
      >
        <div className="relative z-10 flex flex-col h-full gap-5">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Study Dashboard</p>
              <h3 className="mt-1 text-2xl font-black uppercase tracking-tight text-[#2F3D4A]">🚀 My Study Lab</h3>
            </div>
            {profile && (
              <div className="flex items-center gap-1.5 bg-amber-100 border-2 border-[#2F3D4A] pl-1 pr-3 py-1 rounded-full text-xs font-black text-[#2F3D4A] shadow-[2px_2px_0px_0px_#2F3D4A]">
                <span className="text-base leading-none">{profile.avatar}</span>
                <span className="truncate max-w-[90px]">{profile.name}</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border-2 border-[#2F3D4A] bg-amber-50 p-4 shadow-inner">
            <p className="text-sm font-bold leading-6 text-slate-700">
              실시간 과제 현황을 확인하세요. <span className="text-amber-600 font-black">⚠️</span> 아이콘이 뜨면 **프로필 정보를 정확히 입력**한 뒤, 해당 과제를 다시 업로드해 주세요!
            </p>
          </div>

          <div className="flex gap-2 bg-slate-100 border-2 border-[#2F3D4A] p-1 rounded-xl overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[100px] py-2 text-xs font-black rounded-lg transition-all ${activeTab === tab ? "bg-primary text-white border border-[#2F3D4A] shadow-sm" : "text-slate-600 hover:text-primary"}`}
              >
                {tab}
              </button>
            ))}
            {tabs.length === 0 && !isLoading && <p className="text-[10px] p-2 text-muted-foreground">등록된 코스가 없습니다.</p>}
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar flex-1">
            {currentWeeks.map((item, i) => {
              const status = getWeekStatusFromData(item.week);
              return (
                <button
                  key={i}
                  onClick={() => navigateToCourse(item.track, item.week)}
                  className={`w-full text-left flex items-center justify-between p-3 rounded-xl border-2 border-[#2F3D4A] transition-all font-sans group cursor-pointer ${progress[`week${item.week}`] ? "bg-white" : "bg-white hover:bg-slate-50"}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-5 h-5 rounded-md border-2 border-[#2F3D4A] flex items-center justify-center transition-colors shrink-0 ${status.icon === "✅" ? "bg-green-500" : status.icon === "⚠️" ? "bg-amber-500" : "bg-white"}`}>
                      {status.icon === "✅" && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {status.icon === "⚠️" && (
                        <span className="text-[10px] text-white font-black">!</span>
                      )}
                    </div>
                    <span className={`text-sm font-black transition-colors truncate ${status.icon === "✅" ? "text-slate-300 line-through decoration-[#2F3D4A]/30" : "text-[#2F3D4A] group-hover:text-primary"}`}>
                      {item.week}주차: {item.title || "내용 보기"}
                    </span>
                  </div>

                  <span className={`font-black text-[10px] border border-[#2F3D4A] px-2 py-0.5 rounded-md shrink-0 ${status.color}`}>
                    {status.text}
                  </span>
                </button>
              );
            })}
            {currentWeeks.length === 0 && !isLoading && (
              <div className="py-8 text-center text-sm text-slate-400 font-bold bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                준비 중인 차시입니다. 🚀
              </div>
            )}
          </div>

          <div className="relative z-10 space-y-2 pt-3 border-t-2 border-[#2F3D4A] shrink-0">
            <div className="flex justify-between items-end text-[10px] font-black tracking-wider uppercase text-slate-500">
              <div className="flex items-center gap-1">
                <span>{activeTab} Progress</span>
                <button
                  onClick={() => profile?.name && fetchUserProgress(profile.name)}
                  disabled={isLoadingProgress}
                  className="flex items-center gap-1 text-primary hover:text-primary/70 disabled:opacity-50 transition-colors ml-1"
                  title="진도 즉시 동기화"
                >
                  {isLoadingProgress ? (
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
              </div>
              <span className={`${activeTab === "MBTI" ? "text-primary" : "text-sky-600"} font-black`}>
                {`${Math.round(progressPercentage)}%`}
              </span>
            </div>
            <div className="relative h-3 w-full bg-slate-100 border-2 border-[#2F3D4A] rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out relative ${activeTab === "MBTI" ? "bg-primary" : "bg-sky-500"}`}
                style={{ width: `${progressPercentage}%` }}
              >
                {isLoadingProgress && (
                  <div className="absolute inset-0 w-full h-full animate-[progress-scan_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

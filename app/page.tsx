"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { APPS_SCRIPT_URL } from "./constants";
import type { UserProfile } from "@/components/GlobalAuthGuard";

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  const [mbtiProgress, setMbtiProgress] = useState([false, false, false, false, false]);
  const [poseProgress, setPoseProgress] = useState([false, false, false, false]);

  const [activeTab, setActiveTab] = useState<"MBTI" | "POSE">("MBTI");
  const [isHighlighted, setIsHighlighted] = useState(false);

  const scrollToStudyLab = () => {
    const el = document.getElementById("my-study-lab");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 2000);
    }
  };

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

  useEffect(() => {
    const saved = localStorage.getItem("lab_user_profile");
    if (saved) {
      const parsed = JSON.parse(saved) as UserProfile;
      setProfile(parsed);
      fetchUserProgress(parsed.name);
    }
  }, []);

  const fetchUserProgress = async (userName: string) => {
    setIsLoadingProgress(true);
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getProgress&user_id=${encodeURIComponent(userName)}`);
      const result = await response.json();
      if (result && result.data) {
        setMbtiProgress([
          result.data.mbti_week0 || false, // Week 0 might not exist yet
          result.data.mbti_week1,
          result.data.mbti_week2,
          result.data.mbti_week3,
          result.data.mbti_week4
        ]);
        setPoseProgress([
          result.data.pose_week1,
          result.data.pose_week2,
          result.data.pose_week3,
          result.data.pose_week4
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
        router.push(`/course/${weekIndex}`); // weekIndex is 1~4
      }
    } else {
      router.push(`/pose/week${weekIndex + 1}`); // pose still 0~3 maps to 1~4
    }
  };

  const activeProgress = activeTab === "MBTI" ? mbtiProgress : poseProgress;
  const activeLabels = activeTab === "MBTI" ? mbtiLabels : poseLabels;
  const progressPercentage = (activeProgress.filter(Boolean).length / activeProgress.length) * 100;

  return (
    <div className="space-y-20 pb-20 overflow-x-hidden">
      {/* Dynamic Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md animate-float">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-black text-primary uppercase tracking-widest">2026 AI Innovation Lab</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] text-balance">
              인공지능 <span className="text-primary italic">미래 연구소</span><br />
              프로젝트에 오신 것을 환영합니다.
            </h1>

            <p className="max-w-2xl text-lg md:text-xl text-muted-foreground font-medium leading-relaxed text-balance">
              {profile ? (
                <span>
                  환영합니다, <b className="text-white">{profile.name}</b> 연구원님!<br />
                  코딩이 처음이어도 괜찮아요. 8주간의 여정을 통해 나만의 인공지능 <br className="hidden md:block" />
                  서비스를 직접 기획하고 구현하는 놀라운 경험을 이어가보세요.
                </span>
              ) : (
                <span>
                  코딩이 처음이어도 괜찮아요. 8주간의 여정을 통해 나만의 인공지능 <br className="hidden md:block" />
                  서비스를 직접 기획하고 구현하는 놀라운 경험을 시작해보세요.
                </span>
              )}
            </p>

            <div className="flex gap-4">
              <button
                onClick={scrollToStudyLab}
                className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-2xl shadow-primary/40 hover:scale-105 transition-all active:scale-95"
              >
                오늘의 수업 시작하기
              </button>
            </div>
          </div>
        </div>

        {/* Ambient Decorative Elements */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -z-10" />
      </section>

      {/* Main Dashboard - Balanced 2-Column Grid */}
      <section className="px-6 mb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Row 1, Column 1: MBTI Maker */}
            <div className="bento-item group/card min-h-[460px] flex flex-col justify-between">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-black shadow-xl shadow-primary/20">01</div>
                  <div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Phase 01</span>
                    <h3 className="text-3xl font-extrabold tracking-tighter">나만의 MBTI 메이커</h3>
                  </div>
                </div>
                <p className="text-base text-muted-foreground/80 leading-relaxed font-medium">
                  AI와 대화하며 첫 웹 서비스를 기획합니다. 12개의 성향 질문을 만들고 즉시 배포 가능한 웹사이트로 변신시켜보세요.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["AI 프롬프트", "React"].map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/10 text-[9px] font-black text-primary/80 uppercase"># {tag}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 bg-white/5 dark:bg-black/20 p-4 rounded-3xl border border-white/5 shadow-inner">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[9px] font-bold">ST{i}</div>
                  ))}
                </div>
                <Link
                  href="/mbti"
                  className="px-8 py-3 bg-primary text-white rounded-xl font-black text-sm hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                >
                  제작하러 가기 →
                </Link>
              </div>
              <div className="absolute top-1/2 -right-10 -translate-y-1/2 w-40 h-40 bg-primary/5 rounded-full blur-[60px] -z-10" />
            </div>

            {/* Row 1, Column 2: AI Pose Game */}
            <div className="bento-item min-h-[460px] flex flex-col justify-between overflow-hidden">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-black shadow-xl shadow-blue-600/20">02</div>
                  <div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Phase 02</span>
                    <h3 className="text-3xl font-black tracking-tighter">AI 포즈 게임 메이커</h3>
                  </div>
                </div>
                <p className="text-base text-muted-foreground/80 leading-relaxed font-medium">
                  티처블머신으로 내 동작을 직접 학습시키고, 웹캠으로 3D 물체를 조종하는 나만의 인터랙티브 액션 게임을 제작합니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Teachable Machine", "Canvas 3D"].map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg bg-blue-600/5 border border-blue-600/10 text-[9px] font-black text-blue-600/80 uppercase"># {tag}</span>
                  ))}
                </div>
              </div>

              <Link
                href="/game"
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm text-center shadow-xl hover:shadow-blue-600/50 hover:scale-[1.02] active:scale-95 transition-all mt-8"
              >
                🎮 포즈 게임 플레이하기
              </Link>

              <div className="absolute top-1/2 -right-10 -translate-y-1/2 w-40 h-40 bg-blue-600/5 rounded-full blur-[60px] -z-10" />
              <div className="absolute top-10 right-10 text-6xl opacity-[0.03] font-bold select-none italic pointer-events-none">POSE</div>
            </div>

            {/* Row 2, Column 1: Showcase Section */}
            <div className="bento-item min-h-[380px] flex flex-col justify-between overflow-hidden">
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black rounded-full uppercase">Community</div>
                <h3 className="text-3xl font-black tracking-tighter">우리 프로젝트<br />전시관 (Showcase)</h3>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                  다른 친구들의 창의적인 아이디어를 <br />
                  공유하고 영감을 얻으세요.
                </p>
              </div>
              <Link href="/showcase" className="w-fit text-sm font-black text-primary underline underline-offset-8 hover:text-primary/70 transition-colors uppercase tracking-widest mt-8">
                전체 작품 구경하러 가기 →
              </Link>
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -z-10" />
            </div>

            {/* Row 2, Column 2: My Study Lab (Dual Track) */}
            <div
              id="my-study-lab"
              className={`bento-item min-h-[380px] flex flex-col relative overflow-hidden transition-all duration-500 bg-secondary/30 ${isHighlighted ? 'ring-4 ring-primary ring-offset-4 ring-offset-background shadow-[0_0_40px_rgba(var(--primary),0.5)] scale-[1.02]' : ''}`}
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 italic">🚀 MY STUDY LAB</h3>
                  {profile && (
                    <div className="flex items-center gap-2 bg-background/50 border border-white/5 pl-1 pr-3 py-1 rounded-full text-xs font-bold">
                      <span className="text-lg leading-none">{profile.avatar}</span>
                      <span className="truncate max-w-[80px] text-foreground">{profile.name}</span>
                    </div>
                  )}
                </div>

                {/* Track Selector */}
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

                <div className="space-y-2 max-h-[170px] overflow-y-auto pr-2 custom-scrollbar flex-1 mb-4">
                  {activeLabels.map((title, i) => (
                    <button
                      key={i}
                      onClick={() => navigateToCourse(activeTab, i)}
                      className={`w-full text-left flex items-center justify-between p-3.5 rounded-2xl border transition-all font-sans group cursor-pointer hover:border-primary/40 ${activeProgress[i] ? 'bg-primary/5 border-primary/20' : 'bg-background/50 border-border/50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${activeProgress[i] ? 'bg-primary border-primary' : 'border-muted-foreground/30 group-hover:border-primary/50'}`}>
                          {activeProgress[i] && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`text-sm font-bold transition-colors truncate pr-2 ${activeProgress[i] ? 'text-muted-foreground line-through decoration-primary/50' : 'text-foreground group-hover:text-primary'}`}>
                          {title}
                        </span>
                      </div>

                      {activeProgress[i] ? (
                        <span className="text-primary font-black text-[10px] bg-primary/10 px-2 py-1 rounded-md shrink-0">완료</span>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0"></div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Progress Bar Footer */}
                <div className="relative z-10 space-y-2 pt-4 border-t border-border/50 shrink-0">
                  <div className="flex justify-between items-end text-[9px] font-black tracking-widest uppercase text-muted-foreground">
                    <span>{activeTab} Progress</span>
                    <span className={`${activeTab === "MBTI" ? "text-primary" : "text-blue-500"} italic font-black`}>
                      {isLoadingProgress ? "연동 중..." : `${Math.round(progressPercentage)}% COMPLETE`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 shadow-sm delay-300 ease-out ${activeTab === "MBTI" ? "bg-primary shadow-primary/30" : "bg-blue-500 shadow-blue-500/30"}`} style={{ width: `${progressPercentage}%` }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

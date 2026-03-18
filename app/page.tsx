"use client";

import Link from "next/link";
import { useState } from "react";
import useLocalProfile from "@/hooks/useLocalProfile";
import StudyLabPanel from "@/components/StudyLabPanel";

export default function Home() {
  const profile = useLocalProfile();
  const [isHighlighted, setIsHighlighted] = useState(false);

  const scrollToStudyLab = () => {
    const el = document.getElementById("my-study-lab");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 2000);
    }
  };

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
            <StudyLabPanel highlighted={isHighlighted} />

            {/* Row 3: Class Prep & Tools Dashboard */}
            {/* Column 1: Account Prep */}
            <div className="bento-item min-h-[320px] flex flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950/20 via-transparent to-transparent border-indigo-500/10">
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-black rounded-full uppercase">Getting Started</div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter">🔑 수업 전 필수<br />계정 생성 가이드</h3>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                  원활한 수업과 실습 진행을 위해 필수 코딩 계정들을 준비하는 가이드입니다.
                </p>
              </div>
              <Link 
                href="https://ai-student-id.vercel.app/"
                target="_blank"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm text-center shadow-xl hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-95 transition-all mt-8"
              >
                가이드 확인하기 →
              </Link>
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
            </div>

            {/* Column 2: Dashboard Links */}
            <div className="bento-item min-h-[320px] flex flex-col justify-between overflow-hidden">
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black rounded-full uppercase">Analytics & Tools</div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter">📊 학습 기록 및<br />대시보드</h3>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                  나의 실습 현황과 프로젝트 배포 상태를 바로 모니터링하세요.
                </p>
              </div>
              
              <div className="mt-8">
                <Link 
                  href="https://activity-log-six.vercel.app/"
                  target="_blank"
                  className="p-6 bg-white/5 dark:bg-black/20 hover:bg-white/10 dark:hover:bg-black/40 rounded-2xl border border-white/5 hover:border-emerald-500/30 shadow-inner group transition-all flex flex-col items-center justify-center text-center gap-3 w-full"
                >
                  <span className="text-3xl">📝</span>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-extrabold group-hover:text-emerald-500 transition-colors">Activity Log</span>
                    <span className="text-xs text-muted-foreground font-medium mt-1">나의 실시간 학습 및 활동 기록 확인하기</span>
                  </div>
                </Link>
              </div>
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
            </div>


          </div>

        </div>
      </section>
    </div>
  );
}

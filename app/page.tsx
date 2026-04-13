"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useState } from "react";
import useLocalProfile from "@/hooks/useLocalProfile";
import StudyLabPanel from "@/components/StudyLabPanel";
import ShowcaseCarousel from "@/components/ShowcaseCarousel";
import useBackendStatus from "@/hooks/useBackendStatus";

export default function Home() {
  const profile = useLocalProfile();
  const [isHighlighted, setIsHighlighted] = useState(false);
  const { getTrackName } = useBackendStatus();

  const scrollToStudyLab = () => {
    const el = document.getElementById("my-study-lab");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 2000);
    }
  };

  return (
    <div className="space-y-16 pb-20 overflow-x-hidden bg-[#FDFAEF] relative">
      {/* Bright & Cute Hero Section */}
      <section className="relative pt-28 pb-16 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border-2 border-[#2F3D4A] animate-float shadow-[3px_3px_0px_0px_#2F3D4A]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-black text-[#2F3D4A] uppercase tracking-wider">💡 2026 AI Innovation Lab</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] text-[#2F3D4A] text-balance">
              인공지능 <span className="text-primary underline underline-offset-4">미래 연구소</span><br />
              프로젝트에 오신 것을 환영합니다!
            </h1>

            <p className="max-w-2xl text-lg md:text-xl text-slate-600 font-bold leading-relaxed text-balance">
              {profile ? (
                <span>
                  환영합니다, <b className="text-[#2F3D4A]">{profile.name}</b> 연구원님!<br />
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

            <div className="flex gap-4 pt-4">
              <button
                onClick={scrollToStudyLab}
                className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-base border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#2F3D4A] transition-all active:translate-y-[1px]"
              >
                오늘의 수업 시작하기 🚀
              </button>
            </div>
          </div>
        </div>

        {/* Ambient Decorative Elements */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-200/40 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 -right-20 w-80 h-80 bg-sky-200/40 rounded-full blur-[80px] -z-10" />
      </section>

      {/* Main Dashboard - Bento Grid */}
      <section className="px-6 mb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Row 1, Column 1: MBTI Maker */}
            <div className="bento-item flex flex-col justify-between">
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-black border-2 border-[#2F3D4A] shadow-[3px_3px_0px_0px_#2F3D4A]">01</div>
                  <div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Phase 01</span>
                    <h3 className="text-3xl font-black tracking-tighter text-[#2F3D4A]">{getTrackName("MBTI")}</h3>
                  </div>
                </div>
                <p className="text-base text-slate-600 leading-relaxed font-bold">
                  AI와 대화하며 첫 웹 서비스를 기획합니다. 12개의 성향 질문을 만들고 즉시 배포 가능한 웹사이트로 변신시켜보세요.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["AI 프롬프트", "React"].map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg bg-orange-100 border-2 border-[#2F3D4A] text-[10px] font-black text-[#2F3D4A]"># {tag}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 bg-amber-50 p-4 rounded-2xl border-2 border-[#2F3D4A]">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#2F3D4A] bg-white flex items-center justify-center text-[10px] font-bold">🐣</div>
                  ))}
                </div>
                <Link
                  href="/mbti"
                  className="px-6 py-2.5 bg-white text-[#2F3D4A] border-2 border-[#2F3D4A] rounded-xl font-black text-sm shadow-[2px_2px_0px_0px_#2F3D4A] hover:bg-orange-50 transition-all flex items-center gap-1"
                >
                  제작하러 가기 ➡️
                </Link>
              </div>
            </div>

            {/* Row 1, Column 2: AI Pose Game */}
            <div className="bento-item flex flex-col justify-between">
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white text-xl font-black border-2 border-[#2F3D4A] shadow-[3px_3px_0px_0px_#2F3D4A]">02</div>
                  <div>
                    <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest leading-none">Phase 02</span>
                    <h3 className="text-3xl font-black tracking-tighter text-[#2F3D4A]">{getTrackName("POSE")}</h3>
                  </div>
                </div>
                <p className="text-base text-slate-600 leading-relaxed font-bold">
                  티처블머신으로 내 동작을 직접 학습시키고, 웹캠으로 3D 물체를 조종하는 나만의 인터랙티브 액션 게임을 제작합니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Teachable Machine", "Canvas 3D"].map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg bg-sky-100 border-2 border-[#2F3D4A] text-[10px] font-black text-[#2F3D4A]"># {tag}</span>
                  ))}
                </div>
              </div>

              <Link
                href="/game"
                className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-black text-sm text-center border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] hover:translate-y-[-2px] transition-all mt-8"
              >
                🎮 포즈 게임 플레이하기
              </Link>
            </div>

            {/* Row 2, Column 1: Showcase Section */}
            <div className="bento-item flex flex-col justify-between overflow-hidden">
              <div className="relative z-10 space-y-5">
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 border-2 border-[#2F3D4A] text-[#2F3D4A] text-[10px] font-black rounded-full uppercase">🤝 Community</div>
                <h3 className="text-3xl font-black tracking-tighter text-[#2F3D4A]">우리 프로젝트 전시관</h3>
                <p className="text-slate-600 text-sm font-bold leading-relaxed mb-4">
                  다른 친구들의 창의적인 아이디어를 공유하고 영감을 얻으세요.
                </p>
                
                {/* [NEW] 무한 스크롤 캐러셀 삽입 */}
                <ShowcaseCarousel />
              </div>
              <Link href="/showcase" className="w-fit text-sm font-black text-primary underline underline-offset-4 hover:text-primary/80 transition-colors uppercase mt-4">
                전체 작품 구경하러 가기 ➡️
              </Link>
            </div>

            {/* Row 2, Column 2: My Study Lab (Dual Track) */}
            <StudyLabPanel highlighted={isHighlighted} />

            {/* Row 3: Class Prep & Tools Dashboard */}
            {/* Column 1: Account Prep */}
            <div className="bento-item flex flex-col justify-between">
              <div className="relative z-10 space-y-5">
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 border-2 border-[#2F3D4A] text-[#2F3D4A] text-[10px] font-black rounded-full uppercase">🔑 Getting Started</div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-[#2F3D4A]">수업 전 필수<br />계정 생성 가이드</h3>
                <p className="text-slate-600 text-sm font-bold leading-relaxed">
                  원활한 수업과 실습 진행을 위해 필수 코딩 계정들을 준비하는 가이드입니다.
                </p>
              </div>
              <Link 
                href="https://ai-student-id.vercel.app/"
                target="_blank"
                className="w-full py-4 bg-violet-500 hover:bg-violet-400 text-white rounded-2xl font-black text-sm text-center border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] hover:translate-y-[-2px] transition-all mt-8"
              >
                가이드 확인하기 ➡️
              </Link>
            </div>

            {/* Column 2: Dashboard Links */}
            <div className="bento-item flex flex-col justify-between">
              <div className="relative z-10 space-y-5">
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 border-2 border-[#2F3D4A] text-[#2F3D4A] text-[10px] font-black rounded-full uppercase">📊 Analytics & Tools</div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-[#2F3D4A]">학습 기록 및<br />대시보드</h3>
                <p className="text-slate-600 text-sm font-bold leading-relaxed">
                  나의 실습 현황과 프로젝트 배포 상태를 바로 모니터링하세요.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mt-8">
                <Link 
                  href="https://activity-log-six.vercel.app/"
                  target="_blank"
                  className="p-5 bg-emerald-50 hover:bg-emerald-100 rounded-xl border-2 border-[#2F3D4A] shadow-[2px_2px_0px_0px_#2F3D4A] group transition-all flex items-center justify-between text-left gap-4 w-full"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">📝</span>
                    <div className="flex flex-col">
                      <span className="text-base font-extrabold text-[#2F3D4A] group-hover:text-emerald-600 transition-colors">Activity Log</span>
                      <span className="text-xs text-slate-500 font-bold mt-1">나의 실시간 학습 활동 확인</span>
                    </div>
                  </div>
                  <span className="text-xl">➡️</span>
                </Link>

                <Link 
                  href="/ranking"
                  className="p-5 bg-amber-50 hover:bg-amber-100 rounded-xl border-2 border-[#2F3D4A] shadow-[2px_2px_0px_0px_#2F3D4A] group transition-all flex items-center justify-between text-left gap-4 w-full"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🏆</span>
                    <div className="flex flex-col">
                      <span className="text-base font-extrabold text-[#2F3D4A] group-hover:text-amber-600 transition-colors">Hall of Fame</span>
                      <span className="text-xs text-slate-500 font-bold mt-1">우리 반 과제 제출 랭킹 확인</span>
                    </div>
                  </div>
                  <span className="text-xl">➡️</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

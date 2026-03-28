"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { APPS_SCRIPT_URL } from "../../constants";

// MBTI Result Types Mapping
const MBTI_DETAILS: Record<string, { title: string; desc: string; color: string; icon: string; energy: string }> = {
    "ENTP": { title: "아이디어 엔진", desc: "멈추지 않는 상상력으로 세상을 바꾸는 발명가", color: "bg-orange-500", icon: "🚀", energy: "E" },
    "INTJ": { title: "전략적 조율자", desc: "완벽한 설계와 분석으로 목표를 달성하는 마스터", color: "bg-indigo-600", icon: "💎", energy: "I" },
    "ENFP": { title: "열정 프론티어", desc: "모두에게 영감을 주는 무한 긍정의 아이콘", color: "bg-pink-500", icon: "✨", energy: "E" },
    "INFJ": { title: "통찰의 현자", desc: "사람의 마음을 꿰뚫어 보는 따뜻한 분석가", color: "bg-emerald-500", icon: "🕯️", energy: "I" },
    "ESTP": { title: "에너지 해결사", desc: "현장의 활력소이자 실무 중심의 행동파", color: "bg-amber-500", icon: "⚡", energy: "E" },
    "ISTP": { title: "만능 기계공", desc: "도구를 자유자재로 다루는 냉철한 실무자", color: "bg-slate-500", icon: "🛠️", energy: "I" },
    "ESFP": { title: "분위기 메이커", desc: "모두를 즐겁게 만드는 사교적인 연예인", color: "bg-rose-500", icon: "🎭", energy: "E" },
    "ISFP": { title: "예술가 영혼", desc: "자신만의 세계를 아름답게 꾸미는 예술가", color: "bg-purple-500", icon: "🎨", energy: "I" },
    "ESTJ": { title: "추진력 대장", desc: "체계적인 관리와 리더쉽을 발휘하는 감독관", color: "bg-blue-600", icon: "📢", energy: "E" },
    "ISTJ": { title: "원칙의 수호자", desc: "한 치의 흔들림 없는 성실한 관리자", color: "bg-gray-600", icon: "📋", energy: "I" },
    "ESFJ": { title: "친절한 조력자", desc: "주변 사람들을 살뜰히 챙기는 돌봄의 달인", color: "bg-pink-400", icon: "💖", energy: "E" },
    "ISFJ": { title: "조용한 헌신가", desc: "자랑하지 않아도 빛나는 든든한 조력자", color: "bg-teal-500", icon: "🛡️", energy: "I" },
    "ENTJ": { title: "카리스마 리더", desc: "냉철한 판단과 대담한 추진력의 사령관", color: "bg-red-600", icon: "👑", energy: "E" },
    "INTP": { title: "논리술사", desc: "끊임없이 의구심을 품고 탐구하는 사색가", color: "bg-violet-600", icon: "🔬", energy: "I" },
    "ENFJ": { title: "정의로운 선동가", desc: "타인의 성장을 돕고 이끄는 열정적 지도자", color: "bg-orange-400", icon: "🌟", energy: "E" },
    "INFP": { title: "낭만적인 중재자", desc: "이상적인 세상을 꿈꾸는 마음 여린 시인", color: "bg-green-500", icon: "🌱", energy: "I" },
};

function ResultContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get("type") || "ENTP";
    const author = searchParams.get("author") || "AI 연구원";

    const [mbti, setMbti] = useState(MBTI_DETAILS[type as keyof typeof MBTI_DETAILS] || MBTI_DETAILS.ENTP);
    const [showCard, setShowCard] = useState(false);
    const [isFetching, setIsFetching] = useState(Boolean(author && author !== "AI 연구원"));

    useEffect(() => {
        const fetchCustomResults = async () => {
            try {
                const response = await fetch(`${APPS_SCRIPT_URL}?action=getAllMbtiData`);
                const result = await response.json();

                let myResult = null;

                if (Array.isArray(result)) {
                    // 구버전 배열 포맷
                    const userProject = result.reverse().find((item: any) => (item.author || item.Author) === author);
                    const rawResults = userProject?.results || userProject?.Results;
                    if (rawResults) {
                        const parsedResults = typeof rawResults === 'string' ? JSON.parse(rawResults) : rawResults;
                        myResult = parsedResults.find((r: any) => r.type === type);
                    }
                } else if (result.status === "success" && result.data && result.data.results) {
                    // 신버전 flat 포맷
                    myResult = result.data.results.find((r: any) =>
                        (r.author || r.Author) === author &&
                        (r.MBTI_Type || r.mbti_type || r.type) === type
                    );
                }

                if (myResult && ((myResult.Name || myResult.name) || (myResult.Description || myResult.description))) {
                    const resName = myResult.Name || myResult.name;
                    const resDesc = myResult.Description || myResult.description;
                    const resStrengths = myResult.Strengths || myResult.strengths;
                    const resCompatibility = myResult.Compatibility || myResult.compatibility;
                    const resCharacter = myResult.Character || myResult.character;

                    setMbti(prev => ({
                        ...prev,
                        title: resName || prev.title,
                        desc: (resDesc || prev.desc) +
                            (resStrengths ? `\n\n💪 강점/약점: ${resStrengths}` : '') +
                            (resCompatibility ? `\n\n🎯 찰떡궁합: ${resCompatibility}` : '') +
                            (resCharacter ? `\n\n✨ 한줄비유: ${resCharacter}` : ''),
                    }));
                }
            } catch (err) {
                console.error("Failed to load custom results", err);
            } finally {
                setIsFetching(false);
            }
        };

        if (author && author !== "AI 연구원") {
            fetchCustomResults();
        } else {
            setIsFetching(false);
        }
    }, [author, type]);

    useEffect(() => {
        if (!isFetching) {
            const timer = setTimeout(() => setShowCard(true), 50);
            return () => clearTimeout(timer);
        }
    }, [isFetching]);

    if (isFetching) {
        return (
            <div className="min-h-screen flex items-center justify-center text-primary font-black animate-pulse uppercase tracking-[0.2em]">
                Analyzing DNA...
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-20 px-6 flex flex-col items-center justify-center space-y-12">
            {/* Dynamic Header */}
            <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-10 duration-1000">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                    Test Completed
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
                    분석 결과, 당신은<br />
                    <span className="text-primary italic"> {mbti.title}</span> 입니다!
                </h1>
            </div>

            {/* Result Card - AI ID Card Style */}
            <div className={`w-full max-w-sm md:max-w-md transition-all duration-1000 transform ${showCard ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10'}`}>
                <div className="relative w-full min-h-[500px] h-auto rounded-[2.5rem] p-1 bg-gradient-to-br from-white/20 via-primary/30 to-white/10 shadow-2xl overflow-hidden group">

                    <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl rounded-[2.4rem] overflow-hidden">
                        {/* Background Texture/Shine */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10 group-hover:bg-primary/30 transition-all duration-700" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] -z-10" />

                        <div className="h-full flex flex-col p-8 justify-between relative z-10">
                            {/* Card Top: ID Style */}
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-80">AI LAB IDENTITY</span>
                                    <p className="text-2xl font-black italic tracking-tighter text-white">FUTURE RESEARCHER</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all">
                                    {mbti.icon}
                                </div>
                            </div>

                            {/* Card Middle: Profile Area */}
                            <div className="flex flex-col items-center space-y-6">
                                <div className="relative w-48 h-48 rounded-full p-1 bg-gradient-to-tr from-primary via-white/50 to-blue-400 group-hover:rotate-6 transition-transform duration-700">
                                    <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center text-7xl overflow-hidden relative">
                                        {/* Placeholder for Character/Image */}
                                        <span className="relative z-10 group-hover:scale-110 transition-transform duration-500">{mbti.icon}</span>
                                        <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center space-y-1">
                                    <h2 className="text-5xl font-black tracking-tighter text-white">{type}</h2>
                                    <div className={`px-4 py-1 rounded-full ${mbti.color} text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20`}>
                                        {mbti.title}
                                    </div>
                                </div>
                            </div>

                            {/* Card Bottom: Description & Stats */}
                            <div className="space-y-6 mt-8">
                                <p className="text-center text-sm font-medium text-white/90 leading-relaxed whitespace-pre-wrap break-keep">
                                    {mbti.desc}
                                </p>
                                <div className="flex justify-between items-end border-t border-white/10 pt-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Researcher Name</p>
                                        <p className="text-xl font-bold text-white tracking-tight">{author}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Issue Date</p>
                                        <p className="text-xs text-white/60 font-mono">2026.03.02</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card Shine Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                </div>
            </div>

            {/* Global Actions */}
            <div className="flex flex-col md:flex-row gap-4 w-full max-w-sm md:max-w-md animate-in fade-in slide-in-from-bottom-10 duration-[1200ms] delay-500">
                <Link
                    href="/showcase"
                    className="flex-1 py-5 bg-primary text-white text-sm font-black rounded-3xl shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    다른 작품들 구경가기 ✨
                </Link>
                <Link href={`/mbti/play?author=${encodeURIComponent(author)}`} className="px-8 py-5 bg-secondary hover:bg-muted text-foreground text-sm font-black rounded-3xl transition-all flex items-center justify-center whitespace-nowrap">
                    테스트 다시하기
                </Link>
            </div>

            {/* Footer Info */}
            <p className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-[0.3em]">
                AI Innovation Lab • Researcher ID Card System
            </p>
        </div>
    );
}

export default function ResultPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-primary font-black animate-pulse uppercase tracking-[0.2em]">Analyzing DNA...</div>}>
            <ResultContent />
        </Suspense>
    );
}

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { APPS_SCRIPT_URL } from "../../constants";

function MBTIPlayContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const author = searchParams.get("author");

    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 데이터 로드
    useEffect(() => {
        const fetchProject = async () => {
            if (!author) {
                setError("연구원 정보가 없습니다.");
                setIsLoading(false);
                return;
            }

            // 캐시 확인 (빠른 재시작을 위함)
            const cacheKey = `mbti_cache_${author}`;
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                try {
                    const parsedCache = JSON.parse(cachedData);
                    if (Array.isArray(parsedCache) && parsedCache.length > 0) {
                        setQuestions(parsedCache);
                        setIsLoading(false);
                        return; // 캐시가 있으면 fetch 생략
                    }
                } catch (e) {
                    // 캐시 깨짐 -> 다시 fetch
                }
            }

            try {
                const response = await fetch(`${APPS_SCRIPT_URL}?action=getAllMbtiData`);
                const result = await response.json();

                let parsedQuestions: any[] = [];

                if (Array.isArray(result)) {
                    // 구버전 배열 포맷
                    const project = result.reverse().find((p: any) => (p.author || p.Author) === author);
                    const rawQuestions = project?.questions || project?.Questions;
                    if (rawQuestions) {
                        parsedQuestions = typeof rawQuestions === 'string' ? JSON.parse(rawQuestions) : rawQuestions;
                    }
                } else if (result.status === "success" && result.data && result.data.questions) {
                    // 신버전 flat 포맷
                    parsedQuestions = result.data.questions.filter((q: any) => (q.author || q.Author) === author);
                }

                if (parsedQuestions.length > 0) {
                    localStorage.setItem(cacheKey, JSON.stringify(parsedQuestions));
                    setQuestions(parsedQuestions);
                } else {
                    setError("해당 연구원의 프로젝트를 찾을 수 없거나 유효한 문항 데이터가 없습니다.");
                }
            } catch (err) {
                setError("데이터를 불러오는데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProject();
    }, [author]);

    const handleAnswer = (trait: string) => {
        const newAnswers = [...answers, trait];
        if (currentIndex < questions.length - 1) {
            setAnswers(newAnswers);
            setCurrentIndex(currentIndex + 1);
        } else {
            // 모든 답변 완료 시 MBTI 계산
            calculateResult(newAnswers);
        }
    };

    const calculateResult = (finalAnswers: string[]) => {
        const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
        finalAnswers.forEach(ans => {
            if (ans in scores) scores[ans as keyof typeof scores]++;
        });

        const mbti = [
            scores.E >= scores.I ? "E" : "I",
            scores.S >= scores.N ? "S" : "N",
            scores.T >= scores.F ? "T" : "F",
            scores.J >= scores.P ? "J" : "P"
        ].join("");

        router.push(`/mbti/result?type=${mbti}&author=${encodeURIComponent(author || "익명")}`);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="font-black text-primary animate-pulse uppercase tracking-widest text-xs">Loading Research Data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="text-6xl">⚠️</div>
                <h2 className="text-2xl font-black">{error}</h2>
                <Link href="/showcase" className="px-8 py-3 bg-secondary rounded-2xl font-black text-sm hover:bg-muted transition-all">
                    전시관으로 돌아가기
                </Link>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div className="max-w-xl mx-auto py-10 px-4 animate-in fade-in duration-700">
            {/* Play Header */}
            <div className="text-center mb-12 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">
                    Research Participant Mode
                </div>
                <h1 className="text-2xl font-black tracking-tight leading-tight">
                    <span className="text-primary font-black">{author}</span> 연구원의<br />
                    MBTI 실험에 참여 중입니다
                </h1>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-secondary rounded-full mb-16 overflow-hidden border border-border/50">
                <div
                    className="h-full bg-primary shadow-[0_0_15px_rgba(129,140,248,0.5)] transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Question UI */}
            <div className="space-y-12 min-h-[400px]">
                <div className="space-y-6 text-center">
                    <span className="text-4xl font-black text-primary/20 italic">Q. {String(currentIndex + 1).padStart(2, '0')}</span>
                    <h2 className="text-3xl font-black tracking-tight leading-tight text-foreground drop-shadow-sm min-h-[6rem] flex items-center justify-center">
                        {(currentQuestion.Text || currentQuestion.text) || "질문 내용이 없습니다."}
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <button
                        onClick={() => handleAnswer(currentQuestion.Trait1 || currentQuestion.trait1)}
                        className="w-full p-8 rounded-[2rem] bg-secondary hover:bg-primary hover:text-white transition-all duration-300 font-black text-left group flex items-start gap-4 border border-border/50"
                    >
                        <span className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/20">A</span>
                        <span className="text-lg leading-snug">{(currentQuestion.Option1 || currentQuestion.option1) || "보기 1"}</span>
                    </button>
                    <button
                        onClick={() => handleAnswer(currentQuestion.Trait2 || currentQuestion.trait2)}
                        className="w-full p-8 rounded-[2rem] bg-secondary hover:bg-primary hover:text-white transition-all duration-300 font-black text-left group flex items-start gap-4 border border-border/50"
                    >
                        <span className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/20">B</span>
                        <span className="text-lg leading-snug">{(currentQuestion.Option2 || currentQuestion.option2) || "보기 2"}</span>
                    </button>
                </div>
            </div>

            {/* Footer decoration */}
            <div className="mt-20 text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">
                    AI Playgrounds • MBTI Research Lab
                </p>
            </div>
        </div>
    );
}

export default function MBTIPlayPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <MBTIPlayContent />
        </Suspense>
    );
}

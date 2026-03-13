"use client";

import Link from "next/link";
import { useState, use } from "react";
import MarkdownContent from "../../../components/MarkdownContent";
import UploadHomework from "./UploadHomework";
import { getAppsScriptJson } from "@/lib/appsScriptClient";

export default function CoursePage(props: { params: Promise<{ weekId: string }> | { weekId: string } }) {
    const params = use(props.params instanceof Promise ? props.params : Promise.resolve(props.params));
    const weekId = params.weekId;
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const mbtiWeekNum = parseInt(weekId);
    const isValidWeek = !isNaN(mbtiWeekNum) && mbtiWeekNum >= 1 && mbtiWeekNum <= 4;

    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [errorLoading, setErrorLoading] = useState(false);

    useState(() => {
        const fetchContent = async () => {
            if (!isValidWeek) {
                setErrorLoading(true);
                setContent(`# 유효하지 않은 주차입니다.\n\n정상적인 커리큘럼 범위를 벗어났습니다. (1~4주차만 지원)`);
                setIsLoading(false);
                return;
            }
            try {
                const result = await getAppsScriptJson<{ success: boolean, data?: { content: string } }>(
                    new URLSearchParams({ action: "getCourseContent", track: "MBTI", week: weekId })
                );
                if (result?.success && result.data) {
                    setContent(result.data.content);
                } else {
                    throw new Error("Failed to load");
                }
            } catch (err) {
                setErrorLoading(true);
                setContent(`# 진행 중인 문서가 없습니다.\n\n해당 주차의 학습 안내 문서를 찾을 수 없습니다.`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchContent();
    });

    return (
        <div className="relative min-h-screen overflow-hidden bg-background text-foreground pb-24">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.15),transparent_40%)]" />

            {/* Navigation Header */}
            <header className="sticky top-0 inset-x-0 z-40 flex h-20 items-center border-b border-white/10 bg-background/60 px-6 backdrop-blur-2xl">
                <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
                    <Link href="/" className="group text-sm font-bold text-muted-foreground hover:text-primary transition-all flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 group-hover:bg-primary/10 transition-colors">←</span>
                        My Study Lab
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[11px] font-black tracking-widest uppercase border border-primary/20">
                            Week {weekId}
                        </span>
                        {!errorLoading && !isLoading && (
                            <button
                                onClick={() => setIsUploadOpen(true)}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                            >
                                📁 과제 제출하기
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="relative mx-auto max-w-5xl px-6 pt-12">
                <section className="pb-16">
                    <div className="max-w-3xl">
                        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-primary/70 mb-4 ml-1">MBTI Science Lab</p>
                        <div className="flex items-start gap-6">
                            <div className="mt-1.5 h-20 w-1.5 rounded-full bg-gradient-to-b from-primary via-primary/40 to-transparent" />
                            <div>
                                <h1 className="text-[clamp(2.5rem,5vw,5rem)] font-black tracking-tight text-white leading-[1.1]">
                                    {mbtiWeekNum}주차 학습 가이드
                                </h1>
                                <p className="mt-6 max-w-2xl text-[17px] leading-8 text-muted-foreground font-medium">
                                    이번 주 학습 목표를 먼저 확인하고 실습을 진행해 보세요.<br/>
                                    모든 실습을 마친 후 우측 상단의 <span className="text-primary font-bold">제출하기</span> 버튼을 눌러 결과물을 공유해 주세요.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-12">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {isLoading ? (
                            <div className="space-y-4">
                                <div className="h-8 bg-white/5 rounded-xl w-3/4 animate-pulse" />
                                <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
                                <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
                            </div>
                        ) : (
                            <MarkdownContent content={content} className="max-w-none prose-invert" />
                        )}
                    </div>

                    {!errorLoading && !isLoading && (
                        <aside className="hidden lg:block">
                            <div className="sticky top-32 p-8 rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-sm space-y-6">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl border border-primary/20">
                                    🎯
                                </div>
                                <div>
                                    <h4 className="font-black text-lg">실습 완료?</h4>
                                    <p className="text-sm text-muted-foreground mt-2 font-medium leading-relaxed">
                                        결과물 파일을 압축하여 지금 바로 제출하세요!
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsUploadOpen(true)}
                                    className="w-full py-4 bg-primary text-white rounded-2xl font-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                                >
                                    지금 제출하기
                                </button>
                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center opacity-60">
                                        Auto Filename Protection On
                                    </p>
                                </div>
                            </div>
                        </aside>
                    )}
                </div>
            </div>

            {/* Floating Action Button for Mobile */}
            {!errorLoading && !isLoading && (
                <div className="lg:hidden fixed bottom-8 right-6 z-40">
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all"
                    >
                        📁 과제 제출하기
                    </button>
                </div>
            )}

            <UploadHomework 
                weekId={mbtiWeekNum} 
                isOpen={isUploadOpen} 
                onClose={() => setIsUploadOpen(false)} 
            />
        </div>
    );
}

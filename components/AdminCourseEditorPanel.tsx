"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import MarkdownToolbar from "@/components/MarkdownToolbar";

interface AdminCourseEditorPanelProps {
    track: string;
    weekId: number;
}

// Simple local cache to avoid refetching content we just saw
const contentCache: Record<string, { content: string; title: string; source: string }> = {};

export default function AdminCourseEditorPanel({
    track,
    weekId,
}: AdminCourseEditorPanelProps) {
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [source, setSource] = useState("Loading...");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const cacheKey = `${track}-${weekId}`;

    useEffect(() => {
        let isMounted = true;

        const loadContent = async () => {
            setIsLoading(true);
            setError("");
            setMessage("");
            try {
                if (contentCache[cacheKey]) {
                    setContent(contentCache[cacheKey].content);
                    setTitle(contentCache[cacheKey].title);
                    setSource(contentCache[cacheKey].source);
                    setIsLoading(false);
                    return;
                }

                const res = await fetch(`/api/course/content?track=${track}&week=${weekId}`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                
                if (data.success && isMounted) {
                    setContent(data.content || "");
                    setTitle(data.title || "");
                    const displaySource = data.source === "sheet" ? "Google Sheets" : "Local Docs";
                    setSource(displaySource);
                    contentCache[cacheKey] = { content: data.content || "", title: data.title || "", source: displaySource };
                } else if (isMounted) {
                    setError(data.error || "콘텐츠를 불러오지 못했습니다.");
                    setSource("Error");
                }
            } catch (err) {
                if (isMounted) {
                    setError("네트워크 오류로 콘텐츠를 불러오지 못했습니다.");
                    setSource("Error");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadContent();

        return () => {
            isMounted = false;
        };
    }, [track, weekId, cacheKey]);

    const contentStats = useMemo(() => {
        if (isLoading) return { chars: 0, lines: 0 };
        const lines = content.length === 0 ? 0 : content.split("\n").length;
        return {
            chars: content.length,
            lines,
        };
    }, [content, isLoading]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage("");
        setError("");

        try {
            const response = await fetch("/api/course/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    track,
                    weekId,
                    title,
                    content,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                setError(result.error || "저장에 실패했습니다.");
                return;
            }

            const savedTo = result.savedTo === "sheet" ? "구글 스프레드시트" : "로컬 Markdown 파일";
            setMessage(`${track} ${weekId}주차 내용이 ${savedTo}에 저장되었습니다.`);
            
            // Update cache after save
            contentCache[cacheKey] = { content, title, source: "Google Sheets" };
            setSource("Google Sheets");
        } catch {
            setError("저장 요청 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
            <aside className="h-fit space-y-6">
                <div className="rounded-3xl border border-border bg-background/60 backdrop-blur-xl p-6 shadow-xl shadow-primary/5 transition-all">
                    <div className="mb-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/60">Content Editor</p>
                        <h2 className="mt-1 text-2xl font-black tracking-tight">{track} <span className="text-primary">{weekId}주차</span></h2>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Week Title</label>
                            <input 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                placeholder="주차 제목을 입력하세요" 
                                className="w-full bg-secondary/30 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 focus:bg-background focus:border-primary transition-all outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-muted-foreground">
                            <div className="rounded-xl border border-border/40 bg-secondary/10 p-2.5">
                                <p className="mb-0.5 opacity-60">문자 수</p>
                                <p className="font-mono font-bold text-foreground text-sm">{contentStats.chars.toLocaleString()}</p>
                            </div>
                            <div className="rounded-xl border border-border/40 bg-secondary/10 p-2.5">
                                <p className="mb-0.5 opacity-60">줄 수</p>
                                <p className="font-mono font-bold text-foreground text-sm">{contentStats.lines.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${source === "Google Sheets" ? "bg-emerald-500" : "bg-blue-500"}`}></span>
                                로드 소스: <span className="font-bold text-foreground/80">{source}</span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        {message && (
                            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400 font-medium animate-in fade-in slide-in-from-top-2">
                                ✨ {message}
                            </div>
                        )}

                        {error && (
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400 font-medium animate-in fade-in slide-in-from-top-2">
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={isSaving || isLoading}
                            className="group relative w-full overflow-hidden rounded-2xl bg-primary px-4 py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span className="relative z-10">{isSaving ? "동기화 중..." : "변경 내용 저장하기"}</span>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 scale-x-0 transition-transform group-hover:scale-x-100" />
                        </button>
                    </div>
                </div>

                <div className="hidden lg:block rounded-2xl border border-border/50 bg-background/40 p-5 text-[11px] text-muted-foreground leading-relaxed italic shadow-inner">
                    "이 화면은 관리자 전용 편집 패널입니다. 실시간 동기화를 통해 학생들에게 즉각적으로 반영됩니다."
                </div>
            </aside>

            <section className="space-y-6 h-full">
                <div className="rounded-[40px] border border-border/80 bg-background/60 backdrop-blur-md p-6 lg:p-8 shadow-2xl shadow-black/5 ring-1 ring-white/20 h-[calc(100vh-180px)] flex flex-col transition-all overflow-hidden">
                    {/* Header & Sticky Toolbar Container */}
                    <div className="flex-shrink-0 z-30 bg-background/0 pb-4">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/60">
                                Markdown Content
                            </label>
                            <div className="flex gap-2 items-center">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] text-muted-foreground font-bold">LIVE EDITOR</span>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl p-1 shadow-lg">
                            <MarkdownToolbar content={content} onChange={setContent} textareaRef={textareaRef} />
                        </div>
                    </div>
                    
                    {/* Scrollable Textarea Area */}
                    <div className="flex-1 mt-2 overflow-hidden flex flex-col">
                        {isLoading ? (
                            <div className="h-full w-full rounded-3xl border border-border/30 bg-secondary/5 p-8 space-y-6 animate-pulse">
                                <div className="h-8 bg-secondary/20 rounded-2xl w-2/3"></div>
                                <div className="h-4 bg-secondary/10 rounded-xl w-full"></div>
                                <div className="h-4 bg-secondary/10 rounded-xl w-5/6"></div>
                                <div className="h-64 bg-secondary/5 rounded-3xl w-full mt-10"></div>
                            </div>
                        ) : (
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(event) => setContent(event.target.value)}
                                placeholder="마크다운 형식으로 풍부한 학습 내용을 작성해 보세요..."
                                className="flex-1 w-full bg-transparent resize-none font-mono text-base leading-relaxed text-foreground placeholder:text-muted-foreground/30 focus:outline-none overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent selection:bg-primary/20"
                            />
                        )}
                    </div>

                    <div className="flex-shrink-0 mt-6 pt-4 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest px-2">
                        <span>Markdown Engine v2.0</span>
                        <span>Autosave enabled to local cache</span>
                    </div>
                </div>
            </section>
        </div>
    );
}

"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import MarkdownToolbar from "@/components/MarkdownToolbar";

type CourseTrack = "MBTI" | "POSE";

interface AdminCourseEditorPanelProps {
    track: CourseTrack;
    weekId: number;
}

// Simple local cache to avoid refetching content we just saw
const contentCache: Record<string, { content: string; source: string }> = {};

export default function AdminCourseEditorPanel({
    track,
    weekId,
}: AdminCourseEditorPanelProps) {
    const [content, setContent] = useState("");
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

            if (contentCache[cacheKey]) {
                setContent(contentCache[cacheKey].content);
                setSource(contentCache[cacheKey].source);
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/course/content?track=${track}&week=${weekId}`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                
                if (data.success && isMounted) {
                    setContent(data.content || "");
                    const displaySource = data.source === "sheet" ? "Google Sheets" : "Local Docs";
                    setSource(displaySource);
                    contentCache[cacheKey] = { content: data.content || "", source: displaySource };
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
            contentCache[cacheKey] = { content, source: "Google Sheets" };
            setSource("Google Sheets");
        } catch {
            setError("저장 요청 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
            <aside className="rounded-3xl border border-border bg-secondary/10 p-5 space-y-4 h-fit sticky top-24">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Editing</p>
                    <h2 className="mt-2 text-2xl font-black">{track} {weekId}주차</h2>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                    <p>현재 로드 소스: <span className="font-semibold text-foreground">{source}</span></p>
                    <p>문자 수: <span className="font-semibold text-foreground">{contentStats.chars}</span></p>
                    <p>줄 수: <span className="font-semibold text-foreground">{contentStats.lines}</span></p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-background/50 p-4 text-sm text-muted-foreground leading-relaxed">
                    이 화면은 관리자 전용 편집 패널입니다. 클라이언트 사이드에서 즉각적으로 전환되며 에디터 오류가 나도 학생 화면을 망가뜨리지 않습니다.
                </div>

                {message && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={isSaving || isLoading}
                    className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSaving ? "저장 중..." : "변경 내용 저장"}
                </button>
            </aside>

            <section className="space-y-4">
                <div className="rounded-3xl border border-border bg-background/40 p-4 relative overflow-hidden min-h-[500px] flex flex-col">
                    <label className="mb-3 block text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
                        Markdown Editor
                    </label>
                    <MarkdownToolbar content={content} onChange={setContent} textareaRef={textareaRef} />
                    
                    {isLoading ? (
                        <div className="flex-1 w-full rounded-2xl border border-border/50 bg-secondary/10 p-6 space-y-4 animate-pulse">
                            <div className="h-4 bg-secondary/30 rounded w-3/4"></div>
                            <div className="h-4 bg-secondary/30 rounded w-full"></div>
                            <div className="h-4 bg-secondary/30 rounded w-5/6"></div>
                            <div className="h-4 bg-secondary/30 rounded w-1/2 mt-8"></div>
                            <div className="h-32 bg-secondary/20 rounded w-full mt-4"></div>
                        </div>
                    ) : (
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            placeholder="마크다운 형식으로 학습 내용을 입력하세요."
                            className="flex-1 min-h-[70vh] w-full resize-y rounded-2xl border border-border bg-background px-4 py-4 font-mono text-sm leading-7 outline-none transition-colors focus:border-primary"
                        />
                    )}
                </div>
            </section>
        </div>
    );
}

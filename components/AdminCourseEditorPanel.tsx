"use client";

import { useMemo, useState, useRef } from "react";
import MarkdownToolbar from "@/components/MarkdownToolbar";

type CourseTrack = "MBTI" | "POSE";

interface AdminCourseEditorPanelProps {
    track: CourseTrack;
    weekId: number;
    initialContent: string;
    source: "sheet" | "local";
}

export default function AdminCourseEditorPanel({
    track,
    weekId,
    initialContent,
    source,
}: AdminCourseEditorPanelProps) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const contentStats = useMemo(() => {
        const lines = content.length === 0 ? 0 : content.split("\n").length;
        return {
            chars: content.length,
            lines,
        };
    }, [content]);

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
        } catch {
            setError("저장 요청 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
            <aside className="rounded-3xl border border-border bg-secondary/10 p-5 space-y-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Editing</p>
                    <h2 className="mt-2 text-2xl font-black">{track} {weekId}주차</h2>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                    <p>현재 로드 소스: <span className="font-semibold text-foreground">{source === "sheet" ? "Google Sheets" : "Local Docs"}</span></p>
                    <p>문자 수: <span className="font-semibold text-foreground">{contentStats.chars}</span></p>
                    <p>줄 수: <span className="font-semibold text-foreground">{contentStats.lines}</span></p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-background/50 p-4 text-sm text-muted-foreground leading-relaxed">
                    이 화면은 관리자 전용 편집 패널입니다. 학습 페이지 본문 렌더와 분리되어 있으므로, 편집기 오류가 나도 학생 화면을 망가뜨리지 않습니다.
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
                    disabled={isSaving}
                    className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSaving ? "저장 중..." : "변경 내용 저장"}
                </button>
            </aside>

            <section className="space-y-4">
                <div className="rounded-3xl border border-border bg-background/40 p-4">
                    <label className="mb-3 block text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
                        Markdown Editor
                    </label>
                    <MarkdownToolbar content={content} onChange={setContent} textareaRef={textareaRef} />
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder="마크다운 형식으로 학습 내용을 입력하세요."
                        className="min-h-[70vh] w-full resize-y rounded-2xl border border-border bg-background px-4 py-4 font-mono text-sm leading-7 outline-none transition-colors focus:border-primary"
                    />
                </div>
            </section>
        </div>
    );
}

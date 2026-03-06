"use client";

import { useState } from "react";

interface CourseEditorProps {
    weekId: number;
    initialContent: string;
    isAdmin: boolean;
    track?: "MBTI" | "POSE";
}

export default function CourseEditor({ weekId, initialContent, isAdmin, track = "MBTI" }: CourseEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    if (!isAdmin) {
        return null;
    }

    const handleSave = async () => {
        setIsSaving(true);
        setError("");

        try {
            const res = await fetch("/api/course/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ weekId, content, track }),
            });
            const result = await res.json();

            if (res.ok && result.success) {
                setIsEditing(false);
            } else {
                setError(result.error || "저장 중 오류가 발생했습니다.");
            }
        } catch (err) {
            setError("서버 통신 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header / Actions */}
            <div className="flex justify-end items-center gap-3 py-2 border-b border-border/50">
                {error && <span className="text-sm text-red-500 font-medium">{error}</span>}
                {isEditing ? (
                    <>
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setContent(initialContent); // Cancel changes
                                setError("");
                            }}
                            className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-secondary/50"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? "저장 중..." : "저장"}
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 flex items-center gap-2 text-sm font-bold bg-secondary/50 text-foreground border border-border rounded-xl hover:bg-secondary hover:border-primary/50 transition-all shadow-sm group"
                    >
                        <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        편집
                    </button>
                )}
            </div>

            {/* Editor Area */}
            {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[600px]">
                    {/* Raw Markdown Input */}
                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                            <span>Markdown (raw)</span>
                            <span className="text-[10px] font-normal opacity-50 bg-background/50 px-2 py-0.5 rounded border border-border">Editor</span>
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="flex-1 w-full bg-secondary/10 border border-border rounded-2xl p-6 font-mono text-sm leading-relaxed focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none resize-none transition-colors"
                            placeholder="마크다운을 입력하세요..."
                        />
                    </div>

                    {/* Live Preview */}
                    <div className="flex flex-col h-full overflow-hidden">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                            <span>Preview</span>
                            <span className="text-[10px] font-normal opacity-50 bg-background/50 px-2 py-0.5 rounded border border-border">Preview</span>
                        </label>
                        <div className="flex-1 overflow-y-auto bg-background/50 border border-border/50 rounded-2xl p-6 whitespace-pre-wrap leading-relaxed">
                            {content}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-none rounded-2xl border border-border/60 bg-background/40 p-6 whitespace-pre-wrap leading-relaxed">
                    {content}
                </div>
            )}
        </div>
    );
}

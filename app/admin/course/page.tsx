"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AdminCourseEditorPanel from "@/components/AdminCourseEditorPanel";
import { type CourseTrack } from "@/lib/courseContent";
import { useEffect, useRef } from "react";

const tracks: CourseTrack[] = ["MBTI", "POSE"];
const weeks = [1, 2, 3, 4];

function normalizeTrack(value: string | null): CourseTrack {
    return value === "POSE" ? "POSE" : "MBTI";
}

function normalizeWeek(value: string | null): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 4 ? parsed : 1;
}

export default function AdminCoursePage() {
    const searchParams = useSearchParams();
    const track = normalizeTrack(searchParams.get("track"));
    const weekId = normalizeWeek(searchParams.get("week"));

    const trackContainerRef = useRef<HTMLDivElement>(null);
    const weekContainerRef = useRef<HTMLDivElement>(null);

    // Horizontal wheel scroll logic
    useEffect(() => {
        const handleWheel = (e: WheelEvent, container: HTMLDivElement | null) => {
            if (!container) return;
            // Prevent default vertical scroll and apply horizontal scroll instead
            if (e.deltaY !== 0) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        };

        const tContainer = trackContainerRef.current;
        const wContainer = weekContainerRef.current;

        const handleTrackWheel = (e: WheelEvent) => handleWheel(e, tContainer);
        const handleWeekWheel = (e: WheelEvent) => handleWheel(e, wContainer);

        if (tContainer) tContainer.addEventListener("wheel", handleTrackWheel, { passive: false });
        if (wContainer) wContainer.addEventListener("wheel", handleWeekWheel, { passive: false });

        return () => {
            if (tContainer) tContainer.removeEventListener("wheel", handleTrackWheel);
            if (wContainer) wContainer.removeEventListener("wheel", handleWeekWheel);
        };
    }, []);

    return (
        <div className="min-h-screen bg-background px-6 py-10 text-foreground">
            <div className="mx-auto max-w-7xl space-y-8">
                <header className="flex flex-col gap-4 rounded-3xl border border-border bg-secondary/10 p-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground">Admin</p>
                        <h1 className="text-3xl font-black tracking-tight">주차별 코스 콘텐츠 편집</h1>
                        <p className="text-sm text-muted-foreground">
                            학생용 코스 페이지와 분리된 관리자 전용 편집 화면입니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/admin/feedback"
                            className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary/90 hover:scale-105"
                        >
                            🧑‍🏫 학생 피드백 하러가기
                        </Link>
                        <Link
                            href={track === "POSE" ? `/pose/week${weekId}` : `/mbti/week${weekId}`}
                            className="rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                        >
                            현재 학습 페이지 보기
                        </Link>
                        <form action="/api/admin/logout" method="post">
                            <button
                                type="submit"
                                className="rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                            >
                                관리자 로그아웃
                            </button>
                        </form>
                    </div>
                </header>

                <section className="rounded-3xl border border-border bg-secondary/5 p-6 space-y-5">
                    <div className="space-y-3 relative group">
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Track</p>
                        <div 
                            ref={trackContainerRef}
                            className="flex overflow-x-auto flex-nowrap gap-3 scrollbar-hide select-none transition-all"
                            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                        >
                            {tracks.map((item) => {
                                const isActive = item === track;
                                return (
                                    <Link
                                        key={item}
                                        href={`/admin/course?track=${item}&week=${weekId}`}
                                        className={`shrink-0 rounded-2xl px-6 py-3 text-sm font-bold transition-colors ${
                                            isActive
                                                ? "bg-primary text-primary-foreground"
                                                : "border border-border text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {item}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3 relative group">
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Week</p>
                        <div 
                            ref={weekContainerRef}
                            className="flex overflow-x-auto flex-nowrap gap-3 scrollbar-hide select-none transition-all"
                            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                        >
                            {weeks.map((item) => {
                                const isActive = item === weekId;
                                return (
                                    <Link
                                        key={item}
                                        href={`/admin/course?track=${track}&week=${item}`}
                                        className={`shrink-0 rounded-2xl px-6 py-3 text-sm font-bold transition-colors ${
                                            isActive
                                                ? "bg-primary text-primary-foreground"
                                                : "border border-border text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {item}주차
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <AdminCourseEditorPanel
                    key={`${track}-${weekId}`}
                    track={track}
                    weekId={weekId}
                />
            </div>
        </div>
    );
}

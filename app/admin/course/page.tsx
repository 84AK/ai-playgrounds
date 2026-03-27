import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminCourseEditorPanel from "@/components/AdminCourseEditorPanel";
import { getCourseContent, type CourseTrack } from "@/lib/courseContent";

const tracks: CourseTrack[] = ["MBTI", "POSE"];
const weeks = [1, 2, 3, 4];

function normalizeTrack(value: string | string[] | undefined): CourseTrack {
    return value === "POSE" ? "POSE" : "MBTI";
}

function normalizeWeek(value: string | string[] | undefined): number {
    const raw = Array.isArray(value) ? value[0] : value;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 4 ? parsed : 1;
}

export default async function AdminCoursePage(props: {
    searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
    const cookieStore = await cookies();
    if (!cookieStore.has("admin_session")) {
        redirect("/admin");
    }

    const searchParams = await (props.searchParams instanceof Promise
        ? props.searchParams
        : Promise.resolve(props.searchParams || {}));

    const track = normalizeTrack(searchParams.track);
    const weekId = normalizeWeek(searchParams.week);
    const result = await getCourseContent(track, weekId);

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
                            href={track === "POSE" ? `/pose/week${weekId}` : `/course/${weekId}`}
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
                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Track</p>
                        <div className="flex flex-wrap gap-3">
                            {tracks.map((item) => {
                                const isActive = item === track;
                                return (
                                    <Link
                                        key={item}
                                        href={`/admin/course?track=${item}&week=${weekId}`}
                                        className={`rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
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

                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Week</p>
                        <div className="flex flex-wrap gap-3">
                            {weeks.map((item) => {
                                const isActive = item === weekId;
                                return (
                                    <Link
                                        key={item}
                                        href={`/admin/course?track=${track}&week=${item}`}
                                        className={`rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
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
                    initialContent={result.content}
                    source={result.source}
                />
            </div>
        </div>
    );
}

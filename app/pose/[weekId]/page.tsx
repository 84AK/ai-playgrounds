import Link from "next/link";
import MarkdownContent from "../../../components/MarkdownContent";
import UploadHomework from "./UploadHomework";
import PoseSubmissionTrigger from "./PoseSubmissionTrigger";
import { getCourseContent } from "@/lib/courseContent";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export default async function PoseCoursePage(props: { params: Promise<{ weekId: string }> | { weekId: string } }) {
    // Resolve params for Next 15 compatibility
    const params = await (props.params instanceof Promise ? props.params : Promise.resolve(props.params));
    // Extracts the number from "week1", "week2", etc. or handles raw numbers if passed
    const rawWeekId = params.weekId.replace('week', '');
    const poseWeekNum = parseInt(rawWeekId);
    const isValidWeek = !isNaN(poseWeekNum) && poseWeekNum >= 1;

    let content = "";
    let title = "";
    let errorLoading = false;

    if (!isValidWeek) {
        errorLoading = true;
        content = `# 유효하지 않은 주차입니다.\n\n정상적인 커리큘럼 범위를 벗어났습니다.`;
    } else {
        try {
            const cookieStore = await cookies();
            const customUrl = cookieStore.get("custom_gs_url")?.value;
            const notionEncryptedKey = cookieStore.get("custom_notion_key")?.value;
            const notionDbId = cookieStore.get("custom_notion_db_id")?.value;
            const notionPriority = cookieStore.get("custom_notion_priority")?.value as "notion" | "sheet" | undefined;

            const notionConfig = notionEncryptedKey && notionDbId ? {
                apiKey: decrypt(notionEncryptedKey),
                databaseId: notionDbId,
                priority: notionPriority || "sheet"
            } : undefined;

            const result = await getCourseContent("POSE", poseWeekNum, customUrl, notionConfig);
            content = result.content;
            title = result.title;
        } catch (err) {
            errorLoading = true;
            content = `# 진행 중인 문서가 없습니다.\n\n해당 주차의 학습 안내 문서를 찾을 수 없습니다.`;
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-background text-foreground pb-20">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[260px] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%)]" />

            {/* Navigation Header */}
            <header className="sticky top-0 inset-x-0 z-40 flex h-20 items-center border-b border-[#2F3D4A]/10 bg-white/80 px-6 backdrop-blur-xl">
                <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
                    <Link href="/study-lab" className="group text-sm font-bold text-slate-600 hover:text-blue-600 transition-all flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 transition-colors">←</span>
                        My Study Lab
                    </Link>
                    {!errorLoading && (
                        <PoseSubmissionTrigger weekId={poseWeekNum} />
                    )}
                </div>
            </header>

            <div className="relative mx-auto max-w-5xl px-6 pt-10">
                <section className="pb-12">
                    <div className="max-w-3xl">
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600">POSE Week {poseWeekNum}</p>
                        <div className="mt-5 flex items-start gap-4">
                            <div className="mt-1.5 h-16 w-1 rounded-full bg-gradient-to-b from-blue-500 via-blue-500/40 to-transparent" />
                            <div>
                                <h1 className="text-[clamp(2.2rem,4vw,4.25rem)] font-black tracking-tight text-[#2F3D4A]">
                                    {title || `${poseWeekNum}주차 학습 가이드`}
                                </h1>
                                <p className="mt-4 max-w-2xl text-[15px] leading-8 text-slate-600 font-medium">
                                    이번 주 포즈 게임 실습 목표와 구현 흐름을 먼저 읽고, 아래 문서를 따라가며 결과물을 완성하세요.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <MarkdownContent
                    content={content}
                    accentClassName="prose-a:text-blue-400"
                    className="max-w-3xl"
                />

                {!errorLoading && (
                    <div className="mt-20 max-w-3xl">
                        <UploadHomework weekId={poseWeekNum} />
                    </div>
                )}
            </div>
        </div>
    );
}

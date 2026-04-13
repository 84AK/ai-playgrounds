import Link from "next/link";
import MarkdownContent from "@/components/MarkdownContent";
import { getCourseContent } from "@/lib/courseContent";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import CourseSubmissionTrigger from "@/components/course/CourseSubmissionTrigger";
import UploadHomework from "@/components/course/UploadHomework";
import { decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export default async function UniversalCoursePage(props: { params: Promise<{ track: string; weekId: string }> }) {
    const params = await props.params;
    const { track, weekId } = params;

    // "week1" -> 1 추출
    const weekNum = parseInt(weekId.replace('week', ''));
    if (isNaN(weekNum)) return notFound();

    let content = "";
    let title = "";
    let errorLoading = false;
    let rawData = "";

    // 디버그 정보 (관리자용)
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get("admin_session")?.value === "true";
    let dataSource: "sheet" | "local" | "notion" = "local";
    let usedUrl = "";

    try {
        const customUrl = cookieStore.get("custom_gs_url")?.value;
        const notionEncryptedKey = cookieStore.get("custom_notion_key")?.value;
        const notionDbId = cookieStore.get("custom_notion_db_id")?.value;
        const notionPriority = cookieStore.get("custom_notion_priority")?.value as "notion" | "sheet" | undefined;

        const notionConfig = notionEncryptedKey && notionDbId ? {
            apiKey: decrypt(notionEncryptedKey),
            databaseId: notionDbId,
            priority: notionPriority || "sheet"
        } : undefined;

        const result = await getCourseContent(track, weekNum, customUrl, notionConfig);
        
        content = result.content;
        title = result.title || `${track} ${weekNum}주차`;
        dataSource = result.source;
        usedUrl = customUrl || "SYSTEM DEFAULT";
        rawData = result.rawResponse || "No raw data (Local Fallback)";
    } catch (err) {
        errorLoading = true;
        content = `# 수업 내용을 불러올 수 없습니다.\n\n해당 차시가 아직 준비 중이거나 시트 연동에 문제가 있습니다.`;
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#FDFAEF] text-[#2F3D4A] pb-24">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.1),transparent_40%)]" />

            {/* Navigation Header */}
            <header className="sticky top-0 inset-x-0 z-40 flex h-20 items-center border-b border-[#2F3D4A]/10 bg-white/80 px-6 backdrop-blur-2xl">
                <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
                    <Link href="/study-lab" className="group text-sm font-bold text-slate-600 hover:text-primary transition-all flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 group-hover:bg-primary/10 transition-colors">←</span>
                        My Study Lab
                    </Link>
                    {!errorLoading && (
                        <CourseSubmissionTrigger track={track} weekId={weekNum} />
                    )}
                </div>
            </header>

            <div className="relative mx-auto max-w-5xl px-6 pt-12">
                <section className="pb-16 border-b border-[#2F3D4A]/10 mb-12">
                    <div className="max-w-3xl">
                        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-primary mb-4 ml-1">{track} SCIENCE LAB</p>
                        <div className="flex items-start gap-6">
                            <div className="mt-1.5 h-20 w-1.5 rounded-full bg-gradient-to-b from-primary via-primary/40 to-transparent" />
                            <div>
                                <h1 className="text-[clamp(2.5rem,5vw,5rem)] font-black tracking-tight text-[#2F3D4A] leading-[1.1]">
                                    {title}
                                </h1>
                                <p className="mt-6 max-w-2xl text-[17px] leading-8 text-slate-600 font-medium">
                                    선생님이 준비하신 학습 안내 문서를 확인하고 실습을 진행해 보세요.<br/>
                                    모든 실습을 마친 후 우측 상단의 <span className="text-primary font-bold">제출하기</span> 버튼을 눌러 결과물을 공유해 주세요.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="max-w-4xl mx-auto">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <MarkdownContent content={content} className="max-w-none" />
                        
                        {!errorLoading && (
                            <div className="mt-24 pt-24 border-t border-[#2F3D4A]/10">
                                <UploadHomework track={track} weekId={weekNum} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

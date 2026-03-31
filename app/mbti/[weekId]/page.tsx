import Link from "next/link";
import MarkdownContent from "../../../components/MarkdownContent";
import CourseSubmissionTrigger, { SidebarSubmitButton } from "./CourseSubmissionTrigger";
import UploadHomework from "./UploadHomework";
import { getCourseContent } from "@/lib/courseContent";

export async function generateStaticParams() {
    return [
        { weekId: "week1" },
        { weekId: "week2" },
        { weekId: "week3" },
        { weekId: "week4" },
    ];
}

export default async function CoursePage(props: { params: Promise<{ weekId: string }> | { weekId: string } }) {
    const params = await (props.params instanceof Promise ? props.params : Promise.resolve(props.params));
    const weekId = params.weekId;

    // "week1" -> "1" 추출 로직 추가
    const mbtiWeekNum = parseInt(weekId.replace('week', ''));
    const isValidWeek = !isNaN(mbtiWeekNum) && mbtiWeekNum >= 1 && mbtiWeekNum <= 4;

    let content = "";
    let errorLoading = false;

    if (!isValidWeek) {
        errorLoading = true;
        content = `# 유효하지 않은 주차입니다.\n\n정상적인 커리큘럼 범위를 벗어났습니다. (1~4주차만 지원)`;
    } else {
        try {
            // [복구] 서버에서 로컬 파일 + 스프레드시트 통합 조회 (로컬 파일 우선 순위 체크 포함)
            const result = await getCourseContent("MBTI", mbtiWeekNum);
            content = result.content;
        } catch (err) {
            errorLoading = true;
            content = `# 진행 중인 문서가 없습니다.\n\n해당 주차의 학습 안내 문서를 찾을 수 없습니다.`;
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-background text-foreground pb-24">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.15),transparent_40%)]" />

            {/* Navigation Header */}
            <header className="sticky top-0 inset-x-0 z-40 flex h-20 items-center border-b border-[#2F3D4A]/10 bg-white/80 px-6 backdrop-blur-2xl">
                <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
                    <Link href="/study-lab" className="group text-sm font-bold text-slate-600 hover:text-primary transition-all flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 group-hover:bg-primary/10 transition-colors">←</span>
                        My Study Lab
                    </Link>
                    {!errorLoading && (
                        <CourseSubmissionTrigger weekId={mbtiWeekNum} />
                    )}
                </div>
            </header>

            <div className="relative mx-auto max-w-5xl px-6 pt-12">
                <section className="pb-16">
                    <div className="max-w-3xl">
                        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-primary mb-4 ml-1">MBTI Science Lab</p>
                        <div className="flex items-start gap-6">
                            <div className="mt-1.5 h-20 w-1.5 rounded-full bg-gradient-to-b from-primary via-primary/40 to-transparent" />
                            <div>
                                <h1 className="text-[clamp(2.5rem,5vw,5rem)] font-black tracking-tight text-[#2F3D4A] leading-[1.1]">
                                    {mbtiWeekNum}주차 학습 가이드
                                </h1>
                                <p className="mt-6 max-w-2xl text-[17px] leading-8 text-slate-600 font-medium">
                                    이번 주 학습 목표를 먼저 확인하고 실습을 진행해 보세요.<br/>
                                    모든 실습을 마친 후 우측 상단의 <span className="text-primary font-bold">제출하기</span> 버튼을 눌러 결과물을 공유해 주세요.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="max-w-3xl">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <MarkdownContent content={content} className="max-w-none" />
                        
                        {/* Submission Section Integration */}
                        {!errorLoading && (
                            <div className="mt-24 pt-24 border-t border-[#2F3D4A]/10">
                                <UploadHomework weekId={mbtiWeekNum} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Action Button for Mobile would go here, 
                but we've already covered header and sidebar. 
                For a true Floating Button, we could add another Trigger at the end. */}
        </div>
    );
}

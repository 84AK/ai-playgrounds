import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Revalidate occasionally, or use `export const dynamic = 'force-static'`
export const revalidate = 3600;

export default async function CurriculumPage() {
    const docsDir = path.join(process.cwd(), "docs");

    let mbtiContent = "";
    let poseContent = "";

    try {
        mbtiContent = fs.readFileSync(path.join(docsDir, "mbti_week_plan.md"), "utf8");
    } catch (err) {
        mbtiContent = "MBTI 주차별 계획을 불러오지 못했습니다.";
    }

    try {
        poseContent = fs.readFileSync(path.join(docsDir, "pose_week_plan.md"), "utf8");
    } catch (err) {
        poseContent = "포즈 게임 주차별 계획을 불러오지 못했습니다.";
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="mb-12 border-b border-border/50 pb-8 text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                    전체 <span className="text-primary italic">학습 커리큘럼</span>
                </h1>
                <p className="text-muted-foreground font-medium text-lg">
                    8주차 동안 진행될 통합 연구소 프로젝트의 세부 계획입니다.
                </p>
            </div>

            <div className="space-y-20">
                <section className="prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{mbtiContent}</ReactMarkdown>
                </section>

                <section className="prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-blue-500 max-w-none">
                    <div className="border-t border-border/50 pt-16 mt-16" />
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{poseContent}</ReactMarkdown>
                </section>
            </div>
        </div>
    );
}

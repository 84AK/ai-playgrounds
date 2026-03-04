import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import UploadHomework from "./UploadHomework";

export default async function PoseCoursePage(props: { params: Promise<{ weekId: string }> | { weekId: string } }) {
    // Resolve params for Next 15 compatibility
    const params = await (props.params instanceof Promise ? props.params : Promise.resolve(props.params));
    // Extracts the number from "week1", "week2", etc. or handles raw numbers if passed
    const rawWeekId = params.weekId.replace('week', '');
    const poseWeekNum = parseInt(rawWeekId);
    const isValidWeek = !isNaN(poseWeekNum) && poseWeekNum >= 1 && poseWeekNum <= 4;

    const filePath = path.join(process.cwd(), "Docs", `pose_week${poseWeekNum}.md`);
    let content = "";
    let errorLoading = false;

    if (!isValidWeek) {
        errorLoading = true;
        content = `# 유효하지 않은 주차입니다.\n\n정상적인 커리큘럼 범위를 벗어났습니다. (1~4주차만 지원)`;
    } else {
        try {
            content = await fs.readFile(filePath, "utf-8");
        } catch (err) {
            errorLoading = true;
            content = `# 진행 중인 문서가 없습니다.\n\n해당 주차의 학습 안내 문서(${filePath})를 찾을 수 없습니다.`;
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* Navigation Header */}
            <header className="fixed top-0 inset-x-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-40 flex items-center px-6">
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                    <Link href="/" className="text-sm font-bold text-muted-foreground hover:text-blue-500 transition-colors flex items-center gap-2">
                        ← My Study Lab 돌아가기
                    </Link>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-black tracking-widest uppercase border border-blue-500/20">
                            POSE Week {poseWeekNum}
                        </span>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 pt-32 space-y-12">
                {/* Markdown Documentation Content */}
                <div className="prose prose-invert lg:prose-xl max-w-none prose-headings:font-black prose-a:text-blue-500 prose-pre:bg-secondary/50 prose-pre:border prose-pre:border-border prose-img:rounded-2xl">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </div>

                {/* Homework Upload Form Container */}
                {!errorLoading && (
                    <div className="mt-20 pt-10 border-t border-border">
                        <UploadHomework weekId={poseWeekNum} />
                    </div>
                )}
            </div>
        </div>
    );
}

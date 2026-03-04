import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Revalidate occasionally, or use `export const dynamic = 'force-static'`
export const revalidate = 3600;

export default async function GuidePage() {
    const docsDir = path.join(process.cwd(), "docs");

    let guideContent = "";

    try {
        guideContent = fs.readFileSync(path.join(docsDir, "guide.md"), "utf8");
    } catch (err) {
        guideContent = "가이드 내용을 불러오지 못했습니다.";
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="mb-12 border-b border-border/50 pb-8 text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                    통합 연구소 <span className="text-primary italic">이용 가이드</span>
                </h1>
                <p className="text-muted-foreground font-medium text-lg">
                    AI Playgrounds를 100% 활용하는 방법을 안내해 드립니다.
                </p>
            </div>

            <div className="space-y-20">
                <section className="prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary max-w-none prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{guideContent}</ReactMarkdown>
                </section>
            </div>
        </div>
    );
}

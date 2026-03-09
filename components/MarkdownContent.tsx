import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
    content: string;
    accentClassName?: string;
    className?: string;
}

import ImageCarousel from "./ImageCarousel";

export default function MarkdownContent({
    content,
    accentClassName = "prose-a:text-primary",
    className = "",
}: MarkdownContentProps) {
    return (
        <section className={`relative ${className}`}>
            <div className="mb-8 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/8" />
                <span className="text-[10px] font-black uppercase tracking-[0.32em] text-white/38">Document</span>
                <span className="h-px flex-1 bg-white/8" />
            </div>
            <div
                className={`prose prose-invert max-w-none prose-headings:mb-5 prose-headings:font-black prose-headings:tracking-tight prose-h1:mt-0 prose-h1:border-b prose-h1:border-white/8 prose-h1:pb-6 prose-h1:text-[clamp(1.9rem,3vw,3rem)] prose-h1:leading-[1.08] prose-h1:text-white/96 prose-h2:mt-16 prose-h2:border-t prose-h2:border-white/8 prose-h2:pt-10 prose-h2:text-[1.8rem] prose-h3:mt-10 prose-h3:text-xl prose-p:text-[15px] prose-p:leading-8 prose-p:text-white/82 prose-strong:text-white prose-ul:text-white/78 prose-ol:text-white/78 prose-li:my-2 prose-li:marker:text-white/28 prose-blockquote:rounded-r-2xl prose-blockquote:border-l-[3px] prose-blockquote:border-l-white/24 prose-blockquote:bg-white/[0.025] prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:text-white/72 prose-code:rounded prose-code:bg-white/[0.05] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.95em] prose-code:text-white prose-pre:rounded-[24px] prose-pre:border prose-pre:border-white/8 prose-pre:bg-[#0a1122] prose-pre:px-6 prose-pre:py-5 prose-img:rounded-[24px] prose-img:border prose-img:border-white/8 prose-img:shadow-[0_12px_40px_rgba(0,0,0,0.18)] ${accentClassName}`}
            >
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || "");
                            if (!inline && match && match[1] === "carousel") {
                                // Extract URLs: cast children to string, split by newline, and remove empty strings
                                const urls = String(children).replace(/\n$/, "").split("\n").map(u => u.trim()).filter(Boolean);
                                return <ImageCarousel images={urls} />;
                            }
                            return (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            );
                        }
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </section>
    );
}

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
                <span className="h-px flex-1 bg-[#2F3D4A]/10" />
                <span className="text-[10px] font-black uppercase tracking-[0.32em] text-[#2F3D4A]/50">Document</span>
                <span className="h-px flex-1 bg-[#2F3D4A]/10" />
            </div>
            <div
                className={`prose max-w-none prose-headings:mb-5 prose-headings:font-black prose-headings:tracking-tight prose-headings:text-[#2F3D4A] prose-h1:mt-0 prose-h1:border-b prose-h1:border-[#2F3D4A]/10 prose-h1:pb-6 prose-h1:text-[clamp(1.9rem,3vw,3rem)] prose-h1:leading-[1.08] prose-h2:mt-16 prose-h2:border-t prose-h2:border-[#2F3D4A]/10 prose-h2:pt-10 prose-h2:text-[1.8rem] prose-h3:mt-10 prose-h3:text-xl prose-p:text-[15px] prose-p:leading-8 prose-p:text-slate-700 prose-strong:text-[#2F3D4A] prose-strong:font-black prose-ul:text-slate-600 prose-ol:text-slate-600 prose-li:my-2 prose-blockquote:rounded-r-2xl prose-blockquote:border-l-[4px] prose-blockquote:border-l-primary prose-blockquote:bg-amber-50 prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:text-slate-700 prose-code:rounded prose-code:bg-amber-100/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.95em] prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-[24px] prose-pre:border-2 prose-pre:border-[#2F3D4A] prose-pre:bg-white prose-pre:shadow-[4px_4px_0px_0px_#2F3D4A] prose-pre:px-6 prose-pre:py-5 prose-img:rounded-[24px] prose-img:border-2 prose-img:border-[#2F3D4A] prose-img:shadow-[4px_4px_0px_0px_#2F3D4A] ${accentClassName}`}
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

"use client";

import { useRef } from "react";

interface MarkdownToolbarProps {
    content: string;
    onChange: (newContent: string) => void;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export default function MarkdownToolbar({ content, onChange, textareaRef }: MarkdownToolbarProps) {

    // Helper to insert text at the current cursor position
    const insertText = (prefix: string, suffix = "") => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const selectedText = content.substring(start, end);
        const newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);

        onChange(newText);

        // Restore focus and cursor position after state updates
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    const tools = [
        { label: "H1", icon: "H1", action: () => insertText("# ", "") },
        { label: "H2", icon: "H2", action: () => insertText("## ", "") },
        { label: "H3", icon: "H3", action: () => insertText("### ", "") },
        { label: "Bold", icon: "B", action: () => insertText("**", "**") },
        { label: "Italic", icon: "I", action: () => insertText("*", "*") },
        { label: "Quote", icon: "”", action: () => insertText("> ", "") },
        { label: "Code", icon: "</>", action: () => insertText("```\n", "\n```") },
        { label: "Link", icon: "🔗", action: () => insertText("[", "](url)") },
        { label: "Image", icon: "🖼️", action: () => insertText("![alt](", ")") },
        {
            label: "Carousel",
            icon: "🎠 슬라이드",
            action: () => insertText("```carousel\nhttps://example.com/image1.jpg\nhttps://example.com/image2.jpg\n```\n", "")
        },
        {
            label: "Toggle",
            icon: "🔽 토글",
            action: () => insertText("<details>\n<summary>📌 제목을 입력하세요</summary>\n\n여기에 상세 내용을 입력하세요.\n</details>\n", "")
        },
    ];

    return (
        <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide gap-2 mb-3 bg-secondary/20 p-2 rounded-xl border border-border">
            {tools.map((tool) => (
                <button
                    key={tool.label}
                    type="button"
                    title={tool.label}
                    onClick={tool.action}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-lg transition-colors border border-transparent hover:border-border/50"
                >
                    {tool.icon}
                </button>
            ))}
        </div>
    );
}

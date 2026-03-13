"use client";

import { useState } from "react";
import UploadHomework from "./UploadHomework";

interface CourseSubmissionTriggerProps {
    weekId: number;
}

export default function CourseSubmissionTrigger({ weekId }: CourseSubmissionTriggerProps) {
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    return (
        <>
            <div className="flex items-center gap-4">
                <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[11px] font-black tracking-widest uppercase border border-primary/20">
                    Week {weekId}
                </span>
                <button
                    onClick={() => setIsUploadOpen(true)}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                    📁 과제 제출하기
                </button>
            </div>

            {/* Desktop Sidebar Button (Optional, but we use it in page.tsx as well) */}
            {/* Note: In a real app we might want to export the button and modal separately, 
                but for simplicity we'll handle states here. */}

            <UploadHomework 
                weekId={weekId} 
                isOpen={isUploadOpen} 
                onClose={() => setIsUploadOpen(false)} 
            />
        </>
    );
}

export function SidebarSubmitButton({ weekId }: { weekId: number }) {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    return (
        <>
            <button
                onClick={() => setIsUploadOpen(true)}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
            >
                지금 제출하기
            </button>
            <UploadHomework 
                weekId={weekId} 
                isOpen={isUploadOpen} 
                onClose={() => setIsUploadOpen(false)} 
            />
        </>
    );
}

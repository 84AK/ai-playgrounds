"use client";

interface PoseSubmissionTriggerProps {
    weekId: number;
}

export default function PoseSubmissionTrigger({ weekId }: PoseSubmissionTriggerProps) {
    const scrollToSubmission = () => {
        const section = document.getElementById('submission-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <span className="hidden md:inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black tracking-widest uppercase border border-blue-100">
                Week {weekId}
            </span>
            <button
                onClick={scrollToSubmission}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-500 transition-all shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
                📁 과제 제출하기
            </button>
        </div>
    );
}

export function PoseSidebarSubmitButton({ weekId }: { weekId: number }) {
    const scrollToSubmission = () => {
        const section = document.getElementById('submission-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <button
            onClick={scrollToSubmission}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-500 transition-all shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]"
        >
            지금 제출하기
        </button>
    );
}

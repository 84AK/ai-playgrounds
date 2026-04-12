"use client";

interface CourseSubmissionTriggerProps {
    track: string;
    weekId: number;
}

export default function CourseSubmissionTrigger({ track, weekId }: CourseSubmissionTriggerProps) {
    const scrollToSubmission = () => {
        const section = document.getElementById('submission-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="flex items-center gap-4">
            <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[11px] font-black tracking-widest uppercase border border-primary/20">
                {track} Week {weekId}
            </span>
            <button
                onClick={scrollToSubmission}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
            >
                📁 과제 제출하기
            </button>
        </div>
    );
}

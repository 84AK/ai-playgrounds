"use client";

import Link from "next/link";
import StudyLabPanel from "@/components/StudyLabPanel";

export default function StudyLabPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-background text-foreground pb-20">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.2),transparent_36%)]" />

            <section className="mx-auto max-w-5xl px-6 pt-16">
                <div className="max-w-3xl">
                    <Link href="/" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                        ← 홈으로 돌아가기
                    </Link>
                    <p className="mt-8 text-[11px] font-black uppercase tracking-[0.4em] text-primary/70">Student Dashboard</p>
                    <div className="mt-5 flex items-start gap-4">
                        <div className="mt-1 h-16 w-1 rounded-full bg-gradient-to-b from-primary via-primary/40 to-transparent" />
                        <div>
                            <h1 className="text-[clamp(2.2rem,4vw,4.25rem)] font-black tracking-tight text-[#2F3D4A]">
                                My Study Lab
                            </h1>
                            <p className="mt-4 max-w-2xl text-[15px] leading-8 text-slate-600 font-medium">
                                지금까지의 학습 진행도를 확인하고, 원하는 주차를 눌러 바로 해당 코스 페이지로 이동할 수 있는 개인 학습 대시보드입니다.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-14 max-w-4xl">
                    <StudyLabPanel />
                </div>
            </section>
        </div>
    );
}

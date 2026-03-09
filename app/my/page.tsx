"use client";

import Link from "next/link";
import useLocalProfile, { clearLocalProfile } from "@/hooks/useLocalProfile";
import MyProfileEditor from "@/components/MyProfileEditor";
import HomeworkDashboard from "@/components/HomeworkDashboard";

export default function MyPage() {
    const profile = useLocalProfile();

    const handleLogout = () => {
        if (confirm("정말 로그아웃 하시겠습니까?")) {
            clearLocalProfile();
            window.location.href = "/";
        }
    };

    if (!profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-4xl animate-bounce">
                    🔒
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black">로그인이 필요합니다</h2>
                    <p className="text-muted-foreground font-medium">먼저 홈 화면에서 닉네임을 등록하고 연구소에 입장해주세요.</p>
                </div>
                <Link
                    href="/"
                    className="px-8 py-3 bg-primary text-white rounded-xl font-black text-sm hover:shadow-lg hover:shadow-primary/30 transition-all"
                >
                    홈으로 가기
                </Link>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-background text-foreground pb-20">
            {/* Background Decorative Gradient */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(circle_at_top_right,rgba(var(--primary),0.15),transparent_50%)]" />

            <section className="mx-auto max-w-6xl px-6 pt-16 relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-4">
                        <Link href="/" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors group">
                            <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> 홈으로 돌아가기
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-4xl shadow-2xl shadow-primary/20 border border-white/10 shrink-0">
                                {profile.avatar}
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary/70 mb-1">Researcher Dashboard</p>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-2">
                                    {profile.name} <span className="text-lg md:text-xl font-medium text-white/40 italic">연구원님</span>
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-8">
                    {/* Sidebar: Profile Editor */}
                    <div className="space-y-8">
                        <div className="bento-item p-6 bg-primary/5 border-primary/20">
                            <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2 italic">Status</h4>
                            <p className="text-lg font-bold leading-relaxed">
                                {profile.school} 소속으로 <br />
                                성실히 연구를 수행 중입니다.
                            </p>
                        </div>
                        <MyProfileEditor initialProfile={profile} />

                        <button
                            onClick={handleLogout}
                            className="w-full py-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl font-black hover:bg-destructive hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            🚪 연구소 로그아웃
                        </button>
                    </div>

                    {/* Main: Homework dashboard */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black tracking-tight italic">📁 나의 과제 현황</h3>
                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                Live Sync
                            </div>
                        </div>

                        <div className="p-1 rounded-[30px] bg-gradient-to-br from-white/5 to-transparent border border-white/5">
                            <HomeworkDashboard nickname={profile.name} />
                        </div>

                        <div className="bento-item p-10 bg-secondary/5 border-white/5 flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-2xl border border-blue-500/20">
                                💡
                            </div>
                            <div className="max-w-md space-y-2">
                                <h4 className="text-xl font-black">더 높은 곳을 향해!</h4>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    모든 과제를 완료하면 나만의 멋진 포트폴리오가 완성됩니다. <br />
                                    어려운 부분은 언제든 수업 가이드를 참고하세요.
                                </p>
                            </div>
                            <Link
                                href="/curriculum"
                                className="px-8 py-3 border border-white/10 rounded-xl font-bold text-xs hover:bg-white/5 transition-all"
                            >
                                커리큘럼 전체 보기
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

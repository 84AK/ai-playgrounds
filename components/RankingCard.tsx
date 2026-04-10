"use client";

import { StudentRanking } from "@/lib/rankingService";
import { motion } from "framer-motion";

interface RankingCardProps {
    ranking: StudentRanking;
    rank: number;
}

export function RankingCard({ ranking, rank }: RankingCardProps) {
    const getRankIcon = (r: number) => {
        if (r === 1) return "🥇";
        if (r === 2) return "🥈";
        if (r === 3) return "🥉";
        return r;
    };

    const getRankColor = (r: number) => {
        if (r === 1) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
        if (r === 2) return "text-slate-400 bg-slate-400/10 border-slate-400/20";
        if (r === 3) return "text-orange-500 bg-orange-500/10 border-orange-500/20";
        return "text-slate-400 bg-slate-50 border-slate-100";
    };

    const mbtiProgress = ranking.mbtiProgress || [];
    const poseProgress = ranking.poseProgress || [];

    const totalHomeworks = mbtiProgress.length + poseProgress.length;
    const submittedCount = [...mbtiProgress, ...poseProgress].filter(
        (s) => s === true || (s as any) === "TRUE"
    ).length;
    const progressPercent = totalHomeworks > 0 ? (submittedCount / totalHomeworks) * 100 : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="group flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all"
        >
            <div className={`w-12 h-12 flex items-center justify-center rounded-xl font-black text-lg border-2 ${getRankColor(rank)}`}>
                {getRankIcon(rank)}
            </div>

            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 flex items-center justify-center text-2xl ${ranking.avatar && !ranking.avatar.startsWith('http') ? 'bg-slate-50' : 'bg-slate-100'}`}>
                {ranking.avatar ? (
                    ranking.avatar.startsWith('http') ? (
                        <img src={ranking.avatar} alt={ranking.name} className="w-full h-full object-cover" />
                    ) : (
                        <span>{ranking.avatar}</span>
                    )
                ) : (
                    <span className="text-xl">👤</span>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-black text-[#2F3D4A] truncate">{ranking.name}</h3>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                            {ranking.grade && ranking.classGroup && ranking.grade.toString().trim() !== "" && ranking.classGroup.toString().trim() !== "" 
                                ? `${ranking.grade}학년 ${ranking.classGroup}반` 
                                : "소속 정보 미입력"}
                        </span>
                    </div>
                </div>

                {/* Submission Matrix */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mb-3">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter w-8">MBTI</span>
                        <div className="flex gap-1">
                            {ranking.mbtiProgress.map((submitted, i) => (
                                <div 
                                    key={i}
                                    title={`MBTI ${i + 1}주차: ${submitted ? '제출' : '미제출'}`}
                                    className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[8px] font-black border ${
                                        submitted 
                                        ? 'bg-primary border-primary text-white' 
                                        : 'bg-white border-slate-200 text-slate-300'
                                    }`}
                                >
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter w-8">POSE</span>
                        <div className="flex gap-1">
                            {ranking.poseProgress.map((submitted, i) => (
                                <div 
                                    key={i}
                                    title={`POSE ${i+1}주차: ${submitted ? '제출' : '미제출'}`}
                                    className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[8px] font-black border ${
                                        submitted 
                                        ? 'bg-sky-500 border-sky-500 text-white' 
                                        : 'bg-white border-slate-200 text-slate-300'
                                    }`}
                                >
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            className="h-full bg-primary"
                        />
                    </div>
                    <span className="text-[10px] font-black text-slate-400">{submittedCount}/{totalHomeworks}</span>
                </div>
            </div>

            <div className="text-right">
                <div className="text-xl font-black text-primary">{ranking.points}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Points</div>
            </div>
        </motion.div>
    );
}

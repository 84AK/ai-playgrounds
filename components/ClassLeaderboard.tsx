"use client";

import { ClassRanking } from "@/lib/rankingService";
import { motion } from "framer-motion";

interface ClassLeaderboardProps {
    rankings: ClassRanking[];
}

export function ClassLeaderboard({ rankings }: ClassLeaderboardProps) {
    if (rankings.length === 0) return null;

    return (
        <div className="space-y-4">
            {rankings.map((rk, idx) => (
                <motion.div
                    key={rk.classGroup}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative p-6 rounded-3xl bg-secondary/20 border border-white/5 overflow-hidden group"
                >
                    {/* Background Accent */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-colors" />
                    
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-black text-primary mb-1">RANK</span>
                            <span className="text-3xl font-black text-[#2F3D4A]">{idx + 1}</span>
                        </div>
                        
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-[#2F3D4A] tracking-tight">{rk.classGroup}</h3>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average</span>
                                    <span className="text-sm font-black text-slate-600">{rk.averagePoints} pts</span>
                                </div>
                                <div className="w-px h-6 bg-slate-200" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Students</span>
                                    <span className="text-sm font-black text-slate-600">{rk.studentCount}명</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-3xl font-black text-primary">{rk.totalPoints}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Points</div>
                        </div>
                    </div>

                    {/* Simple Progress Bar for context */}
                    <div className="mt-4 w-full h-1.5 bg-background/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(rk.averagePoints / 80) * 100}%` }}
                            className="h-full bg-gradient-to-r from-primary to-blue-500"
                        />
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

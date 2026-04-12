"use client";

import { useState, useEffect } from "react";
import { fetchRankingData, calculateClassRankings, StudentRanking, ClassRanking } from "@/lib/rankingService";
import { RankingCard } from "@/components/RankingCard";
import { ClassLeaderboard } from "@/components/ClassLeaderboard";
import { motion, AnimatePresence } from "framer-motion";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function RankingPage() {
    const [students, setStudents] = useState<StudentRanking[]>([]);
    const [classRankings, setClassRankings] = useState<ClassRanking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"individual" | "class">("individual");
    const [selectedClass, setSelectedClass] = useState("전체");

    const loadData = async () => {
        setIsLoading(true);
        const data = await fetchRankingData();
        setStudents(data);
        setClassRankings(calculateClassRankings(data));
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const formatClassGroup = (s: StudentRanking) => {
        if (!s.grade || !s.classGroup || s.grade.toString().trim() === "" || s.classGroup.toString().trim() === "") {
            return "소속 미입력";
        }
        return `${s.grade}학년 ${s.classGroup}반`.trim();
    };

    const classes = ["전체", ...Array.from(new Set(students.map(formatClassGroup))).sort()];
    
    const filteredStudents = students.filter(s => {
        const className = formatClassGroup(s);
        return selectedClass === "전체" || className === selectedClass;
    });

    const top3 = students.slice(0, 3);
    const rest = filteredStudents;

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-6">
            <LoadingOverlay isVisible={isLoading} message="실시간 랭킹 데이터를 집계하고 있습니다..." />

            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-5xl font-black text-[#2F3D4A] tracking-tighter">
                            🏆 HALL OF FAME
                        </h1>
                        <p className="text-slate-500 font-medium mt-3 text-lg">
                            우리 반의 자존심! 과제 제출 랭킹 시스템
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3"
                    >
                        <button
                            onClick={loadData}
                            disabled={isLoading}
                            className="p-3 bg-white hover:bg-slate-50 transition-colors border-2 border-slate-100 rounded-2xl shadow-sm flex items-center justify-center text-slate-400 hover:text-primary active:scale-95 disabled:opacity-50"
                            title="데이터 새로고침"
                        >
                            <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>

                        <div className="flex p-1.5 bg-white rounded-2xl border-2 border-slate-100 shadow-sm">
                        {(["individual", "class"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${
                                    activeTab === tab 
                                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                    : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                {tab === "individual" ? "개인별 순위" : "반별 대항전"}
                            </button>
                        ))}
                        </div>
                    </motion.div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "individual" ? (
                        <motion.div
                            key="individual"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                        >
                            {/* Podium (Top 3) */}
                            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                                {top3.map((student, idx) => (
                                    <motion.div
                                        key={student.name}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`relative p-8 rounded-[40px] border-4 overflow-hidden shadow-2xl ${
                                            idx === 0 ? "bg-amber-500 border-amber-400 md:scale-105 z-10" : 
                                            idx === 1 ? "bg-slate-400 border-slate-300" : "bg-orange-500 border-orange-400"
                                        }`}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent" />
                                        <div className="relative z-10 flex flex-col items-center text-center text-white">
                                            <div className="text-sm font-black uppercase tracking-widest opacity-80 mb-2">
                                                {idx === 0 ? "1st Place" : idx === 1 ? "2nd Place" : "3rd Place"}
                                            </div>
                                            <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden mb-4 flex items-center justify-center bg-white/20 text-4xl">
                                                {student.avatar ? (
                                                    student.avatar.startsWith('http') ? (
                                                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{student.avatar}</span>
                                                    )
                                                ) : (
                                                    <span>👤</span>
                                                )}
                                            </div>
                                            <h2 className="text-2xl font-black">{student.name}</h2>
                                            <p className="text-sm font-bold opacity-80">{student.grade}학년 {student.classGroup}반</p>
                                            <div className="mt-6 flex items-baseline gap-1">
                                                <span className="text-5xl font-black">{student.points}</span>
                                                <span className="text-xs font-bold uppercase">Points</span>
                                            </div>
                                        </div>
                                        {/* Rank Badge */}
                                        <div className="absolute -bottom-4 -right-4 text-9xl font-black text-white/10 italic">
                                            {idx + 1}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Filters & List */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="p-8 rounded-[32px] bg-white border-2 border-slate-100 shadow-sm sticky top-32">
                                    <h3 className="text-xl font-black text-[#2F3D4A] mb-6">🎯 Filter by Class</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {classes.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setSelectedClass(c)}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                                    selectedClass === c 
                                                    ? "bg-primary text-white shadow-lg shadow-primary/10" 
                                                    : "bg-slate-50 border-2 border-slate-100 text-slate-400 hover:border-slate-300"
                                                }`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="mt-12 p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Ranking Info</h4>
                                        <ul className="space-y-3">
                                            <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                                <span className="w-6 h-6 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
                                                과제 1건당 10점 지급
                                            </li>
                                            <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs">✓</span>
                                                12주차 모두 제출 시 명예의 전당
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-8 space-y-4">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black text-[#2F3D4A]">
                                        {selectedClass === "전체" ? "전체 학생 랭킹" : `${selectedClass} 랭킹`}
                                    </h3>
                                    <span className="px-3 py-1 bg-white border-2 border-slate-100 rounded-full text-xs font-bold text-slate-400">
                                        Total {filteredStudents.length} Students
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {rest.map((student, idx) => (
                                        <RankingCard key={student.name} ranking={student} rank={students.findIndex(s => s.name === student.name) + 1} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="class"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="text-center mb-12">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl text-4xl mb-6">🏢</div>
                                <h2 className="text-3xl font-black text-[#2F3D4A]">반별 대항전 리더보드</h2>
                                <p className="text-slate-500 font-medium mt-2">반 전체 평균 점수로 계산된 우리 반의 위상입니다.</p>
                            </div>
                            <ClassLeaderboard rankings={classRankings} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AdminCourseEditorPanel from "@/components/AdminCourseEditorPanel";
import { type CourseStructureItem } from "@/lib/courseContent";
import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useBackendStatus from "@/hooks/useBackendStatus";

function normalizeWeek(value: string | null): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export default function AdminCoursePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const track = searchParams.get("track") || "MBTI";
    const weekId = normalizeWeek(searchParams.get("week"));

    const [structure, setStructure] = useState<CourseStructureItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const { isCustom, getTrackName, trackNames } = useBackendStatus();

    // Registration Form State
    const [regTrack, setRegTrack] = useState("");
    const [regWeek, setRegWeek] = useState(1);
    const [regTitle, setRegTitle] = useState("");

    const trackContainerRef = useRef<HTMLDivElement>(null);
    const weekContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchStructure = async () => {
            try {
                const res = await fetch("/api/course/structure");
                const result = await res.json();
                if (result.success) setStructure(result.data);
            } catch (err) {
                console.error("Failed to load structure", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStructure();
    }, []);

    const tracks = useMemo(() => {
        const unique = Array.from(new Set(structure.map(s => s.track)));
        if (unique.length === 0) return ["MBTI", "POSE"];
        return unique;
    }, [structure]);

    const weeks = useMemo(() => {
        const filtered = structure
            .filter(s => s.track.toUpperCase() === track.toUpperCase())
            .map(s => s.week)
            .sort((a,b) => a - b);
        if (filtered.length === 0) return Array.from({ length: 12 }, (_, i) => i + 1);
        return filtered;
    }, [structure, track]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/course/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ track: regTrack, weekId: regWeek, title: regTitle, content: `# ${regTitle}\n\n새로운 수업 내용을 입력해 주세요.` })
            });
            if (res.ok) {
                alert("새 주차가 등록되었습니다.");
                router.push(`/admin/course?track=${regTrack}&week=${regWeek}`);
            }
        } catch (err) { alert("등록 실패"); }
    };

    const handleRenameTrack = (originalName: string) => {
        if (!isCustom) {
            alert("⚠️ 트랙 이름 변경은 '개인 연구소(환경 설정)'가 연결된 상태에서만 가능합니다.");
            return;
        }

        const currentName = getTrackName(originalName);
        const newName = prompt(`'${currentName}' 트랙의 새로운 이름을 입력하세요:`, currentName);
        
        if (newName && newName !== currentName) {
            const updatedNames = { ...trackNames, [originalName]: newName };
            const expires = new Date();
            expires.setFullYear(expires.getFullYear() + 1);
            
            document.cookie = `custom_track_names=${encodeURIComponent(JSON.stringify(updatedNames))}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
            
            // 전역 이벤트 발생 (훅 트리거)
            window.dispatchEvent(new CustomEvent("backend:changed"));
            alert("✨ 트랙 이름이 변경되었습니다!");
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFAEF] px-6 py-12 text-[#2F3D4A] font-sans">
            <div className="mx-auto max-w-7xl space-y-10">
                
                {/* Dashboard Navigation Header */}
                <div className="flex items-center justify-between bg-white border-4 border-[#2F3D4A] rounded-3xl p-5 shadow-[6px_6px_0px_0px_#2F3D4A]">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.push("/admin")}
                            className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-sm border-2 border-[#2F3D4A] hover:scale-110 transition-transform"
                        >
                            🏠
                        </button>
                        <div>
                            <h2 className="text-xl font-black italic tracking-tighter">Admin <span className="text-primary tracking-normal">Course Center</span></h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`w-2 h-2 rounded-full ${isCustom ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {isCustom ? "Working on Custom Sheet" : "Default Database Mode"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/admin/setup" className="px-4 py-2 bg-[#E0F2FE] border-2 border-[#2F3D4A] rounded-xl text-xs font-black text-sky-600 shadow-[2px_2px_0px_0px_#2F3D4A] hover:translate-y-[-2px] transition-all">
                            ⚙️ 환경 설정
                        </Link>
                        <button onClick={() => window.location.href="/"} className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:text-primary transition-colors">
                            나가기
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Sidebar Area: Structure Selection */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white border-4 border-[#2F3D4A] rounded-[32px] p-6 shadow-[8px_8px_0px_0px_#2F3D4A] space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 pl-1">Tracks</h3>
                                <div className="flex flex-col gap-2">
                                    {tracks.map((item) => (
                                        <div key={item} className="relative group/track">
                                            <Link
                                                href={`/admin/course?track=${item}&week=${weekId}`}
                                                className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl font-black text-sm border-2 transition-all ${
                                                    item.toUpperCase() === track.toUpperCase()
                                                        ? "bg-primary text-white border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] translate-y-[-2px]"
                                                        : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                                                }`}
                                            >
                                                <span>{getTrackName(item)}</span>
                                            </Link>
                                            
                                            {/* Rename Button (Small Pencil Icon) */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRenameTrack(item);
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/20 hover:bg-white/40 rounded-lg flex items-center justify-center opacity-0 group-hover/track:opacity-100 transition-opacity"
                                                title="트랙 이름 변경"
                                            >
                                                <svg className={`w-3.5 h-3.5 ${item.toUpperCase() === track.toUpperCase() ? "text-white" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => {
                                            setRegTrack("");
                                            setRegWeek(1);
                                            setRegTitle("");
                                            setIsRegistering(true);
                                        }}
                                        className="w-full mt-2 py-3 bg-white border-2 border-dashed border-slate-300 rounded-2xl text-[10px] font-black text-slate-400 hover:border-primary hover:text-primary transition-all uppercase tracking-widest"
                                    >
                                        + 새로운 트랙 추가
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 pl-1">Weeks</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {weeks.map((item) => (
                                        <Link
                                            key={item}
                                            href={`/admin/course?track=${track}&week=${item}`}
                                            className={`px-3 py-3 rounded-xl font-black text-xs text-center border-2 transition-all ${
                                                item === weekId
                                                    ? "bg-primary text-white border-[#2F3D4A] shadow-[3px_3px_0px_0px_#2F3D4A] translate-y-[-1px]"
                                                    : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                                            }`}
                                        >
                                            {item}주차
                                        </Link>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => {
                                        setRegTrack(track);
                                        setRegWeek(weeks.length > 0 ? Math.max(...weeks) + 1 : 1);
                                        setRegTitle("");
                                        setIsRegistering(true);
                                    }}
                                    className="w-full mt-4 py-3 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl text-[10px] font-black text-slate-400 hover:border-primary hover:text-primary transition-all"
                                >
                                    + {track} 주차 추가
                                </button>
                            </div>
                        </div>

                        {isRegistering && (
                            <motion.form 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onSubmit={handleRegister} 
                                className="bg-white border-4 border-primary rounded-[32px] p-6 shadow-[8px_8px_0px_0px_#2F3D4A] space-y-4"
                            >
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-primary uppercase">Track</label>
                                    <input value={regTrack} onChange={e=>setRegTrack(e.target.value)} placeholder="MBTI" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm focus:border-primary outline-none" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-primary uppercase">Week No.</label>
                                    <input type="number" value={regWeek} onChange={e=>setRegWeek(Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm focus:border-primary outline-none" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-primary uppercase">Title</label>
                                    <input value={regTitle} onChange={e=>setRegTitle(e.target.value)} placeholder="Lesson Title" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm focus:border-primary outline-none" required />
                                </div>
                                <button type="submit" className="w-full bg-primary text-white rounded-xl py-3 text-sm font-black shadow-[4px_4px_0px_0px_#2F3D4A] active:translate-y-[2px]">등록 완료</button>
                            </motion.form>
                        )}
                    </div>

                    {/* Main Content Area: Editor */}
                    <div className="lg:col-span-3">
                        <div className="bg-white border-4 border-[#2F3D4A] rounded-[40px] shadow-[12px_12px_0px_0px_#2F3D4A] min-h-[600px] overflow-hidden">
                            <AdminCourseEditorPanel
                                key={`${track}-${weekId}`}
                                track={track}
                                weekId={weekId}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

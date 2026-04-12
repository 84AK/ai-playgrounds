"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPage() {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    // 초기 로드 시 세션 확인 (기본적인 클라이언트 체크)
    useEffect(() => {
        const checkSession = async () => {
            try {
                // 특정 관리자 API를 호출하여 세션 유효성 확인 가능
                // 여기서는 간단하게 로컬 스토리지나 쿠키 상태를 시뮬레이션 할 수 있음
                // 실제 보안은 API Route의 httpOnly 쿠키가 담당함
            } catch (err) {}
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!password) {
            setError("비밀번호를 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const result = await res.json();

            if (res.ok && result.success) {
                setIsLoggedIn(true);
            } else {
                setError(result.error || "로그인 실패");
                setLoading(false);
            }
        } catch (err) {
            setError("서버 통신 중 오류가 발생했습니다.");
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        // 실제 운영 환경에서는 쿠키를 삭제하는 API 호출 필요
        setIsLoggedIn(false);
        setPassword("");
        setLoading(false);
    };

    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{count: number} | null>(null);

    const handleSyncDrive = async () => {
        if (!confirm("드라이브의 모든 파일을 스캔하여 시트와 동기화하시겠습니까?\n파일이 많을 경우 시간이 다소 걸릴 수 있습니다.")) return;
        
        setIsScanning(true);
        setScanResult(null);
        try {
            const res = await fetch("/api/proxy-apps-script", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    action: "syncDriveToSheet",
                    password: password // 관리자 비밀번호 검증용
                })
            });
            const result = await res.json();
            if (result.success || result.status === "success") {
                setScanResult({ count: result.count || 0 });
                alert(`동기화 완료! 총 ${result.count || 0}개의 파일을 찾아 시트에 업데이트했습니다.`);
            } else {
                alert("동기화 중 오류가 발생했습니다: " + (result.error || result.message));
            }
        } catch (err) {
            alert("서버 통신 실패");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFAEF] text-[#2F3D4A] flex items-center justify-center p-6 font-sans">
            <AnimatePresence mode="wait">
                {!isLoggedIn ? (
                    <motion.div 
                        key="login"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="max-w-md w-full p-10 border-4 border-[#2F3D4A] rounded-[40px] bg-white shadow-[12px_12px_0px_0px_#2F3D4A]"
                    >
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-white text-2xl font-black mb-6 mx-auto shadow-lg rotate-3 border-2 border-[#2F3D4A]">
                                AD
                            </div>
                            <h1 className="text-3xl font-black tracking-tight mb-3">관리자 로그인</h1>
                            <p className="text-sm font-bold text-slate-400">시스템 설정을 위해 인증이 필요합니다.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 pl-1" htmlFor="password">
                                    ADMIN PASSWORD
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-6 py-4 bg-[#F8FAFC] border-3 border-[#2F3D4A] rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-primary/20 outline-none transition-all pr-14"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors p-2"
                                    >
                                        {showPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <motion.p 
                                    initial={{ x: -10 }}
                                    animate={{ x: 0 }}
                                    className="text-sm text-red-500 font-black pl-1"
                                >
                                    ⚠️ {error}
                                </motion.p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-primary text-white font-black text-lg rounded-2xl border-4 border-[#2F3D4A] shadow-[6px_6px_0px_0px_#2F3D4A] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_0px_#2F3D4A] active:translate-y-[2px] transition-all disabled:opacity-50"
                            >
                                {loading ? "인증 중..." : "시스템 입장하기"}
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="dashboard"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl w-full"
                    >
                        <div className="flex flex-col md:flex-row items-end justify-between mb-10 gap-4">
                            <div>
                                <h2 className="text-4xl font-black tracking-tight text-[#2F3D4A]">Admin Center</h2>
                                <p className="text-lg font-bold text-slate-400 mt-2">반갑습니다, 관리자님! 수행할 작업을 선택하세요.</p>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="px-6 py-3 bg-white border-3 border-[#2F3D4A] rounded-xl font-black text-sm shadow-[4px_4px_0px_0px_#2F3D4A] hover:bg-slate-50 transition-all active:translate-y-[2px]"
                            >
                                로그아웃
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* 설정 센터 카드 */}
                            <motion.button
                                onClick={() => router.push("/admin/setup")}
                                whileHover={{ y: -8 }}
                                className="group relative bg-[#E0F2FE] border-4 border-[#2F3D4A] rounded-[40px] p-10 text-left shadow-[12px_12px_0px_0px_#2F3D4A] overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 text-6xl opacity-20 group-hover:scale-125 transition-transform duration-500">⚙️</div>
                                <div className="relative z-10">
                                    <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center text-white text-2xl mb-8 border-2 border-[#2F3D4A] group-hover:rotate-12 transition-transform">
                                        🛠️
                                    </div>
                                    <h3 className="text-2xl font-black text-[#2F3D4A] mb-4">선생님 설정 센터</h3>
                                    <p className="text-sky-900/60 font-bold leading-relaxed mb-8">
                                        나만의 구글 시트와 드라이브를 연동하고,<br/>
                                        학생 배포용 매직 링크를 생성합니다.
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-sky-600 font-extrabold group-hover:gap-4 transition-all">
                                        환경 설정 그룹으로 이동 <span className="text-xl">→</span>
                                    </div>
                                </div>
                            </motion.button>

                            {/* 코스 관리 카드 */}
                            <motion.button
                                onClick={() => router.push("/admin/course")}
                                whileHover={{ y: -8 }}
                                className="group relative bg-[#F0FDFA] border-4 border-[#2F3D4A] rounded-[40px] p-10 text-left shadow-[12px_12px_0px_0px_#2F3D4A] overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 text-6xl opacity-20 group-hover:scale-125 transition-transform duration-500">📚</div>
                                <div className="relative z-10">
                                    <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl mb-8 border-2 border-[#2F3D4A] group-hover:-rotate-12 transition-transform">
                                        ✍️
                                    </div>
                                    <h3 className="text-2xl font-black text-[#2F3D4A] mb-4">교육 과정 및 과제 관리</h3>
                                    <p className="text-emerald-900/60 font-bold leading-relaxed mb-8">
                                        주차별 강의 내용을 커스텀하고,<br/>
                                        제출된 학생들의 과제를 모니터링합니다.
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-emerald-600 font-extrabold group-hover:gap-4 transition-all">
                                        수업 운영 도구로 이동 <span className="text-xl">→</span>
                                    </div>
                                </div>
                            </motion.button>
                        </div>

                        {/* [NEW] v7.5 전수 조사 도구 */}
                        <div className="mt-12 bg-white border-4 border-[#2F3D4A] rounded-[40px] p-8 shadow-[8px_8px_0px_0px_#2F3D4A] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center text-3xl border-2 border-[#2F3D4A]">
                                    🔍
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-[#2F3D4A]">드라이브 마스터 리콘(Recon)</h3>
                                    <p className="text-sm font-bold text-slate-400 mt-1">드라이브의 실제 파일들과 시트의 기록을 1:1로 일치시킵니다.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSyncDrive}
                                disabled={isScanning}
                                className={`px-8 py-4 bg-amber-400 text-[#2F3D4A] font-black rounded-2xl border-4 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] transition-all hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_#2F3D4A] active:translate-y-[1px] disabled:opacity-50 disabled:grayscale ${isScanning ? 'animate-pulse' : ''}`}
                            >
                                {isScanning ? "🔎 전수 조사 중..." : "지금 동기화 시작"}
                            </button>
                            {isScanning && (
                                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Scanning Drive Structure...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-12 p-8 bg-white border-4 border-[#2F3D4A] rounded-[32px] shadow-[6px_6px_0px_0px_#2F3D4A] flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">💡</span>
                                <p className="text-sm font-bold text-slate-500">
                                    개별 백엔드를 설정하지 않으면 시스템 기본(데모) 환경으로 연결됩니다.
                                </p>
                            </div>
                            <div className="px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 tracking-widest border-2 border-slate-200">
                                MULTI-TENANT MODE ACTIVE
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

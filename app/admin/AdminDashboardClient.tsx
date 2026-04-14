"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface AdminDashboardClientProps {
    initialTeacherName?: string;
    initialIsLoggedIn?: boolean;
    initialIsCustom?: boolean;
}

export default function AdminDashboardClient({ 
    initialTeacherName = "", 
    initialIsLoggedIn = false,
    initialIsCustom = false
}: AdminDashboardClientProps) {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
    const [teacherName, setTeacherName] = useState(""); // 현재 로그인한 관리자 이름
    const [isCustom, setIsCustom] = useState(initialIsCustom);
    const [isRequestMode, setIsRequestMode] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);
    const router = useRouter();

    // 초기 로드 시 커스텀 상태 및 로그인 정보 확인
    useEffect(() => {
        const cookies = document.cookie.split("; ");
        const gsUrl = cookies.find(row => row.startsWith("custom_gs_url="));
        if (gsUrl && gsUrl.split("=")[1]) {
            setIsCustom(true);
        }

        const adminName = cookies.find(row => row.startsWith("admin_name="));
        if (adminName) {
            const decodedName = decodeURIComponent(adminName.split("=")[1]);
            setTeacherName(decodedName);
            // [NEW] 관리자 성함을 연구소 성함 쿠키와 동기화 (UI 일관성)
            const expires = new Date();
            expires.setFullYear(expires.getFullYear() + 1);
            document.cookie = `custom_teacher_name=${encodeURIComponent(decodedName)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
        } else {
            const legacyName = cookies.find(row => row.startsWith("custom_teacher_name="));
            if (legacyName) setTeacherName(decodeURIComponent(legacyName.split("=")[1]));
        }
    }, [isLoggedIn]);

    const handleReset = async () => {
        if (!confirm("모든 커스텀 설정을 초기화하고 시스템 기본(Demo) 환경으로 돌아가시겠습니까?")) return;
        
        try {
            const res = await fetch("/api/admin/reset-settings", { method: "POST" });
            if (res.ok) {
                alert("기본 설정으로 복구되었습니다. 페이지를 새로고침합니다.");
                window.location.href = "/admin"; // 강제 리다이렉트 및 새로고침
            } else {
                alert("초기화 중 오류가 발생했습니다.");
            }
        } catch (err) {
            alert("서버 통신 실패");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name) {
            setError("이름을 입력해주세요.");
            return;
        }
        if (!password) {
            setError("비밀번호를 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, password }),
            });
            const result = await res.json();

            if (res.ok && result.success) {
                if (result.setupRequired) {
                    alert("✨ 첫 관리자 등록이 완료되었습니다! (Super Admin)");
                }
                setIsLoggedIn(true);
                router.refresh();
            } else {
                setError(result.error || "로그인 실패");
                setLoading(false);
            }
        } catch (err) {
            setError("서버 통신 중 오류가 발생했습니다.");
            setLoading(false);
        }
    };

    const handleRequestAccess = async () => {
        if (!name) {
            setError("신청하실 성함을 입력해주세요.");
            return;
        }
        
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/request-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            const result = await res.json();
            
            if (res.ok && result.success) {
                setRequestSuccess(true);
                alert("✅ 관리자 권한 신청이 완료되었습니다!\nSuper Admin의 승인 후 입장이 가능합니다.");
            } else {
                setError(result.error || "신청 중 오류가 발생했습니다.");
            }
        } catch (err) {
            setError("서버 통신 실패");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        // 모든 세션 쿠키 삭제
        document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "admin_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "admin_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        setIsLoggedIn(false);
        setName("");
        setPassword("");
        setLoading(false);
        router.refresh();
    };

    const [isScanning, setIsScanning] = useState(false);
    const handleSyncDrive = async () => {
        if (!isLoggedIn) return;
        if (!confirm("드라이브의 모든 파일을 스캔하여 시트와 동기화하시겠습니까?\n파일이 많을 경우 시간이 다소 걸릴 수 있습니다.")) return;
        
        setIsScanning(true);
        try {
            const res = await fetch("/api/proxy-apps-script", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "syncDriveToSheet" })
            });
            const result = await res.json();
            if (result.success || result.status === "success") {
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
                            <h1 className="text-3xl font-black tracking-tight mb-3">
                                {isRequestMode ? "관리자 권한 신청" : "관리자 로그인"}
                            </h1>
                            <p className="text-sm font-bold text-slate-400">
                                {isRequestMode 
                                    ? "동료 교사 권한을 신청하고 승인을 기다립니다." 
                                    : "시스템 설정을 위해 인증이 필요합니다."}
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 pl-1">
                                    ADMIN NAME
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-6 py-4 bg-[#F8FAFC] border-3 border-[#2F3D4A] rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="이름을 입력하세요"
                                    disabled={loading || requestSuccess}
                                />
                            </div>

                            {!isRequestMode && (
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
                                            disabled={loading}
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
                            )}
                            {isCustom && (
                                <div className="p-4 bg-amber-50 border-2 border-amber-500 rounded-2xl flex items-center justify-between gap-3 mb-6">
                                    <span className="text-[10px] font-black text-amber-600 leading-tight">
                                        현재 개인 설정된<br/>환경을 사용 중입니다.
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={handleReset}
                                        className="text-[10px] font-black text-white bg-amber-500 px-3 py-1.5 rounded-lg border-2 border-[#2F3D4A]"
                                    >
                                        원본 복구
                                    </button>
                                </div>
                            )}

                            {error && (
                                <motion.p 
                                    initial={{ x: -10 }}
                                    animate={{ x: 0 }}
                                    className="text-sm text-red-500 font-black pl-1"
                                >
                                    ⚠️ {error}
                                </motion.p>
                            )}

                            {isRequestMode ? (
                                <button
                                    type="button"
                                    onClick={handleRequestAccess}
                                    disabled={loading || requestSuccess}
                                    className="w-full py-5 bg-emerald-500 text-white font-black text-lg rounded-2xl border-4 border-[#2F3D4A] shadow-[6px_6px_0px_0px_#2F3D4A] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_0px_#2F3D4A] active:translate-y-[2px] transition-all disabled:opacity-50"
                                >
                                    {loading ? "신청 중..." : requestSuccess ? "신청 완료됨" : "승인 요청 보내기"}
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full py-5 bg-primary text-white font-black text-lg rounded-2xl border-4 border-[#2F3D4A] shadow-[6px_6px_0px_0px_#2F3D4A] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_0px_#2F3D4A] active:translate-y-[2px] transition-all disabled:opacity-50"
                                >
                                    {loading ? "인증 중..." : "시스템 입장하기"}
                                </button>
                            )}

                            <div className="text-center mt-6">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsRequestMode(!isRequestMode);
                                        setError("");
                                    }}
                                    className="text-xs font-black text-slate-400 hover:text-primary underline underline-offset-4 transition-colors"
                                >
                                    {isRequestMode ? "이미 승인된 관리자가 있으신가요? 로그인하기" : "아직 관리자 권한이 없으신가요? 요청하기"}
                                </button>
                            </div>
                        </div>
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
                                <p className="text-lg font-bold text-slate-400 mt-2">
                                    반갑습니다, {teacherName ? `${teacherName} 선생님` : "관리자님"}! 수행할 작업을 선택하세요.
                                </p>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="px-6 py-3 bg-white border-3 border-[#2F3D4A] rounded-xl font-black text-sm shadow-[4px_4px_0px_0px_#2F3D4A] hover:bg-slate-50 transition-all active:translate-y-[2px]"
                            >
                                로그아웃
                            </button>
                        </div>

                        {/* Connection Status Bar */}
                        <AnimatePresence>
                            {isCustom && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-8 p-4 bg-emerald-50 border-4 border-emerald-500 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-[6px_6px_0px_0px_#10b981]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-xl border-2 border-[#2F3D4A] animate-pulse">
                                            📡
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">CONNECTED TO EXTERNAL SOURCE</p>
                                            <h4 className="text-lg font-black text-[#2F3D4A]">
                                                {teacherName ? `${teacherName} 선생님의 연구소` : "개별 설정된 백엔드 시트"}
                                            </h4>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleReset}
                                        className="px-5 py-2.5 bg-white border-3 border-emerald-500 rounded-xl font-black text-xs text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-[3px_3px_0px_0px_#10b981] active:translate-y-[1px]"
                                    >
                                        기본 시스템으로 복구하기
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                            <motion.button
                                onClick={() => {
                                    if (!isCustom) {
                                        alert("⚠️ 수업을 운영하려면 먼저 '선생님 설정 센터'에서 구글 시트 연동을 완료해야 합니다.");
                                        router.push("/admin/setup");
                                        return;
                                    }
                                    router.push("/admin/course");
                                }}
                                whileHover={{ y: -8 }}
                                className={`group relative ${isCustom ? "bg-[#F0FDFA]" : "bg-slate-100 opacity-80"} border-4 border-[#2F3D4A] rounded-[40px] p-10 text-left shadow-[12px_12px_0px_0px_#2F3D4A] overflow-hidden`}
                            >
                                {!isCustom && <div className="absolute inset-0 bg-white/40 z-20 flex items-center justify-center font-black text-slate-400 rotate-12 text-sm uppercase tracking-widest">Setup Required</div>}
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

                        {/* Sync Tool */}
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

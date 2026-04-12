"use client";

import { useState, useEffect } from "react";
import Link from "next/navigation"; // useRouter 사용 권장
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GAS_TEMPLATE_CODE } from "@/lib/gasTemplate";

export default function TeacherSetupPage() {
    const [gasUrl, setGasUrl] = useState("");
    const [folderId, setFolderId] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<"default" | "custom">("default");
    const router = useRouter();

    useEffect(() => {
        // Load existing values from cookies
        const cookies = document.cookie.split("; ");
        const gsUrlCookie = cookies.find(row => row.startsWith("custom_gs_url="));
        const gdFolderCookie = cookies.find(row => row.startsWith("custom_folder_id="));
        const adminPassCookie = cookies.find(row => row.startsWith("custom_admin_password="));
        
        if (gsUrlCookie && gsUrlCookie.split("=")[1]) {
            setGasUrl(decodeURIComponent(gsUrlCookie.split("=")[1]));
            setCurrentStatus("custom");
        }
        if (gdFolderCookie && gdFolderCookie.split("=")[1]) {
            setFolderId(decodeURIComponent(gdFolderCookie.split("=")[1]));
        }
        if (adminPassCookie && adminPassCookie.split("=")[1]) {
            setAdminPassword(decodeURIComponent(adminPassCookie.split("=")[1]));
        }
    }, []);

    const saveSettings = (url: string, fId: string, pass: string) => {
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);
        document.cookie = `custom_gs_url=${encodeURIComponent(url)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
        document.cookie = `custom_folder_id=${encodeURIComponent(fId)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
        document.cookie = `custom_admin_password=${encodeURIComponent(pass)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
        setIsSaved(true);
        setCurrentStatus(url ? "custom" : "default");
        setTimeout(() => setIsSaved(false), 3000);
    };

    const handleReset = () => {
        if (!confirm("모든 설정을 초기화하고 시스템 기본 백엔드로 돌아가시겠습니까?")) return;
        document.cookie = "custom_gs_url=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "custom_folder_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "custom_admin_password=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        setGasUrl("");
        setFolderId("");
        setAdminPassword("");
        setCurrentStatus("default");
        alert("설정이 초기화되었습니다.");
        router.refresh();
    };

    const handleTestConnection = async () => {
        if (!gasUrl) return;
        
        let targetUrl = gasUrl.trim();
        
        // URL 유효성 검사: /exec 누락 확인
        if (!targetUrl.endsWith("/exec")) {
            if (confirm("입력하신 URL이 '/exec'로 끝나지 않습니다. 자동으로 추가하여 테스트할까요?\n\n(구글 앱스스크립트 배포 URL은 반드시 /exec로 끝나야 합니다)")) {
                targetUrl = targetUrl.endsWith("/") ? targetUrl + "exec" : targetUrl + "/exec";
                setGasUrl(targetUrl);
            } else {
                setTestResult({ success: false, message: "URL이 올바르지 않습니다. 끝에 '/exec'가 포함되어 있는지 확인해 주세요." });
                return;
            }
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            saveSettings(targetUrl, folderId, adminPassword);

            // API 프록시를 통해 테스트 액션 호출
            const res = await fetch("/api/proxy-apps-script?action=testConnection", {
                headers: { "Authorization": `Bearer ${adminPassword || "test"}` } 
            });
            const data = await res.json();

            if (data.status === "success" || data.message?.includes("성공")) {
                setTestResult({ success: true, message: "구글 앱스스크립트(GAS)와 성공적으로 연결되었습니다." });
            } else if (data.status === "error" && data.error) {
                // 프록시에서 반환된 구체적인 에러 메시지 표시
                setTestResult({ success: false, message: `연결 실패: ${data.error}` });
            } else if (data.error && data.error.includes("Unauthorized")) {
                setTestResult({ success: true, message: "URL은 유효하지만 관리자 인증이 필요합니다." });
            } else {
                throw new Error(data.error || data.message || "Invalid response");
            }
        } catch (err: any) {
            console.error("Connection Test Error:", err);
            setTestResult({ 
                success: false, 
                message: `연결에 실패했습니다. (${err.message || "URL을 다시 확인해 주세요"})` 
            });
        } finally {
            setIsTesting(false);
        }
    };

    const copyMagicLink = () => {
        if (!gasUrl) {
            alert("먼저 앱스스크립트 URL을 설정하고 완료해 주세요.");
            return;
        }
        const origin = window.location.origin;
        const magicLink = `${origin}/?setup_gs_url=${encodeURIComponent(gasUrl)}&setup_folder_id=${encodeURIComponent(folderId)}`;
        
        navigator.clipboard.writeText(magicLink);
        alert("학생용 매직 링크가 복사되었습니다!\n이 링크로 접속하는 학생들은 자동으로 선생님의 시트와 연결됩니다.");
    };

    const copyCodeToClipboard = () => {
        const finalFolderId = folderId || "여기에_폴더_ID를_넣으세요";
        const code = GAS_TEMPLATE_CODE.replace("{{FOLDER_ID}}", finalFolderId);
        
        navigator.clipboard.writeText(code);
        alert("백엔드 코드가 클립보드에 복사되었습니다! (입력하신 폴더 ID가 자동 반영되었습니다)");
    };

    const downloadFile = (content: string, fileName: string) => {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-[#FDFAEF] pb-20 pt-12 px-6 font-sans">
            <div className="max-w-5xl mx-auto space-y-12">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <button onClick={() => router.push("/admin")} className="text-xs font-black text-primary hover:underline uppercase tracking-widest">← Back to Dashboard</button>
                        <h1 className="text-4xl md:text-5xl font-black text-[#2F3D4A] tracking-tighter italic">
                            Teacher <span className="text-primary">Lab</span> Setup
                        </h1>
                        <p className="text-slate-500 font-bold">나만의 독립적인 인공지능 연구소 환경을 구축하세요.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`px-4 py-2 rounded-xl border-2 font-black text-[10px] tracking-widest uppercase flex items-center gap-2 ${currentStatus === "custom" ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-slate-50 border-slate-300 text-slate-400"}`}>
                            <span className={`w-2 h-2 rounded-full ${currentStatus === "custom" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
                            {currentStatus === "custom" ? "Custom Backend Active" : "System Default Mode"}
                        </div>
                        {currentStatus === "custom" && (
                            <button onClick={handleReset} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="설정 초기화">
                                🔄
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: URL Setup Form */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white border-4 border-[#2F3D4A] rounded-[32px] p-8 shadow-[8px_8px_0px_0px_#2F3D4A] flex flex-col gap-6 relative overflow-hidden">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm border-2 border-[#2F3D4A]">1</span>
                                    <h3 className="text-xl font-black text-[#2F3D4A]">Apps Script URL 연결</h3>
                                </div>
                                <p className="text-sm text-slate-500 font-bold leading-relaxed">
                                    배포한 구글 앱스스크립트(GAS)의 웹 앱 URL을 입력하고 저장하세요.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#2F3D4A] uppercase tracking-widest pl-1">1. 앱스스크립트 Web App URL</label>
                                    <input 
                                        type="text" 
                                        value={gasUrl}
                                        onChange={(e) => setGasUrl(e.target.value)}
                                        placeholder="https://script.google.com/macros/s/.../exec"
                                        className="w-full px-5 py-4 bg-[#F8FAFC] border-2 border-[#2F3D4A] rounded-2xl font-mono text-xs focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#2F3D4A] uppercase tracking-widest pl-1">2. 구글 드라이브 폴더 ID (선택)</label>
                                        <input 
                                            type="text" 
                                            value={folderId}
                                            onChange={(e) => setFolderId(e.target.value)}
                                            placeholder="예: 1-Gx2MnaqHW2nT4XXpnPCRLrcLrFOsgo8"
                                            className="w-full px-5 py-4 bg-[#F8FAFC] border-2 border-[#2F3D4A] rounded-2xl font-mono text-xs focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                        />
                                        <p className="text-[9px] text-slate-400 font-bold pl-1">폴더 주소창의 마지막 영문+숫자 조합이 ID입니다.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1">3. 나만의 관리자 비밀번호 (권장)</label>
                                        <input 
                                            type="password" 
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                            placeholder="관리자용 개인 암호"
                                            className="w-full px-5 py-4 bg-white border-2 border-primary rounded-2xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                                        />
                                        <p className="text-[9px] text-primary/60 font-bold pl-1">개별 설정 시 공용 비밀번호 대신 사용됩니다.</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3 pt-2">
                                    <button 
                                        onClick={handleTestConnection}
                                        disabled={isTesting || !gasUrl}
                                        className="flex-1 min-w-[150px] py-4 bg-primary text-white rounded-2xl font-black text-sm border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#2F3D4A] transition-all disabled:opacity-50 disabled:translate-y-0 active:translate-y-[1px]"
                                    >
                                        {isTesting ? "연결 확인 중..." : "설정 저장 및 연결 테스트"}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {testResult && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-2xl border-2 ${testResult.success ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-red-50 border-red-500 text-red-700"} text-sm font-bold flex items-center gap-3`}
                                    >
                                        <span>{testResult.success ? "✅" : "❌"}</span>
                                        {testResult.message}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* NEW: Magic Link Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#2F3D4A] border-4 border-[#2F3D4A] rounded-[32px] p-8 shadow-[8px_8px_0px_0px_#2F3D4A] space-y-5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-10 h-10 rounded-2xl bg-amber-400 text-[#2F3D4A] flex items-center justify-center font-black text-lg border-2 border-[#2F3D4A]">✨</span>
                                    <h4 className="text-xl font-black text-white">학생용 매직 링크 배포</h4>
                                </div>
                                <div className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black text-amber-400 border border-amber-400/30 tracking-widest">
                                    AUTO-ONBOARDING
                                </div>
                            </div>
                            <p className="text-sm font-bold text-white/60 leading-relaxed">
                                이 링크를 학생들에게 공유하세요. 학생들이 접속하면 자동으로 선생님의 데이터베이스와 연결되어 학습이 시작됩니다. 별도의 설정 주소를 입력할 필요가 없습니다.
                            </p>
                            <button 
                                onClick={copyMagicLink}
                                disabled={!gasUrl}
                                className="w-full py-4 bg-amber-400 text-[#2F3D4A] rounded-xl font-black text-sm border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:bg-amber-300 transition-all disabled:opacity-30 disabled:grayscale"
                            >
                                🔗 학생용 매직 링크 복사하기
                            </button>
                        </motion.div>
                    </div>

                    {/* Right Column: Visual Guide / Checklist */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-[#E0F2FE] border-4 border-[#2F3D4A] rounded-[32px] p-8 shadow-[8px_8px_0px_0px_#2F3D4A] space-y-5">
                                <div className="flex items-center gap-2">
                                    <span className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-lg border-2 border-[#2F3D4A]">2</span>
                                    <h4 className="text-xl font-black text-[#2F3D4A]">시트 템플릿 준비</h4>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <a 
                                        href="/templates/playground_template.xlsx"
                                        download
                                        className="w-full py-4 bg-white text-sky-600 rounded-xl font-black text-sm border-2 border-[#2F3D4A] shadow-[3px_3px_0px_0px_#2F3D4A] flex items-center justify-center hover:bg-sky-50 transition-all"
                                    >
                                        📊 템플릿 다운로드
                                    </a>
                                </div>
                            </div>

                            <div className="bg-[#F0FDFA] border-4 border-[#2F3D4A] rounded-[32px] p-8 shadow-[8px_8px_0px_0px_#2F3D4A] space-y-5">
                                <div className="flex items-center gap-2">
                                    <span className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg border-2 border-[#2F3D4A]">3</span>
                                    <h4 className="text-xl font-black text-[#2F3D4A]">GAS 코드 복사</h4>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={copyCodeToClipboard}
                                        className="flex-1 py-4 bg-white text-emerald-600 rounded-xl font-black text-sm border-2 border-[#2F3D4A] shadow-[3px_3px_0px_0px_#2F3D4A] hover:bg-emerald-50 transition-all"
                                    >
                                        📋 코드 복사
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border-4 border-[#2F3D4A] rounded-[32px] p-6 shadow-[6px_6px_0px_0px_#2F3D4A]">
                            <h4 className="text-lg font-black text-[#2F3D4A] mb-4 flex items-center gap-2">
                                🚀 <span className="underline underline-offset-4 decoration-primary">Next Steps</span>
                            </h4>
                            <ul className="space-y-4">
                                {[
                                    { title: "매직 링크 배포", desc: "학생들에게 링크를 전달하여 자동 연동을 완료하세요." },
                                    { title: "데이터 확인", desc: "학생들이 제출한 과제가 선생님의 시트에 기록됩니다." },
                                    { title: "코스 커스텀", desc: "시트의 CourseContents에서 강의 내용을 바로 수정하세요." },
                                ].map((tip, idx) => (
                                    <li key={idx} className="flex gap-3">
                                        <div className="mt-1 w-4 h-4 rounded-full bg-amber-100 border-2 border-[#2F3D4A] flex-shrink-0"></div>
                                        <div>
                                            <p className="text-xs font-black text-[#2F3D4A]">{tip.title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">{tip.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

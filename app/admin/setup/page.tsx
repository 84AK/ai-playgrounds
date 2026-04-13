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
    const [notionKey, setNotionKey] = useState("");
    const [notionDbId, setNotionDbId] = useState("");
    const [notionPriority, setNotionPriority] = useState<"notion" | "sheet">("sheet");
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<"default" | "custom">("default");
    const [teacherName, setTeacherName] = useState("");
    const [slackWebhook, setSlackWebhook] = useState("");
    const [admins, setAdmins] = useState<any[]>([]);
    const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
    
    const [isNotionSaved, setIsNotionSaved] = useState(false);
    const [isNotionTesting, setIsNotionTesting] = useState(false);
    const [notionTestResult, setNotionTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [hasNotionChanges, setHasNotionChanges] = useState(false);
    const [savedNotionPriority, setSavedNotionPriority] = useState<"notion" | "sheet">("sheet");
    const router = useRouter();

    useEffect(() => {
        // Load existing values from cookies
        const cookies = document.cookie.split("; ");
        const gsUrlCookie = cookies.find(row => row.startsWith("custom_gs_url="));
        const gdFolderCookie = cookies.find(row => row.startsWith("custom_folder_id="));
        const adminPassCookie = cookies.find(row => row.startsWith("custom_admin_password="));
        const teacherNameCookie = cookies.find(row => row.startsWith("custom_teacher_name="));
        const notionDbIdCookie = cookies.find(row => row.startsWith("custom_notion_db_id="));
        const notionPriorityCookie = cookies.find(row => row.startsWith("custom_notion_priority="));
        const slackWebhookCookie = cookies.find(row => row.startsWith("custom_slack_webhook="));
        
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
        if (teacherNameCookie && teacherNameCookie.split("=")[1]) {
            setTeacherName(decodeURIComponent(teacherNameCookie.split("=")[1]));
        }
        if (notionDbIdCookie && notionDbIdCookie.split("=")[1]) {
            setNotionDbId(decodeURIComponent(notionDbIdCookie.split("=")[1]));
        }
        if (notionPriorityCookie && notionPriorityCookie.split("=")[1]) {
            const priority = decodeURIComponent(notionPriorityCookie.split("=")[1]) as "notion" | "sheet";
            setNotionPriority(priority);
            setSavedNotionPriority(priority);
        }
        if (slackWebhookCookie && slackWebhookCookie.split("=")[1]) {
            setSlackWebhook(decodeURIComponent(slackWebhookCookie.split("=")[1]));
        }
    }, []);

    // 관리자 목록 불러오기
    useEffect(() => {
        if (gasUrl) fetchAdmins();
    }, [gasUrl]);

    const fetchAdmins = async () => {
        setIsLoadingAdmins(true);
        try {
            const res = await fetch(`/api/proxy-apps-script?action=getAdmins`);
            const data = await res.json();
            if (data.status === "success") {
                setAdmins(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch admins", err);
        } finally {
            setIsLoadingAdmins(false);
        }
    };

    // 노션 설정 변경 감지
    useEffect(() => {
        setHasNotionChanges(notionPriority !== savedNotionPriority);
    }, [notionPriority, savedNotionPriority]);

    const saveSettings = async (url: string, fId: string, pass: string, tName?: string) => {
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);
        
        document.cookie = `custom_gs_url=${encodeURIComponent(url)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
        document.cookie = `custom_folder_id=${encodeURIComponent(fId)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
        document.cookie = `custom_admin_password=${encodeURIComponent(pass)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
        
        if (tName) {
            document.cookie = `custom_teacher_name=${encodeURIComponent(tName)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
        }

        if (notionKey) {
            try {
                const res = await fetch("/api/admin/encrypt", {
                    method: "POST",
                    body: JSON.stringify({ value: notionKey })
                });
                const { encrypted } = await res.json();
                if (encrypted) {
                    document.cookie = `custom_notion_key=${encodeURIComponent(encrypted)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
                }
            } catch (err) { console.error("Notion key encryption failed"); }
        }

        document.cookie = `custom_notion_db_id=${encodeURIComponent(notionDbId)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
        document.cookie = `custom_notion_priority=${encodeURIComponent(notionPriority)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
        document.cookie = `custom_slack_webhook=${encodeURIComponent(slackWebhook)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;

        setIsSaved(true);
        setIsNotionSaved(true);
        setCurrentStatus(url ? "custom" : "default");
        setSavedNotionPriority(notionPriority); // 저장 후 현재 우선순위를 기준으로 설정
        setHasNotionChanges(false);
        if (tName) setTeacherName(tName);

        setTimeout(() => {
            setIsSaved(false);
            setIsNotionSaved(false);
        }, 3000);
    };

    const handleReset = async () => {
        if (!confirm("모든 커스텀 설정을 초기화하고 시스템 기본(Vercel) 환경으로 돌아가시겠습니까?")) return;
        
        try {
            const res = await fetch("/api/admin/reset-settings", { method: "POST" });
            if (res.ok) {
                alert("기본 설정으로 복구되었습니다. 페이지를 새로고침합니다.");
                window.location.href = "/admin"; // 강제 리다이렉트
            } else {
                alert("초기화 중 오류가 발생했습니다.");
            }
        } catch (err) {
            alert("서버 통신 실패");
        }
    };

    const handleTestNotion = async () => {
        if (!notionDbId) {
            alert("노션 Database ID를 입력해주세요.");
            return;
        }
        
        setIsNotionTesting(true);
        setNotionTestResult(null);

        try {
            // 키가 입력되어 있으면 입력된 키를 쓰고, 아니면 쿠키에 있는거 사용 여부 확인
            // 여기서는 입력된 키 우선
            let apiKeyToUse = notionKey;
            let isEncrypted = false;
            
            if (!apiKeyToUse) {
                const notionKeyCookie = document.cookie.split("; ").find(row => row.startsWith("custom_notion_key="));
                if (notionKeyCookie) {
                    apiKeyToUse = decodeURIComponent(notionKeyCookie.split("=")[1]);
                    isEncrypted = true;
                }
            }

            if (!apiKeyToUse) throw new Error("API Key가 입력되지 않았거나 저장된 정보가 없습니다.");

            const res = await fetch("/api/admin/notion/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey: apiKeyToUse, databaseId: notionDbId, isEncrypted })
            });
            const data = await res.json();

            if (data.success) {
                setNotionTestResult({ success: true, message: `연결 성공! [${data.title}]` });
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            setNotionTestResult({ success: false, message: `연결 실패: ${err.message}` });
        } finally {
            setIsNotionTesting(false);
        }
    };

    const handleTestConnection = async () => {
        if (!gasUrl) return;
        
        let targetUrl = gasUrl.trim();
        
        if (!targetUrl.endsWith("/exec")) {
            if (confirm("입력하신 URL이 '/exec'로 끝나지 않습니다. 자동으로 추가하여 테스트할까요?")) {
                targetUrl = targetUrl.endsWith("/") ? targetUrl + "exec" : targetUrl + "/exec";
                setGasUrl(targetUrl);
            }
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            // API 프록시를 통해 테스트 액션 호출
            const res = await fetch("/api/proxy-apps-script?action=testConnection", {
                headers: { 
                    "Authorization": `Bearer ${adminPassword || "test"}`,
                    "x-custom-gs-url": targetUrl // 임시로 타겟 URL 전달 (쿠키 저장 전 테스트용)
                } 
            });
            const data = await res.json();

            if (data.status === "success" || data.message?.includes("성공")) {
                const sName = data.spreadsheetName || "연결된 시트";
                saveSettings(targetUrl, folderId, adminPassword, sName);
                setTestResult({ success: true, message: `연결 성공! [${sName}]` });
            } else {
                throw new Error(data.error || data.message || "Invalid response");
            }
        } catch (err: any) {
            setTestResult({ success: false, message: `연결 실패: ${err.message}` });
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

    // [V8.2] 관리자 매직 링크 생성 로직 (Full Sync)
    const copyAdminMagicLink = () => {
        const cookies = document.cookie.split("; ");
        const getCookie = (name: string) => cookies.find(r => r.startsWith(`${name}=`))?.split("=")[1] || "";
        
        const pass = adminPassword || decodeURIComponent(getCookie("custom_admin_password"));
        
        if (!pass) {
            alert("관리자 비밀번호가 설정되어 있어야 링크 생성이 가능합니다.");
            return;
        }
        
        const origin = window.location.origin;
        const trackNames = getCookie("custom_track_names");

        const params = new URLSearchParams({
            token: pass,
            teacherName: teacherName || decodeURIComponent(getCookie("custom_teacher_name")),
            gsUrl: gasUrl || decodeURIComponent(getCookie("custom_gs_url")),
            folderId: folderId || decodeURIComponent(getCookie("custom_folder_id")),
            adminPass: pass,
            notionDbId: notionDbId || decodeURIComponent(getCookie("custom_notion_db_id")),
            notionPriority: notionPriority || decodeURIComponent(getCookie("custom_notion_priority")),
            trackNames: trackNames ? decodeURIComponent(trackNames) : "" 
        });

        const magicLink = `${origin}/api/admin/magic-login?${params.toString()}`;
        
        navigator.clipboard.writeText(magicLink);
        alert("🛡️ [완전체] 관리자 매직 링크가 복사되었습니다!\n이 링크 하나로 동료 선생님의 환경(시트, 노션, 권한, 트랙명)이 사용자님과 똑같이 자동 세팅됩니다.");
    };

    const handleSaveAll = async () => {
        setIsTesting(true); // 로딩 상태 재활용
        await saveSettings(gasUrl, folderId, adminPassword, teacherName);
        alert("✨ 모든 환경 설정이 성공적으로 저장되었습니다!");
        setIsTesting(false);
    };

    return (
        <div className="min-h-screen bg-[#FDFAEF] pb-24 pt-12 px-6 font-sans">
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
                        <button 
                            onClick={handleReset} 
                            className={`p-2 transition-colors ${currentStatus === "custom" ? "text-slate-400 hover:text-red-500" : "text-slate-200 hover:text-amber-500"}`} 
                            title="커스텀 설정 초기화 (시스템 기본값으로 복구)"
                        >
                            🔄
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Forms */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* 1. Google Sheets Setup */}
                        <div className="bg-white border-4 border-[#2F3D4A] rounded-[32px] p-8 shadow-[8px_8px_0px_0px_#2F3D4A] flex flex-col gap-6 relative overflow-hidden">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm border-2 border-[#2F3D4A]">1</span>
                                    <h3 className="text-xl font-black text-[#2F3D4A]">Apps Script URL 연결</h3>
                                </div>
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
                                            placeholder="폴더 ID 입력"
                                            className="w-full px-5 py-4 bg-[#F8FAFC] border-2 border-[#2F3D4A] rounded-2xl font-mono text-xs focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                        />
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
                                    </div>
                                </div>

                                <button 
                                    onClick={handleTestConnection}
                                    disabled={isTesting || !gasUrl}
                                    className="w-full py-4 bg-white text-[#2F3D4A] rounded-2xl font-black text-sm border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] hover:bg-slate-50 transition-all disabled:opacity-50"
                                >
                                    {isTesting ? "연결 확인 중..." : "🔍 시트 연동 테스트 (선택)"}
                                </button>
                            </div>

                            <AnimatePresence>
                                {testResult && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-2xl border-2 ${testResult.success ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-red-50 border-red-500 text-red-700"} text-xs font-bold flex items-center gap-3`}
                                    >
                                        <span>{testResult.success ? "✅" : "❌"}</span>
                                        {testResult.message}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* 2. Notion Integration */}
                        <div className="bg-white border-4 border-[#2F3D4A] rounded-[32px] p-8 shadow-[8px_8px_0px_0px_#2F3D4A] flex flex-col gap-6 relative overflow-hidden">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-xl bg-[#000000] text-white flex items-center justify-center font-black text-sm border-2 border-[#2F3D4A]">N</span>
                                    <h3 className="text-xl font-black text-[#2F3D4A]">Notion 페이지 연동 (선택)</h3>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#2F3D4A] uppercase tracking-widest pl-1">Notion API Token</label>
                                        <input 
                                            type="password" 
                                            value={notionKey}
                                            onChange={(e) => setNotionKey(e.target.value)}
                                            placeholder="secret_..."
                                            className="w-full px-5 py-4 bg-[#F8FAFC] border-2 border-[#2F3D4A] rounded-2xl font-mono text-xs focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#2F3D4A] uppercase tracking-widest pl-1">Database ID</label>
                                        <input 
                                            type="text" 
                                            value={notionDbId}
                                            onChange={(e) => setNotionDbId(e.target.value)}
                                            placeholder="32자리 ID"
                                            className="w-full px-5 py-4 bg-[#F8FAFC] border-2 border-[#2F3D4A] rounded-2xl font-mono text-xs focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between pl-1">
                                        <label className="text-[10px] font-black text-[#2F3D4A] uppercase tracking-widest">데이터 소스 우선순위</label>
                                        {hasNotionChanges && <span className="bg-amber-100 text-amber-600 text-[8px] font-black px-2 py-0.5 rounded-full border border-amber-200">변경됨</span>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setNotionPriority("sheet")}
                                            className={`flex-1 py-3 rounded-xl border-2 font-black text-xs transition-all relative ${notionPriority === "sheet" ? "bg-[#2F3D4A] text-white border-[#2F3D4A]" : "bg-white text-slate-400 border-slate-200"}`}
                                        >
                                            구글 시트 우선
                                            {savedNotionPriority === "sheet" && <span className="absolute -top-2 -right-1 bg-emerald-500 text-white text-[7px] px-1.5 py-0.5 rounded-full">ACTIVE</span>}
                                        </button>
                                        <button 
                                            onClick={() => setNotionPriority("notion")}
                                            className={`flex-1 py-3 rounded-xl border-2 font-black text-xs transition-all relative ${notionPriority === "notion" ? "bg-primary text-white border-primary" : "bg-white text-slate-400 border-slate-200"}`}
                                        >
                                            노션 우선
                                            {savedNotionPriority === "notion" && <span className="absolute -top-2 -right-1 bg-emerald-500 text-white text-[7px] px-1.5 py-0.5 rounded-full">ACTIVE</span>}
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleTestNotion}
                                    disabled={isNotionTesting}
                                    className="w-full py-4 bg-white text-[#2F3D4A] rounded-2xl font-black text-sm border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] hover:bg-slate-50 transition-all disabled:opacity-50"
                                >
                                    {isNotionTesting ? "연동 확인 중..." : "🔍 노션 연동 테스트 (선택)"}
                                </button>
                            </div>

                            <AnimatePresence>
                                {notionTestResult && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-2xl border-2 ${notionTestResult.success ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-red-50 border-red-500 text-red-700"} text-[10px] font-bold flex items-center gap-2`}
                                    >
                                        <span>{notionTestResult.success ? "✅" : "❌"}</span>
                                        {notionTestResult.message}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        {/* 3. Global Save Button (Unified) */}
                        <div className="pt-4">
                            <button 
                                onClick={handleSaveAll}
                                disabled={isTesting}
                                className="w-full py-6 bg-primary text-white rounded-[32px] font-black text-xl border-4 border-[#2F3D4A] shadow-[8px_8px_0px_0px_#2F3D4A] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_#2F3D4A] active:translate-y-[2px] transition-all flex items-center justify-center gap-3"
                            >
                                {isTesting ? <span className="animate-spin">🔄</span> : "✨ 전체 환경 설정 저장하기"}
                            </button>
                            <p className="text-center text-[10px] font-bold text-slate-400 mt-4 italic">※ 변경하신 모든 설정(시트, 노션, 비밀번호 등)이 브라우저에 즉시 저장됩니다.</p>
                        </div>
                    </div>

                    {/* Right Column: Invite & Tools */}
                    <div className="space-y-6">
                        {/* Admin Management Tool */}
                        <div className="bg-[#2F3D4A] border-4 border-[#2F3D4A] rounded-[32px] p-8 shadow-[8px_8px_0px_0px_rgba(47,61,74,0.3)] space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-10 h-10 rounded-2xl bg-emerald-400 text-[#2F3D4A] flex items-center justify-center font-black text-lg border-2 border-[#2F3D4A]">👑</span>
                                    <h4 className="text-xl font-black text-white">관리자 관리</h4>
                                </div>
                                <button onClick={fetchAdmins} className="text-white/40 hover:text-white transition-colors">🔄</button>
                            </div>
                            
                            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                {isLoadingAdmins ? (
                                    <div className="text-center py-4 text-white/30 text-[10px] font-bold animate-pulse">관리자 목록 로딩 중...</div>
                                ) : admins.length === 0 ? (
                                    <div className="text-center py-4 text-white/30 text-[10px] font-bold font-mono italic">No admins registered yet.</div>
                                ) : (
                                    admins.map((admin, idx) => (
                                        <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-black text-white truncate">{admin.name}</p>
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${admin.role === 'super_admin' ? 'bg-amber-400 text-[#2F3D4A]' : 'bg-emerald-400 text-[#2F3D4A]'}`}>
                                                        {admin.role === 'super_admin' ? 'SUPER' : 'ADMIN'}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] font-bold text-white/40 mt-0.5">{admin.createdAt?.split(' ')[0]}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${admin.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                                                <span className="text-[10px] font-black text-white/60 lowercase tracking-tighter">{admin.status}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            <p className="text-[10px] font-bold text-white/40 leading-relaxed italic border-t border-white/10 pt-4">
                                ※ 역할 변경이나 승인은 연동된 구글 스프레드시트의 <span className="text-emerald-400">'Admins'</span> 시트에서 직접 하실 수 있습니다.
                            </p>
                        </div>

                        {/* Student Magic Link */}
                        <div className="bg-[#F8FAFC] border-4 border-[#2F3D4A] rounded-[32px] p-8 shadow-[8px_8px_0px_0px_#2F3D4A] space-y-5">
                            <div className="flex items-center gap-2">
                                <span className="w-10 h-10 rounded-2xl bg-amber-400 text-[#2F3D4A] flex items-center justify-center font-black text-lg border-2 border-[#2F3D4A]">✨</span>
                                <h4 className="text-xl font-black text-[#2F3D4A]">학생 배포 링크</h4>
                            </div>
                            <button 
                                onClick={copyMagicLink}
                                disabled={!gasUrl}
                                className="w-full py-4 bg-white text-[#2F3D4A] rounded-xl font-black text-xs border-2 border-[#2F3D4A] shadow-[3px_3px_0px_0px_#2F3D4A] hover:bg-slate-50 transition-all disabled:opacity-30"
                            >
                                🔗 학생용 매직 링크 복사
                            </button>
                        </div>

                        {/* Templates */}
                        <div className="bg-[#E0F2FE] border-4 border-[#2F3D4A] rounded-[32px] p-8 shadow-[8px_8px_0px_0px_#2F3D4A] space-y-5">
                            <h4 className="text-xl font-black text-[#2F3D4A] flex items-center gap-2">📊 시트 템플릿</h4>
                            <div className="flex flex-col gap-3">
                                <button onClick={copyCodeToClipboard} className="w-full py-4 bg-white text-sky-600 rounded-xl font-black text-xs border-2 border-[#2F3D4A] shadow-[3px_3px_0px_0px_#2F3D4A] hover:bg-sky-50 transition-all">
                                    📋 GAS 코드 복사
                                </button>
                                <a 
                                    href="/templates/playground_template.xlsx"
                                    download
                                    className="w-full py-4 bg-sky-500 text-white rounded-xl font-black text-xs border-2 border-[#2F3D4A] shadow-[3px_3px_0px_0px_#2F3D4A] flex items-center justify-center hover:bg-sky-600 transition-all"
                                >
                                    📥 템플릿 다운로드
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

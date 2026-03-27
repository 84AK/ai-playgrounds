"use client";

import { useState, useEffect } from "react";
import { getAppsScriptJson, postAppsScript } from "@/lib/appsScriptClient";
import JSZip from "jszip";

interface Student {
    name: string;
    grade: string;
    class: string;
    feedback: string;
}

export default function AdminFeedbackPage() {
    const [password, setPassword] = useState("");
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [feedback, setFeedback] = useState("");
    const [statusMsg, setStatusMsg] = useState("");
    const [referenceCode, setReferenceCode] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState(1);
    const [studentSubmission, setStudentSubmission] = useState<{ status: string; fileName: string } | null>(null);
    const [activeTab, setActiveTab] = useState("전체");
    const [searchTerm, setSearchTerm] = useState("");

    // [NEW] 학년/반별 탭 목록 추출 (예외 처리 포함)
    const classes = ["전체", ...Array.from(new Set(students.map(s => {
        const val = `${s.grade} ${s.class}`.trim();
        return (val === "학년 반" || !val) ? "기타" : val;
    }))).sort()];

    // [NEW] 필터링된 학생 목록 (탭 + 검색)
    const filteredStudents = students.filter(s => {
        const val = `${s.grade} ${s.class}`.trim();
        const classKey = (val === "학년 반" || !val) ? "기타" : val;
        const matchesTab = activeTab === "전체" || classKey === activeTab;
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    // [NEW] 정답 코드 자동 로드
    useEffect(() => {
        const loadReferenceCode = async () => {
            try {
                const res = await getAppsScriptJson<{ content: string }>(
                    new URLSearchParams({ action: "getReferenceCode", week: selectedWeek.toString() })
                );
                if (res.content) {
                    setReferenceCode(res.content);
                } else {
                    setReferenceCode(""); // 파일이 없는 경우 초기화
                }
            } catch (err) {
                console.error("정답 코드 로드 실패:", err);
            }
        };
        loadReferenceCode();
    }, [selectedWeek]);

    // [NEW] 학생 제출 상태 실시간 확인
    useEffect(() => {
        const checkSubmission = async () => {
            if (!selectedStudent) {
                setStudentSubmission(null);
                return;
            }
            try {
                const res = await getAppsScriptJson<{ data: any }>(
                    new URLSearchParams({ 
                        action: "checkUserStatus", 
                        user_id: selectedStudent.name, 
                        week: selectedWeek.toString() 
                    })
                );
                if (res.data) {
                    setStudentSubmission({
                        status: res.data.submissionStatus,
                        fileName: res.data.fileName
                    });
                }
            } catch (err) {
                console.error("제출 상태 확인 실패:", err);
            }
        };
        checkSubmission();
    }, [selectedStudent, selectedWeek]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // 환경변수 또는 기본값 체크
        const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";
        if (password === adminPass) {
            setIsAuthorized(true);
            fetchStudents();
        } else {
            alert("비밀번호가 틀렸습니다.");
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await getAppsScriptJson<{ data: Student[] }>(
                new URLSearchParams({ action: "getStudentList" })
            );
            if (res.data) setStudents(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleSendFeedback = async () => {
        if (!selectedStudent) return;
        setLoading(true);
        setStatusMsg("전송 중...");
        try {
            await postAppsScript({
                action: "updateFeedback",
                user_id: selectedStudent.name,
                feedback: feedback
            });
            setStatusMsg("✅ 피드백 전송 완료!");
            fetchStudents(); // 목록 새로고침
        } catch (err) {
            setStatusMsg("❌ 전송 실패");
        }
        setLoading(false);
    };
    const handleAIAnalyze = async () => {
        if (!selectedStudent) return;
        setIsAnalyzing(true);
        setStatusMsg("🔄 AI가 파일을 분석하고 있습니다...");
        try {
            // 1. 학생의 해당 주차 제출 정보(URL 포함) 가져오기
            const statusRes = await getAppsScriptJson<{ data: any }>(
                new URLSearchParams({ 
                    action: "checkUserStatus", 
                    user_id: selectedStudent.name,
                    week: selectedWeek.toString()
                })
            );

            const fileUrl = statusRes.data?.fileUrl;
            if (!fileUrl) throw new Error("제출된 파일이 없거나 찾을 수 없습니다.");

            // 2. AI 분석 API 호출 (파일 다운로드 및 압축 해제는 서버에서 처리하여 CORS 회피)
            const aiRes = await fetch('/api/analyze-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileUrl,
                    referenceCode,
                    week: selectedWeek,
                    objective: `${selectedWeek}주차 과제 목표 달성 여부 분석`
                })
            });

            const aiData = await aiRes.json();
            if (aiData.error) throw new Error(aiData.error);

            setFeedback(aiData.feedback);
            setStatusMsg("✨ AI 피드백 생성이 완료되었습니다!");
        } catch (err: any) {
            console.error(err);
            setStatusMsg(`❌ AI 분석 실패: ${err.message}`);
        }
        setIsAnalyzing(false);
    };

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <form onSubmit={handleLogin} className="p-8 bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md">
                    <h1 className="text-2xl font-black mb-6 text-center text-[#2F3D4A]">선생님 로그인 🔐</h1>
                    <input
                        type="password"
                        placeholder="관리자 비밀번호 입력"
                        className="w-full p-4 border-2 border-slate-200 rounded-2xl mb-4 focus:border-primary outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg hover:bg-primary/90">
                        입장하기
                    </button>
                    {/* 보안을 위해 비밀번호 힌트 제거 */}
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8 md:p-12">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div onClick={() => window.location.href = '/'} className="cursor-pointer">
                        <h1 className="text-4xl font-black text-[#2F3D4A]">피드백 대시보드 🧑‍🏫</h1>
                        <p className="text-slate-500 font-medium mt-2">학생들에게 소중한 조언을 남겨주세요.</p>
                    </div>
                    <button onClick={() => fetchStudents()} className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50">
                        🔄 새로고침
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-8">
                    {/* Student List */}
                    <div className="bg-white rounded-[32px] border-2 border-slate-200 overflow-hidden shadow-sm flex flex-col h-[700px]">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="font-black text-slate-700">학생 목록 ({filteredStudents.length}명)</h2>
                                <span className="text-xs font-bold px-2 py-1 bg-slate-200 text-slate-600 rounded-lg">전체 {students.length}명</span>
                            </div>

                            {/* Search Bar */}
                            <div className="relative mb-6">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                                <input 
                                    type="text"
                                    placeholder="학생 이름으로 검색..."
                                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm focus:border-primary outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {classes.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setActiveTab(c)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${activeTab === c ? 'bg-primary text-white shadow-lg' : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-slate-300'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {loading && students.length === 0 ? (
                                <p className="p-8 text-center text-slate-400">불러오는 중...</p>
                            ) : (
                                filteredStudents.map((s, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setSelectedStudent(s);
                                            setFeedback(s.feedback);
                                            setStatusMsg("");
                                        }}
                                        className={`p-6 border-b border-slate-50 cursor-pointer transition-all ${selectedStudent?.name === s.name ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-black text-lg text-[#2F3D4A]">{s.name}</p>
                                                <p className="text-sm text-slate-500">{s.grade}학년 {s.class}반</p>
                                            </div>
                                            {s.feedback && <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-bold">피드백 있음</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Feedback Editor */}
                    <div className="bg-white rounded-[40px] border-2 border-slate-200 p-8 md:p-12 shadow-sm relative overflow-hidden">
                        {selectedStudent ? (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="mb-8">
                                    <span className="text-primary font-black uppercase tracking-widest text-xs">Target Student</span>
                                    <h2 className="text-3xl font-black text-[#2F3D4A] mt-2">{selectedStudent.name} 학생에게 피드백</h2>
                                    {studentSubmission && (
                                        <div className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${studentSubmission.status === 'not_found' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                                            {studentSubmission.status === 'not_found' ? (
                                                <>❌ {selectedWeek}주차 과제 미제출</>
                                            ) : (
                                                <>✅ {selectedWeek}주차 제출됨: <span className="underline ml-1">{studentSubmission.fileName}</span></>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-2">과제 주차 선택</label>
                                        <select 
                                            value={selectedWeek}
                                            onChange={(e) => setSelectedWeek(Number(e.target.value))}
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary font-bold"
                                        >
                                            {[1, 2, 3, 4].map(w => (
                                                <option key={w} value={w}>{w}주차 과제</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col justify-end">
                                        <div className={`flex items-center gap-3 p-4 border-2 rounded-2xl transition-all h-[56px] ${referenceCode ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-600 font-black animate-pulse'}`}>
                                            <div className={`w-3 h-3 rounded-full ${referenceCode ? 'bg-green-500' : 'bg-red-500 animate-ping'}`}></div>
                                            <p className="text-sm">
                                                {referenceCode ? `✅ ${selectedWeek}주차 정답 로드 완료` : `⚠️ ${selectedWeek}주차 정답 파일 찾지 못함`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <div className="absolute -top-4 right-6 z-10">
                                        <button
                                            onClick={handleAIAnalyze}
                                            disabled={isAnalyzing}
                                            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group disabled:opacity-50"
                                        >
                                            {isAnalyzing ? (
                                                <span className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    AI 분석 중...
                                                </span>
                                            ) : (
                                                <>✨ AI 분석 서비스 🤖</>
                                            )}
                                        </button>
                                    </div>
                                    <textarea
                                        className="w-full min-h-[400px] p-8 bg-slate-50 border-2 border-slate-100 rounded-[32px] focus:border-primary outline-none text-lg font-medium resize-none transition-all pt-12"
                                        placeholder="AI 분석을 시작하거나 직접 피드백을 입력하세요."
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                    />
                                </div>

                                <div className="mt-8 flex items-center justify-between gap-4">
                                    <p className={`font-bold ${statusMsg.includes('✅') ? 'text-green-500' : 'text-slate-400'}`}>
                                        {statusMsg}
                                    </p>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setSelectedStudent(null)}
                                            className="px-8 py-5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                        >
                                            취소
                                        </button>
                                        <button
                                            onClick={handleSendFeedback}
                                            disabled={loading}
                                            className="px-12 py-5 bg-primary text-white font-black rounded-2xl shadow-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-3"
                                        >
                                            {loading ? "전송 중..." : "🚀 피드백 보내기"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 py-24">
                                <div className="text-6xl">👈</div>
                                <p className="text-xl font-black">왼쪽 목록에서 학생을 선택해주세요.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

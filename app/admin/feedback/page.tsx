"use client";

import { useState, useEffect } from "react";
import { getAppsScriptJson, postAppsScript } from "@/lib/appsScriptClient";
import JSZip from "jszip";

interface Student {
    name: string;
    grade: string;
    class: string;
    feedback: string;
    feedbacks?: {
        mbti: string[];
        pose: string[];
    };
    progress?: boolean[];
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
    const [selectedCourse, setSelectedCourse] = useState<"MBTI" | "POSE">("MBTI");
    const [showPassword, setShowPassword] = useState(false);
    const [studentSubmission, setStudentSubmission] = useState<{ status: string; fileName: string } | null>(null);
    const [isValidating, setIsValidating] = useState(false);
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

    const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);

    // [NEW] 전체 커리큘럼 구조 로드 및 동적 주차 목록 추출
    useEffect(() => {
        const fetchStructure = async () => {
            try {
                const res = await fetch("/api/course/structure");
                const result = await res.json();
                if (result.success && result.data) {
                    const structure: any[] = result.data;
                    // 현재 선택된 코스에 해당하는 주차 목록만 추출 (오름차순 정렬)
                    const weeks = Array.from(new Set(
                        structure
                            .filter(s => s.track.toUpperCase() === selectedCourse.toUpperCase())
                            .map(s => Number(s.week))
                    )).sort((a, b) => a - b);
                    
                    if (weeks.length > 0) {
                        setAvailableWeeks(weeks);
                        // 현재 선택된 주차가 목록에 없으면 첫 번째 주차로 변경
                        if (!weeks.includes(selectedWeek)) {
                            setSelectedWeek(weeks[0]);
                        }
                    } else {
                        // 등록된 주차가 없으면 기본값 유지
                        setAvailableWeeks([1, 2, 3, 4, 5, 6, 7, 8]);
                    }
                }
            } catch (err) {
                console.error("커리큘럼 구조 로드 실패:", err);
                setAvailableWeeks([1, 2, 3, 4, 5, 6, 7, 8]);
            }
        };
        fetchStructure();
    }, [selectedCourse]);

    // [NEW] 정답 코드 자동 로드 (selectedWeek 반영)
    useEffect(() => {
        const loadReferenceCode = async () => {
            if (!isAuthorized) return; // 인증되지 않은 경우 호출 안함
            try {
                const res = await getAppsScriptJson<{ content: string }>(
                    new URLSearchParams({ 
                        action: "getReferenceCode", 
                        week: selectedWeek.toString(),
                        course_type: selectedCourse 
                    }),
                    password // 비밀번호 전달
                );
                if (res.content) {
                    setReferenceCode(res.content);
                } else {
                    setReferenceCode(""); 
                }
            } catch (err) {
                console.error("정답 코드 로드 실패:", err);
            }
        };
        loadReferenceCode();
    }, [selectedWeek, selectedCourse, isAuthorized, password]);

    // [NEW] 학생 제출 상태 및 주차별 피드백 실시간 확인
    useEffect(() => {
        const checkSubmissionAndFeedback = async () => {
            if (!selectedStudent || !isAuthorized) {
                setStudentSubmission(null);
                setFeedback(""); 
                return;
            }
            try {
                setIsValidating(true);
                const res = await getAppsScriptJson<{ data: any }>(
                    new URLSearchParams({ 
                        action: "checkUserStatus", 
                        user_id: selectedStudent.name, 
                        week: selectedWeek.toString(),
                        course_type: selectedCourse
                    }),
                    password // 비밀번호 전달
                );
                if (res.data) {
                    setStudentSubmission({
                        status: res.data.submissionStatus,
                        fileName: res.data.fileName
                    });
                    setFeedback(res.data.feedback || "");
                }
            } catch (err) {
                console.error("데이터 로드 실패:", err);
            } finally {
                setIsValidating(false);
            }
        };
        checkSubmissionAndFeedback();
    }, [selectedStudent, selectedWeek, selectedCourse, isAuthorized, password]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // 더 이상 클라이언트에서 직접 비교하지 않고 첫 요청을 시도하여 인증 여부 확인
        fetchStudents();
    };

    const fetchStudents = async () => {
        setLoading(true);
        setStatusMsg("");
        try {
            const res = await getAppsScriptJson<{ data: Student[] }>(
                new URLSearchParams({ action: "getStudentList" }),
                password // 입력된 비밀번호를 전송
            );
            if (res.data) {
                setStudents(res.data);
                setIsAuthorized(true); // 응답이 성공(200)이면 인증된 것으로 간주
            }
        } catch (err: any) {
            console.error(err);
            alert("비밀번호가 틀렸거나 접근 권한이 없습니다.");
            setIsAuthorized(false);
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
                week: selectedWeek, // 주차 정보 추가
                course_type: selectedCourse, // 코스 정보 추가
                feedback: feedback
            }, password); // 비밀번호 전달
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
                    week: selectedWeek.toString(),
                    course_type: selectedCourse
                })
            );

            const fileUrl = statusRes.data?.fileUrl;
            if (!fileUrl) throw new Error("제출된 파일이 없거나 찾을 수 없습니다.");

            // 2. AI 분석 API 호출 (관리자 인증 헤더 포함)
            const aiRes = await fetch('/api/analyze-code', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${password}` // 비밀번호 전달
                },
                body: JSON.stringify({
                    fileUrl,
                    referenceCode,
                    week: selectedWeek,
                    objective: `${selectedCourse} ${selectedWeek}주차 과제 목표 달성 여부 분석`
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
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <form onSubmit={handleLogin} className="p-10 bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white w-full max-w-md animate-in fade-in zoom-in duration-500">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                            <span className="text-3xl">🔐</span>
                        </div>
                        <h1 className="text-2xl font-black text-[#2F3D4A]">선생님 로그인</h1>
                        <p className="text-slate-400 font-medium mt-1">대시보드 접속을 위해 비밀번호를 입력하세요.</p>
                    </div>
                    
                    <div className="relative mb-6">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="관리자 비밀번호 입력"
                            className="w-full p-4 pr-14 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:bg-white outline-none transition-all font-bold"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                        </button>
                    </div>

                    <button 
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                로그인 중...
                            </>
                        ) : (
                            "입장하기"
                        )}
                    </button>
                    
                    <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-relaxed">
                            🔒 Security Notice<br />
                            비밀번호는 .env.local 및 Vercel 환경변수에서 관리됩니다.
                        </p>
                    </div>
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
                                            // setFeedback(s.feedback); // 여기서 설정하지 않고 useEffect에서 로드함
                                            setStatusMsg("");
                                        }}
                                        className={`p-6 border-b border-slate-50 cursor-pointer transition-all ${selectedStudent?.name === s.name ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-black text-lg text-[#2F3D4A]">{s.name}</p>
                                                <p className="text-sm text-slate-500 mb-2">{s.grade}학년 {s.class}반</p>
                                                
                                                {/* [복구] 차시별 제출 현황 미니 도트 */}
                                                <div className="flex gap-1 flex-wrap">
                                                    {(s.progress || Array(12).fill(false)).map((submitted, i) => (
                                                        <div 
                                                            key={i}
                                                            className={`w-2.5 h-2.5 rounded-sm border ${
                                                                submitted 
                                                                ? 'bg-primary border-primary shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]' 
                                                                : 'bg-slate-100 border-slate-200'
                                                            }`}
                                                            title={`${i+1}주차: ${submitted ? '제출' : '미제출'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {(() => {
                                                    const weekIdx = selectedWeek - 1;
                                                    const hasFeedback = selectedCourse === "MBTI" 
                                                        ? !!s.feedbacks?.mbti?.[weekIdx]
                                                        : !!s.feedbacks?.pose?.[weekIdx];
                                                    return hasFeedback ? (
                                                        <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">피드백 완료</span>
                                                    ) : null;
                                                })()}
                                                <span className="text-[10px] font-black text-slate-300">
                                                    {(s.progress || []).filter(p => p).length}/12
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Feedback Editor */}
                    <div className="bg-white rounded-[40px] border-2 border-slate-200 p-8 md:p-12 shadow-sm relative overflow-hidden">
                        {isValidating && (
                            <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm font-black text-primary animate-pulse">데이터를 불러오는 중...</p>
                                </div>
                            </div>
                        )}
                        {selectedStudent ? (
                            <div className={`animate-in fade-in slide-in-from-right-4 duration-500 ${isValidating ? 'opacity-30 blur-[1px]' : ''}`}>
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
                                        <div className="relative">
                                            <select 
                                                value={selectedWeek}
                                                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary font-bold appearance-none cursor-pointer"
                                            >
                                                {availableWeeks.map(w => (
                                                    <option key={w} value={w}>{selectedCourse === 'MBTI' ? 'MBTI ' : 'POSE '} {w}주차 과제</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-2">코스 선택</label>
                                        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                                            {["MBTI", "POSE"].map(course => (
                                                <button
                                                    key={course}
                                                    onClick={() => setSelectedCourse(course as any)}
                                                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all ${selectedCourse === course ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    {course}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className={`mb-8 flex items-center gap-3 p-4 border-2 rounded-2xl transition-all h-[56px] ${referenceCode ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-600 font-black animate-pulse'}`}>
                                    <div className={`w-3 h-3 rounded-full ${referenceCode ? 'bg-green-500' : 'bg-red-500 animate-ping'}`}></div>
                                    <p className="text-sm font-bold">
                                        {referenceCode ? `✅ ${selectedCourse} ${selectedWeek}주차 정답 로드 완료` : `⚠️ ${selectedCourse} ${selectedWeek}주차 정답 파일 찾지 못함`}
                                    </p>
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

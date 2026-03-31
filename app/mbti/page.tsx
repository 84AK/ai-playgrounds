"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAppsScriptJson, postAppsScript } from "@/lib/appsScriptClient";
import useLocalProfile from "@/hooks/useLocalProfile";

export default function MBTIMaker() {
    const router = useRouter();
    const profile = useLocalProfile();
    const [activeTab, setActiveTab] = useState("planning");
    const [previewIndex, setPreviewIndex] = useState(0);
    const [isPreviewFinished, setIsPreviewFinished] = useState(false);
    const [authorName, setAuthorName] = useState("");
    const [password, setPassword] = useState(""); // 보안 비밀번호 추가
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState("고등학교 급식 만족도 연구");
    const [customTheme, setCustomTheme] = useState("");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [previewScores, setPreviewScores] = useState<Record<string, number>>({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
    const [previewResultType, setPreviewResultType] = useState("");
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // 자동 입력 모달 상태
    const [autoFillModalOpen, setAutoFillModalOpen] = useState(false);
    const [autoFillText, setAutoFillText] = useState("");
    const [autoFillTarget, setAutoFillTarget] = useState<"questions" | "results">("questions");

    // 로그인된 유저 정보로 폼 자동 완성
    useEffect(() => {
        if (profile?.name) setAuthorName(profile.name);
        if (profile?.password) setPassword(profile.password);
    }, [profile]);

    const showCustomToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // 초기 12문항 템플릿 (E/I, S/N, T/F, J/P 각 3문항)
    const initialQuestions = [
        { id: 1, typeLabel: "E/I 유형", text: "", option1: "", option2: "", trait1: "E", trait2: "I" },
        { id: 2, typeLabel: "E/I 유형", text: "", option1: "", option2: "", trait1: "E", trait2: "I" },
        { id: 3, typeLabel: "E/I 유형", text: "", option1: "", option2: "", trait1: "E", trait2: "I" },
        { id: 4, typeLabel: "S/N 유형", text: "", option1: "", option2: "", trait1: "S", trait2: "N" },
        { id: 5, typeLabel: "S/N 유형", text: "", option1: "", option2: "", trait1: "S", trait2: "N" },
        { id: 6, typeLabel: "S/N 유형", text: "", option1: "", option2: "", trait1: "S", trait2: "N" },
        { id: 7, typeLabel: "T/F 유형", text: "", option1: "", option2: "", trait1: "T", trait2: "F" },
        { id: 8, typeLabel: "T/F 유형", text: "", option1: "", option2: "", trait1: "T", trait2: "F" },
        { id: 9, typeLabel: "T/F 유형", text: "", option1: "", option2: "", trait1: "T", trait2: "F" },
        { id: 10, typeLabel: "J/P 유형", text: "", option1: "", option2: "", trait1: "J", trait2: "P" },
        { id: 11, typeLabel: "J/P 유형", text: "", option1: "", option2: "", trait1: "J", trait2: "P" },
        { id: 12, typeLabel: "J/P 유형", text: "", option1: "", option2: "", trait1: "J", trait2: "P" },
    ];

    const [questions, setQuestions] = useState(initialQuestions);

    const initialMBTITypes = ["ENTP", "INTJ", "ENFP", "INFJ", "ESTP", "ISTP", "ESFP", "ISFP", "ESTJ", "ISTJ", "ESFJ", "ISFJ", "ENTJ", "INTP", "ENFJ", "INFP"];
    const initialResults = initialMBTITypes.map(type => ({
        type, name: "", description: "", strengths: "", compatibility: "", character: ""
    }));
    const [results, setResults] = useState(initialResults);


    const themeToUse = selectedTheme === "direct" ? customTheme : selectedTheme;

    // AI 지침 프롬프트 생성
    const aiPromptText = `🎯 역할(Role)

너는 MBTI 성격 유형 테스트 문제 생성기야.
'${themeToUse || "자유 주제"}'를 주제로 MBTI 12문제를 만들어. 
그리고 해당 주제와 연관된 16가지 MBTI 결과와 해설을 제공해야 해.

🛠️ 지침(Instructions)
1. 제시된 주제에 맞는 12가지 유형별 문제를 생성하여 보여줘.
2. 그리고 16개의 MBTI 유형 결과를 CSV (쉼표 구분) 형식으로 모두 보여줘.

1. MBTI 문제 생성 (총 12문제)
4가지 축(E-I, S-N, T-F, J-P) × 각 3문제씩 = 총 12문제
각 문제는 질문 + 선택지 2개 형식 (선택지는 반드시 MBTI 유형에 매칭됨)
예시 (E-I)
1번 문제: 나는 대부분의 경우
보기1: 신중하기보다 활기에 넘친다. (E)
보기2: 활기가 넘치기보다 신중하다. (I)

2. 결과 제공
사용자가 요청한 주제와 관련된 16가지 MBTI 유형 결과를 쉼표(,)로 구분된 CSV 형식으로 제공해.
반드시 아래 6개 항목 순서를 지켜서 출력해!
(항목: 유형, 별명, 핵심설명, 강점/약점, 찰떡궁합, 캐릭터비유)
16가지 결과 조합을 꼭 모두 보여줘야 해!

📋 출력 형식 예시
[문제 예시]
[E-I: 에너지의 방향]
1번 문제: 친구들과 모임을 할 때 나는?
보기1: 이야기의 중심에 서서 분위기를 띄운다. (E)
보기2: 조용히 대화를 듣고 필요한 순간에만 말한다. (I)

[최종 결과 예시]
유형,별명,핵심설명,강점/약점,찰떡궁합,캐릭터비유
ENFP,무지개 활동가,사람을 좋아하고 열정이 넘침,창의성 / 산만함,INTJ,반짝이는 아이디어 뱅크 불꽃놀이
ISTJ,완벽한 기록술사,매뉴얼대로 움직이는 정확함,책임감이 강함 / 변화에 취약함,ESFP,우리 반의 걸어 다니는 백과사전`;
    // 질문 데이터 자동 파싱
    const parseQuestions = (text: string) => {
        const parsed = [...questions];
        let currentIdx = -1;
        const lines = text.split('\n');

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            if (trimmed.includes('문제:')) {
                currentIdx++;
                if (currentIdx < 12) {
                    const parts = trimmed.split('문제:');
                    parsed[currentIdx].text = parts.slice(1).join('문제:').trim();
                }
            } else if (trimmed.startsWith('보기1:')) {
                if (currentIdx >= 0 && currentIdx < 12) {
                    let content = trimmed.replace('보기1:', '').trim();
                    const match = content.match(/\(([EISTNFJP])\)$/i);
                    if (match) {
                        parsed[currentIdx].trait1 = match[1].toUpperCase();
                        content = content.replace(/\([EISTNFJP]\)$/i, '').trim();
                    }
                    parsed[currentIdx].option1 = content;
                }
            } else if (trimmed.startsWith('보기2:')) {
                if (currentIdx >= 0 && currentIdx < 12) {
                    let content = trimmed.replace('보기2:', '').trim();
                    const match = content.match(/\(([EISTNFJP])\)$/i);
                    if (match) {
                        parsed[currentIdx].trait2 = match[1].toUpperCase();
                        content = content.replace(/\([EISTNFJP]\)$/i, '').trim();
                    }
                    parsed[currentIdx].option2 = content;
                }
            }
        });
        setQuestions(parsed);
        showCustomToast("✨ 질문 데이터 자동 입력 완료!");
        setAutoFillModalOpen(false);
        setAutoFillText("");
    };

    // 결과 데이터 자동 파싱
    const parseResults = (text: string) => {
        const parsed = [...results];
        const lines = text.split('\n');

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('유형,')) return;

            const parts = trimmed.split(',');
            if (parts.length >= 5) {
                const type = parts[0].trim().toUpperCase();
                const matchedIdx = parsed.findIndex(r => r.type === type);
                if (matchedIdx !== -1) {
                    parsed[matchedIdx].name = parts[1]?.trim() || "";
                    if (parts.length === 5) {
                        parsed[matchedIdx].description = parts[2]?.trim() || "";
                        parsed[matchedIdx].strengths = "설명 내용 참고";
                        parsed[matchedIdx].compatibility = parts[3]?.trim() || "";
                        parsed[matchedIdx].character = parts[4]?.trim() || "";
                    } else if (parts.length === 6) {
                        parsed[matchedIdx].description = parts[2]?.trim() || "";
                        parsed[matchedIdx].strengths = parts[3]?.trim() || "";
                        parsed[matchedIdx].compatibility = parts[4]?.trim() || "";
                        parsed[matchedIdx].character = parts[5]?.trim() || "";
                    } else {
                        const character = parts[parts.length - 1]?.trim() || "";
                        const compatibility = parts[parts.length - 2]?.trim() || "";
                        const middle = parts.slice(2, parts.length - 2).join(', ');
                        parsed[matchedIdx].description = middle;
                        parsed[matchedIdx].strengths = "설명 내용 참고";
                        parsed[matchedIdx].compatibility = compatibility;
                        parsed[matchedIdx].character = character;
                    }
                }
            }
        });
        setResults(parsed);
        showCustomToast("✨ 결과 데이터 자동 입력 완료!");
        setAutoFillModalOpen(false);
        setAutoFillText("");
    };

    // 데이터 불러오기 함수 (CRUD - Read) - 보안 강화 (비밀번호 체크)
    const loadExistingData = async () => {
        if (!authorName || !password) {
            showCustomToast("불러오기를 위해 연구원 이름과 비밀번호를 모두 입력해주세요!");
            return;
        }

        setIsLoadingData(true);
        try {
            const result = await getAppsScriptJson<any>(new URLSearchParams({ action: "getAllMbtiData" }));

            let isValid = false;
            let loadedQuestions: any[] = [];
            let loadedResults: any[] = [];

            if (Array.isArray(result)) {
                // 구버전 배열 포맷
                const userProject = result.reverse().find((item: any) =>
                    (item.author || item.Author) === authorName && String(item.password || item.Password) === String(password)
                );
                if (userProject) {
                    isValid = true;
                    loadedQuestions = typeof userProject.questions === 'string' ? JSON.parse(userProject.questions) : (userProject.questions || []);
                    loadedResults = typeof userProject.results === 'string' ? JSON.parse(userProject.results) : (userProject.results || []);
                }
            } else if (result.status === "success" && result.data) {
                // 신버전 flat 포맷
                const userAuth = result.data.users?.[authorName];
                isValid = Boolean(userAuth || result.data.questions?.some((q: any) => (q.author || q.Author) === authorName));

                if (isValid) {
                    loadedQuestions = (result.data.questions || []).filter((q: any) => (q.author || q.Author) === authorName);
                    const resultsArray = result.data.results || [];
                    loadedResults = resultsArray.filter((r: any) => (r.author || r.Author) === authorName);

                    loadedResults = loadedResults.map(r => ({
                        type: r.mbti_type || r.type,
                        name: r.name,
                        description: r.description,
                        strengths: r.strengths,
                        compatibility: r.compatibility,
                        character: r.character
                    }));
                }
            }

            if (isValid) {
                if (loadedQuestions.length > 0) setQuestions(loadedQuestions);
                if (loadedResults.length > 0) setResults(loadedResults);
                showCustomToast(`${authorName} 연구원님의 이전 데이터를 성공적으로 불러왔습니다!`);
            } else {
                showCustomToast("이름과 일치하는 프로젝트를 찾을 수 없거나 데이터가 없습니다.");
            }
        } catch (err) {
            console.error("Fetch failed", err);
            showCustomToast("서버 연결 실패. 나중에 다시 시도해주세요.");
        } finally {
            setIsLoadingData(false);
        }
    };

    // MBTI 타입 동적 결정
    const calculateTargetType = () => {
        const types = ["ENTP", "INTJ", "ENFP", "INFJ", "ESTP", "ISTP", "ESFP", "ISFP", "ESTJ", "ISTJ", "ESFJ", "ISFJ", "ENTJ", "INTP", "ENFJ", "INFP"];
        return types[authorName.length % 16];
    };

    // 질문 추가 함수
    const addQuestion = () => {
        const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
        setQuestions([...questions, {
            id: newId,
            typeLabel: "기타 유형",
            text: "",
            option1: "",
            option2: "",
            trait1: "E",
            trait2: "I"
        }]);
    };

    // 프리뷰 질문 넘기기 및 점수 계산
    const handleAnswer = (trait: string) => {
        const safeTrait = trait ? trait.trim().toUpperCase() : "";
        const newScores = { ...previewScores, [safeTrait]: (previewScores[safeTrait] || 0) + 1 };
        setPreviewScores(newScores);

        if (previewIndex < questions.length - 1) {
            setPreviewIndex(previewIndex + 1);
        } else {
            const finalType = [
                (newScores.E || 0) >= (newScores.I || 0) ? "E" : "I",
                (newScores.S || 0) >= (newScores.N || 0) ? "S" : "N",
                (newScores.T || 0) >= (newScores.F || 0) ? "T" : "F",
                (newScores.J || 0) >= (newScores.P || 0) ? "J" : "P",
            ].join("");
            setPreviewResultType(finalType);
            setIsPreviewFinished(true);
        }
    };

    // 프리뷰 초기화
    const resetPreview = () => {
        setPreviewIndex(0);
        setIsPreviewFinished(false);
        setPreviewScores({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
        setPreviewResultType("");
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Contextual Header */}
            <div className="text-center space-y-4 py-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                    AI Web App Maker
                </div>
                <h1 className="text-5xl font-black tracking-tight leading-none"> 나만의 MBTI <span className="text-primary italic">심리테스트 실험실</span></h1>
                <p className="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed pt-2 font-medium">
                    ChatGPT로 기획하고 멋진 웹사이트로 배포해보세요. <br className="hidden md:block" />
                    교실에서 바로 사용할 수 있는 실전형 프로젝트 도구입니다.
                </p>
            </div>

            {/* Step Progress & Main Layout */}
            <div className="glass-card p-4 md:p-8 space-y-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/5 via-primary to-primary/5" />

                {/* Step Indicator Taps */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 border-b border-border/50 pb-8">
                    {[
                        { id: "planning", step: "01", label: "AI 기획하기", icon: "🤖" },
                        { id: "create", step: "02", label: "질문 데이터 입력", icon: "✍️" },
                        { id: "results", step: "03", label: "결과 데이터 입력", icon: "🎉" },
                        { id: "preview", step: "04", label: "라이브 프리뷰", icon: "📱" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`group relative flex items-center gap-4 transition-all duration-500 ${activeTab === tab.id ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-100'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-xl transition-all duration-500 ${activeTab === tab.id ? 'bg-primary text-white rotate-12' : 'bg-secondary text-muted-foreground'}`}>
                                {tab.icon}
                            </div>
                            <div className="text-left">
                                <span className={`text-[10px] font-black tracking-widest block ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'}`}>STEP {tab.step}</span>
                                <span className="text-lg font-black tracking-tight">{tab.label}</span>
                            </div>
                            {activeTab === tab.id && (
                                <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full animate-in zoom-in" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="py-6 min-h-[450px]">
                    {activeTab === "planning" && (
                        <div className="max-w-4xl mx-auto space-y-12 py-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20 rotate-3">
                                    <span className="text-4xl">🧬</span>
                                </div>
                                <h2 className="text-3xl font-black tracking-tight">AI 연구원 등록 및 기획</h2>
                                <p className="text-muted-foreground font-medium">연구원 정보를 등록하고 작업을 시작해볼까요? (보안을 위해 비밀번호를 꼭 설정해주세요!)</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="glass-card p-8 border-primary/20 bg-primary/5 space-y-6 relative overflow-hidden group">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Step 01-A</span>
                                            <h3 className="text-xl font-black">연구원 프로필 (보안)</h3>
                                        </div>
                                        <button
                                            onClick={loadExistingData}
                                            disabled={isLoadingData}
                                            className="px-6 py-2.5 bg-primary text-white text-xs font-black rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 z-10"
                                        >
                                            {isLoadingData ? (
                                                <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 불러오는 중...</>
                                            ) : (
                                                <>작업 불러오기 📂</>
                                            )}
                                        </button>
                                    </div>
                                    <div className="space-y-10">
                                        <div className="space-y-2 group/name">
                                            <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1">Researcher Name</label>
                                            <input
                                                type="text"
                                                placeholder="이름을 입력하세요"
                                                value={authorName}
                                                onChange={(e) => setAuthorName(e.target.value)}
                                                className="w-full bg-black/20 border border-border focus:border-primary rounded-xl px-4 py-3 text-sm font-bold text-foreground outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-2 group/pass">
                                            <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1">Security Key (4 Digit)</label>
                                            <input
                                                type="password"
                                                maxLength={4}
                                                placeholder="비밀번호 4자리"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-black/20 border border-border focus:border-primary rounded-xl px-4 py-3 text-sm font-bold text-foreground outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner tracking-widest"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed italic opacity-70">* 설정하신 이름과 비밀번호로만 소중한 기획안을 다시 불러올 수 있습니다.</p>
                                </div>

                                <div className="glass-card p-8 space-y-6">
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Step 01-B</span>
                                        <h3 className="text-xl font-black">연구 주제 선정</h3>
                                    </div>
                                    <div className="space-y-8">
                                        <select
                                            value={selectedTheme}
                                            onChange={(e) => setSelectedTheme(e.target.value)}
                                            className="w-full bg-secondary/50 border-2 border-border rounded-2xl px-6 py-4 text-sm font-black focus:border-primary outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="고등학교 급식 만족도 연구">고등학교 급식 만족도 연구</option>
                                            <option value="우리 반 친구들의 초능력 유형">우리 반 친구들의 초능력 유형</option>
                                            <option value="미래 AI 개발자 적성 탐구">미래 AI 개발자 적성 탐구</option>
                                            <option value="방과후 활동 성향 분석">방과후 활동 성향 분석</option>
                                            <option value="direct">✨ 직접 입력하기 (Custom)</option>
                                        </select>

                                        {selectedTheme === "direct" && (
                                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                                <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1">Custom Theme</label>
                                                <input
                                                    type="text"
                                                    placeholder="어떤 주제로 만들고 싶나요?"
                                                    value={customTheme}
                                                    onChange={(e) => setCustomTheme(e.target.value)}
                                                    className="w-full bg-black/20 border border-border focus:border-primary rounded-xl px-4 py-3 text-sm font-bold text-foreground outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
                                                />
                                            </div>
                                        )}

                                        <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 text-xs text-orange-600 dark:text-orange-400 font-bold leading-relaxed">
                                            💡 TIP: 주제를 선택하거나 직접 입력한 뒤 아래 AI 추천 프롬프트를 활용해보세요!
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Prompt Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
                                    <h3 className="text-xl font-black">AI에게 질문 세트 요청하기</h3>
                                </div>
                                <div className="p-8 bento-item bg-black/5 dark:bg-white/5 border-2 border-dashed border-primary/20 space-y-6 relative group overflow-hidden">
                                    <div className="flex justify-between items-center text-xs font-black text-muted-foreground uppercase tracking-widest">
                                        <span>Recommended Prompt</span>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(aiPromptText);
                                                showCustomToast("프롬프트가 복사되었습니다!");
                                            }}
                                            className="text-primary hover:underline flex items-center gap-2"
                                        >
                                            복사하기 📋
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <pre className="text-sm font-bold leading-relaxed whitespace-pre-wrap text-foreground/80 overflow-y-auto max-h-[300px] pr-4 custom-scrollbar min-h-[100px]">
                                            {aiPromptText}
                                        </pre>
                                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center pt-6">
                                <button
                                    onClick={() => {
                                        if (!password || password.length < 4) {
                                            showCustomToast("보안을 위해 4자리 비밀번호를 입력해주세요!");
                                            return;
                                        }
                                        setActiveTab("create");
                                    }}
                                    className="px-12 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 animate-bounce"
                                >
                                    좋아요, 다음 단계로! <span className="text-xl">➡️</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "create" && (
                        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-primary/5 p-8 rounded-[2rem] border border-primary/20">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                        질문 데이터 시트 <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Researcher Mode</span>
                                    </h2>
                                    <p className="text-sm text-muted-foreground">연구원 <span className="text-primary font-black">{authorName || "(미등록)"}</span>님이 설계한 12문항을 입력해주세요.</p>
                                </div>
                                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                                    <button
                                        onClick={() => {
                                            setAutoFillTarget("questions");
                                            setAutoFillModalOpen(true);
                                        }}
                                        className="w-full md:w-auto px-6 py-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-sm font-black rounded-xl hover:bg-indigo-600/30 transition-all shadow-lg flex items-center justify-center gap-2 group/btn"
                                    >
                                        <span className="text-lg">✨</span> AI 데이터 파싱
                                    </button>
                                    <button
                                        onClick={addQuestion}
                                        className="w-full md:w-auto px-6 py-3 bg-primary text-white text-sm font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group/btn"
                                    >
                                        <span className="text-lg group-hover/btn:rotate-90 transition-transform">+</span> 항목 추가
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-12">
                                {questions.map((q, idx) => {
                                    const isCompleted = q.text.trim() !== "" && q.option1.trim() !== "" && q.option2.trim() !== "";
                                    return (
                                        <div key={idx} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-2xl font-black italic ${isCompleted ? 'text-primary' : 'text-primary/40'}`}>{idx + 1}.</span>
                                                <span className={`px-4 py-1.5 border rounded-full text-[12px] font-black uppercase tracking-widest leading-none ${isCompleted ? 'bg-primary text-white border-primary' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                                                    [{q.typeLabel}]
                                                </span>
                                                {isCompleted && <span className="text-primary text-sm font-bold">✨ 작성 완료</span>}
                                            </div>

                                            <div className={`glass-card p-4 md:p-8 space-y-8 group/item transition-all duration-300 shadow-xl shadow-black/5 ${isCompleted ? 'border-primary/80 bg-primary/5 opacity-100 ring-4 ring-primary/20' : 'border-border/50 hover:border-primary/50 opacity-80'}`}>
                                                {/* 문제 입력 */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Question Content
                                                    </div>
                                                    <input
                                                        id={`question-text-${idx}`}
                                                        type="text"
                                                        placeholder="문제: 질문 내용을 입력하세요"
                                                        value={q.text}
                                                        onChange={(e) => {
                                                            const newQuestions = [...questions];
                                                            newQuestions[idx].text = e.target.value;
                                                            setQuestions(newQuestions);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const nextInput = document.getElementById(`question-opt1-${idx}`);
                                                                if (nextInput) nextInput.focus();
                                                            }
                                                        }}
                                                        className="w-full bg-transparent border-none text-2xl font-black placeholder:text-muted-foreground/30 focus:outline-none text-white drop-shadow-md p-0"
                                                    />
                                                </div>

                                                {/* 보기 입력 */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Option 01
                                                            </div>
                                                            <select
                                                                value={q.trait1}
                                                                onChange={(e) => {
                                                                    const newQuestions = [...questions];
                                                                    newQuestions[idx].trait1 = e.target.value;
                                                                    setQuestions(newQuestions);
                                                                }}
                                                                className="text-[10px] font-black bg-secondary/50 border border-border px-2 py-1 rounded-md"
                                                            >
                                                                {["E", "I", "S", "N", "T", "F", "P", "J"].map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                        <input
                                                            id={`question-opt1-${idx}`}
                                                            type="text"
                                                            placeholder="보기1의 내용을 입력하세요"
                                                            value={q.option1}
                                                            onChange={(e) => {
                                                                const newQuestions = [...questions];
                                                                newQuestions[idx].option1 = e.target.value;
                                                                setQuestions(newQuestions);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    const nextInput = document.getElementById(`question-opt2-${idx}`);
                                                                    if (nextInput) nextInput.focus();
                                                                }
                                                            }}
                                                            className="w-full bg-black/40 border-2 border-border focus:border-indigo-500/50 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all shadow-inner text-white"
                                                        />
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Option 02
                                                            </div>
                                                            <select
                                                                value={q.trait2}
                                                                onChange={(e) => {
                                                                    const newQuestions = [...questions];
                                                                    newQuestions[idx].trait2 = e.target.value;
                                                                    setQuestions(newQuestions);
                                                                }}
                                                                className="text-[10px] font-black bg-secondary/50 border border-border px-2 py-1 rounded-md"
                                                            >
                                                                {["E", "I", "S", "N", "T", "F", "P", "J"].map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                        <input
                                                            id={`question-opt2-${idx}`}
                                                            type="text"
                                                            placeholder="보기2의 내용을 입력하세요"
                                                            value={q.option2}
                                                            onChange={(e) => {
                                                                const newQuestions = [...questions];
                                                                newQuestions[idx].option2 = e.target.value;
                                                                setQuestions(newQuestions);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    const nextInput = document.getElementById(`question-text-${idx + 1}`);
                                                                    if (nextInput) {
                                                                        nextInput.focus();
                                                                        nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full bg-black/40 border-2 border-border focus:border-pink-500/50 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all shadow-inner text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="flex justify-center pt-10">
                                <button
                                    onClick={() => setActiveTab("results")}
                                    className="px-16 py-5 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-[2rem] font-black shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group"
                                >
                                    결과 데이터 16개 입력하기 <span className="text-2xl group-hover:rotate-12 transition-transform">➡️</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "results" && (
                        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-primary/5 p-8 rounded-[2rem] border border-primary/20">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                        결과 데이터 시트 <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">16 Types</span>
                                    </h2>
                                    <p className="text-sm text-muted-foreground">AI가 만들어준 16가지 MBTI 결과를 정리해보세요. 빈칸으로 두면 기본값이 적용됩니다.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setAutoFillTarget("results");
                                        setAutoFillModalOpen(true);
                                    }}
                                    className="w-full md:w-auto px-6 py-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-sm font-black rounded-xl hover:bg-indigo-600/30 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <span className="text-lg">✨</span> AI 결과 파싱
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {results.map((res, idx) => {
                                    const isCompleted = res.name.trim() !== "" && res.description.trim() !== "" && res.character.trim() !== "" && res.strengths.trim() !== "" && res.compatibility.trim() !== "";
                                    return (
                                        <div key={idx} className={`glass-card p-6 space-y-5 transition-all duration-300 ${isCompleted ? 'border-primary/80 bg-primary/5 opacity-100 ring-4 ring-primary/20' : 'hover:border-primary/40 border-border/50 opacity-80'}`}>
                                            <div className="flex items-center justify-between border-b border-border/50 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-2xl font-black ${isCompleted ? 'text-primary' : 'text-primary/60'}`}>{res.type}</span>
                                                    {isCompleted && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter">완료</span>}
                                                </div>
                                                <input
                                                    id={`result-name-${idx}`}
                                                    type="text"
                                                    placeholder="유형 별명 (예: 재기발랄 활동가)"
                                                    value={res.name}
                                                    onChange={(e) => {
                                                        const newResults = [...results];
                                                        newResults[idx].name = e.target.value;
                                                        setResults(newResults);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const nextInput = document.getElementById(`result-desc-${idx}`);
                                                            if (nextInput) nextInput.focus();
                                                        }
                                                    }}
                                                    className={`w-[140px] text-right bg-transparent border-none text-sm font-bold placeholder:text-muted-foreground/50 focus:outline-none ${isCompleted ? 'text-white' : 'text-white/90'}`}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">핵심 설명</label>
                                                    <textarea
                                                        id={`result-desc-${idx}`}
                                                        placeholder="핵심 성격 요약"
                                                        value={res.description}
                                                        onChange={(e) => {
                                                            const newResults = [...results];
                                                            newResults[idx].description = e.target.value;
                                                            setResults(newResults);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            // textarea는 엔터로 넘어가지 않고 shift+enter로 줄바꿈하거나 넘기지 않음
                                                        }}
                                                        className="w-full h-20 bg-black/40 border-2 border-border focus:border-primary/50 rounded-xl px-4 py-3 text-xs font-medium outline-none resize-none transition-all shadow-inner custom-scrollbar text-white placeholder:text-muted-foreground/50"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">캐릭터 비유</label>
                                                    <input
                                                        type="text"
                                                        placeholder="당신은 파티의 불꽃놀이!"
                                                        value={res.character}
                                                        onChange={(e) => {
                                                            const newResults = [...results];
                                                            newResults[idx].character = e.target.value;
                                                            setResults(newResults);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const nextInput = document.getElementById(`result-strength-${idx}`);
                                                                if (nextInput) nextInput.focus();
                                                            }
                                                        }}
                                                        className="w-full bg-black/40 border-2 border-border focus:border-primary/50 rounded-xl px-4 py-2.5 text-xs font-medium outline-none transition-all shadow-inner text-white placeholder:text-muted-foreground/50"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">강점/약점</label>
                                                        <input
                                                            id={`result-strength-${idx}`}
                                                            type="text"
                                                            placeholder="창의성 / 산만함"
                                                            value={res.strengths}
                                                            onChange={(e) => {
                                                                const newResults = [...results];
                                                                newResults[idx].strengths = e.target.value;
                                                                setResults(newResults);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    const nextInput = document.getElementById(`result-compat-${idx}`);
                                                                    if (nextInput) nextInput.focus();
                                                                }
                                                            }}
                                                            className="w-full bg-black/40 border-2 border-border focus:border-primary/50 rounded-xl px-3 py-2 text-[11px] font-medium outline-none transition-all text-white placeholder:text-muted-foreground/50"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">찰떡궁합</label>
                                                        <input
                                                            id={`result-compat-${idx}`}
                                                            type="text"
                                                            placeholder="INFJ, ENTP"
                                                            value={res.compatibility}
                                                            onChange={(e) => {
                                                                const newResults = [...results];
                                                                newResults[idx].compatibility = e.target.value;
                                                                setResults(newResults);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    const nextInput = document.getElementById(`result-name-${idx + 1}`);
                                                                    if (nextInput) {
                                                                        nextInput.focus();
                                                                        nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full bg-black/40 border-2 border-border focus:border-primary/50 rounded-xl px-3 py-2 text-[11px] font-medium outline-none transition-all text-white placeholder:text-muted-foreground/50"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="flex justify-center pt-10">
                                <button
                                    onClick={() => setActiveTab("preview")}
                                    className="px-16 py-5 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-[2rem] font-black shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group"
                                >
                                    모의 앱 테스트 하러가기 <span className="text-2xl group-hover:rotate-12 transition-transform">📱</span>
                                </button>
                            </div>
                        </div>
                    )
                    }

                    {
                        activeTab === "preview" && (
                            <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 max-w-5xl mx-auto py-6 animate-in fade-in slide-in-from-right-10 duration-700">
                                <div className="flex-1 space-y-8 text-center lg:text-left">
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black rounded-full uppercase tracking-tighter">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Testing Mode
                                        </div>
                                        <h2 className="text-4xl font-black tracking-tight leading-tight">내 스마트폰에서<br className="hidden lg:block" />어떻게 보일까요?</h2>
                                        <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                                            작성하신 질문과 보기 내용이 실제 앱에서 어떻게 작동하는지 확인해보세요.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-5 rounded-3xl bg-secondary/50 border border-border flex flex-col items-center lg:items-start gap-2">
                                            <span className="text-xl">✨</span>
                                            <p className="text-xs font-black">부드러운 화면 전환</p>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-secondary/50 border border-border flex flex-col items-center lg:items-start gap-2">
                                            <span className="text-xl">📝</span>
                                            <p className="text-xs font-black">오타 및 문맥 체크</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Mockup */}
                                <div className="w-[340px] h-[680px] rounded-[3.5rem] border-[12px] border-slate-900 bg-black shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col p-8 group shrink-0">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50" />

                                    <div className="flex justify-between items-center text-[10px] text-white/40 font-bold mb-8 relative z-10 px-2 pt-2">
                                        <span>9:41</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 border border-white/20 rounded-sm" />
                                            <div className="w-4 h-2.5 bg-white/20 rounded-sm" />
                                        </div>
                                    </div>

                                    <div className="w-full h-1 bg-white/10 rounded-full mb-12 relative z-10 overflow-hidden">
                                        <div
                                            className="h-full bg-primary shadow-[0_0_15px_rgba(129,140,248,0.8)] transition-all duration-700 ease-out"
                                            style={{ width: `${((previewIndex + 1) / questions.length) * 100}%` }}
                                        />
                                    </div>

                                    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
                                        {!isPreviewFinished ? (
                                            <div className="w-full space-y-10 animate-in fade-in slide-in-from-right-5 duration-500" key={previewIndex}>
                                                <div className="space-y-4 px-2">
                                                    <h3 className="text-4xl font-black italic text-primary drop-shadow-[0_0_20px_rgba(129,140,248,0.4)]">Q. {String(previewIndex + 1).padStart(2, '0')}</h3>
                                                    <p className="text-lg font-bold leading-tight tracking-tight text-white/90 min-h-[5rem] flex items-center justify-center">
                                                        {questions[previewIndex]?.text || "질문을 입력해주세요!"}
                                                    </p>
                                                </div>
                                                <div className="space-y-4 w-full px-4">
                                                    <button
                                                        onClick={() => handleAnswer(questions[previewIndex]?.trait1 || "E")}
                                                        className="w-full py-5 px-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary hover:border-primary hover:scale-[1.02] active:scale-95 transition-all font-black text-xs text-white/70 hover:text-white leading-relaxed"
                                                    >
                                                        {questions[previewIndex]?.option1 || "보기 1"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleAnswer(questions[previewIndex]?.trait2 || "I")}
                                                        className="w-full py-5 px-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary hover:border-primary hover:scale-[1.02] active:scale-95 transition-all font-black text-xs text-white/70 hover:text-white leading-relaxed"
                                                    >
                                                        {questions[previewIndex]?.option2 || "보기 2"}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full space-y-10 animate-in zoom-in-95 duration-700">
                                                <div className="w-24 h-24 bg-primary/20 rounded-[2.5rem] flex items-center justify-center mx-auto border border-primary/30 shadow-2xl shadow-primary/20">
                                                    <span className="text-4xl animate-pulse">🧪</span>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                                                        Test Completed
                                                    </div>
                                                    <h3 className="text-2xl font-black text-white leading-tight">
                                                        당신은<br />
                                                        <span className="text-primary tracking-tight">
                                                            {(results && results.find(r => r.type.trim().toUpperCase() === (previewResultType || calculateTargetType()).trim().toUpperCase())?.name) || (results && results[0]?.name) || "직함 미정"}
                                                        </span>
                                                        입니다!
                                                    </h3>
                                                    <p className="text-xs text-white/60 leading-relaxed max-w-[240px] mx-auto font-medium line-clamp-3">
                                                        {(results && results.find(r => r.type.trim().toUpperCase() === (previewResultType || calculateTargetType()).trim().toUpperCase())?.description) || (results && results[0]?.description) || "작성해주신 결과 설명이 이 곳에 표시됩니다."}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={resetPreview}
                                                    className="px-8 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all font-black text-[10px] text-white uppercase tracking-[0.2em] border border-white/10"
                                                >
                                                    다시 테스트하기
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-indigo-500/10 pointer-events-none" />
                                </div>
                            </div>
                        )
                    }
                </div >

                {/* Global Actions Bar */}
                < div className="border-t border-border/50 pt-8 flex flex-col gap-6" >
                    {!isSaved && (
                        <div className="w-full flex flex-col md:flex-row items-center justify-between bg-orange-500/10 p-4 rounded-xl border border-orange-500/20 gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl animate-bounce">🚨</span>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400">데이터가 아직 완전히 저장되지 않았습니다!</p>
                                    <p className="text-xs text-orange-600/70 dark:text-orange-400/70 font-medium">페이지를 닫거나 새로고침하면 입력하신 내용이 소실됩니다. 반드시 '쇼케이스에 저장하기' 버튼을 눌러주세요.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end w-full">
                        <button
                            onClick={async () => {
                                if (isSaved) {
                                    router.push('/showcase');
                                    return;
                                }

                                if (!authorName || !password) {
                                    showCustomToast("연구원 이름과 비밀번호를 모두 입력해주세요!");
                                    setActiveTab("planning");
                                    return;
                                }

                                setIsSaving(true);
                                const targetType = calculateTargetType();
                                try {
                                    await postAppsScript({
                                        action: 'saveMbti',
                                        author: authorName,
                                        password: password, // 비밀번호 포함하여 저장
                                        type: targetType,
                                        questions: questions,
                                        results: results
                                    });

                                    const syncPayload = {
                                        userName: authorName,
                                        timestamp: Date.now()
                                    };
                                    localStorage.setItem("mbti_week0_last_saved", JSON.stringify(syncPayload));
                                    localStorage.setItem("mbti_week0_force_refresh", String(syncPayload.timestamp));
                                    window.dispatchEvent(new CustomEvent("mbti:save-complete", { detail: syncPayload }));

                                    setIsSaved(true);
                                    showCustomToast("데이터가 안전하게 저장되었습니다! 전시관으로 이동합니다.");
                                    setTimeout(() => {
                                        router.push('/showcase');
                                    }, 1500);
                                } catch (err) {
                                    console.error("Data transfer failed:", err);
                                    showCustomToast("서버 저장 실패! 다시 시도해주세요.");
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                            disabled={isSaving}
                            className={`px-12 py-4 text-white text-xs font-black rounded-2xl shadow-2xl transition-all text-center uppercase tracking-widest ${isSaved
                                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                                : 'bg-primary hover:scale-105 active:scale-95 shadow-primary/30'
                                }`}
                        >
                            {isSaving ? (
                                <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" /> 저장 중...</>
                            ) : isSaved ? (
                                "저장 완료! 전시관 구경하기 ✨"
                            ) : (
                                "쇼케이스에 저장하기 ✨"
                            )}
                        </button>
                    </div>
                </div >
            </div >

            {/* AI Auto Fill Modal */}
            {
                autoFillModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-black/40 border border-primary/20 p-8 rounded-3xl shadow-2xl max-w-2xl w-full space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="space-y-2 text-center text-white">
                                <h3 className="text-2xl font-black flex items-center justify-center gap-2">
                                    <span>✨</span> AI 생성 내용 자동 입력
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    ChatGPT에서 복사한 {autoFillTarget === 'questions' ? '질문 텍스트들' : '결과 CSV 표'}을(를) 아래에 붙여넣어주세요.
                                </p>
                            </div>
                            <textarea
                                value={autoFillText}
                                onChange={(e) => setAutoFillText(e.target.value)}
                                placeholder="이곳에 복사한 내용을 붙여넣으세요..."
                                className="w-full h-64 bg-black/50 border-2 border-primary/30 focus:border-primary rounded-xl px-4 py-3 text-sm font-medium text-white outline-none resize-none transition-all custom-scrollbar"
                            />
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setAutoFillModalOpen(false)}
                                    className="flex-1 py-3 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/80 transition-all"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={() => autoFillTarget === 'questions' ? parseQuestions(autoFillText) : parseResults(autoFillText)}
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
                                >
                                    자동 입력 실행하기
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 토스트 알림 컴포넌트 */}
            {
                toastMessage && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-primary/90 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl z-50 animate-in fade-in zoom-in duration-300 flex items-center gap-2 border border-white/20 whitespace-nowrap">
                        ✨ {toastMessage}
                    </div>
                )
            }
        </div >
    );
}

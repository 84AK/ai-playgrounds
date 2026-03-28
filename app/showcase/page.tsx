"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { APPS_SCRIPT_URL } from "../constants";
import useLocalProfile from "@/hooks/useLocalProfile";

export default function Showcase() {
    const profile = useLocalProfile();
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [selectedDate, setSelectedDate] = useState("");
    const [likedProjects, setLikedProjects] = useState<Record<number, boolean>>({});

    // 새로운 필터링 상태 추가
    const [schoolFilter, setSchoolFilter] = useState("all");
    const [gradeFilter, setGradeFilter] = useState("all");
    const [classFilter, setClassFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // 커스텀 쇼케이스 등록용 상태
    const [showModal, setShowModal] = useState(false);
    const [showEditAuthModal, setShowEditAuthModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [activeProject, setActiveProject] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [alertModal, setAlertModal] = useState<{ isOpen: boolean, type: 'success' | 'error', message: string }>({ isOpen: false, type: 'success', message: '' });
    const [formData, setFormData] = useState({
        author: "",
        title: "",
        description: "",
        url: "",
        password: "",
        type: "MBTI"
    });
    const [authInput, setAuthInput] = useState({ author: "", password: "" });
    const [deletePassword, setDeletePassword] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            author: profile?.name || "",
            password: profile?.password || ""
        }));
    }, [profile]);

    useEffect(() => {
        const stored = localStorage.getItem('mbti_likedProjects');
        if (stored) {
            try {
                setLikedProjects(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse liked projects", e);
            }
        }
    }, []);

    // 삭제된 좋아요 로직 제외
    const toggleLike = (e: React.MouseEvent, projectId: number) => {
        e.preventDefault();
        // 삭제 예정이므로 빈 함수
    };

    const toDateKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const parseTimestamp = (value: unknown): Date | null => {
        if (!value) return null;
        if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

        const raw = String(value).trim();
        if (!raw) return null;

        const direct = new Date(raw);
        if (!Number.isNaN(direct.getTime())) return direct;

        // Google Sheet의 "2026. 3. 5 오후 2:14:03" 형태 대응
        const normalized = raw.replace(/\./g, "-").replace(/\s+/g, " ").trim();
        const koreanMatch = normalized.match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})\s*(오전|오후)?\s*(\d{1,2})?:(\d{1,2})(?::(\d{1,2}))?$/
        );

        if (koreanMatch) {
            const year = Number(koreanMatch[1]);
            const month = Number(koreanMatch[2]) - 1;
            const day = Number(koreanMatch[3]);
            const ampm = koreanMatch[4];
            let hour = Number(koreanMatch[5] || 0);
            const minute = Number(koreanMatch[6] || 0);
            const second = Number(koreanMatch[7] || 0);

            if (ampm === "오후" && hour < 12) hour += 12;
            if (ampm === "오전" && hour === 12) hour = 0;

            const parsed = new Date(year, month, day, hour, minute, second);
            if (!Number.isNaN(parsed.getTime())) return parsed;
        }

        const dateOnly = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (dateOnly) {
            const parsed = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
            if (!Number.isNaN(parsed.getTime())) return parsed;
        }

        return null;
    };

    const normalizeCategory = (raw: unknown): "MBTI" | "GAME" | "CUSTOM" => {
        const value = String(raw || "").trim().toUpperCase();
        if (!value) return "CUSTOM";
        if (value.includes("MBTI")) return "MBTI";
        if (value.includes("GAME") || value.includes("POSE")) return "GAME";
        if (value.includes("CUSTOM") || value.includes("일반") || value.includes("커스텀")) return "CUSTOM";
        return "CUSTOM";
    };

    const normalizeSchoolName = (name: string) => {
        if (!name || name === "undefined") return "";
        // 1. 공백 제거 및 오타 수정
        let n = name.replace(/\s+/g, "").replace(/등학교/g, "고등학교");
        
        // 2. 키워드 기반 표준화 (대건)
        if (n.includes("대건")) return "인천대건고등학교";
        if (n.includes("남극")) return "남극고등학교";
        if (n.includes("아크랩스")) return "아크랩스";
        
        // 3. '고', '고등'으로 끝나는 경우 '고등학교'로 통일 (선택사항)
        if (n.endsWith("고") && !n.endsWith("고등학교")) n += "등학교";
        if (n.endsWith("고등") && !n.endsWith("고등학교")) n += "학교";
        
        return n;
    };

    const getCategoryText = (type: string) => {
        if (type === "MBTI") return "MBTI 결과물";
        if (type === "GAME") return "AI 포즈 게임";
        return "일반개발/커스텀앱";
    };

    const isMbtiBuilderOrigin = (item: { source?: string; link?: string }) => {
        const link = String(item.link || "");
        return item.source === "MBTI_BUILDER" || link.includes("/mbti/play?author=");
    };

    const getDescriptionText = (item: { source?: string; description?: string; displayType?: string; type?: string; link?: string }) => {
        if (isMbtiBuilderOrigin(item)) {
            const typeName = item.displayType || "MBTI";
            return `0주차 실습으로 만들어진 MBTI 작품입니다. (${typeName} 유형 테스트)`;
        }

        const savedDescription = (item.description || "").trim();
        if (savedDescription) return savedDescription;

        if (item.type === "CUSTOM") {
            return "작성자가 앱 한 줄 소개를 아직 입력하지 않았습니다.";
        }
        if (item.type === "GAME") {
            return "AI 포즈 게임 실습 결과물입니다.";
        }
        return "MBTI 실습 결과물입니다.";
    };

    // 구글 시트 데이터 로드
    useEffect(() => {
        async function loadData() {
            try {
                // 사용자님이 제공해주신 구글 시트 API URL에 getAllMbtiData 액션 추가 (쇼케이스 데이터 포함)
                const response = await fetch(`${APPS_SCRIPT_URL}?action=getAllMbtiData`);
                const result = await response.json();

                // 새로운 백엔드 응답 구조(mbti_questions, showcase_links) 대응
                let rawProjects: any[] = [];
                let customProjects: any[] = [];

                if (result.status === "success" && result.data) {
                    // MBTI 데이터 파싱 (API가 data 객체 안에 questions로 내려줌)
                    if (result.data.questions) {
                        const uniqueMap = new Map();
                        result.data.questions.forEach((item: any) => {
                            const author = item.Author || item.author || "익명";
                            const type = item.TargetType || item.type || "MBTI";
                            const key = `mbti-${author}-${type}`;
                            if (!uniqueMap.has(key)) {
                                uniqueMap.set(key, {
                                    author, title: `${author} 연구원의 MBTI 테스트`,
                                    type: "CUSTOM",
                                    displayType: type,
                                    source: "MBTI_BUILDER",
                                    link: `/mbti/play?author=${encodeURIComponent(author)}`,
                                    description: ""
                                });
                            }
                        });
                        rawProjects = Array.from(uniqueMap.values());
                    }

                    // 커스텀 링크 파싱 (API가 data 객체 안에 showcase_links 또는 ShowcaseLinks로 내려줌)
                    const showcaseData = result.data.showcase_links || result.data.ShowcaseLinks || result.data.showcaseLinks;
                    if (showcaseData) {
                        customProjects = showcaseData.map((item: any) => ({
                            ...(String(item.Url || item.url || "").includes("/mbti/play?author=")
                                ? { type: "CUSTOM", source: "MBTI_BUILDER" }
                                : {
                                    type: normalizeCategory(item.Type || item.type || item.Category || item.category),
                                    source: "SHOWCASE_LINK"
                                }),
                            timestamp: item.Timestamp || item.timestamp, // 고유 식별자 추가
                            author: item.Author || item.author || "익명",
                            title: item.Title || item.title || "무제 프로젝트",
                            description: item.Description || item.description || "",
                            displayType: "WEB",
                            link: item.Url || item.url || "#",
                            password: String(item.Password || item.password || "") // 권한 확인용
                        }));
                    }
                }

                // 구글 시트 데이터를 정규 앱 카드 형식으로 병합
                // customProjects가 최우선순위를 가지도록 앞에 둡니다.
                const combinedData = [...customProjects, ...rawProjects];

                // 중복되는 링크(이미 쇼케이스에 등록된 MBTI 테스트) 제거
                const uniqueData = [];
                const seenLinks = new Set();
                for (const item of combinedData) {
                    if (!seenLinks.has(item.link)) {
                        seenLinks.add(item.link);
                        uniqueData.push(item);
                    }
                }

                const formatted = uniqueData.map((item: any, idx: number) => {
                    let displayType = item.displayType || "APP";
                    if (displayType.length > 15 || displayType.includes('{') || displayType.includes('[')) displayType = "APP";
                    const createdAt = parseTimestamp(item.timestamp);

                    // 서버에서 아바타 정보(users 객체) 및 프로필 정보를 넘겨주면 활용
                    const userData = result.data?.users?.[item.author];
                    
                    // userData가 문자열인 경우(이전 버전)와 객체인 경우(최신 버전) 모두 대응
                    const userAvatar = typeof userData === 'string' ? userData : userData?.avatar;
                    const school = typeof userData === 'object' ? (userData?.school || "") : "";
                    const grade = typeof userData === 'object' ? (userData?.grade || "") : "";
                    const classGroup = typeof userData === 'object' ? (userData?.classGroup || "") : "";

                    const imageOrEmoji = userAvatar ? userAvatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${item.author || idx}&backgroundColor=b6e3f4`;

                    return {
                        id: idx + 1,
                        timestamp: item.timestamp,
                        title: item.title,
                        author: item.author,
                        type: item.type,
                        description: getDescriptionText(item),
                        link: item.link,
                        password: item.password,
                        source: item.source || "SHOWCASE_LINK",
                        createdAt,
                        createdDateKey: createdAt ? toDateKey(createdAt) : "",
                        tags: ["AI", item.type, displayType],
                        image: imageOrEmoji,
                        // 필터링을 위한 추가 메타데이터
                        school: normalizeSchoolName(school),
                        grade,
                        classGroup
                    };
                });

                setProjects(formatted.reverse()); // 최신순
            } catch (err) {
                console.error("Showcase data fetch failed:", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const typeFilteredProjects = filter === "all" ? projects : projects.filter((p) => p.type === filter);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysStart = new Date(todayStart);
    sevenDaysStart.setDate(sevenDaysStart.getDate() - 6);
    const thirtyDaysStart = new Date(todayStart);
    thirtyDaysStart.setDate(thirtyDaysStart.getDate() - 29);

    const filteredProjects = typeFilteredProjects.filter((project) => {
        // [NEW] 테스트용 이름 및 숫자/기호 포함 이름 필터링 강화
        const authorName = (project.author || "").trim();
        
        // 1. 숫자 또는 특수문자가 포함된 이름 제외 (학번+이름 등 차단)
        // 한글, 영문, 공백만 허용하는 정규표현식
        const isValidName = /^[a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣\s]+$/.test(authorName);
        if (!isValidName) return false;

        // 2. 숫자가 포함되어 있는지 한 번 더 명시적으로 확인
        if (/[0-9]/.test(authorName)) return false;

        // 3. 특정 제외 이름 및 테스트용 키워드 차단
        const lowerName = authorName.toLowerCase();
        if (["은우", "남은", "테스트", "test", "admin", "관리자", "수정테스트"].some(k => lowerName.includes(k))) return false;

        // 4. 이름이 너무 짧거나 비어있는 경우 제외 (익명 등)
        if (authorName.length < 2 || authorName === "익명") return false;

        // --- 기존 필터링 로직 ---
        // 1. 검색어 필터링
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const searchableText = `${project.title} ${project.author} ${project.description} ${project.school}`.toLowerCase();
            if (!searchableText.includes(query)) return false;
        }

        // 2. 학교 필터링
        if (schoolFilter !== "all" && project.school !== schoolFilter) return false;

        // 3. 학년 필터링
        if (gradeFilter !== "all" && String(project.grade) !== gradeFilter) return false;

        // 4. 반 필터링
        if (classFilter !== "all" && String(project.classGroup) !== classFilter) return false;

        return true;
    });

    // 동적 필터 옵션 추출
    const schools = Array.from(new Set(projects.map(p => p.school).filter(s => s && s !== "undefined"))).sort() as string[];
    const grades = Array.from(new Set(projects.map(p => p.grade ? String(p.grade) : "").filter(g => g !== ""))).sort();
    const classes = Array.from(new Set(projects.map(p => p.classGroup ? String(p.classGroup) : "").filter(c => c !== ""))).sort();

    const submitProject = async () => {
        if (!formData.author || !formData.title || !formData.url || !formData.password) {
            setSubmitError("모든 필수 항목을 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            const payload = {
                action: "registerShowcaseLink",
                ...formData
            };

            const response = await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.error || result.status !== "success") {
                throw new Error(result.error || result.message || "등록 실패");
            }

            setIsSubmitting(false);
            setShowModal(false);
            setFormData({ author: "", title: "", description: "", url: "", password: "", type: "MBTI" });
            setAlertModal({
                isOpen: true,
                type: 'success',
                message: "✨ 전시 등록이 완료되었습니다! 잠시 후 갤러리에 반영됩니다."
            });

        } catch (e: any) {
            setSubmitError(e.message || "등록 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요.");
            setIsSubmitting(false);
            setAlertModal({
                isOpen: true,
                type: 'error',
                message: "등록 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요."
            });
        }
    };

    const closeAlertModal = () => {
        setAlertModal({ ...alertModal, isOpen: false });
        if (alertModal.type === 'success') {
            window.location.reload();
        }
    };

    const handleEditClick = (e: React.MouseEvent, project: any) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveProject(project);
        setAuthInput({ author: "", password: "" });
        setSubmitError("");
        setShowEditAuthModal(true);
    };

    const submitEditAuth = () => {
        if (!authInput.author || !authInput.password) {
            setSubmitError("작성자와 비밀번호를 모두 입력해주세요.");
            return;
        }
        if (authInput.author.trim() === activeProject.author.trim() && authInput.password === activeProject.password) {
            setShowEditAuthModal(false);
            setFormData({
                author: activeProject.author,
                title: activeProject.title,
                description: activeProject.description,
                url: activeProject.link,
                password: activeProject.password,
                type: activeProject.type || "CUSTOM"
            });
            setShowEditModal(true);
            setSubmitError("");
        } else {
            setSubmitError("작성자명 또는 비밀번호가 일치하지 않습니다.");
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, project: any) => {
        e.preventDefault(); // 링크 이동 방지
        e.stopPropagation();
        setActiveProject(project);
        setDeletePassword("");
        setSubmitError("");
        setShowDeleteModal(true);
    };

    const submitEditProject = async () => {
        if (!formData.author || !formData.title || !formData.url) {
            setSubmitError("모든 필수 항목을 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            const payload = {
                action: "editShowcaseLink",
                timestamp: activeProject.timestamp,
                ...formData
            };

            const response = await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.error || result.status !== "success") {
                throw new Error(result.error || result.message || "권한 확인(비밀번호) 오류 또는 네트워크 장애가 발생했습니다.");
            }

            setIsSubmitting(false);
            setShowEditModal(false);
            setAlertModal({
                isOpen: true,
                type: 'success',
                message: "✨ 전시 작품이 성공적으로 수정되었습니다! 잠시 후 반영됩니다."
            });

        } catch (e: any) {
            setSubmitError(e.message || "수정 중 오류가 발생했습니다.");
            setIsSubmitting(false);
        }
    };

    const submitDeleteProject = async () => {
        if (!deletePassword) {
            setSubmitError("작품을 삭제하려면 등록 시 설정했던 비밀번호를 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            const payload = {
                action: "deleteShowcaseLink",
                timestamp: activeProject.timestamp,
                password: deletePassword
            };

            const response = await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.error || result.status !== "success") {
                throw new Error(result.error || "비밀번호가 일치하지 않거나 권한이 없습니다.");
            }

            setIsSubmitting(false);
            setShowDeleteModal(false);
            setAlertModal({
                isOpen: true,
                type: 'success',
                message: "🗑️ 전시 작품 삭제가 완료되었습니다. 잠시 후 목록에서 사라집니다."
            });

        } catch (e: any) {
            setSubmitError(e.message || "비밀번호 확인에 실패했습니다.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
                    Open Gallery
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">✨ 우리들의 쇼케이스</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto font-medium">
                    인공지능 미래 연구소의 연구원들이 직접 설계하고 구현한 <br className="hidden md:block" />
                    혁신적인 프로젝트들을 만나보세요.
                </p>
            </div>

            {/* Search and Filters */}
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <input 
                        type="text" 
                        placeholder="연구원 이름, 학교, 또는 프로젝트 제목으로 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 rounded-[2rem] bg-secondary/30 border-2 border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-lg font-bold placeholder:text-muted-foreground/50 shadow-sm"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex justify-center gap-3 flex-wrap">
                    {["all", "MBTI", "GAME", "CUSTOM"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-8 py-3 rounded-2xl text-xs font-black transition-all tracking-widest uppercase ${filter === f
                                ? "bg-primary text-white shadow-xl shadow-primary/30 scale-105"
                                : "bg-secondary/50 hover:bg-muted text-muted-foreground border border-transparent hover:border-border"
                                }`}
                        >
                            {f === "all" ? "전체 보기" : f === "MBTI" ? "🧪 MBTI" : f === "GAME" ? "🎮 GAME" : "💻 CUSTOM"}
                        </button>
                    ))}
                </div>

                {/* Sub Filters (School, Grade, Class) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <select
                            value={schoolFilter}
                            onChange={(e) => setSchoolFilter(e.target.value)}
                            className="w-full appearance-none px-6 py-4 rounded-2xl bg-white border-2 border-border/50 focus:border-primary/50 outline-none font-bold text-sm transition-all pr-12 shadow-sm"
                        >
                            <option value="all">모든 학교</option>
                            {schools.map(school => (
                                <option key={school} value={school}>{school}</option>
                            ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            value={gradeFilter}
                            onChange={(e) => setGradeFilter(e.target.value)}
                            className="w-full appearance-none px-6 py-4 rounded-2xl bg-white border-2 border-border/50 focus:border-primary/50 outline-none font-bold text-sm transition-all pr-12 shadow-sm"
                        >
                            <option value="all">학년 전체</option>
                            {grades.map(grade => (
                                <option key={grade} value={grade}>{grade}학년</option>
                            ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className="w-full appearance-none px-6 py-4 rounded-2xl bg-white border-2 border-border/50 focus:border-primary/50 outline-none font-bold text-sm transition-all pr-12 shadow-sm"
                        >
                            <option value="all">반 전체</option>
                            {classes.map(cls => (
                                <option key={cls} value={cls}>{cls}반</option>
                            ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {isLoading ? (
                    // 로딩 스켈레톤
                    Array(10).fill(0).map((_, i) => (
                        <div key={i} className="h-80 rounded-3xl bg-muted animate-pulse" />
                    ))
                ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => {
                        const isCustom = project.type === "CUSTOM";

                        const handleCardClick = (e: React.MouseEvent) => {
                            setActiveProject(project);
                            setShowDetailModal(true);
                        };

                        return (
                            <div
                                key={project.id}
                                onClick={handleCardClick}
                                className="bento-item cursor-pointer h-auto group overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-500 flex flex-col hover:scale-[1.02] active:scale-95 relative"
                            >
                                {isCustom && (
                                    <>
                                        <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <button
                                                onClick={(e) => handleEditClick(e, project)}
                                                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black hover:text-white hover:scale-110 active:scale-95 transition-all outline-none"
                                                title="수정하기"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteClick(e, project)}
                                                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-destructive hover:text-white hover:scale-110 active:scale-95 transition-all outline-none"
                                                title="삭제하기"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            </button>
                                        </div>
                                        <div className="absolute top-0 right-0 z-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                        </div>
                                    </>
                                )}
                                <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center relative transition-all duration-500 overflow-hidden m-2">
                                    {project.image.startsWith("http") ? (
                                        <img
                                            src={project.image}
                                            alt={project.author}
                                            className="w-32 h-32 group-hover:rotate-12 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 flex items-center justify-center text-[80px] group-hover:rotate-12 transition-transform duration-500 drop-shadow-md">
                                            {project.image}
                                        </div>
                                    )}
                                    {/* `AI LAB` Hover 텍스트 제거됨 */}
                                </div>
                                <div className="p-6 pt-2 space-y-4 flex-1 flex flex-col">
                                    <div className="flex gap-2 flex-wrap mb-1">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${project.type === "MBTI" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                            project.type === "GAME" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                                "bg-primary/10 text-primary border-primary/20"
                                            }`}>
                                            {project.type === "MBTI" ? "MBTI TEST" : project.type === "GAME" ? "GAME" : "CUSTOM APP"}
                                        </span>
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <h3 className="font-black text-lg tracking-tight group-hover:text-primary transition-colors line-clamp-1 py-1">{project.title}</h3>
                                        <p className="text-xs text-muted-foreground font-bold flex items-center gap-1.5 pb-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            {project.author} {isCustom ? "개발자" : "연구원"}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground/80 font-semibold">
                                            카테고리: {getCategoryText(project.type)}
                                        </p>
                                        {(project.school || project.grade) && (
                                            <p className="text-[11px] text-primary/70 font-black">
                                                소속: {project.school} {project.grade ? `${project.grade}학년` : ""} {project.classGroup ? `${project.classGroup}반` : ""}
                                            </p>
                                        )}
                                        {project.createdAt && (
                                            <p className="text-[11px] text-muted-foreground/80 font-semibold">
                                                등록일: {project.createdDateKey}
                                            </p>
                                        )}
                                    </div>
                                    <div className="pt-3 border-t border-border/50">
                                        <div className="w-full text-center py-2.5 rounded-xl bg-secondary group-hover:bg-primary group-hover:text-white text-xs font-black transition-all uppercase tracking-widest shadow-sm group-hover:shadow-primary/30">
                                            상세 보기
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-32 text-center space-y-6 glass-card bg-primary/5 border-primary/10">
                        <div className="text-8xl animate-bounce">🔭</div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black">아직 등록된 작품이 없습니다.</h3>
                            <p className="text-muted-foreground font-medium">첫 번째로 작품을 제작하고 전시관의 주인공이 되어보세요!</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Submit CTA */}
            {!isLoading && (
                <div className="glass-card bg-primary/5 border-primary/20 text-center py-16 mt-20 rounded-[3rem]">
                    <h2 className="text-3xl font-black mb-3">내 작품이 목록에 없나요?</h2>
                    <p className="text-muted-foreground mb-8 font-medium">제작 도구에서 '최종 전시하기'를 누르거나, <br />직접 개발한 커스텀 앱의 링크를 수동 등록하여 전 세계에 멋진 작품을 공개해보세요.</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setShowModal(true)} className="px-10 py-4 bg-primary text-white rounded-[1.25rem] font-black hover:scale-105 transition-transform shadow-2xl shadow-primary/40">
                            내 작품 전시 등록하기 ✨
                        </button>
                    </div>
                </div>
            )}

            {/* Registration Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background max-w-md w-full p-8 rounded-3xl shadow-2xl border border-border scale-in-center animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black">새 작품 전시하기</h3>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted font-bold text-muted-foreground">✕</button>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium mb-6">HTML, React 등 외부에서 직접 개발한 결과물의 웹 링크를 등록하여 쇼케이스에 뽐내보세요.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-primary uppercase tracking-widest mb-1.5 block">카테고리 (Category)</label>
                                <select name="type" value={formData.type} onChange={handleInputChange as any} className="w-full bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-bold text-primary">
                                    <option value="MBTI">🧪 MBTI 결과물</option>
                                    <option value="GAME">🎮 AI 포즈 게임</option>
                                    <option value="CUSTOM">💻 일반 개발/커스텀 앱</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">작성자 (Developer)</label>
                                <input type="text" name="author" value={formData.author} readOnly className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm font-bold text-muted-foreground cursor-not-allowed" title="내 정보 설정에서 변경할 수 있습니다." />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">앱 이름 (App Title)</label>
                                <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="나만의 멋진 MBTI 우주 비행선" className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-medium" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">앱 한 줄 소개 (Description)</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="자바스크립트 캔버스를 이용해 만든 AI 포즈 게임입니다." rows={2} className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-medium resize-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">결과물 웹 URL (Link)</label>
                                <input type="url" name="url" value={formData.url} onChange={handleInputChange} placeholder="https://my-awesome-app.com" className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-medium" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">웹 앱 관리를 위한 고유 비밀번호</label>
                                <input type="password" name="password" value={formData.password} readOnly className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm font-bold text-muted-foreground cursor-not-allowed" title="내 정보 설정의 비밀번호가 자동 연동됩니다." />
                            </div>

                            {submitError && <p className="text-destructive text-sm font-bold bg-destructive/10 p-3 rounded-lg">{submitError}</p>}

                            <button
                                onClick={submitProject}
                                disabled={isSubmitting}
                                className="w-full py-4 mt-4 bg-primary text-white rounded-xl font-black disabled:opacity-50 hover:bg-primary/90 transition-colors flex justify-center items-center"
                            >
                                {isSubmitting ? "🔥 로켓 출발 준비 중..." : "🚀 전시 프로젝트 등록하기"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Auth Modal */}
            {showEditAuthModal && activeProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background max-w-sm w-full p-8 rounded-3xl shadow-2xl border border-border scale-in-center animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black">수정 권한 확인</h3>
                            <button onClick={() => setShowEditAuthModal(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted font-bold text-muted-foreground">✕</button>
                        </div>
                        <p className="text-sm text-foreground font-medium mb-6 leading-relaxed">
                            <span className="text-primary font-bold">[{activeProject.title}]</span> 작품을 수정하려면 등록 시 입력했던 <br />작성자와 비밀번호가 필요합니다.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">작성자 명</label>
                                <input
                                    type="text"
                                    value={authInput.author}
                                    onChange={(e) => setAuthInput(prev => ({ ...prev, author: e.target.value }))}
                                    placeholder="홍길동"
                                    className="w-full bg-secondary/50 border border-border focus:border-primary rounded-xl px-4 py-3 text-sm focus:outline-none font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">비밀번호</label>
                                <input
                                    type="password"
                                    value={authInput.password}
                                    onChange={(e) => setAuthInput(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="설정하셨던 비밀번호"
                                    className="w-full bg-secondary/50 border border-border focus:border-primary rounded-xl px-4 py-3 text-sm focus:outline-none font-medium"
                                />
                            </div>

                            {submitError && <p className="text-destructive text-sm font-bold bg-destructive/10 p-3 rounded-lg">{submitError}</p>}

                            <button
                                onClick={submitEditAuth}
                                className="w-full py-4 mt-4 bg-primary text-white rounded-xl font-black hover:bg-primary/90 transition-colors flex justify-center items-center"
                            >
                                수정 창 열기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && activeProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background max-w-md w-full p-8 rounded-3xl shadow-2xl border border-border scale-in-center animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black">작품 정보 수정하기</h3>
                            <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted font-bold text-muted-foreground">✕</button>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium mb-6"><span className="text-primary font-bold">[{activeProject.title}]</span> 정보를 수정합니다. 수정을 완료하려면 처음에 설정했던 비밀번호를 입력해야 합니다.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">작성자 (Developer)</label>
                                <input type="text" name="author" value={formData.author} onChange={handleInputChange} className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-medium" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">앱 이름 (App Title)</label>
                                <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-medium" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">앱 한 줄 소개 (Description)</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={2} className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-medium resize-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">결과물 웹 URL (Link)</label>
                                <input type="url" name="url" value={formData.url} onChange={handleInputChange} className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-medium" />
                            </div>

                            {submitError && <p className="text-destructive text-sm font-bold bg-destructive/10 p-3 rounded-lg">{submitError}</p>}

                            <button
                                onClick={submitEditProject}
                                disabled={isSubmitting}
                                className="w-full py-4 mt-4 bg-primary text-white rounded-xl font-black disabled:opacity-50 hover:bg-primary/90 transition-colors flex justify-center items-center"
                            >
                                {isSubmitting ? "🛠️ 업데이트 중..." : "✏️ 수정사항 저장하기"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && activeProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background max-w-sm w-full p-8 rounded-3xl shadow-2xl border border-destructive/50 scale-in-center animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-destructive">작품 삭제하기</h3>
                            <button onClick={() => setShowDeleteModal(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted font-bold text-muted-foreground">✕</button>
                        </div>
                        <p className="text-sm text-foreground font-medium mb-6 leading-relaxed">
                            정말로 <strong className="text-destructive">[{activeProject.title}]</strong> 전시를 <span className="underline decoration-destructive decoration-2 underline-offset-2">삭제</span>하시겠습니까? <br />
                            <span className="text-muted-foreground text-xs mt-2 block">💡 이 작업은 되돌릴 수 없으며 복구가 불가능합니다.</span>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-destructive uppercase tracking-widest mb-1.5 block">관리용 비밀번호</label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    placeholder="삭제 권한 확인을 위해 입력"
                                    className="w-full bg-secondary/50 border border-destructive/30 focus:border-destructive rounded-xl px-4 py-3 text-sm focus:outline-none font-medium text-destructive placeholder:text-destructive/50 focus:bg-destructive/5"
                                />
                            </div>

                            {submitError && <p className="text-destructive text-sm font-bold bg-destructive/10 p-3 rounded-lg">{submitError}</p>}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3.5 bg-secondary text-foreground hover:bg-secondary/80 rounded-xl font-bold transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={submitDeleteProject}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3.5 bg-destructive text-white rounded-xl font-black disabled:opacity-50 hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/20 transition-all active:scale-95 flex justify-center items-center"
                                >
                                    {isSubmitting ? "💣 파괴 중..." : "🗑️ 영구 삭제"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && activeProject && (
                <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background max-w-lg w-full p-8 rounded-3xl shadow-2xl border border-border scale-in-center animate-in zoom-in-95 duration-200 relative overflow-hidden">

                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />

                        <div className="flex justify-between items-start mb-6 border-b border-border/50 pb-6 relative z-10">
                            <div className="flex gap-4 items-center">
                                {/* Small Avatar / Icon instead of giant thumbnail */}
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/30 flex items-center justify-center overflow-hidden shrink-0 border border-white/5 shadow-inner">
                                    {activeProject.image.startsWith("http") ? (
                                        <img src={activeProject.image} alt={activeProject.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-4xl drop-shadow-sm">{activeProject.image}</div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${activeProject.type === "MBTI" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                            activeProject.type === "GAME" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                                "bg-primary/10 text-primary border-primary/20"
                                            }`}>
                                            {activeProject.type === "MBTI" ? "MBTI TEST" : activeProject.type === "GAME" ? "GAME" : "CUSTOM APP"}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-black">{activeProject.title}</h3>
                                    <p className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        {activeProject.author} {activeProject.type === "CUSTOM" ? "개발자" : "연구원"}
                                    </p>
                                    <p className="text-xs font-semibold text-muted-foreground/90">
                                        카테고리: {getCategoryText(activeProject.type)}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted font-bold text-muted-foreground shrink-0 transition-colors">✕</button>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 opacity-80">Project Description</h4>
                                <div className="relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 rounded-full" />
                                    <p className="text-sm font-medium leading-relaxed bg-secondary/30 p-5 pl-6 rounded-r-xl text-foreground">
                                        {activeProject.description}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Link
                                    href={activeProject.link}
                                    className="w-full py-4 bg-primary text-white rounded-xl font-black hover:bg-primary/90 hover:-translate-y-1 transition-all shadow-xl shadow-primary/20 flex justify-center items-center gap-2 group"
                                >
                                    프로젝트 직접 체험하러 가기
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Modal */}
            {alertModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background max-w-sm w-full p-6 pb-8 rounded-3xl shadow-2xl border border-border scale-in-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center -mt-10 bg-background border-4 border-background shadow-inner">
                            {alertModal.type === 'success' ? (
                                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </div>
                            )}
                        </div>
                        <h3 className={`text-xl font-black text-center mb-2 ${alertModal.type === 'error' ? 'text-destructive' : ''}`}>
                            {alertModal.type === 'success' ? '성공!' : '오류 지속 발생'}
                        </h3>
                        <p className="text-muted-foreground text-center font-medium mb-8 leading-relaxed">
                            {alertModal.message}
                        </p>
                        <button
                            onClick={closeAlertModal}
                            className={`w-full py-3.5 rounded-xl font-black text-white transition-all shadow-lg active:scale-95 ${alertModal.type === 'success' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/25' : 'bg-destructive hover:bg-destructive/90 shadow-destructive/25'
                                }`}
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

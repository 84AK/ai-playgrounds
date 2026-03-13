"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import useLocalProfile, { clearLocalProfile, readLocalProfile, writeLocalProfile } from "@/hooks/useLocalProfile";
import { fetchUserProfile, registerUser } from "@/lib/appsScriptUsers";
import type { UserProfile } from "@/types/auth";

const AVATARS = ["🐶", "🐱", "🐰", "🦊", "🐻", "🐼", "🦁", "🐯", "🐨", "🐸", "🐹", "🐵"];

export default function GlobalAuthGuard() {
    const pathname = usePathname();
    const currentProfile = useLocalProfile();
    const [isMounting, setIsMounting] = useState(true);
    const [step, setStep] = useState<"login" | "avatar" | "authenticated">("authenticated");

    const [formData, setFormData] = useState({
        name: "",
        school: "",
        grade: "",
        classGroup: "",
        password: "",
    });
    const [selectedAvatar, setSelectedAvatar] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [alertMessage, setAlertMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const shouldBypassGuard =
        pathname?.startsWith("/course/") ||
        pathname?.startsWith("/pose/") ||
        pathname === "/curriculum" ||
        pathname === "/guide" ||
        pathname?.startsWith("/admin");

    useEffect(() => {
        if (shouldBypassGuard) {
            setStep("authenticated");
            setIsMounting(false);
            return;
        }

        const checkUserValidity = async () => {
            // 브라우저 로딩 시점에 동기적으로 프로필 존재 여부를 먼저 확인하여 깜빡임 방지
            const profileFromStorage = readLocalProfile();

            if (!profileFromStorage) {
                setStep("login");
                setIsMounting(false);
                return;
            }

            try {
                // 서버에서 해당 유저가 아직 존재하는지 검증 (삭제되었으면 자동 로그아웃)
                try {
                    const verifiedProfile = await fetchUserProfile(profileFromStorage.name);

                    if (verifiedProfile.password !== profileFromStorage.password) {
                        // 유저가 구글 시트에서 삭제되었거나 비밀번호가 변경된 경우
                        clearLocalProfile();
                        setStep("login");
                    } else {
                        setStep("authenticated");
                    }
                } catch (networkError) {
                    // 오프라인이거나 서버 일시적 오류일 경우 기존 접속 유지
                    setStep("authenticated");
                }
            } catch (e) {
                setStep("login");
            }
            setIsMounting(false);
        };

        checkUserValidity();
    }, [shouldBypassGuard]);

    if (shouldBypassGuard || isMounting || step === "authenticated") {
        return null;
    }

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 필수 필드 검사
        if (!formData.name.trim() || !formData.password.trim()) {
            setAlertMessage("이름과 비밀번호를 입력해주세요.");
            return;
        }

        if (!isLoginMode && (!formData.school.trim() || !formData.grade.trim() || !formData.classGroup.trim())) {
            setAlertMessage("모든 필드(이름, 학교, 학년, 반, 비밀번호)를 입력해주세요.");
            return;
        }

        setIsLoading(true);
        try {
            // Check if user exists on the server
            const result = await fetchUserProfile(formData.name).then((profile) => ({
                status: "success" as const,
                data: profile,
            })).catch(() => ({
                status: "error" as const,
                data: null,
            }));

            if (result.status === "success" && result.data) {
                // User exists
                if (!isLoginMode) {
                    // 가입 모드인데 사용자가 존재할 경우 -> 중복 안내
                    setAlertMessage("이미 등록된 이름입니다. 다른 이름을 사용하거나 로그인을 시도해 주세요.");
                    setIsLoading(false);
                    return;
                }

                const dbPassword = result.data.password ? String(result.data.password).trim() : "";
                const inputPassword = formData.password ? formData.password.trim() : "";

                if (dbPassword === inputPassword) {
                    const profile: UserProfile = {
                        name: result.data.name ? String(result.data.name).trim() : "",
                        school: result.data.school ? String(result.data.school).trim() : "",
                        grade: result.data.grade,
                        classGroup: result.data.classGroup,
                        password: dbPassword,
                        avatar: result.data.avatar,
                    };
                    writeLocalProfile(profile);
                    setStep("authenticated");
                } else {
                    setAlertMessage("비밀번호가 일치하지 않습니다.\n(오타나 대소문자를 다시 한번 확인해 주세요!)");
                }
            } else {
                // User not found
                if (isLoginMode) {
                    setAlertMessage("등록된 이름이 없습니다. 처음이시라면 계정을 먼저 만들어주세요.");
                } else {
                    // proceed to sign up (avatar selection)
                    setStep("avatar");
                }
            }
        } catch (e) {
            console.error("Failed to login", e);
            setAlertMessage("서버 연결에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarSelect = (avatar: string) => {
        setSelectedAvatar(avatar);
    };

    const handleCompleteSignUp = async () => {
        if (!selectedAvatar) {
            setAlertMessage("캐릭터를 선택해주세요!");
            return;
        }

        setIsLoading(true);
        const payload: UserProfile = {
            name: formData.name,
            school: formData.school,
            grade: formData.grade,
            classGroup: formData.classGroup,
            password: formData.password,
            avatar: selectedAvatar,
        };

        try {
            await registerUser(payload);
            const verifiedProfile = await fetchUserProfile(payload.name);
            writeLocalProfile(verifiedProfile);
            setStep("authenticated");
        } catch (error) {
            console.error(error);
            setAlertMessage("등록 결과를 확인하지 못했습니다. 앱스 스크립트 배포 상태와 사용자 생성 여부를 확인해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl p-4 text-foreground">
            <div className="bg-card text-foreground w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-300">

                {step === "login" && (
                    <form onSubmit={handleLoginSubmit} className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-2">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">
                                {isLoginMode ? "AI 연구소 로그인" : "AI 연구소 시작하기"}
                            </h2>
                            <p className="text-sm text-muted-foreground break-keep">
                                {isLoginMode ? "이름과 비밀번호를 입력해주세요." : "이름, 학교, 학년, 반 그리고 비밀번호를 설정해주세요."}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">이름 (실명)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-background/50 text-foreground placeholder:text-muted-foreground border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="홍길동"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {!isLoginMode && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">소속 학교</label>
                                        <input
                                            type="text"
                                            required={!isLoginMode}
                                            className="w-full bg-background/50 text-foreground placeholder:text-muted-foreground border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                            placeholder="대건고등학교"
                                            value={formData.school}
                                            onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">학년</label>
                                            <input
                                                type="text"
                                                required={!isLoginMode}
                                                className="w-full bg-background/50 text-foreground placeholder:text-muted-foreground border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                                placeholder="1"
                                                value={formData.grade}
                                                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">반</label>
                                            <input
                                                type="text"
                                                required={!isLoginMode}
                                                className="w-full bg-background/50 text-foreground placeholder:text-muted-foreground border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                                placeholder="2"
                                                value={formData.classGroup}
                                                onChange={(e) => setFormData({ ...formData, classGroup: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-primary/80 font-medium pl-1">
                                        * 1학년 2반 형식으로 입력할 수 있게 도와줍니다.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">비밀번호 {isLoginMode ? "입력" : "설정"}</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full bg-background/50 text-foreground placeholder:text-muted-foreground border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                        placeholder={isLoginMode ? "비밀번호" : "기억하기 쉬운 비밀번호"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    확인 중...
                                </>
                            ) : (isLoginMode ? "로그인" : "다음 단계로")}
                        </button>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLoginMode(!isLoginMode);
                                    setFormData({ ...formData, school: "", grade: "", classGroup: "" });
                                }}
                                className="text-sm text-primary hover:underline hover:text-primary/80 transition-colors"
                            >
                                {isLoginMode ? "처음이신가요? 계정 만들기" : "이미 계정이 있으신가요? 로그인"}
                            </button>
                        </div>
                    </form>
                )}

                {step === "avatar" && (
                    <div className="space-y-8 animate-in slide-in-from-right-8 duration-300">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">캐릭터 선택</h2>
                            <p className="text-sm text-muted-foreground">연구소에서 활동할 내 캐릭터를 골라주세요!</p>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            {AVATARS.map((avatar, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAvatarSelect(avatar)}
                                    className={`aspect-square text-5xl flex items-center justify-center rounded-2xl transition-all ${selectedAvatar === avatar
                                        ? "bg-primary/20 border-2 border-primary scale-105 shadow-lg shadow-primary/20"
                                        : "bg-background/50 border border-white/5 hover:bg-white/5 hover:scale-105"
                                        }`}
                                >
                                    {avatar}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep("login")}
                                className="flex-1 py-4 bg-white/5 rounded-xl font-medium hover:bg-white/10 transition-colors"
                            >
                                뒤로
                            </button>
                            <button
                                onClick={handleCompleteSignUp}
                                disabled={!selectedAvatar || isLoading}
                                className="flex-[2] py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : "연구소 입장하기 🚀"}
                            </button>
                        </div>
                    </div>
                )}

                {/* 에러/알림 팝업 모달 */}
                {alertMessage && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-[200] flex items-center justify-center rounded-[2.5rem] animate-in fade-in duration-200">
                        <div className="bg-card/90 border border-white/10 p-8 rounded-3xl shadow-2xl text-center space-y-6 w-[85%] max-w-xs transform animate-in zoom-in-95 duration-200">
                            <div className="space-y-2">
                                <div className="text-3xl">⚠️</div>
                                <h3 className="text-base font-bold break-keep leading-relaxed text-foreground">
                                    {alertMessage}
                                </h3>
                            </div>
                            <button
                                onClick={() => setAlertMessage("")}
                                className="inline-flex items-center justify-center px-8 py-2.5 rounded-full bg-primary text-white hover:bg-primary/90 font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

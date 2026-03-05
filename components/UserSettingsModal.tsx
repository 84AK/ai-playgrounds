"use client";

import { useState, useEffect } from "react";
import type { UserProfile } from "./GlobalAuthGuard";
import { APPS_SCRIPT_URL } from "@/app/constants";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const AVATARS = ["🐶", "🐱", "🐰", "🦊", "🐻", "🐼", "🦁", "🐯", "🐨", "🐸", "🐹", "🐵"];

export default function UserSettingsModal({ isOpen, onClose }: Props) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [passwordInput, setPasswordInput] = useState("");
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const [editData, setEditData] = useState({
        name: "",
        school: "",
        password: "",
    });
    const [selectedAvatar, setSelectedAvatar] = useState("");
    const [showPasswordUnlock, setShowPasswordUnlock] = useState(false);
    const [showPasswordEdit, setShowPasswordEdit] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const savedData = localStorage.getItem("lab_user_profile");
            if (savedData) {
                const parsed = JSON.parse(savedData) as UserProfile;
                setProfile(parsed);
                setEditData({ name: parsed.name, school: parsed.school, password: parsed.password || "" });
                setSelectedAvatar(parsed.avatar);
            }
            setIsUnlocked(false);
            setPasswordInput("");
            setErrorText("");
        }
    }, [isOpen]);

    if (!isOpen || !profile) return null;

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === profile.password) {
            setIsUnlocked(true);
            setErrorText("");
        } else {
            setErrorText("비밀번호가 일치하지 않습니다.\n(끝에 띄어쓰기가 포함되었거나, 첫 글자가 대문자로 입력되지 않았는지 확인해 주세요!)");
        }
    };

    const handleSave = async () => {
        if (!editData.name.trim() || !editData.school.trim() || !editData.password.trim() || !selectedAvatar) {
            setErrorText("모든 필드를 입력해주세요.");
            return;
        }

        setIsLoading(true);
        const newProfile: UserProfile = {
            name: editData.name,
            school: editData.school,
            password: editData.password,
            avatar: selectedAvatar,
        };

        try {
            await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({
                    action: "updateUser",
                    user_id: newProfile.name,
                    school: newProfile.school,
                    password: newProfile.password,
                    avatar: newProfile.avatar
                })
            });

            localStorage.setItem("lab_user_profile", JSON.stringify(newProfile));
            localStorage.setItem("lab_nickname", newProfile.name);

            alert("정보가 수정되었습니다.");
            window.location.reload();
        } catch (error) {
            console.error("Update failed", error);
            setErrorText("서버 통신 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white/10 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                    ✕
                </button>

                {!isUnlocked ? (
                    <form onSubmit={handleUnlock} className="space-y-6">
                        <h2 className="text-2xl font-bold text-center">🔐 내 정보 관리</h2>
                        <p className="text-sm text-center text-muted-foreground">정보를 수정하려면 기존 비밀번호를 입력해주세요.</p>

                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type={showPasswordUnlock ? "text" : "password"}
                                    required
                                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="비밀번호"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordUnlock(!showPasswordUnlock)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                                >
                                    {showPasswordUnlock ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                    )}
                                </button>
                            </div>
                            {errorText && <p className="text-destructive text-sm font-medium whitespace-pre-wrap">{errorText}</p>}
                            <button
                                type="submit"
                                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
                            >
                                잠금 해제
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowLogoutConfirm(true)}
                                className="w-full py-3 bg-destructive/10 text-destructive rounded-xl font-bold hover:bg-destructive/20 transition-colors"
                            >
                                사용자 로그아웃
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <h2 className="text-2xl font-bold text-center">내 정보 수정</h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">이름</label>
                                <input
                                    type="text"
                                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">학교</label>
                                <input
                                    type="text"
                                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none"
                                    value={editData.school}
                                    onChange={(e) => setEditData({ ...editData, school: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">비밀번호 변경</label>
                                <div className="relative">
                                    <input
                                        type={showPasswordEdit ? "text" : "password"}
                                        className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-2 pr-10 focus:outline-none"
                                        value={editData.password}
                                        onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordEdit(!showPasswordEdit)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                                    >
                                        {showPasswordEdit ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7-10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">캐릭터 변경</label>
                                <div className="grid grid-cols-6 gap-2">
                                    {AVATARS.map((avatar, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedAvatar(avatar)}
                                            className={`text-2xl aspect-square flex items-center justify-center rounded-xl transition-all ${selectedAvatar === avatar
                                                ? "bg-primary/20 border-2 border-primary"
                                                : "bg-background/50 border border-white/5 hover:bg-white/5"
                                                }`}
                                        >
                                            {avatar}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {errorText && <p className="text-destructive text-sm font-medium whitespace-pre-wrap">{errorText}</p>}
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    저장 중...
                                </>
                            ) : "저장하기"}
                        </button>
                    </div>
                )}

                {showLogoutConfirm && (
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-[200] flex items-center justify-center rounded-3xl animate-in fade-in duration-200">
                        <div className="p-6 text-center space-y-6 w-full max-w-[80%]">
                            <h3 className="text-xl font-bold">정말 로그아웃 하시겠습니까?</h3>
                            <div className="flex gap-3 justify-center mt-4">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem("lab_user_profile");
                                        localStorage.removeItem("lab_nickname");
                                        window.location.reload();
                                    }}
                                    className="flex-1 px-4 py-3 rounded-xl bg-destructive text-white hover:bg-destructive/90 font-bold transition-colors"
                                >
                                    확인
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

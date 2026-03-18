"use client";

import { useState } from "react";
import { UserProfile } from "@/types/auth";
import { writeLocalProfile } from "@/hooks/useLocalProfile";
import { updateUser } from "@/lib/appsScriptUsers";

interface MyProfileEditorProps {
    initialProfile: UserProfile;
}

const avatars = ["👨‍🚀", "👩‍🔬", "🤖", "🧬", "💻", "🚀", "🎨", "🌍", "🐶", "🐱", "🐰", "🦊"];

export default function MyProfileEditor({ initialProfile }: MyProfileEditorProps) {
    const [name, setName] = useState(initialProfile.name);
    const [school, setSchool] = useState(initialProfile.school);
    const [grade, setGrade] = useState(initialProfile.grade || "");
    const [classGroup, setClassGroup] = useState(initialProfile.classGroup || "");
    const [avatar, setAvatar] = useState(initialProfile.avatar);
    const [password, setPassword] = useState(initialProfile.password || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const newProfile: UserProfile = {
            ...initialProfile,
            name,
            school,
            grade,
            classGroup,
            avatar,
            password,
        };

        try {
            // Update Backend (Apps Script)
            await updateUser(newProfile);
            // Update LocalStorage
            writeLocalProfile(newProfile);

            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("프로필 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bento-item p-8 bg-white border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-xl border-2 border-[#2F3D4A]">
                    👤
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Profile settings</p>
                    <h3 className="text-xl font-black text-[#2F3D4A]">나의 정보 수정</h3>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">아바타 선택</label>
                    <div className="flex flex-wrap gap-3">
                        {avatars.map((a) => (
                            <button
                                key={a}
                                onClick={() => setAvatar(a)}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all border-2 border-[#2F3D4A] shadow-[2px_2px_0px_0px_#2F3D4A] ${avatar === a ? "bg-primary scale-110" : "bg-white hover:bg-slate-50"
                                    }`}
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest">연구원 이름 (닉네임)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest">소속 학교/기관</label>
                        <input
                            type="text"
                            value={school}
                            onChange={(e) => setSchool(e.target.value)}
                            placeholder="대건고등학교"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest">학년</label>
                        <input
                            type="text"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            placeholder="1"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest">반</label>
                        <input
                            type="text"
                            value={classGroup}
                            onChange={(e) => setClassGroup(e.target.value)}
                            placeholder="2"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest">비밀번호 변경</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary p-1 transition-colors"
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
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#2F3D4A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSaving ? "⏳ 저장 중..." : isSaved ? "✅ 변경사항이 저장되었습니다!" : "💾 프로필 정보 저장하기"}
                </button>
            </div>
        </div>
    );
}

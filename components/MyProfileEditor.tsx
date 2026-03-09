"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@/types/auth";
import { writeLocalProfile } from "@/hooks/useLocalProfile";

interface MyProfileEditorProps {
    initialProfile: UserProfile;
}

const avatars = ["👨‍🚀", "👩‍🔬", "🤖", "🧬", "💻", "🚀", "🎨", "🌍"];

export default function MyProfileEditor({ initialProfile }: MyProfileEditorProps) {
    const [name, setName] = useState(initialProfile.name);
    const [school, setSchool] = useState(initialProfile.school);
    const [avatar, setAvatar] = useState(initialProfile.avatar);
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        const newProfile: UserProfile = {
            ...initialProfile,
            name,
            school,
            avatar,
        };
        writeLocalProfile(newProfile);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="bento-item p-8 bg-secondary/10 border-white/5 space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-xl border border-primary/20">
                    👤
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Profile settings</p>
                    <h3 className="text-xl font-black">나의 정보 수정</h3>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">아바타 선택</label>
                    <div className="flex flex-wrap gap-3">
                        {avatars.map((a) => (
                            <button
                                key={a}
                                onClick={() => setAvatar(a)}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all border ${avatar === a ? "bg-primary border-primary scale-110 shadow-lg shadow-primary/20" : "bg-background/40 border-white/5 hover:border-white/20"
                                    }`}
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">연구원 이름 (닉네임)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">소속 학교/기관</label>
                        <input
                            type="text"
                            value={school}
                            onChange={(e) => setSchool(e.target.value)}
                            className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-bold"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {isSaved ? "✅ 변경사항이 저장되었습니다!" : "💾 프로필 정보 저장하기"}
                </button>
            </div>
        </div>
    );
}

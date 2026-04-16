"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/types/auth";

export function readLocalProfile(): UserProfile | null {
    if (typeof window === "undefined") {
        return null;
    }

    // 1. 관리자 정보 파싱 (Cookie + LocalStorage 교차 검증)
    const cookies = document.cookie.split(";").reduce((acc: any, row) => {
        const parts = row.split("=");
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join("=");
            acc[key] = decodeURIComponent(val.trim());
        }
        return acc;
    }, {});

    const adminName = cookies["admin_name"] || localStorage.getItem("admin_name");
    const adminRole = cookies["admin_role"] || localStorage.getItem("admin_role");

    // 2. 학생 프로필 확인 (로컬 스토리지)
    const saved = localStorage.getItem("lab_user_profile");
    let profile: UserProfile | null = null;
    if (saved) {
        try {
            profile = JSON.parse(saved) as UserProfile;
        } catch {
            profile = null;
        }
    }

    // 3. 관리자/슈퍼관리자 권한 강제 주입
    if (adminRole) {
        const roleStr = adminRole.toLowerCase();
        if (!profile) {
            // 로그인 안된 상태에서 관리자 정보만 있는 경우
            profile = {
                name: adminName || "관리자",
                school: "관리 센터",
                avatar: roleStr.includes("super") ? "💎" : "🎖️",
                role: (roleStr.includes("super") ? "super_admin" : "admin") as any
            };
        } else {
            // 학생으로 로그인 되어 있는 상태면 역할 부여
            profile.role = (roleStr.includes("super") ? "super_admin" : "admin") as any;
        }
    }

    return profile;
}

export function writeLocalProfile(profile: UserProfile) {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.setItem("lab_user_profile", JSON.stringify(profile));
    localStorage.setItem("lab_nickname", profile.name);
    window.dispatchEvent(new Event("auth:changed"));
}

export function clearLocalProfile() {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.removeItem("lab_user_profile");
    localStorage.removeItem("lab_nickname");
    window.dispatchEvent(new Event("auth:changed"));
}

export default function useLocalProfile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const syncProfile = () => {
            setProfile(readLocalProfile());
        };

        syncProfile();
        window.addEventListener("auth:changed", syncProfile);
        window.addEventListener("storage", syncProfile);

        return () => {
            window.removeEventListener("auth:changed", syncProfile);
            window.removeEventListener("storage", syncProfile);
        };
    }, []);

    return profile;
}

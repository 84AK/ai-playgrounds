"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/types/auth";

export function readLocalProfile(): UserProfile | null {
    if (typeof window === "undefined") {
        return null;
    }

    const saved = localStorage.getItem("lab_user_profile");
    if (!saved) {
        return null;
    }

    try {
        return JSON.parse(saved) as UserProfile;
    } catch {
        return null;
    }
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

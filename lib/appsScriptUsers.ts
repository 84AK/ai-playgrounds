import { getAppsScriptJson, postAppsScript } from "@/lib/appsScriptClient";
import type { UserProfile } from "@/types/auth";

interface GetUserResponse {
    status?: string;
    data?: UserProfile;
}

export async function fetchUserProfile(userName: string) {
    const result = await getAppsScriptJson<GetUserResponse>(
        new URLSearchParams({
            action: "getUser",
            user_id: userName,
        })
    );

    if (result?.status !== "success" || !result.data) {
        throw new Error("User verification failed");
    }

    return result.data;
}

export async function registerUser(profile: UserProfile) {
    await postAppsScript({
        action: "registerUser",
        user_id: profile.name,
        school: profile.school,
        password: profile.password,
        avatar: profile.avatar,
    });
}

export async function updateUser(profile: UserProfile) {
    await postAppsScript({
        action: "updateUser",
        user_id: profile.name,
        school: profile.school,
        password: profile.password,
        avatar: profile.avatar,
    });
}

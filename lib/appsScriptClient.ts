import { APPS_SCRIPT_URL } from "@/app/constants";

export function getAppsScriptUrl() {
    if (!APPS_SCRIPT_URL) {
        throw new Error("Apps Script URL is not configured");
    }
    return APPS_SCRIPT_URL;
}

export async function postAppsScript<T = any>(payload: Record<string, unknown>, token?: string): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch("/api/proxy-apps-script", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return (await res.json()) as T;
}

export async function getAppsScriptJson<T>(params: URLSearchParams, token?: string) {
    const headers: Record<string, string> = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/proxy-apps-script?${params.toString()}`, {
        method: "GET",
        headers,
        cache: "no-store",
    });
    
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    
    return (await res.json()) as T;
}

export async function delay(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

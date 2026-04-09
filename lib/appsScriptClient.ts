import { APPS_SCRIPT_URL } from "@/app/constants";

export function getAppsScriptUrl() {
    if (!APPS_SCRIPT_URL) {
        throw new Error("Apps Script URL is not configured");
    }
    return APPS_SCRIPT_URL;
}

export async function postAppsScript<T = any>(payload: Record<string, unknown>, token?: string, maxRetries = 3): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let attempt = 0;
    while (attempt <= maxRetries) {
        attempt++;
        try {
            const res = await fetch("/api/proxy-apps-script", {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP error! status: ${res.status}`;
                if (attempt > maxRetries) throw new Error(errorMessage);
                console.warn(`[AppsScript] POST failed, retrying (${attempt}/${maxRetries})...`, errorMessage);
            } else {
                return (await res.json()) as T;
            }
        } catch (error) {
            if (attempt > maxRetries) throw error;
            console.warn(`[AppsScript] POST error:`, error);
        }
        
        // 지수형 백오프(Exponential Backoff) + Jitter(무작위 지연)로 병목 해소 대기
        const backoffMs = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
    
    throw new Error("Max retries exceeded for Apps Script POST");
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

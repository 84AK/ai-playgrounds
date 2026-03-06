import { APPS_SCRIPT_URL } from "@/app/constants";

export function getAppsScriptUrl() {
    if (!APPS_SCRIPT_URL) {
        throw new Error("Apps Script URL is not configured");
    }
    return APPS_SCRIPT_URL;
}

export async function postAppsScript(payload: Record<string, unknown>) {
    const url = getAppsScriptUrl();

    await fetch(url, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload),
    });
}

export async function getAppsScriptJson<T>(params: URLSearchParams) {
    const url = getAppsScriptUrl();
    const res = await fetch(`${url}?${params.toString()}`, {
        cache: "no-store",
    });
    return (await res.json()) as T;
}

export async function delay(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

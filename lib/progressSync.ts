import { APPS_SCRIPT_URL } from "@/app/constants";

export interface ProgressData {
    mbti_week0: boolean;
    mbti_week1: boolean;
    mbti_week2: boolean;
    mbti_week3: boolean;
    mbti_week4: boolean;
    pose_week1: boolean;
    pose_week2: boolean;
    pose_week3: boolean;
    pose_week4: boolean;
    // Download URLs
    mbti_week1_url?: string;
    mbti_week2_url?: string;
    mbti_week3_url?: string;
    mbti_week4_url?: string;
    pose_week1_url?: string;
    pose_week2_url?: string;
    pose_week3_url?: string;
    pose_week4_url?: string;
}

const CACHE_KEY_PREFIX = "lab_progress_";
const CACHE_TTL = 60 * 1000; // 1 minute

export interface CachedProgress {
    data: ProgressData;
    timestamp: number;
}

/**
 * MBTI 0주차 데이터는 백엔드 진도 데이터에 포함되어 있지 않을 경우, 
 * 별도의 MBTI 데이터 시트를 조회하여 보완합니다.
 */
async function hasMbtiMakerSaveRecord(userName: string): Promise<boolean> {
    const readTextField = (row: any, keyA: string, keyB: string) => {
        if (!row || typeof row !== "object") return "";
        return String(row[keyA] ?? row[keyB] ?? "").trim();
    };

    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getAllMbtiData`);
        const result = await response.json();
        const normalizedName = userName.trim();

        if (result?.status === "success" && result?.data) {
            const questionRows = Array.isArray(result.data.questions) ? result.data.questions : [];
            const hasQuestion = questionRows.some((item: any) => readTextField(item, "Author", "author") === normalizedName);
            if (hasQuestion) return true;

            const showcaseRows = Array.isArray(result.data.showcase_links) ? result.data.showcase_links : [];
            return showcaseRows.some((item: any) => {
                const author = readTextField(item, "Author", "author");
                const url = readTextField(item, "Url", "url");
                return author === normalizedName && url.includes("/mbti/play?author=");
            });
        }
    } catch (err) {
        console.error("Failed to verify MBTI week0", err);
    }
    return false;
}

export function getCachedProgress(userName: string): CachedProgress | null {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem(`${CACHE_KEY_PREFIX}${userName}`);
    if (!saved) return null;
    try {
        return JSON.parse(saved);
    } catch {
        return null;
    }
}

export async function fetchAndCacheProgress(userName: string): Promise<ProgressData | null> {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getProgress&user_id=${encodeURIComponent(userName)}`);
        const result = await response.json();

        if (result && result.data) {
            let isMbtiWeek0 = Boolean(result.data.mbti_week0);
            if (!isMbtiWeek0) {
                // 백엔드 진도 데이터에는 없지만 실제 데이터가 있는지 교차 검증 (느린 요청)
                isMbtiWeek0 = await hasMbtiMakerSaveRecord(userName);
            }

            const progress: ProgressData = {
                ...result.data,
                mbti_week0: isMbtiWeek0,
            };

            const cache: CachedProgress = {
                data: progress,
                timestamp: Date.now(),
            };

            localStorage.setItem(`${CACHE_KEY_PREFIX}${userName}`, JSON.stringify(cache));
            return progress;
        }
    } catch (err) {
        console.error("Sync Progress Error:", err);
    }
    return null;
}

/**
 * 최신 데이터인지 확인하고 필요 시 갱신 요청을 보내는 로직
 */
export function isCacheStale(cache: CachedProgress | null): boolean {
    if (!cache) return true;
    return Date.now() - cache.timestamp > CACHE_TTL;
}

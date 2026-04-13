import fs from "fs/promises";
import path from "path";

export type CourseTrack = string;

export interface CourseStructureItem {
  track: string;
  week: number;
  title: string;
}

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || "";

function getLocalFilePath(track: CourseTrack, weekId: number) {
  const normTrack = track.toUpperCase();
  const filePrefix = normTrack === "POSE" ? "pose_week" : "mbti_week";
  return path.join(process.cwd(), "Docs", `${filePrefix}${weekId}.md`);
}

async function readLocalContent(track: CourseTrack, weekId: number) {
  const filePath = getLocalFilePath(track, weekId);
  const content = await fs.readFile(filePath, "utf-8");
  return { content, filePath };
}

function extractFromResponse(result: any, key: string): any {
  if (!result) return null;
  // 1. 최상단 키 확인 (예: result.content)
  if (result[key] !== undefined && result[key] !== null) return result[key];
  // 2. data 객체 내부 확인 (예: result.data.content)
  if (result.data && result.data[key] !== undefined && result.data[key] !== null) return result.data[key];
  // 3. result가 이미 우리가 찾는 객체인 경우 (간혹 바로 데이터가 올 때)
  if (typeof result === "object" && result[key] !== undefined) return result[key];
  return null;
}

import { getNotionCourseContent, getNotionCourseStructure } from "./notion";

export async function getCourseStructure(
  customUrl?: string,
  notionConfig?: { apiKey: string, databaseId: string, priority: "notion" | "sheet" }
): Promise<CourseStructureItem[]> {
  const targetUrl = customUrl || APPS_SCRIPT_URL;
  const isCustom = !!customUrl;
  
  // [NEW] Notion 우선순위 처리
  if (notionConfig && notionConfig.apiKey && notionConfig.databaseId && notionConfig.priority === "notion") {
    const notionData = await getNotionCourseStructure(notionConfig.apiKey, notionConfig.databaseId);
    if (notionData && notionData.length > 0) {
      return notionData;
    }
  }

  if (!targetUrl) return [];
  
  // 기본 트랙 정의 (폴백용)
  const defaultItems: CourseStructureItem[] = [
    ...Array.from({ length: 12 }, (_, i) => ({ track: "MBTI", week: i + 1, title: `${i + 1}차시` })),
    ...Array.from({ length: 12 }, (_, i) => ({ track: "POSE", week: i + 1, title: `${i + 1}차시` }))
  ];

  try {
    const gasUrl = new URL(targetUrl);
    gasUrl.searchParams.set("action", "getAllCourseStructure");
    
    // 타임아웃 15초로 확장 (GAS의 지연 응답 대비)
    const res = await fetch(gasUrl.toString(), { 
        cache: "no-store", 
        redirect: "follow",
        signal: AbortSignal.timeout(15000) 
    });
    
    if (!res.ok) {
        // 시트 호출 실패 시, 노션이 시트우선이었더라도 폴백 시도
        if (notionConfig && notionConfig.apiKey && notionConfig.databaseId) {
            const notionData = await getNotionCourseStructure(notionConfig.apiKey, notionConfig.databaseId);
            if (notionData && notionData.length > 0) return notionData;
        }
        return isCustom ? [] : defaultItems;
    }
    
    const result = await res.json();
    const fetchedData = extractFromResponse(result, "data");
    
    // 데이터가 있고 배열이면 결과 반환
    if (fetchedData && Array.isArray(fetchedData) && fetchedData.length > 0) {
        // [V7.8.2] 가져온 데이터의 트랙 대문자화 (일관성 유지)
        return fetchedData.map(item => ({
            ...item,
            track: item.track?.toString().toUpperCase().trim()
        }));
    }
    
    // 데이터가 비어있다면 노션 폴백
    if (notionConfig && notionConfig.apiKey && notionConfig.databaseId) {
        const notionData = await getNotionCourseStructure(notionConfig.apiKey, notionConfig.databaseId);
        if (notionData && notionData.length > 0) return notionData;
    }

    return isCustom ? [] : defaultItems;
  } catch (err) {
    console.error("Failed to fetch course structure", err);
    // 에러 발생 시 노션 폴백 시도
    if (notionConfig && notionConfig.apiKey && notionConfig.databaseId) {
        const notionData = await getNotionCourseStructure(notionConfig.apiKey, notionConfig.databaseId);
        if (notionData && notionData.length > 0) return notionData;
    }
    return isCustom ? [] : defaultItems;
  }
}

export async function getCourseContent(
  track: CourseTrack, 
  weekId: number, 
  customUrl?: string,
  notionConfig?: { apiKey: string, databaseId: string, priority: "notion" | "sheet" }
) {
  const targetUrl = customUrl || APPS_SCRIPT_URL;
  const isCustom = !!customUrl;

  // [NEW] Notion 우선순위 처리
  if (notionConfig && notionConfig.apiKey && notionConfig.databaseId && notionConfig.priority === "notion") {
    const notionRes = await getNotionCourseContent(notionConfig.apiKey, notionConfig.databaseId, track, weekId);
    if (notionRes) {
      return { ...notionRes, source: "notion" as const };
    }
  }

  if (!targetUrl) {
    try {
      const local = await readLocalContent(track, weekId);
      return { content: local.content, title: "", source: "local" as const, filePath: local.filePath };
    } catch (error) {
      return { content: "", title: "", source: "local" as const };
    }
  }

  try {
    const gasUrl = new URL(targetUrl);
    gasUrl.searchParams.set("action", "getCourseContent");
    gasUrl.searchParams.set("track", track.toUpperCase()); // 대문자로 표준화하여 요청
    gasUrl.searchParams.set("week", weekId.toString());

    // [V8.3] 로깅 개선: URL 출처 표시 및 더 긴 주소 출력
    console.log(`📡 [CourseContent] Fetching: ${track} Week ${weekId}`);
    console.log(`📡 [CourseContent] Source: ${isCustom ? "CUSTOM (Cookie)" : "SYSTEM (Env)"}`);
    console.log(`📡 [CourseContent] URL: ${gasUrl.toString().length > 120 ? gasUrl.toString().substring(0, 100) + "..." + gasUrl.toString().slice(-15) : gasUrl.toString()}`);

    // 상세 페이지는 사용자가 기다리는 중이므로 타임아웃 20초 부여
    const res = await fetch(gasUrl.toString(), { 
      cache: "no-store", 
      redirect: "follow",
      signal: AbortSignal.timeout(20000)
    });
    if (!res.ok) throw new Error(`Apps Script responded with ${res.status}`);

    const result = await res.json();
    
    // [V8.3] 디버깅을 위한 원본 응답 로깅 (터미널 출력)
    console.log(`📡 [CourseContent] Response Data for ${track} W${weekId}:`, JSON.stringify(result).substring(0, 500));

    const content = extractFromResponse(result, "content");
    const title = extractFromResponse(result, "title") || "";
    
    // [V8.4] 데이터 검증 강화: 공백만 있는 문자열도 유효하지 않은 것으로 간주
    const hasValidContent = typeof content === "string" && content.trim().length > 0;

    if (hasValidContent) {
      return { 
        content: content as string, 
        title: title as string, 
        source: "sheet" as const,
        rawResponse: JSON.stringify(result) // 디버그를 위해 원본 저장
      };
    }
    
    // 시트에서 응답은 왔으나 내용이 없는 경우 (의도적인 빈 페이지 가능성)
    if (result.status === "success" || result.content === "" || (result.data && result.data.content === "")) {
       // 커스텀 URL 사용 중이면 빈 내용도 그대로 보여줌 (선생님 의도 반영)
       if (isCustom) {
         return { content: "", title: title as string, source: "sheet" as const, rawResponse: JSON.stringify(result) };
       }
    }

    console.warn(`⚠️ [CourseContent] No valid content found in GAS response. Falling back to local.`);

    try {
      const local = await readLocalContent(track, weekId);
      return { content: local.content, title: "", source: "local" as const, filePath: local.filePath };
    } catch {
      return { content: "", title: "", source: "local" as const };
    }
    // [NEW] Notion 폴백 처리 (Sheet 실패 시 Notion 시도)
    if (notionConfig && notionConfig.apiKey && notionConfig.databaseId && notionConfig.priority !== "notion") {
      const notionRes = await getNotionCourseContent(notionConfig.apiKey, notionConfig.databaseId, track, weekId);
      if (notionRes) return { ...notionRes, source: "notion" as const };
    }

    try {
      const local = await readLocalContent(track, weekId);
      return { content: local.content, title: "", source: "local" as const, filePath: local.filePath };
    } catch {
      return { content: "", title: "", source: "local" as const };
    }
  } catch (error) {
    console.error("Content load failed:", error);
    if (isCustom) {
        return { content: "", title: "로드 실패 (시트 확인 필요)", source: "sheet" as const };
    }
    try {
      const local = await readLocalContent(track, weekId);
      return { content: local.content, title: "", source: "local" as const, filePath: local.filePath };
    } catch {
      throw new Error("Failed to load course content.");
    }
  }
}

export async function saveCourseContent(track: CourseTrack, weekId: number, content: string, title?: string, customUrl?: string) {
  const targetUrl = customUrl || APPS_SCRIPT_URL;

  if (!targetUrl) {
    const filePath = getLocalFilePath(track, weekId);
    await fs.writeFile(filePath, content, "utf-8");
    return { savedTo: "local" as const, filePath };
  }

  try {
    const gasUrl = new URL(targetUrl);
    gasUrl.searchParams.set("action", "saveCourseContent");
    gasUrl.searchParams.set("track", track);
    gasUrl.searchParams.set("week", weekId.toString());
    if (title) gasUrl.searchParams.set("title", title);

    const res = await fetch(gasUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "saveCourseContent",
        track,
        week: weekId,
        title: title || "",
        content,
      }),
      cache: 'no-store',
      redirect: 'follow'
    });

    if (!res.ok) throw new Error(`Apps Script responded with ${res.status}`);

    const result = await res.json();
    const ok = result && (result.success === true || result.status === "success");

    if (!ok) throw new Error(result?.error || result?.message || "Unknown error during save.");

    return { savedTo: "sheet" as const };
  } catch (error) {
    console.error("Save failure:", error);
    throw new Error("Failed to save to Google Sheet: " + (error instanceof Error ? error.message : String(error)));
  }
}



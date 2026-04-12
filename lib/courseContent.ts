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
  if (result[key] !== undefined) return result[key];
  if (result.data && result.data[key] !== undefined) return result.data[key];
  return null;
}

export async function getCourseStructure(customUrl?: string): Promise<CourseStructureItem[]> {
  const targetUrl = customUrl || APPS_SCRIPT_URL;
  const isCustom = !!customUrl;
  
  if (!targetUrl) return [];
  
  // 기본 트랙 정의 (폴백용)
  const defaultItems: CourseStructureItem[] = [
    ...Array.from({ length: 12 }, (_, i) => ({ track: "MBTI", week: i + 1, title: `${i + 1}차시` })),
    ...Array.from({ length: 12 }, (_, i) => ({ track: "POSE", week: i + 1, title: `${i + 1}차시` }))
  ];

  try {
    const gasUrl = new URL(targetUrl);
    gasUrl.searchParams.set("action", "getAllCourseStructure");
    
    // 타임아웃 5초 설정 (기존 학생들을 위해 피드백 속도 중요)
    const res = await fetch(gasUrl.toString(), { 
        cache: "no-store", 
        redirect: "follow",
        signal: AbortSignal.timeout(5000) 
    });
    
    if (!res.ok) {
        // 시트 호출 실패 시, 커스텀 모드가 아니면 기본값 반환
        return isCustom ? [] : defaultItems;
    }
    
    const result = await res.json();
    const fetchedData = extractFromResponse(result, "data");
    
    // 데이터가 있고 배열이면 결과 반환
    if (fetchedData && Array.isArray(fetchedData) && fetchedData.length > 0) {
        return fetchedData;
    }
    
    // 데이터가 비어있다면, 커스텀 모드면 빈 배열, 기본 모드면 폴백 반환
    return isCustom ? [] : defaultItems;
  } catch (err) {
    console.error("Failed to fetch course structure", err);
    // 에러 발생 시 커스텀 모드가 아니면 기본 MBTI/POSE 반환 (기존 학생 보호)
    return isCustom ? [] : defaultItems;
  }
}

export async function getCourseContent(track: CourseTrack, weekId: number, customUrl?: string) {
  const targetUrl = customUrl || APPS_SCRIPT_URL;
  const isCustom = !!customUrl;

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
    gasUrl.searchParams.set("track", track);
    gasUrl.searchParams.set("week", weekId.toString());

    const res = await fetch(gasUrl.toString(), { cache: "no-store", redirect: "follow" });
    if (!res.ok) throw new Error(`Apps Script responded with ${res.status}`);

    const result = await res.json();
    const content = extractFromResponse(result, "content");
    const title = extractFromResponse(result, "title") || "";
    
    if (content !== null) {
      return { content, title, source: "sheet" as const };
    }
    
    // 이부분이 중요: 커스텀 URL 사용 시 로컬 파일로 폴백하지 않음 (선생님의 빈 시트 반영)
    if (isCustom) {
      return { content: "", title: "", source: "sheet" as const };
    }

    try {
      const local = await readLocalContent(track, weekId);
      return { content: local.content, title: "", source: "local" as const, filePath: local.filePath };
    } catch {
      return { content: "", title: "", source: "local" as const };
    }
  } catch (error) {
    console.error("Content load failed:", error);
    // 에러 발생 시 커스텀 URL이면 빈 내용 반환, 아니면 로컬 폴백 시도
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



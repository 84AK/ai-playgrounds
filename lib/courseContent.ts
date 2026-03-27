import fs from "fs/promises";
import path from "path";

export type CourseTrack = "MBTI" | "POSE";

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";

function getLocalFilePath(track: CourseTrack, weekId: number) {
  const filePrefix = track === "POSE" ? "pose_week" : "mbti_week";
  return path.join(process.cwd(), "Docs", `${filePrefix}${weekId}.md`);
}

async function readLocalContent(track: CourseTrack, weekId: number) {
  const filePath = getLocalFilePath(track, weekId);
  const content = await fs.readFile(filePath, "utf-8");
  return { content, filePath };
}

function extractContentFromSheetResponse(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const data = result as Record<string, unknown>;

  if (typeof data.content === "string") return data.content;

  if (data.data && typeof data.data === "object") {
    const nested = data.data as Record<string, unknown>;
    if (typeof nested.content === "string") return nested.content;
  }

  return null;
}

export async function getCourseContent(track: CourseTrack, weekId: number) {
  if (!APPS_SCRIPT_URL) {
    // 로컬 개발 환경 등에서 URL이 없을 때만 로컬 파일을 읽도록 처리
    try {
      const local = await readLocalContent(track, weekId);
      return { content: local.content, source: "local" as const, filePath: local.filePath };
    } catch (error) {
      return { content: "", source: "local" as const };
    }
  }

  try {
    const res = await fetch(
      `${APPS_SCRIPT_URL}?action=getCourseContent&track=${encodeURIComponent(track)}&week=${weekId}`,
      { cache: "no-store" }
    );
    const result = await res.json();
    console.log(`[DEBUG] GAS Response (${track}, week ${weekId}):`, JSON.stringify(result).substring(0, 100) + "...");
    
    const content = extractContentFromSheetResponse(result);
    
    // [보강] 시트에 내용이 있으면 반환, 없으면 로컬 파일에서 읽어오기 (Fallback)
    if (content && content.trim().length > 0) {
      console.log(`[OK] Sheet content loaded successfully for ${track} week ${weekId}`);
      return { content: content, source: "sheet" as const };
    }
    
    console.log(`[WARN] Sheet content is empty or not found. Falling back to Local File for ${track} week ${weekId}`);

    // 시트가 비어있으면 로컬 파일 시도
    try {
      const local = await readLocalContent(track, weekId);
      console.log(`구글 시트에 내용이 없어 로컬 파일(${local.filePath})을 대신 불러왔습니다.`);
      return { content: local.content, source: "local" as const, filePath: local.filePath };
    } catch (localError) {
      return { content: "", source: "local" as const };
    }
  } catch (error) {
    console.error("구글 스프레드시트 콘텐츠 로드 실패, 로컬 파일 시도:", error);
    try {
      const local = await readLocalContent(track, weekId);
      return { content: local.content, source: "local" as const, filePath: local.filePath };
    } catch (localError) {
      throw new Error("강의 콘텐츠를 불러오는 데 완전히 실패했습니다.");
    }
  }
}

export async function saveCourseContent(track: CourseTrack, weekId: number, content: string) {
  if (!APPS_SCRIPT_URL) {
    const filePath = getLocalFilePath(track, weekId);
    await fs.writeFile(filePath, content, "utf-8");
    return { savedTo: "local" as const, filePath };
  }

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "saveCourseContent",
        track,
        week: weekId,
        content,
      }),
    });

    if (!res.ok) {
      throw new Error(`Apps Script 응답 오류: HTTP ${res.status}`);
    }

    const result = await res.json();
    const ok = Boolean(
      (result && (result.success === true || result.status === "success")) ||
      (result && result.data && result.data.success === true)
    );

    if (!ok) {
      throw new Error(result?.error || result?.message || "스프레드시트 처리 중 원인 불명의 오류가 발생했습니다.");
    }

    return { savedTo: "sheet" as const };
  } catch (error) {
    console.error("구글 스프레드시트 콘텐츠 저장 실패:", error);
    // 에러를 그대로 위로 던져서 API Route가 올바른 실패 응답을 뱉도록 합니다.
    throw new Error("구글 스프레드시트에 저장을 실패했습니다: " + (error instanceof Error ? error.message : String(error)));
  }
}



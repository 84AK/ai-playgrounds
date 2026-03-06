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
  if (APPS_SCRIPT_URL) {
    try {
      const res = await fetch(
        `${APPS_SCRIPT_URL}?action=getCourseContent&track=${encodeURIComponent(track)}&week=${weekId}`,
        { cache: "no-store" }
      );
      const result = await res.json();
      const content = extractContentFromSheetResponse(result);
      if (content !== null) {
        return { content, source: "sheet" as const };
      }
    } catch (error) {
      // fall back to local file when sheet is unavailable
    }
  }

  const local = await readLocalContent(track, weekId);
  return { content: local.content, source: "local" as const, filePath: local.filePath };
}

export async function saveCourseContent(track: CourseTrack, weekId: number, content: string) {
  if (APPS_SCRIPT_URL) {
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveCourseContent",
          track,
          week: weekId,
          content,
        }),
      });

      // Apps Script에서 JSON을 반환하면 success 플래그를 확인하고,
      // no-cors/빈 응답 환경에서도 HTTP 성공이면 저장 성공으로 취급합니다.
      if (res.ok) {
        try {
          const result = await res.json();
          const ok = Boolean(
            (result && (result.success === true || result.status === "success")) ||
              (result && result.data && result.data.success === true)
          );
          if (ok) return { savedTo: "sheet" as const };
        } catch {
          return { savedTo: "sheet" as const };
        }
      }
    } catch (error) {
      // fall back to local file write
    }
  }

  const filePath = getLocalFilePath(track, weekId);
  await fs.writeFile(filePath, content, "utf-8");
  return { savedTo: "local" as const, filePath };
}


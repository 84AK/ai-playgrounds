import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCourseContent, type CourseTrack } from "@/lib/courseContent";
import { decrypt } from "@/lib/crypto";

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        // 학생도 수업 내용을 읽을 수 있어야 하므로 관리자 체크 제거

        const { searchParams } = new URL(request.url);
        const trackParam = searchParams.get("track");
        const weekParam = searchParams.get("week");

        const resolvedTrack: string = trackParam || "MBTI";
        const weekId = Number(weekParam);

        if (isNaN(weekId) || weekId < 1) {
            return NextResponse.json({ success: false, error: "유효하지 않은 주차입니다." }, { status: 400 });
        }

        const customUrl = cookieStore.get("custom_gs_url")?.value;
        const notionEncryptedKey = cookieStore.get("custom_notion_key")?.value;
        const notionDbId = cookieStore.get("custom_notion_db_id")?.value;
        const notionPriority = cookieStore.get("custom_notion_priority")?.value as "notion" | "sheet" | undefined;

        const notionConfig = notionEncryptedKey && notionDbId ? {
            apiKey: decrypt(notionEncryptedKey),
            databaseId: notionDbId,
            priority: notionPriority || "sheet"
        } : undefined;

        const result = await getCourseContent(resolvedTrack, weekId, customUrl, notionConfig);
        return NextResponse.json({ 
            success: true, 
            content: result.content,
            title: result.title,
            source: result.source
        });
    } catch (error) {
        console.error("강의 내용 조회 실패:", error);
        return NextResponse.json(
            { success: false, error: "강의 내용을 불러오는 중 오류가 발생했습니다: " + (error instanceof Error ? error.message : String(error)) }, 
            { status: 500 }
        );
    }
}

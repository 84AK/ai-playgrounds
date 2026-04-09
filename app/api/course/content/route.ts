import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCourseContent, type CourseTrack } from "@/lib/courseContent";

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const hasAdmin = cookieStore.has("admin_session");

        if (!hasAdmin) {
            return NextResponse.json({ success: false, error: "관리자 권한이 없습니다." }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const trackParam = searchParams.get("track");
        const weekParam = searchParams.get("week");

        const resolvedTrack: CourseTrack = trackParam === "POSE" ? "POSE" : "MBTI";
        const weekId = Number(weekParam);

        if (isNaN(weekId) || weekId < 1) {
            return NextResponse.json({ success: false, error: "유효하지 않은 주차입니다." }, { status: 400 });
        }

        const result = await getCourseContent(resolvedTrack, weekId);
        return NextResponse.json({ 
            success: true, 
            content: result.content,
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

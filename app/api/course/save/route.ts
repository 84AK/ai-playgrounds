import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { saveCourseContent, type CourseTrack } from "@/lib/courseContent";

export async function POST(request: Request) {
    // 참고: Vercel과 같은 서버리스 호스팅에서는 프로덕션 환경이어도 API Route가 정상 동작합니다.
    try {
        const cookieStore = await cookies();
        const hasAdmin = cookieStore.has("admin_session");

        if (!hasAdmin) {
            return NextResponse.json({ success: false, error: "관리자 권한이 없습니다." }, { status: 403 });
        }

        const { weekId, content, track, title } = await request.json();
        const resolvedTrack: string = track || "MBTI";

        if (isNaN(weekId) || weekId < 1) {
            return NextResponse.json({ success: false, error: "유효하지 않은 주차입니다." }, { status: 400 });
        }

        const customUrl = cookieStore.get("custom_gs_url")?.value;
        const result = await saveCourseContent(resolvedTrack, weekId, String(content ?? ""), title, customUrl);
        return NextResponse.json({ success: true, savedTo: result.savedTo });
    } catch (error) {
        console.error("파일 저장 실패:", error);
        return NextResponse.json({ success: false, error: "파일 저장 중 오류가 발생했습니다: " + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }
}

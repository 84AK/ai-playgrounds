import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { saveCourseContent, type CourseTrack } from "@/lib/courseContent";

export async function POST(request: Request) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ success: false, error: "운영 서버(정적 사이트)에서는 파일을 수정할 수 없습니다." }, { status: 403 });
    }

    try {
        const cookieStore = await cookies();
        const hasAdmin = cookieStore.has("admin_session");

        if (!hasAdmin) {
            return NextResponse.json({ success: false, error: "관리자 권한이 없습니다." }, { status: 403 });
        }

        const { weekId, content, track } = await request.json();
        const resolvedTrack: CourseTrack = track === "POSE" ? "POSE" : "MBTI";

        if (isNaN(weekId) || weekId < 1 || weekId > 4) {
            return NextResponse.json({ success: false, error: "유효하지 않은 주차입니다." }, { status: 400 });
        }

        const result = await saveCourseContent(resolvedTrack, weekId, String(content ?? ""));
        return NextResponse.json({ success: true, savedTo: result.savedTo });
    } catch (error) {
        console.error("파일 저장 실패:", error);
        return NextResponse.json({ success: false, error: "파일 저장 중 오류가 발생했습니다." }, { status: 500 });
    }
}

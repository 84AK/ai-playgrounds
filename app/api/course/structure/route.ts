import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCourseStructure } from "@/lib/courseContent";

export async function GET() {
    try {
        const cookieStore = await cookies();
        // 학생도 코스 구조를 볼 수 있어야 하므로 관리자 체크 제거

        const customUrl = cookieStore.get("custom_gs_url")?.value;
        const data = await getCourseStructure(customUrl);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("커리큘럼 구조 조회 실패:", error);
        return NextResponse.json({ success: false, error: "조회 중 오류 발생" }, { status: 500 });
    }
}

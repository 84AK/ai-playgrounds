import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const token = searchParams.get("token");
    const teacherName = searchParams.get("teacherName");
    const gsUrl = searchParams.get("gsUrl");
    const folderId = searchParams.get("folderId");
    const notionDbId = searchParams.get("notionDbId");
    const notionPriority = searchParams.get("notionPriority");
    const customAdminPass = searchParams.get("adminPass");
    const trackNames = searchParams.get("trackNames");

    if (!token) {
        return NextResponse.redirect(new URL("/admin?error=invalid_token", req.url));
    }

    try {
        const response = NextResponse.redirect(new URL("/admin", req.url));
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);

        const cookieOptions = {
            path: "/",
            expires: expires,
            sameSite: "lax" as const
        };

        // 1. 관리자 세션 인증 (전달받은 토큰 우선)
        response.cookies.set("admin_session", token, { ...cookieOptions });

        // 2. 선생님 성함 연동
        if (teacherName) {
            response.cookies.set("custom_teacher_name", teacherName, { ...cookieOptions });
        }

        // 3. [NEW] 전체 백엔드 환경 설정 연동
        if (gsUrl) response.cookies.set("custom_gs_url", gsUrl, { ...cookieOptions });
        if (folderId) response.cookies.set("custom_folder_id", folderId, { ...cookieOptions });
        if (customAdminPass) response.cookies.set("custom_admin_password", customAdminPass, { ...cookieOptions });
        if (notionDbId) response.cookies.set("custom_notion_db_id", notionDbId, { ...cookieOptions });
        if (notionPriority) response.cookies.set("custom_notion_priority", notionPriority, { ...cookieOptions });
        if (trackNames) response.cookies.set("custom_track_names", trackNames, { ...cookieOptions });

        return response;
    } catch (error) {
        return NextResponse.redirect(new URL("/admin?error=login_failed", req.url));
    }
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const cookieStore = await cookies();
        
        // 삭제할 쿠키 목록
        const cookiesToClear = [
            "admin_session",
            "custom_gs_url",
            "custom_folder_id",
            "custom_admin_password",
            "custom_teacher_name",
            "custom_notion_key",
            "custom_notion_db_id",
            "custom_backend_priority"
        ];

        const response = NextResponse.json({ 
            success: true, 
            message: "모든 커스텀 설정이 초기화되었습니다. 원본 시스템으로 복구합니다." 
        });

        // 모든 관련 쿠키 삭제
        cookiesToClear.forEach(cookieName => {
            response.cookies.set(cookieName, "", { 
                path: "/", 
                expires: new Date(0) 
            });
        });

        return response;
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

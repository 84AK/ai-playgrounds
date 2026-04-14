import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const DEFAULT_APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || "";

/**
 * 관리자 비밀번호 업데이트 API
 * 구글 시트(Admins 시트)의 비밀번호를 업데이트하고 쿠키도 갱신합니다.
 */
export async function POST(request: Request) {
    try {
        const { name, newPassword } = await request.json();
        const cookieStore = await cookies();
        
        const customUrl = cookieStore.get("custom_gs_url")?.value;
        const targetUrl = customUrl || DEFAULT_APPS_SCRIPT_URL;

        if (!name || !newPassword) {
            return NextResponse.json({ success: false, error: "이름과 새 비밀번호가 필요합니다." }, { status: 400 });
        }

        if (!targetUrl) {
            return NextResponse.json({ success: false, error: "연동된 백엔드 URL이 없습니다." }, { status: 500 });
        }

        // 1. GAS 백엔드 호출 (setAdminPassword 액션 사용)
        console.log(`📡 [Update-Password-API] Calling GAS to update password for: ${name}`);
        const gasRes = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "setAdminPassword", name, password: newPassword }),
            redirect: "follow"
        });

        if (!gasRes.ok) {
            throw new Error("GAS 통신 실패");
        }

        const result = await gasRes.json();

        if (result.status === "success") {
            // 2. 성공 시 쿠키도 함께 갱신 (선택 사항: 이미 Setup 페이지에서 처리하지만 2중 안전장치)
            const expires = new Date();
            expires.setFullYear(expires.getFullYear() + 1);
            
            // Note: 서버 사이드에서 쿠키를 세팅하는 것은 response를 반환할 때 response.cookies.set을 쓰거나 
            // 여기서는 클라이언트에서 이미 세팅하므로 API 결과만 성공으로 반환해도 무방함.
            
            return NextResponse.json({ success: true, message: "비밀번호가 성공적으로 업데이트되었습니다." });
        } else {
            return NextResponse.json({ success: false, error: result.error || "비밀번호 업데이트 실패" }, { status: 400 });
        }

    } catch (e: any) {
        console.error("Update Admin Password Error:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

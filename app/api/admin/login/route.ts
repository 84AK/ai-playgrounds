import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
const DEFAULT_APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || "";

export async function POST(request: Request) {
    try {
        const { name, password } = await request.json();
        const cookieStore = await cookies();
        
        // 0. 연결 정보 확인
        const customUrl = cookieStore.get("custom_gs_url")?.value;
        const targetUrl = customUrl || DEFAULT_APPS_SCRIPT_URL;

        if (!name || !password) {
            return NextResponse.json({ success: false, error: "이름과 비밀번호를 모두 입력해주세요." }, { status: 400 });
        }

        // 1. GAS 백엔드가 설정되어 있다면 백엔드 인증 우선
        if (targetUrl) {
            console.log(`📡 [Login-API] Proxying login to GAS: ${name}`);
            const gasRes = await fetch(targetUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "adminLogin", name, password }),
                redirect: "follow"
            });

            if (gasRes.ok) {
                const result = await gasRes.json();
                if (result.status === "success" || result.status === "setup_required") {
                    // 세션 쿠키 설정
                    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 1주
                    
                    cookieStore.set("admin_session", "true", { httpOnly: true, secure: true, expires, path: "/" });
                    cookieStore.set("admin_name", result.name || name, { httpOnly: false, secure: true, expires, path: "/" });
                    cookieStore.set("admin_role", result.role || "admin", { httpOnly: false, secure: true, expires, path: "/" });
                    
                    if (result.status === "setup_required") {
                      return NextResponse.json({ success: true, setupRequired: true, message: result.message });
                    }
                    return NextResponse.json({ success: true, role: result.role, name: result.name });
                } else if (result.status === "pending") {
                    return NextResponse.json({ success: false, error: result.message || "승인 대기 중입니다." }, { status: 403 });
                } else {
                    return NextResponse.json({ success: false, error: result.error === "InvalidPassword" ? "비밀번호가 일치하지 않습니다." : "등록되지 않은 관리자이거나 승인이 필요합니다." }, { status: 401 });
                }
            }
        }

        // 2. 백엔드 미연동 시 시스템 비밀번호로 대체 (최초 설치 및 긴급용)
        // 이름이 'admin' 또는 '관리자'이고 비밀번호가 시스템 상용구와 일치할 때
        if ((name === "admin" || name === "관리자") && password === ADMIN_PASSWORD) {
            const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
            cookieStore.set("admin_session", "true", { httpOnly: true, secure: true, expires, path: "/" });
            cookieStore.set("admin_name", "시스템 관리자", { httpOnly: false, secure: true, expires, path: "/" });
            cookieStore.set("admin_role", "super_admin", { httpOnly: false, secure: true, expires, path: "/" });
            return NextResponse.json({ success: true, role: "super_admin" });
        }

        return NextResponse.json({ success: false, error: "인증 정보가 올바르지 않거나 아직 승인되지 않았습니다." }, { status: 401 });
    } catch (e) {
        console.error("Login Error Details:", e);
        return NextResponse.json({ success: false, error: "잘못된 요청입니다. 상세 에러: " + (e as Error).message }, { status: 400 });
    }
}

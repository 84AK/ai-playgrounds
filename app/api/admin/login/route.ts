import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

export async function POST(request: Request) {
    // 참고: Vercel과 같은 서버리스 호스팅에서는 프로덕션 환경이어도 API Route가 정상 동작합니다.
    // GitHub Pages와 같은 정적 호스팅에서는 엔드포인트 자체가 존재하지 않아 404 에러가 발생합니다.

    try {
        const { password } = await request.json();
        const cookieStore = await cookies();
        
        // 브라우저 쿠키에 설정된 개인 관리자 비밀번호 확인
        const customAdminPass = cookieStore.get("custom_admin_password")?.value;

        // 개인 비밀번호와 시스템 비밀번호 중 하나라도 일치하면 로그인 허용 (유연한 인증)
        if (password === customAdminPass || password === ADMIN_PASSWORD) {
            cookieStore.set("admin_session", "true", {
                httpOnly: true,
                secure: (process.env.NODE_ENV as string) === "production",
                maxAge: 60 * 60 * 24 * 7, // 1주
                path: "/",
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: "비밀번호가 일치하지 않습니다." }, { status: 401 });
    } catch (e) {
        console.error("Login Error Details:", e);
        return NextResponse.json({ success: false, error: "잘못된 요청입니다. 상세 에러: " + (e as Error).message }, { status: 400 });
    }
}

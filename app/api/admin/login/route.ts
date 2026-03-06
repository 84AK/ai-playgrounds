import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

export async function POST(request: Request) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ success: false, error: "운영 서버(정적 사이트)에서는 관리자 로그인을 사용할 수 없습니다." }, { status: 403 });
    }

    try {
        const { password } = await request.json();

        if (password === ADMIN_PASSWORD) {
            const cookieStore = await cookies();
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

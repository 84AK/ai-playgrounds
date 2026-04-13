import { NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto";

/**
 * [보안] 클라이언트에서 전달받은 민감한 키 값을 서버사이드에서 암호화하여 반환합니다.
 */
export async function POST(request: Request) {
    try {
        const { value } = await request.json();
        if (!value) return NextResponse.json({ error: "No value provided" }, { status: 400 });

        const encrypted = encrypt(value);
        return NextResponse.json({ success: true, encrypted });
    } catch (error) {
        return NextResponse.json({ error: "Encryption failed" }, { status: 500 });
    }
}

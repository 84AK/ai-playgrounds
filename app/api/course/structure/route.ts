import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCourseStructure } from "@/lib/courseContent";
import { decrypt } from "@/lib/crypto";

export async function GET() {
    try {
        const cookieStore = await cookies();
        
        const customUrl = cookieStore.get("custom_gs_url")?.value;
        const notionEncryptedKey = cookieStore.get("custom_notion_key")?.value;
        const notionDbId = cookieStore.get("custom_notion_db_id")?.value;
        const notionPriority = cookieStore.get("custom_notion_priority")?.value as "notion" | "sheet" | undefined;

        const notionConfig = notionEncryptedKey && notionDbId ? {
            apiKey: decrypt(notionEncryptedKey),
            databaseId: notionDbId,
            priority: notionPriority || "sheet"
        } : undefined;

        const data = await getCourseStructure(customUrl, notionConfig);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("커리큘럼 구조 조회 실패:", error);
        return NextResponse.json({ success: false, error: "조회 중 오류 발생" }, { status: 500 });
    }
}

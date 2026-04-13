import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { decrypt } from "@/lib/crypto";

export async function POST(req: NextRequest) {
    try {
        const { apiKey, databaseId, isEncrypted } = await req.json();
        
        if (!apiKey || !databaseId) {
            return NextResponse.json({ success: false, error: "API Key와 Database ID가 필요합니다." }, { status: 400 });
        }

        let finalKey = apiKey;
        if (isEncrypted) {
            finalKey = await decrypt(apiKey);
        }

        const notion = new Client({ auth: finalKey });
        
        // 데이터베이스 정보 가져오기 시도 (연결 테스트용)
        const response = await notion.databases.retrieve({ database_id: databaseId });
        
        return NextResponse.json({ 
            success: true, 
            message: "노션 데이터베이스와 성공적으로 연결되었습니다.",
            title: (response as any).title?.[0]?.plain_text || "이름 없는 데이터베이스"
        });

    } catch (error: any) {
        console.error("Notion Test Error:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || "노션 연결에 실패했습니다. API 키와 ID를 확인해주세요." 
        }, { status: 500 });
    }
}

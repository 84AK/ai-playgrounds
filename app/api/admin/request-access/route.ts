import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const DEFAULT_APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || "";
const DEFAULT_SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL || "";

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        const cookieStore = await cookies();
        
        const customUrl = cookieStore.get("custom_gs_url")?.value;
        const targetUrl = customUrl || DEFAULT_APPS_SCRIPT_URL;
        
        const customSlack = cookieStore.get("custom_slack_webhook")?.value;
        const targetSlack = customSlack || DEFAULT_SLACK_WEBHOOK;

        if (!name) {
            return NextResponse.json({ success: false, error: "이름을 입력해주세요." }, { status: 400 });
        }

        if (!targetUrl) {
            return NextResponse.json({ success: false, error: "Apps Script URL이 설정되지 않았습니다." }, { status: 500 });
        }

        // 1. GAS에 신청 기록
        const gasRes = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "requestAdmin", name }),
            redirect: "follow"
        });

        const result = await gasRes.json();
        if (!gasRes.ok || result.error) {
            return NextResponse.json({ success: false, error: result.error === "Exists" ? "이미 신청되었거나 등록된 이름입니다." : "신청 중 오류가 발생했습니다." }, { status: 400 });
        }

        // 2. Slack 알림 전송 (선택 사항)
        if (targetSlack) {
            try {
                await fetch(targetSlack, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: `🔔 *새로운 관리자 권한 신청*\n\n*신청자:* ${name}\n*일시:* ${new Date().toLocaleString('ko-KR')}\n\n스프레드시트에서 역할을 'admin'으로 변경하여 승인해 주세요.`
                    })
                });
            } catch (slackErr) {
                console.error("Slack Notification Error:", slackErr);
                // 슬랙 오류가 전체 프로세스를 방해하지 않도록 함
            }
        }

        return NextResponse.json({ success: true, message: "관리자 신청이 완료되었습니다. Super Admin의 승인을 기다려주세요." });
    } catch (e) {
        console.error("Request Access Error:", e);
        return NextResponse.json({ success: false, error: "잘못된 요청입니다." }, { status: 400 });
    }
}

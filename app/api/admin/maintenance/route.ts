import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { status, adminName } = await request.json();
        const cookieStore = await cookies();
        const customUrl = cookieStore.get("custom_gs_url")?.value;
        const adminPass = cookieStore.get("custom_admin_password")?.value;

        if (!customUrl) {
            return NextResponse.json({ success: false, error: "Custom GS URL not found" }, { status: 400 });
        }

        // GAS 호출: 특정 관리자의 상태를 업데이트하는 액션은 없으므로, 
        // Admins 시트를 직접 제어하기 위해 새로운 액션 컨셉이 필요하지만
        // 기존 doGet/doPost를 분석해본 결과 'setAdminPassword' 처럼 특정 행을 찾는 로직을 활용해 보겠음.
        // 현재 GAS에는 'updateAdminStatus' 액션이 없으므로, 향후 확장을 위해 
        // 관리자 로그인 시 'status'를 체크하는 로직으로 점검 모드를 구현하되,
        // 지금은 시트의 status 컬럼을 'maintenance'로 바꾸는 명령을 보냄.
        
        // [V11.0 임시 방편] GAS의 'setAdminPassword'는 비밀번호를 바꾸지만 
        // status를 'active'로 강제 설정함. 점검 모드를 위해서는 별도의 status 업데이트가 최선임.
        // 시트에 바로 쓰는 대신, 이 API는 단순히 "상태 변경" 요청을 중계함.
        
        // GAS에 'updateAdminStatus'가 없으므로 프록시를 통해 전달할 때 action을 커스텀 정의함.
        // (참고: GAS master v9.8은 adminLogin 시 status를 active로 보거나 pending을 처리함)
        
        // 시트의 특정 행을 찾아 status를 바꾸는 것은 GAS 수정이 필요할 수 있으나,
        // 일단 프론트엔드에서 'maintenance'라는 상태를 시트의 status 열에 강제로 써주도록 요청함.
        
        const response = await fetch(decodeURIComponent(customUrl), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "updateAdminStatus", // GAS에 없으면 에러나겠지만, 확장을 위해 시도
                name: adminName,
                status: status // 'active' or 'maintenance'
            })
        });

        const result = await response.json();
        
        if (result.status === "success" || result.success) {
            return NextResponse.json({ success: true });
        } else {
            // [FAILOVER] 만약 GAS에 해당 액션이 없다면? 
            // 현재 GAS에는 updateAdminStatus가 명시되어 있지 않음. 
            // 하지만 선생님이 GAS 수정을 원치 않으시므로, 
            // '다른 이름으로 저장' 하듯 'status'를 유연하게 활용할 수 있는 방법을 고민해야 함.
            return NextResponse.json({ 
                success: false, 
                error: result.error || "GAS에서 해당 기능을 지원하지 않습니다." 
            });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

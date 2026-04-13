import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const DEFAULT_APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || "";

/**
 * Apps Script Proxy API
 * 클라이언트 대신 서버에서 Apps Script를 호출하여 보안 정보를 숨기고 인증을 수행합니다.
 */

// 관리자만 수행 가능한 민감한 액션 목록
const ADMIN_ACTIONS = ['getStudentList', 'updateFeedback', 'getReferenceCode'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || "";
    const authHeader = request.headers.get('Authorization');
    
    // 0. 동적 URL 및 개인 비밀번호 확인 (쿠키 우선)
    const cookieStore = await cookies();
    const customUrl = cookieStore.get('custom_gs_url')?.value;
    const customAdminPass = cookieStore.get('custom_admin_password')?.value;
    
    const isCustom = !!customUrl;
    const targetUrl = customUrl || DEFAULT_APPS_SCRIPT_URL;
    const targetAdminPass = customAdminPass || ADMIN_PASSWORD;

    // 1. 민감한 액션의 경우 관리자 비밀번호 검증
    if (ADMIN_ACTIONS.includes(action)) {
      if (!authHeader || authHeader !== `Bearer ${targetAdminPass}`) {
        return NextResponse.json({ error: 'Unauthorized: 관리자 인증이 필요합니다.' }, { status: 401 });
      }
    }

    if (!targetUrl) {
      console.error('❌ [Proxy-GET] Apps Script URL is not configured');
      return NextResponse.json({ error: 'Apps Script URL가 설정되지 않았습니다. 설정 페이지에서 연동해 주세요.' }, { status: 500 });
    }

    // 2. Apps Script 호출 (GET) - URL 객체로 안전하게 구성
    const gasUrl = new URL(targetUrl);
    searchParams.forEach((value, key) => gasUrl.searchParams.set(key, value));

    // [V8.3] 로깅 개선: URL 출처 표시 및 더 긴 주소 출력 (전체 확인 용이)
    console.log(`📡 [Proxy-GET] Source: ${isCustom ? "CUSTOM (Cookie)" : "SYSTEM (Env)"}`);
    console.log(`📡 [Proxy-GET] URL: ${gasUrl.toString().length > 120 ? gasUrl.toString().substring(0, 100) + "..." + gasUrl.toString().slice(-15) : gasUrl.toString()}`);

    const response = await fetch(gasUrl.toString(), {
      cache: 'no-store',
      redirect: 'follow'
    });

    if (!response.ok) {
        console.error(`❌ [Proxy-GET] GAS responded with ${response.status}`);
    }

    // Apps Script의 응답 처리 (HTML 응답 가능성 대응)
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
    } else {
        const text = await response.text();
        console.warn(`⚠️ [Proxy-GET] GAS returned non-JSON response: ${text.substring(0, 100)}...`);
        
        try {
            // 텍스트가 JSON일 수도 있으므로 파싱 시도
            responseData = JSON.parse(text);
        } catch {
            // HTML이거나 일반 텍스트인 경우
            let errorMessage = "GAS로부터 예상치 못한 응답(HTML)을 받았습니다.";
            if (text.includes("login") || text.includes("Service Login")) {
                errorMessage = "GAS 권한 설정이 '모든 사용자(Anyone)'로 되어 있는지 확인해 주세요. (로그인 페이지가 반환됨)";
            } else if (text.includes("Script not found") || text.includes("404")) {
                errorMessage = "지정한 GAS URL을 찾을 수 없습니다. URL을 다시 확인해 주세요.";
            }
            responseData = { status: "error", error: errorMessage, debug: text.substring(0, 200) };
        }
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('💥 [Proxy-GET] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || "";
    const authHeader = request.headers.get('Authorization');
    
    // 0. 동적 URL 및 개인 비밀번호 확인 (쿠키 우선)
    const cookieStore = await cookies();
    const customUrl = cookieStore.get('custom_gs_url')?.value;
    const customAdminPass = cookieStore.get('custom_admin_password')?.value;
    
    const isCustom = !!customUrl;
    const targetUrl = customUrl || DEFAULT_APPS_SCRIPT_URL;
    const targetAdminPass = customAdminPass || ADMIN_PASSWORD;

    // 1. 민감한 액션의 경우 관리자 비밀번호 검증
    if (ADMIN_ACTIONS.includes(action)) {
      if (!authHeader || authHeader !== `Bearer ${targetAdminPass}`) {
        return NextResponse.json({ error: 'Unauthorized: 관리자 인증이 필요합니다.' }, { status: 401 });
      }
    }

    if (!targetUrl) {
      console.error('❌ [Proxy-POST] Apps Script URL is not configured');
      return NextResponse.json({ error: 'Apps Script URL가 설정되지 않았습니다.' }, { status: 500 });
    }

    console.log(`📡 [Proxy-POST] Source: ${isCustom ? "CUSTOM (Cookie)" : "SYSTEM (Env)"}`);
    console.log(`📡 [Proxy-POST] Action: ${action}, URL: ${targetUrl.length > 50 ? targetUrl.substring(0, 50) + "..." + targetUrl.slice(-10) : targetUrl}`);

    // 2. Apps Script 호출 (POST)
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
      },
      body: JSON.stringify(body),
      redirect: 'follow'
    });

    // Apps Script의 POST 응답 처리
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
    } else {
        const text = await response.text();
        try {
            responseData = JSON.parse(text);
        } catch {
            responseData = { success: response.ok, message: text || (response.ok ? 'Success' : 'Failed') };
        }
    }

    console.log(`✅ [Proxy-POST] Success: ${response.ok}`);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('💥 [Proxy-POST] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || "";

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
    
    // 1. 민감한 액션의 경우 관리자 비밀번호 검증
    if (ADMIN_ACTIONS.includes(action)) {
      if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
        return NextResponse.json({ error: 'Unauthorized: 관리자 인증이 필요합니다.' }, { status: 401 });
      }
    }

    if (!APPS_SCRIPT_URL) {
      console.error('❌ [Proxy-GET] APPS_SCRIPT_URL is not configured in .env.local or Vercel Settings');
      return NextResponse.json({ error: 'Apps Script URL not configured. .env.local을 확인해 주세요.' }, { status: 500 });
    }

    // 2. Apps Script 호출 (GET) - URL 객체로 안전하게 구성
    const gasUrl = new URL(APPS_SCRIPT_URL);
    searchParams.forEach((value, key) => gasUrl.searchParams.set(key, value));

    console.log(`📡 [Proxy-GET] Fetching: ${gasUrl.toString().substring(0, 100)}...`);

    const response = await fetch(gasUrl.toString(), {
      cache: 'no-store',
      redirect: 'follow'
    });

    if (!response.ok) {
        console.error(`❌ [Proxy-GET] GAS responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
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
    
    // 1. 민감한 액션의 경우 관리자 비밀번호 검증
    if (ADMIN_ACTIONS.includes(action)) {
      if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
        return NextResponse.json({ error: 'Unauthorized: 관리자 인증이 필요합니다.' }, { status: 401 });
      }
    }

    if (!APPS_SCRIPT_URL) {
      console.error('❌ [Proxy-POST] APPS_SCRIPT_URL is not configured');
      return NextResponse.json({ error: 'Apps Script URL not configured' }, { status: 500 });
    }

    console.log(`📡 [Proxy-POST] Action: ${action}, URL: ${APPS_SCRIPT_URL.substring(0, 50)}...`);

    // 2. Apps Script 호출 (POST)
    const response = await fetch(APPS_SCRIPT_URL, {
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

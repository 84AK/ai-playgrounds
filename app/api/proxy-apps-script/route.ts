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
      return NextResponse.json({ error: 'Apps Script URL not configured' }, { status: 500 });
    }

    // 2. Apps Script 호출 (GET)
    const response = await fetch(`${APPS_SCRIPT_URL}?${searchParams.toString()}`, {
      cache: 'no-store'
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Apps Script Proxy Error (GET):', error);
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
      return NextResponse.json({ error: 'Apps Script URL not configured' }, { status: 500 });
    }

    // 2. Apps Script 호출 (POST)
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // Apps Script의 POST 응답은 대개 텍스트이거나 리다이렉션이므로 유연하게 처리
    let responseData;
    try {
        responseData = await response.json();
    } catch {
        responseData = { success: response.ok };
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Apps Script Proxy Error (POST):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

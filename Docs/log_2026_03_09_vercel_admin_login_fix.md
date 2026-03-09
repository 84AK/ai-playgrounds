# 작업 로그 - Vercel 운영 서버 관리자 로그인 에러 및 제한 해제

## 일시
2026년 3월 9일

## 작업 역할
Fix(해결사) & Doc(서기)

## 상황 (Context)
- Vercel을 통해 배포된 라이브 사이트에서 관리자 페이지(`/admin`)에 로그인 시도 시, 다음과 같은 에러 발생:
  > "운영 서버(정적 사이트)에서는 관리자 로그인을 사용할 수 없습니다."

## 원인 분석 (Root Cause)
- 환경 변수 충돌이 아니라, **`app/api/admin/login/route.ts` API 라우트 코드 자체에 존재하는 방어 로직이 원인**이었습니다.
- 기존에 `GitHub Pages`와 같은 정적 사이트 호스팅(Static Export) 환경을 위해, `process.env.NODE_ENV === "production"` 상태일 때는 의도적으로 로그인을 막는 코드가 작성되어 있었습니다.
- Vercel에 배포된 환경 역시 `NODE_ENV` 값이 `"production"`이 되지만, Vercel은 단순한 정적 웹서버가 아니라 **동적 서버리스 함수(Serverless Functions/API Routes)를 지원**하기 때문에 해당 제한 코드를 유지할 필요가 없습니다.

## 해결책 및 수정 사항 (Resolution)
1. **API 제한 코드 삭제**: 
   - `app/api/admin/login/route.ts` 파일에서 `NODE_ENV === "production"`을 조건으로 바로 403 에러를 반환하는 부분을 찾아 주석/삭제 처리했습니다.
   - 이제 Vercel(프로덕션) 환경에서도 조건 없이 본래의 비밀번호 확인 로직을 수행합니다.
   
```typescript
// 수정 전
export async function POST(request: Request) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ success: false, error: "운영 서버(정적 사이트)에서는 관리자 로그인을 사용할 수 없습니다." }, { status: 403 });
    }
    // ...
}

// 수정 후
export async function POST(request: Request) {
    // Vercel과 같은 서버리스 호스팅에서는 정상 작동하므로 제한 해제됨.
    try {
        const { password } = await request.json();
    // ...
}
```

## 비고 (Notes)
- 프론트엔드 환경 변수(`.env`) 설정 문제는 아니었으므로 `NEXT_PUBLIC_STATIC_EXPORT` 등의 추가 처리는 하지 않았습니다.
- 향후 GitHub Pages로 재배포 시, API Routes가 존재하지 않아 404 에러로 처리되며 화면 상에는 "서버 통신 중 오류가 발생했습니다."라고 노출될 예정입니다.

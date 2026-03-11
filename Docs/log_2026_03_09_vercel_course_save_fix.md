# 작업 로그 - Vercel 운영 서버 환경 파일 수정(저장) 에러 해제

## 일시
2026년 3월 9일

## 작업 역할
Fix(해결사) & Doc(서기)

## 상황 (Context)
- Vercel에 배포된 사이트에서 관리자 편집 페이지(`/admin/course`)를 통해 마크다운 문서를 수정한 후 "변경 내용 저장"을 클릭했을 때 다음과 같은 에러가 발생:
  > "운영 서버(정적 사이트)에서는 파일을 수정할 수 없습니다."

## 원인 분석 (Root Cause)
- 앞서 "관리자 로그인"에서 발생했던 문제와 완전히 동일한 원인입니다. 
- GitHub Pages와 같은 100% 정적 프론트엔드 호스팅을 고려하여, 코스 내용을 저장하는 API 라우트(`app/api/course/save/route.ts`) 내부에도 프로덕션 환경(`NODE_ENV === "production"`)일 때 저장을 원천 차단하는 방어 코드가 남아있었습니다.
- Vercel 환경에서는 이 제한이 필요 없으므로 삭제해야 합니다.

## 해결책 및 수정 사항 (Resolution)
1. **저장 API 프로덕션 제한 코드 삭제**: 
   - `app/api/course/save/route.ts` 파일에서 프로덕션 여부를 검사해 403 에러를 반환하는 부분을 삭제했습니다.
   
```typescript
// 수정 전
export async function POST(request: Request) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ success: false, error: "운영 서버(정적 사이트)에서는 파일을 수정할 수 없습니다." }, { status: 403 });
    }
    // ...
}

// 수정 후
export async function POST(request: Request) {
    // Vercel 환경은 서버리스 API를 지원하므로 정상 통과
    try {
        const cookieStore = await cookies();
    // ...
}
```

## 비고 (Notes)
- 변경 후 깃허브로 다시 푸시(Push)가 완료되면, Vercel에서도 원활하게 "변경 내용 저장" 기능이 활성화됩니다.
- 구글 스프레드시트가 연결된 경우(환경변수 등록 시) 정상적으로 시트에 저장되며, 미등록 상태라면 Vercel 특성상 로컬 파일이 일시적으로만 저장되고 배포 후 날아갈 수 있으므로 가급적 백엔드 DB나 Google Sheets 연결 환경변수를 Vercel 쪽에 등록하는 것이 권장됩니다.

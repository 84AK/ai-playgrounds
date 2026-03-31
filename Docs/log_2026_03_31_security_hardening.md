# 📝 작업 로그 (Job Log) - 2026.03.31

## 📌 작업 개요
- **작업명**: 바이브코딩 보안 규칙 준수 및 관리자 인증 보안 강화
- **일자**: 2026년 3월 31일
- **담당 역할**: 해결사(Solver), 서기(Scribe), 건축가(Architect)

---

## 🛠️ 구현 내용 (Implementation)

### 1. 환경 변수 보안 격리 (Rule 1, 2 준수)
- **파일**: `.env.local`, `app/constants.ts`
- **내용**: 클라이언트 번들에 노출되던 `NEXT_PUBLIC_ADMIN_PASSWORD` 및 `NEXT_PUBLIC_APPS_SCRIPT_URL` 접두사를 제거하여 서버 사이드 전용 변수로 격리했습니다.

### 2. 서버 사이드 인증 프록시 구축 (Rule 5 준수)
- **파일**: `app/api/proxy-apps-script/route.ts`
- **내용**: 클라이언트가 직접 Apps Script URL을 부르는 대신 Next.js 서버를 거치도록 프록시를 생성했습니다.
    - `getStudentList`, `updateFeedback`, `getReferenceCode` 등 민감한 관리자 액션은 반드시 `Authorization` 헤더의 비밀번호 검증을 거치도록 설계했습니다.
    - 학생용 기능(과제 제출, 진도 조회 등)은 이전과 동일하게 인증 없이 프록시를 이용할 수 있도록 예외 처리를 수행했습니다.

### 3. AI 분석 라우트 보안 강화 (Rule 5, 8 준수)
- **파일**: `app/api/analyze-code/route.ts`
- **내용**: AI 분석 요청 시 관리자 비밀번호를 필수로 검증하도록 로직을 추가하여 무단 호출을 차단했습니다.

### 4. 프론트엔드 통신 로직 및 UI 연동 (Rule 5 준수)
- **파일**: `lib/appsScriptClient.ts`, `app/admin/feedback/page.tsx`, `components/HomeworkDashboard.tsx`
- **내용**: 
    - `appsScriptClient.ts`가 프록시 경로를 호출하고 인증 헤더를 지원하도록 개편했습니다.
    - 관리자 전용 피드백 대시보드에서 `NEXT_PUBLIC_` 참조를 제거하고, 유저가 입력한 비밀번호를 API 호출 시 동적으로 전달하게 개선했습니다.
    - 학생용 대시보드도 보안이 강화된 통신 유틸리티를 사용하도록 수정했습니다.

---

## 🔧 수정 및 에러 해결 (Fix & Resolution)

- **기능 중단 방지**: 모든 요청에 인증을 걸 경우 학생들의 과제 제출 기능이 마비될 수 있었으나, 프록시 내부에서 `action` 파라미터별 차등 인증 로직을 적용하여 기존 기능을 완벽하게 보존했습니다.
- **임포트 누락 해결**: `HomeworkDashboard.tsx` 수정 시 `getAppsScriptJson` 함수 임포트 누락으로 발생한 TS 린트 에러를 즉시 해결했습니다.

---

## 💡 다음 작업 참고 사항 (Feedback)
- **현재 비밀번호 구조**: 현재는 환경 변수와 직접 비교하는 방식입니다. 향후 더 많은 관리자가 필요할 경우 Supabase Auth나 JWT 세션 기반의 정교한 인증으로의 전환을 고려할 수 있습니다.
- **Vercel 배포 시**: 새롭게 변경된 환경 변수명(`ADMIN_PASSWORD`, `APPS_SCRIPT_URL`)을 Vercel 대시보드에 반드시 업데이트해야 합니다.

---
**기록자**: 서기(Doc)
**프로젝트**: AI Playgrounds - Security Hardening

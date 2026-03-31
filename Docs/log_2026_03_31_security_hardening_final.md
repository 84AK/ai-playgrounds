# 작업 로그: 보안 강화 및 SyntaxError 해결 (2026-03-31)

## 1. 개요
브라우저 환경에서 `APPS_SCRIPT_URL`을 직접 호출(`fetch`)할 때 발생하는 `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON` 문제를 해결하고, 프로젝트 전반의 보안 가이드라인(Rule 1)을 준수하도록 리팩토링을 수행했습니다.

## 2. 발생한 문제 (Root Cause)
- **원인**: 보안 강화를 위해 클라이언트 사이드(`NEXT_PUBLIC_`) 환경 변수에서 `APPS_SCRIPT_URL`을 제거함에 따라, 브라우저에서 `APPS_SCRIPT_URL`이 빈 문자열(`""`)이 되었습니다.
- **현상**: `fetch("")` 호출 시 현재 페이지의 HTML(`<!DOCTYPE html>...`)이 반환되고, 이를 `res.json()`으로 파싱하려다 보니 문법 에러가 발생했습니다.

## 3. 해결 및 구현 내용
모든 클라이언트 사이드 직접 호출을 서버 사이드 프록시 API(`/api/proxy-apps-script`)를 통하도록 수정했습니다.

### (1) 공통 유틸리티 수정 (`lib/appsScriptClient.ts`)
- `postAppsScript` 함수가 응답 JSON을 반환하도록 수정하여 호출 측에서 처리 결과를 확인할 수 있게 개선했습니다.
- 에러 핸들링 로직을 강화했습니다.

### (2) 쇼케이스 페이지 리팩토링 (`app/showcase/page.tsx`)
- `fetch(APPS_SCRIPT_URL)` -> `getAppsScriptJson` (데이터 로드)
- `fetch(APPS_SCRIPT_URL, { method: 'POST' })` -> `postAppsScript` (프로젝트 등록/수정/삭제)
- 누락된 React 훅 및 Link 컴포넌트 임포트를 복구했습니다.

### (3) MBTI 메이커 페이지 리팩토링 (`app/mbti/page.tsx`)
- `loadExistingData` 함수 내의 직접 fetch 호출을 `getAppsScriptJson`으로 교체했습니다.
- `handleSubmit` (저장) 로직의 직접 fetch 호출을 `postAppsScript`로 교체했습니다.
- 구문 오류(`try-catch` 구조)를 수정하고 린트 에러를 해결했습니다.

### (4) 기타 컴포넌트 및 라이브러리 정리
- `components/StudyLabPanel.tsx`: 불필요해진 `APPS_SCRIPT_URL` 임포트를 제거했습니다.
- `lib/progressSync.ts`: 직접 fetch를 `getAppsScriptJson`으로 교체 완료했습니다.
- `app/mbti/[weekId]/UploadHomework.tsx`: 이미 프록시 유틸리티를 사용 중임을 확인했습니다.

## 4. 결과 및 검증
- `grep` 검색 결과, 클라이언트 사이드 코드에서 더 이상 `fetch(APPS_SCRIPT_URL)`을 호출하는 곳이 없음을 확인했습니다.
- 모든 외부 API 통신은 서버(`app/api/proxy-apps-script/route.ts`)를 거치므로 구글 Apps Script URL이 외부에 노출되지 않습니다.
- 브라우저 콘솔의 `SyntaxError`가 해결되었을 것으로 기대됩니다.

## 5. 향후 과제
- `lib/courseContent.ts` 등 서버 전용 유틸리티가 향후 클라이언트에서 필요한 경우, 반드시 프록시 API를 추가로 구현하여 대응해야 합니다.
- 배포 환경(Vercel 등)에서 `APPS_SCRIPT_URL` 및 `ADMIN_PASSWORD` 환경 변수가 올바르게 설정되어 있는지 최종 확인이 필요합니다.

---
작성자: antigravity (AI Study Assistant)
날짜: 2026-03-31

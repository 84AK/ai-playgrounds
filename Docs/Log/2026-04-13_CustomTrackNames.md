# [2026-04-13] 프로젝트 작업 로그: 개인 연구소 트랙 명칭 커스텀

## 1. 개요 (Objective)
선생님들이 '개인 연구소' 환경에서 기본 트랙(MBTI, POSE)의 이름을 자유롭게 변경하고, 이를 매직 링크를 통해 공유할 수 있도록 시스템 전반의 명칭 동기화 로직을 구현함.

## 2. 주요 수정 내용 (Implementation Details)

### Backend & Sync Layer
- **`hooks/useBackendStatus.ts`**: `trackNames` (Record<string, string>) 상태를 추가하고, 쿠키(`custom_track_names`)에서 매핑 정보를 읽어와 전역에서 사용할 수 있게 개선함. `getTrackName(originalName)` 헬퍼 함수 제공.
- **`app/api/admin/magic-login/route.ts`**: URL 파라미터로 전달된 `trackNames`를 수신하여 브라우저 쿠키에 저장하도록 업데이트함.

### Admin UI
- **`app/admin/course/page.tsx`**: 
    - 트랙 리스트 영역에 편집(Pencil) 아이콘 추가.
    - `prompt`를 통해 새 이름을 입력받아 쿠키에 저장하고 `backend:changed` 이벤트를 발생시켜 즉시 반영함.
- **`app/admin/setup/page.tsx`**: '관리자 매직 링크' 생성 시 현재 설정된 커스텀 트랙 이름 정보를 인코딩하여 포함함.

### Global UI
- **`app/page.tsx`**: 메인 페이지 벤토 그리드 타이틀을 `getTrackName`을 거쳐 출력하도록 변경.
- **`components/StudyLabPanel.tsx`**: 대시보드 탭 및 진도율 헤더 명칭을 커스텀 이름으로 연동함.
- **`components/AdminCourseEditorPanel.tsx`**: 편집기 사이드바 헤더에 노출되는 트랙명을 커스텀 이름으로 변경함.

## 3. 발생한 에러 및 해결 (Error & Resolution)

### [ERROR] Module parse failed: Identifier 'fetchUserProgress' has already been declared
- **원인**: `useSWR` 도입 과정에서 `mutate` 함수를 `fetchUserProgress`로 비구조화 할당했으나, 기존에 존재하던 동일한 이름의 `async` 함수를 제거하지 않아 발생한 빌드 에러.
- **해결**: `components/StudyLabPanel.tsx`에서 중복된 함수 선언을 삭제하고, 새로고침 버튼(`onClick`)에서 파라미터 없이 `mutate`를 호출하도록 수정함.

## 4. 향후 참고 사항 (Notes for Future Work)
- **쿠키 만료**: 모든 커스텀 설정 쿠키는 1년 뒤 만료되도록 설정됨.
- **동기화 원리**: `window.dispatchEvent(new CustomEvent("backend:changed"))`를 통해 서로 다른 컴포넌트 간의 쿠키 변경 사항을 실시간으로 감지하고 UI를 갱신함.

---
**작성자**: 서기 (Scribe)
**기술 스택**: Next.js 14, Tailwind CSS, Framer Motion, SWR
아크랩스 공식 홈페이지: https://litt.ly/aklabs ✨

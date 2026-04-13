# 📝 작업 로그 (Update Log) - 2026-04-13

## 📋 작업 일시
- **날짜:** 2026년 4월 13일
- **작업자:** AI 스터디 플랫폼 개발팀 (Architect, Worker, Solver, Designer, Scribe)

## 🎯 작업 목표
- **다중 관리자(Multi-Admin) 시스템 구축:** 단일 비밀번호 체계를 벗어나 성명 기반의 개별 계정 및 승인 시스템 도입.
- **보안 강화:** 비밀번호 SHA-256 해싱 저장 및 세션 관리 고도화.
- **슬랙(Slack) 연동:** 새로운 관리자 권한 신청 시 Super Admin에게 실시간 알림 전송.
- **관리자 UI 개편:** 로그인, 권한 신청, 관리자 모니터링 UI 구현.

## 🛠️ 주요 구현 내용

### 1. 백엔드 (Google Apps Script)
- **`Admins` 시트 지원:** 이름, 역할, 비밀번호 해시, 상태, 생성일을 관리하는 전용 시트 로직 추가.
- **보안 로직:** `Utilities.computeDigest`를 활용한 SHA-256 비밀번호 해싱 기능 구현.
- **액션 추가:**
    - `adminLogin`: 이름/비번 검증 및 세션 정보 반환.
    - `requestAdmin`: 신규 관리자 권한 신청 기록.
    - `getAdmins`: (Super Admin 전용) 전체 관리자 목록 및 상태 조회.
    - `setAdminPassword`: 승인된 관리자의 초기 비밀번호 설정.

### 2. API 레이어 (Next.js API Routes)
- **`/api/admin/login`:**
    - GAS 백엔드와 연동하여 실시간 인증 프록시 수행.
    - 인증 성공 시 `admin_session`, `admin_name`, `admin_role` 쿠키를 통한 정교한 세션 관리.
- **`/api/admin/request-access`:**
    - 신규 권한 신청 처리 및 슬랙 웹훅(Slack Webhook) 알림 발송 로직 통합.

### 3. 프론트엔드 (UI/UX)
- **로그인 화면 개편:**
    - '이름' 입력 필드 추가 및 '로그인/신청' 모드 전환 기능 구현.
    - 신청 완료 시 상태 피드백 UI 제공.
- **관리자 설정 페이지 (`/admin/setup`):**
    - **슬랙 웹훅 설정:** 알림용 웹훅 URL 입력 및 쿠키 저장 기능.
    - **관리자 목록 대시보드:** 현재 등록된 관리자들의 상태(Active/Pending) 및 역할 실시간 모니터링.

## ⚠️ 특이 사항 및 해결 방법
- **최초 설치 로직:** `Admins` 시트가 비어있거나 없는 경우, 첫 번째 로그인 시도를 자동으로 `Super Admin`으로 등록하여 시스템 잠김 방지.
- **하이브리드 세션:** 쿠키 기반의 기존 방식과 GAS 시트 기반의 신규 방식을 조화시켜, 개인 연구소 모드에서도 완벽하게 작동하도록 설계.

## 🐛 버그 수정 (Bug Fix) - 2026-04-13

### 1. 관리자 로그인 화면 UI 중복 오류 수정
- **문제:** `AdminDashboardClient.tsx` 구현 과정에서 `ADMIN PASSWORD` 입력 필드가 조건문 외부에도 중복 선언되어 로그인 화면에 두 개가 노출되는 버그 발생.
- **해결:** 중복된 입력 필드를 제거하여 정상적으로 하나만 노출되도록 수정 완료.
- **교훈:** 복잡한 조건부 렌더링(Conditional Rendering) 작성 시 중첩 구조를 세밀하게 확인해야 함.

### 2. StudyLabPanel.tsx 'useBackendStatus' 참조 오류 수정
- **문제:** `getTrackName` 함수를 도입하는 과정에서 `StudyLabPanel.tsx`에 `useBackendStatus` 훅 임포트(Import)가 누락되어 `ReferenceError` 발생.
- **해결:** 해당 파일 상단에 `import useBackendStatus from "@/hooks/useBackendStatus";`를 추가하여 오류 해결.

### 3. app/ranking/page.tsx 데이터 참조 예외 처리 (Full Sweep)
- **문제:** `useSWR`이 초기값으로 `null`을 반환할 때 `.map()`, `.length`, `.findIndex()` 등 배열 메서드 호출 시 `TypeError` 발생.
- **해결:** 파일 내 모든 `students` 참조 부위에 `(students || [])` 안전 장치를 적용하여, 데이터 로딩 상태에 관계없이 크래시가 발생하지 않도록 전수 수정 완료.

### 4. app/ranking/page.tsx 'isLoading' 참조 오류 수정
- **문제:** 랭킹 새로고침 버튼에서 `useSWR`이 제공하는 `isValidating` 대신 정의되지 않은 `isLoading` 변수를 사용하여 `ReferenceError` 발생.
- **해결:** 해당 변수를 `isValidating`으로 교체하여 로딩 애니메이션 및 버튼 비활성화 기능이 정상 작동하도록 수정 완료.

## 🔗 관련 문서 및 링크
- **스프레드시트:** `Admins` 시트 확인 필요.
- **아크랩스:** [https://litt.ly/aklabs](https://litt.ly/aklabs)

# 2026-03-05 로컬 동기화/런타임 이슈 대응 로그

이 문서는 2026년 3월 5일 진행한 작업을 기준으로, 요청사항부터 문제 파악, 에러, 해결 방법, 결과를 상세 정리한 기록입니다.

## 1) 최초 요청

### 요청 A
- **요청 내용:** MBTI 페이지에서 "쇼케이스에 저장"까지 완료한 유저는 홈의 `0주차: MBTI 메이커 & 쇼케이스`가 자동 체크되도록 반영.

### 요청 B
- **추가 요청:** 저장 직후 홈으로 돌아왔을 때 새로고침 없이 0주차 체크가 즉시 반영되도록 처리.

### 요청 C
- **추가 이슈:** 로컬(`http://localhost:3000`) 로그인 화면이 배포본보다 어둡고 텍스트가 검게 보이는 문제.

### 요청 D
- **추가 이슈:** 홈(루트 경로)에서 404 발생.

### 요청 E
- **추가 이슈:** 로그아웃 시 다음 런타임 에러 발생.
  - `Module ... next/image.js ... module factory is not available. It might have been deleted in an HMR update.`
  - 스택에 `marketing_simulation/.next/dev/...` 경로가 표시됨.

### 요청 F
- **최종 요청:** 지금까지 수정한 코드를 GitHub에 업로드.

---

## 2) 문제 파악/분석

### A. 0주차 체크 누락 원인
- 홈 진척도는 `getProgress` 응답의 `mbti_week0`만 읽고 있었음.
- MBTI 제작/저장은 되어도 백엔드 `mbti_week0` 반영이 늦거나 누락될 수 있어 홈에서 체크되지 않는 케이스 확인.

### B. 즉시 반영 불가 원인
- 저장 후 쇼케이스로 이동하지만 홈 화면 상태 재조회 트리거가 없어 실시간 반영이 되지 않음.

### C. 로컬 로그인 화면 어둡게 보이는 원인
- 로그인 모달이 일부 텍스트/입력 색상을 상속에 의존.
- 로컬 렌더/캐시 조건에서 `foreground` 토큰 적용 타이밍 차이로 검정 텍스트가 노출되는 상황 확인.

### D. 홈 404 원인
- `next.config.ts`에 `basePath: '/ai-playgrounds'`가 항상 적용되어 로컬 루트(`/`)가 깨짐.
- 즉, GitHub Pages 배포용 경로가 로컬 개발에도 강제 적용된 상태.

### E. 로그아웃 런타임 에러 원인
- 로그아웃/로그인/정보수정 흐름에서 `window.location.reload()` 사용.
- 개발 환경 HMR과 강한 충돌이 발생할 때 `module factory is not available` 에러가 발생 가능.
- 특히 브라우저 런타임이 과거/타 프로젝트 번들을 참조(`marketing_simulation/.next`)하는 캐시 오염 정황이 함께 보임.

---

## 3) 실제 에러/현상 기록

### 에러 1: 로컬 홈 404
- 현상: 상단 네비의 홈 진입 시 `404 This page could not be found`.

### 에러 2: 로그아웃 후 Runtime Error
- 현상: 로그아웃 직후 Next 개발 오버레이에서 module factory 관련 런타임 에러 노출.
- 대표 메시지:
  - `... next/image.js [app-client] ... module factory is not available ... HMR update`

### 참고 에러: git commit 잠금 파일
- 커밋 중 `.git/index.lock` 잔존으로 커밋 실패.
- stale lock 제거 후 정상 커밋 진행.

---

## 4) 해결 작업 상세

## 4-1. MBTI 0주차 자동 체크 보정

### 수정 파일
- `app/page.tsx`

### 처리 내용
- `fetchUserProgress()`에서 `mbti_week0`가 false일 때 보정 로직 추가.
- `getAllMbtiData`를 조회해 다음 조건이면 0주차 완료로 간주:
  - `data.questions`에 해당 유저 author 존재
  - 또는 `data.showcase_links`에 해당 유저 + MBTI play 링크 존재

### 기대 효과
- 백엔드 진행도(`mbti_week0`)가 즉시 반영되지 않아도, 실제 MBTI 저장 이력이 있으면 홈에서 0주차 체크 표시.

---

## 4-2. 저장 직후 즉시 반영(새로고침 없이)

### 수정 파일
- `app/mbti/page.tsx`
- `app/page.tsx`

### 처리 내용
- MBTI 저장 성공 시:
  - `localStorage`에 `mbti_week0_force_refresh` 타임스탬프 기록
  - `window.dispatchEvent(new CustomEvent("mbti:save-complete"))` 발행
- 홈 페이지에서 다음 이벤트를 구독하여 진척도 재조회:
  - `mbti:save-complete`
  - `focus`
  - `visibilitychange`(visible 복귀)
  - `storage`(`mbti_week0_force_refresh` 변경)

### 기대 효과
- 저장 직후 탭 전환/복귀 또는 동일 탭 이동에서도 0주차가 빠르게 동기화.

---

## 4-3. 로컬 로그인 화면 텍스트/톤 불일치 수정

### 수정 파일
- `app/layout.tsx`
- `components/GlobalAuthGuard.tsx`

### 처리 내용
- 레이아웃 body에 `dark` 클래스 명시 추가.
- 로그인 모달에 `text-foreground`를 명시하고, 주요 label/input에도 텍스트/placeholder 색상 직접 지정.

### 기대 효과
- 다크 토큰 상속/적용 타이밍 편차가 있어도 로그인 UI가 환경(배포/로컬) 간 일관된 대비 유지.

---

## 4-4. 로컬 홈 404 수정

### 수정 파일
- `next.config.ts`

### 처리 내용
- 프로덕션에서만 `basePath` / `assetPrefix` 적용하도록 분기.
  - `const isProd = process.env.NODE_ENV === "production"`
  - `basePath: isProd ? "/ai-playgrounds" : undefined`
  - `assetPrefix: isProd ? "/ai-playgrounds" : undefined`

### 기대 효과
- 로컬 개발 서버(`localhost`)에서는 `/` 정상 라우팅.
- 배포(GitHub Pages)에서는 기존 경로 유지.

---

## 4-5. 로그아웃 시 HMR 런타임 에러 완화/해결

### 수정 파일
- `components/GlobalAuthGuard.tsx`
- `components/UserSettingsModal.tsx`
- `components/Navbar.tsx`
- `package.json`

### 처리 내용
- `window.location.reload()` 기반 인증 흐름 제거.
- `auth:changed` 이벤트 기반으로 로그인/로그아웃/프로필변경 상태 동기화.
- `router.refresh()`로 안전하게 화면 갱신.
- Navbar/Guard에서 `auth:changed` + `storage` 구독 추가.
- dev 스크립트 안정화:
  - `"dev": "next dev --webpack"` 변경(개발 중 HMR 안정성 보강 목적).

### 기대 효과
- 로그아웃 시 강제 리로드로 인한 개발 런타임 충돌 가능성 감소.
- 인증 상태 전환이 더 부드럽고 예측 가능해짐.

---

## 5) 변경 파일 목록

- `app/page.tsx`
- `app/mbti/page.tsx`
- `app/layout.tsx`
- `components/GlobalAuthGuard.tsx`
- `components/UserSettingsModal.tsx`
- `components/Navbar.tsx`
- `next.config.ts`
- `package.json`

---

## 6) 검증/배포 상태

### 검증
- 변경 파일 기준 lint 점검 진행(프로젝트 전체의 기존 lint 이슈는 별도 존재).
- 라우팅/진척도/로그아웃 동작 기준으로 기능 검증 절차 안내 및 재확인 수행.

### GitHub 반영
- 브랜치: `main`
- 커밋: `39ee68d`
- 메시지: `Fix local routing/theme issues and stabilize auth state sync`
- 원격 반영: `origin/main` 푸시 완료

---

## 7) 후속 권장 사항

- 개발 브라우저에서 프로젝트를 자주 바꿔 작업할 경우, 탭/서비스워커/캐시가 꼬일 수 있으므로 프로젝트별 프로필(또는 시크릿 창) 사용 권장.
- 인증 상태 갱신(`auth:changed`)은 공통 이벤트로 정착했으므로, 향후 사용자 상태 관련 컴포넌트도 동일 이벤트로 통일 권장.
- 장기적으로는 `no-cors` POST의 성공 판정 한계를 보완하기 위해 응답 확인 가능한 백엔드 계약(status/json) 정비 권장.

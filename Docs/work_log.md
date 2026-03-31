# 프로젝트 작업 로그 (2026-03-31)

## 📝 작업 개요
보안 강화(Hardening) 과정에서 발생한 데이터 로딩 및 로그인 실패 문제를 해결하고, 서비스의 시각적 완성도와 안정성을 높이기 위한 프리미엄 UX 기능들을 추가했습니다.

## 🛠️ 수정 및 해결 내용 (Fix & Solve)

### 1. 데이터 통신 오류 복구
- **문제**: 보안 프록시 전환 후 `fetch` 요청 시 URL 파라미터가 유실되거나 잘못 형성되어 데이터 로딩 실패.
- **원인**: 문자열 기반의 URL 생성이 특수문자 및 리다이렉트(302) 처리에 취약했음.
- **해결**: 
    - `app/api/proxy-apps-script/route.ts`의 URL 생성 로직을 `URL` 객체 기반으로 전면 개편.
    - 서버 사이드 로깅을 강화하여 통신 실패 시 터미널에서 즉시 원인 파악 가능하도록 개선.
    - Apps Script의 302 리다이렉트를 안정적으로 처리하도록 `fetch` 옵션 최적화.

### 2. 환경 변수 하위 호환성 확보
- **문제**: `NEXT_PUBLIC_` 접두사 제거 정책으로 인해 기존 환경 변수와 충돌 발생.
- **해결**: `lib/courseContent.ts` 및 `app/constants.ts`에서 접두사가 있는 버전과 없는 버전을 모두 확인하도록 Fallback 로직 추가.

## ✨ 신규 구현 기능 (New Features)

### 1. 프리미엄 전체 화면 로딩 (`LoadingOverlay`)
- **디자인**: Glassmorphism(반투명 블러) 배경과 2026 트렌드 애니메이션 적용.
- **기능**: 진도 데이터 동기화 시 화면 전체를 덮어 사용자에게 진행 상태를 명확히 고지.
- **위치**: `components/StudyLabPanel.tsx` 연동.

### 2. 무한 스크롤 쇼케이스 캐러셀 (`ShowcaseCarousel`)
- **디자인**: 끊김 없는(Infinite Loop) CSS 애니메이션 슬라이더.
- **기능**: 실제 등록된 연구원들의 작품 데이터를 홈 화면에 생동감 있게 노출. 마우스 호버 시 정지 인터랙션 포함.
- **위치**: `app/page.tsx` (우리 프로젝트 전시관 섹션).

### 3. 세련된 점검 안내 페이지 (`MaintenanceOverlay`)
- **디자인**: 일러스트와 고급스러운 타이포그래피가 적용된 안내 화면.
- **기능**: `NEXT_PUBLIC_MAINTENANCE_MODE=true` 설정 시 서비스 전체를 덮어 사용자 안내 제공.
- **위치**: `components/LayoutClientWrapper.tsx` 연동.

## 📚 향후 참고 사항
- 모든 외부 API 호출은 반드시 서버 사이드 프록시(`app/api/proxy-apps-script`)를 거쳐야 보안 규칙을 준수할 수 있습니다.
- 새로운 환경 변수 추가 시 `.env.example`에 기록하여 팀원들과 공유하십시오.

---
**작업자:** antigravity (Senior UI/UX & Full-stack)
**소속:** 인공지능 미래 연구소 (AI Playgrounds)

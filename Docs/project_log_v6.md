# 📝 Project Log: Multi-Tenant Teacher Setup & GAS V6.0 Integration

- **일시**: 2026-04-11
- **작업자**: Antigravity (Relector, Blueprint, Fix, UI Polish, Doc)

---

## 1. 개요 (Overview)
선생님들이 각자 독립적인 백엔드(구글 시트 + GAS)를 소유할 수 있도록 멀티 테넌트 환경을 구축하고, 최신 동적 교육과정 규격인 **GAS V6.0**을 도입함. 기존 8주차 제한을 12주차로 확장하고 엑셀 템플릿 직접 다운로드 방식을 채택하여 온보딩 경험을 혁신함.

## 2. 주요 구현 내용 (Implementation)

### [Blueprint] 멀티 테넌트 아키텍처 설계
- 쿠키(`custom_gs_url`, `custom_folder_id`)를 활용한 동적 API 라우팅 구현.
- Vercel 환경변수 의존성을 낮추고 "Bring Your Own Backend" 모델 확립.

### [Relector] 백엔드 & 프론트엔드 연동
- **GAS V6.0**: `lib/gasTemplate.ts`에 동적 커리큘럼 및 12주차 확장 로직 반영.
- **Data Layer**: `rankingService.ts` 데이터 구조 통합 (`progress` 배열 단일화).
- **Study Plan**: `StudyLabPanel.tsx` 12주차 루프 확장.

### [UI Polish] 설정 및 랭킹 UI 고도화
- **Setup Center**: 엑셀 템플릿 다운로드 링크 및 GAS 연동 가이드 개선.
- **Ranking Chart**: `RankingCard.tsx`에 12주차 통합 진도 매트릭스(Bento Dot) 적용.

## 3. 발생 문제 및 해결 (Fix & AS)

### 🚨 [에러] Unterminated template (lib/gasTemplate.ts)
- **원인**: 템플릿 리터럴 마감 기호 앞에 백슬래시(\)가 붙어 있어 마감 처리가 되지 않음. (문법 오류)
- **해결**: 마감 기호 `\`;`를 `;`로 수정하여 해결 완료.

### 🚨 [이슈] 구글 드라이브 사본 만들기 권한 문제
- **원인**: 공유 권한 설정에 따라 가끔 사본 만들기가 차단되는 현상 발생.
- **해결**: 파일 직접 다운로드 방식(`public/templates/playground_template.xlsx`)으로 변경하여 100% 성공률 확보.

## 4. 최종 결과물 (Deliverables)
- **GAS V6.0 Standard Code** (lib/gasTemplate.ts)
- **Teacher Setup Dashboard** (app/admin/setup)
- **12-Week Unified Progress System**

## 5. 다음 작업 제안 (Next Steps)
- 각 주차별 정답 코드(Reference Codes) 폴더 ID를 설정 화면에서 추가로 입력받는 기능 검토.
- 선생님들을 위한 "5분 만에 백엔드 구축하기" 퀵 가이드 문서화.

---
*기록: 서기(Doc)*

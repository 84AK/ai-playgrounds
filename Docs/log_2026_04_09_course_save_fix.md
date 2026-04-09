# 관리자 코스 수정 저상 오류 해결 및 성능 최적화 로그 (2026-04-09)

## 📋 이슈 사항 (Issue)
1. **관리자 코스 편집 저장 오류**: 관리자 페이지에서 내용 수정 후 저장 시 `Invalid Action` 에러가 발생하고 시트 업데이트가 안 됨. (302 Redirect 시 POST Body 유실이 원인)
2. **관리자 페이지 트랙/주차 버튼 응답 지연**: 버튼을 클릭할 때마다 페이지가 서버 재렌더링되며 반응이 1~2초 지연되는 현상.
3. **대규모 확장성 우려**: 주차가 4주차를 넘어 수십 단계로 늘어났을 때 현재의 그리드 버튼 UI가 가로로 깨질 우려.

## 🛠️ 해결 및 구현 (Resolution)

### Phase 1: 저장 통신 안정성 개선 및 하이브리드 정답 도입
1. **Frontend (`lib/courseContent.ts`)**: `fetch` 요청 시 URL 기반 이중 파라미터 맵핑으로 리다이렉트 대응.
2. **Apps Script (`Code.gs`) 고도화 (V5.3)**: 
   - 랭킹 데이터(Students Progress) 보존.
   - 부분 일치(flexible matching) 방식으로 `course_contents` 탭 지능형 탐색.
   - **하이브리드 정답 참조**: 시트 내 `ReferenceCodes` 탭에서 우선 정답 코드를 읽어오고, 없을 시 기존 구글 드라이브 폴더에서 스캔하는 기능 추가.

### Phase 2: 관리자 페이지 "Instant UI" 성능 혁신
1. **서버 페칭 -> 클라이언트 렌더링 전환**: 
   - `app/admin/course/page.tsx` 내부의 무거운 `await getCourseContent()` 제거. 레이아웃만 즉시 그리기.
2. **비동기 로딩 전용 API 신설**: `app/api/course/content/route.ts`의 GET 엔드포인트를 만들어 클라이언트 사이드에서 즉시 내용을 로드할 수 있게 구성.
3. **AdminCourseEditorPanel 리팩토링 (SWR/Cache)**: 
   - `useEffect` 비동기 상태 적용. 버튼을 누른 즉시 페이지 내리기 방지.
   - **스마트 캐시 (`contentCache`)** 도입: 이미 본 주차는 메모리에 저장되어 0.1초 내 즉각 재로드.
   - **Skeleton UI**: 빈 화면 대신 우아한 펄스형(Pulse) 뼈대 UI 표시하여 체감 속도 향상.
4. **가로형 휠 스크롤 패널 개발**:
   - 트랙과 주차 버튼 영역(`overflow-x-auto`, `flex-nowrap`, `scrollbar-hide`) 개발.
   - 자바스크립트의 `onWheel` 이벤트 컨버팅(`e.deltaY`를 `scrollLeft`로 매핑)으로 일반 마우스 상하 휠을 굴려도 부드럽게 좌우 스크롤되는 매직 트랙패드급 사용자 경험 달성.
5. **무결성 린트 제거**: ESLint가 React 최신 패턴을 엄격히 잡는 6가지 컴포넌트(`Navbar.tsx`, `PrivacyModal.tsx` 등)의 경고들을 완벽히 해소해 클린 빌드 상태 달성.

## ✅ 향후 계획 (Next Step)
- 이 템플릿(가로휠 네비게이션 + 클라이언트 캐싱)은 학습자용 메인 뷰어에도 충분히 도입할 가치가 있습니다.
- Google Sheets의 `ReferenceCodes` 시트를 만들어 관리자가 직접 정답 코드를 쉽게 입력할 수 있는 구조 활용 권장.

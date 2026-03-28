# 📝 프로젝트 작업 로그 (2026-03-28)

주차별 개별 피드백 시스템(WeeklyFeedbacks) 구현 내역입니다.

## ✨ 신규 구현 사항 (Implement)

- **주차별 독립 피드백 저장 (WeeklyFeedbacks 시트)**:
    - 학생 한 명당 주차별로 다른 피드백을 남길 수 있는 전용 시트를 도입했습니다.
    - 데이터 구조: `학생ID | 주차 | 피드백 내용 | 업데이트 시간`
    - 기존 `Users` 시트의 피드백은 '전체 공지/통합 피드백' 용도로 유지(Fallback)되도록 설계했습니다.

- **관리자 페이지 주차별 연동**:
    - `AdminFeedbackPage.tsx`에서 주차 선택 시 해당 주차의 피드백을 실시간으로 불러오도록 고도화했습니다.
    - 피드백 전송 시 현재 선택된 주차 정보를 함께 전달하여 정확한 위치에 저장되게 했습니다.

- **학생 페이지 주차별 표시**:
    - `UploadHomework.tsx` 접속 시 해당 차시(`weekId`)에 저장된 피드백만 필터링하여 노출합니다.

## 🛠️ 수정 내역 (Modify)

- **`app/admin/feedback/page.tsx`**: 주차 변경 시 데이터 로드 및 전송 로직 수정.
- **`GAS_Update_Guide.md`**: `updateFeedback`, `checkUserStatus` 액션 고도화 (V7_Weekly 버전).
- **`components/FeedbackOverlay.tsx`**: (유지) 전체 공지용 피드백을 노출하는 글로벌 컴포넌트 역할 유지.

---
**기록자**: 서기(Doc)
**상태**: 주차별 피드백 시스템 구축 완료

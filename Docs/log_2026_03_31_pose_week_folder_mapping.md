# 📋 작업 로그: Pose Game 주차 폴더명 매핑 수정

- **날짜**: 2026-03-31
- **담당**: Fix (해결사) + Doc (서기)
- **관련 파일**: `app/pose/[weekId]/UploadHomework.tsx`

---

## 🔍 문제 상황

### 증상
- My Study Lab에서 **MBTI Maker** 탭(4차시)과 **Pose Game** 탭(4차시)이 서로 다른 학습 세션으로 구성되어 있음
- Pose Game에서 "결과 저장하기" 버튼 클릭 시, 앱스스크립트로 전달되는 `week` 값이 단순 숫자(`1`, `2`, `3`, `4`)로 전달됨
- 앱스스크립트가 이 숫자를 MBTI와 동일한 방식으로 처리 → 구글드라이브에 `1주차_기타` 폴더로 잘못 저장됨

### 원인
- `UploadHomework.tsx` (pose 버전) payload의 `week` 필드에 `weekId` 숫자를 그대로 전달
- 앱스스크립트에서 POSE/MBTI를 `week` 번호만으로 구분하지 못함
- Progress 시트에는 `POSE_Week1` ~ `POSE_Week4` 컬럼이 존재하나, 프론트에서 해당 키를 전달하지 않았음

---

## ✅ 해결 방법

### 전략
> **앱스스크립트 코드를 수정하지 않고**, 프론트엔드 payload에서 `week` 값을 `POSE_Week{n}` 형식 문자열로 매핑하여 전달

### 수정 파일
**`app/pose/[weekId]/UploadHomework.tsx`**

#### 변경 내용 1: payload의 week 값 변경
```diff
- const payload = {
-     action: "uploadHomework",
-     week: weekId,   // ❌ 숫자 (1, 2, 3, 4)
-     ...
- };

+ const poseWeekLabel = `POSE_Week${weekId}`;   // ✅ "POSE_Week1" 형식
+ const payload = {
+     action: "uploadHomework",
+     week: poseWeekLabel,   // ✅ "POSE_Week1", "POSE_Week2", ...
+     ...
+ };
```

#### 변경 내용 2: 업로드 성공 확인 키 변경
```diff
- if (checkResult?.data?.[`pose_week${weekId}`] === true) {
+ if (checkResult?.data?.[`POSE_Week${weekId}`] === true) {
```
- Progress 시트의 컬럼명인 `POSE_Week1` 형식으로 통일

---

## 💡 핵심 원리

| 항목 | 값 |
|------|-----|
| 화면 표시 | Pose Game 1차시 |
| 앱스스크립트로 전달되는 `week` | `POSE_Week1` |
| 구글드라이브 생성 폴더 | `POSE_Week1_학년반_이름` |
| Progress 시트 컬럼 | `POSE_Week1` |


---

## 🔄 2차 수정 (2026-03-31) — Option A 적용

### 원인 재확인
- `week` 필드가 **폴더명 생성 (`week + "주차"`)** 과 **Progress 기록 (`Number(week)`)** 두 역할을 동시에 담당
- 문자열 `"POSE_Week1"`을 전달하면 `Number("POSE_Week1") = NaN` → Progress 기록 실패

### 최종 수정 방향 (Option A)

#### 1. `app/pose/[weekId]/UploadHomework.tsx` — 원상복구
- `week: poseWeekLabel` → `week: weekId` (숫자 그대로)
- `POSE_Week${weekId}` 체크 → `pose_week${weekId}` (소문자, 앱스스크립트 반환 키와 일치)

#### 2. `Docs/Code_v4_merged.js` (→ Google Apps Script에 반영 필요)
```javascript
// 수정 전
const weekFolderName = (week.toString() + "주차").normalize("NFC");

// 수정 후
const weekNum = Number(week);
const weekFolderName = (course_type && course_type.toUpperCase() === 'POSE')
  ? `POSE_Week${weekNum}`.normalize("NFC")   // POSE → "POSE_Week1"
  : (week.toString() + "주차").normalize("NFC"); // MBTI → "1주차" (기존 유지)
```

### 결과 구조

| 학습 | 전달값 | 구글드라이브 폴더 | Progress 키 |
|------|--------|-----------------|-------------|
| MBTI 1차시 | week=1, course_type=MBTI | `1주차 > 기타` | mbti_week1 |
| POSE 1차시 | week=1, course_type=POSE | `POSE_Week1 > 기타` | pose_week1 |

### ⚠️ 적용 필수 사항
`Docs/Code_v4_merged.js`의 변경 내용을 실제 **Google Apps Script 편집기**에도 반영하고 **새 버전으로 배포**해야 합니다.


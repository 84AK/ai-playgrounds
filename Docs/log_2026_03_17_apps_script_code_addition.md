# 구글 앱스 스크립트(`Code.gs`) 추가 코드 (2026-03-17)

작성해주신 앱스 스크립트 소스 코드에 **강의 콘텐츠를 불러오고(`getCourseContent`) 저장하는(`saveCourseContent`) 로직이 빠져있습니다.** 
선언문 상단에 `COURSE_SHEET_NAME = "course_contents"`는 정의가 되어 있지만, 하단분기에서 누락되어 있던 상태입니다.

스프레드시트에서 정상적으로 반영되도록 아래 코드를 각각의 위치에 추가해 주시면 됩니다!

---

## 🛠️ 1. `doPost(e)` 함수 내부에 추가할 코드
`doPost(e)`의 분기 처리 하단(`if (action === 'saveMbti') { ... }` 끝나는 자리 아래)에 위치시킵니다.

```javascript
    // ⬇️ 강의 콘텐츠 저장 액션 추가 ⬇️
    if (action === 'saveCourseContent') {
      const { track, week, content } = data;
      let cSheet = ss.getSheetByName(COURSE_SHEET_NAME) || ss.insertSheet(COURSE_SHEET_NAME);
      if (cSheet.getLastRow() === 0) cSheet.appendRow(["Track", "Week", "Content", "Last_Updated"]);

      const rows = cSheet.getDataRange().getValues();
      let foundRow = -1;
      for (let i = 1; i < rows.length; i++) {
        // 트랙과 주차가 일치하는 행 탐색
        if (rows[i][0] === track && Number(rows[i][1]) === Number(week)) { 
          foundRow = i + 1; 
          break; 
        }
      }

      if (foundRow !== -1) {
        // 기존 콘텐츠 업데이트
        cSheet.getRange(foundRow, 3).setValue(content);
        cSheet.getRange(foundRow, 4).setValue(getKoreanTime());
      } else {
        // 새 콘텐츠 추가
        cSheet.appendRow([track, Number(week), content, getKoreanTime()]);
      }
      return createJSONResponse({ status: "success" });
    }
```

---

## 🛠️ 2. `doGet(e)` 함수 내부에 추가할 코드
`doGet(e)`의 분기 처리 하단(`if (action === "getProgress") { ... }` 아래)에 위치시킵니다.

```javascript
    // ⬇️ 강의 콘텐츠 조회 액션 추가 ⬇️
    if (action === 'getCourseContent') {
      const { track, week } = params;
      const cSheet = ss.getSheetByName(COURSE_SHEET_NAME);
      
      // 시트가 없으면 빈 콘텐츠 반환
      if (!cSheet) return createJSONResponse({ status: "success", content: "" }); 
      
      const rows = cSheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === track && Number(rows[i][1]) === Number(week)) {
          return createJSONResponse({ status: "success", content: rows[i][2] });
        }
      }
      return createJSONResponse({ status: "success", content: "" });
    }
```

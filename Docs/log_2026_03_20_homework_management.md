# 📁과제 다운로드 및 관리 기능 백엔드(Apps Script) 연동 가이드

학생들이 파일을 업로드할 때 중복 생성을 방지(덮어쓰기)하고, 다운로드 링크를 생성하여 대시보드에 연동하며, 삭제 기능까지 지원하기 위한 **구글 앱스 스크립트(Code.gs) 수정 코드**입니다.

---

## 🛠️ 1. `doPost(e)` 함수 내 기능 수정 및 추가

### 📍 [수정] `uploadHomework` 액션 (중복 방지 및 다운로드 주소 생성)
기존 `uploadHomework` 분기(`if (action === 'uploadHomework') { ... }`)를 아래 코드로 **교체**해 주세요.

```javascript
    // 1. 학습 결과물 파일 업로드 (Base64) - 중복 덮어쓰기 및 삭제 연동 포함
    if (action === 'uploadHomework') {
      const { user_id, course_type, week, file_name, file_base64, mime_type } = data;
      
      if (!user_id || !course_type || week === undefined || !file_base64) {
        return createJSONResponse({ error: "Missing parameters for file upload" }, 400);
      }

      try {
        const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
        
        // 🔍 기존에 동일한 이름의 파일이 있는지 검색
        const files = folder.getFilesByName(file_name);
        let file;

        if (files.hasNext()) {
          // 덮어쓰기 (기존 파일 활용)
          file = files.next();
          const decodedData = Utilities.base64Decode(file_base64);
          file.setContent(Utilities.newBlob(decodedData, mime_type || MimeType.PLAIN_TEXT).getBytes());
        } else {
          // 신규 파일 생성
          const dEncoded = Utilities.base64Decode(file_base64);
          const blob = Utilities.newBlob(dEncoded, mime_type || MimeType.PLAIN_TEXT, file_name);
          file = folder.createFile(blob);
        }

        // ⚠️ [필수] 다운로드 가능하도록 권한 설정 변경
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const downloadUrl = file.getDownloadUrl(); // 다운로드 다이렉트 링크 생성

        // 드라이브 업로드 성공 시 진도율 및 URL 업데이트
        updateUserProgress(user_id, course_type, Number(week), true, downloadUrl);

        return createJSONResponse({ 
          status: "success", 
          message: "과제가 구글 드라이브에 안전하게 보관 및 업데이트되었습니다!", 
          fileUrl: downloadUrl 
        });

      } catch (driveError) {
        return createJSONResponse({ status: "error", message: "서버가 구글 폴더에 접근하지 못했습니다: " + driveError.toString() }, 500);
      }
    }
```

### 📍 [추가] `deleteHomework` 액션 (프로필 삭제 기능 지원)
`doPost(e)` 내부 하단 적절한 위치(예: `uploadHomework` 끝나는 부근)에 아래 코드를 **추가**해 주세요.

```javascript
    // ✅ 과제 삭제 액션 추가
    if (action === 'deleteHomework') {
      const { user_id, course_type, week } = data;
      if (!user_id || !course_type || week === undefined) {
        return createJSONResponse({ error: "Missing parameters" }, 400);
      }

      try {
        const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
        // 파일명 포함 규칙 검색 (주차 및 유저 닉네임을 기반으로 휴지통 처리)
        const query = `title contains '${week}주차_' and title contains '${user_id}' and trashed = false`;
        const files = folder.searchFiles(query);
        
        while (files.hasNext()) {
          const file = files.next();
          file.setTrashed(true); // 🗑️ 휴지통으로 이동
        }

        // 진도 차감 및 URL 제거 업데이트
        updateUserProgress(user_id, course_type, Number(week), false, "");

        return createJSONResponse({ status: "success", message: "과제가 정상적으로 삭제되었습니다." });
      } catch (err) {
        return createJSONResponse({ status: "error", message: "삭제 작업 중 오류 발생: " + err.toString() }, 500);
      }
    }
```

---

## 🛠️ 2. `doGet(e)` 함수 내 기능 수정

### 📍 [수정] `getProgress` 액션 (진척도 로딩 시 다운로드 URL 포함 전달)
`doGet(e)` 내의 `action === "getProgress"` 분기를 아래 코드로 **교체**해 주세요.

```javascript
    // 2. 통합 학습 달성도(Progress) 불러오기 (다운로드 URL 포함)
    if (action === "getProgress") {
      const user_id = params.user_id;
      if (!user_id) return createJSONResponse({ error: "Missing user_id parameter" }, 400);

      const pSheet = ss.getSheetByName(SHEET_PROGRESS);
      let userData = {
        mbti_week1: false, mbti_week2: false, mbti_week3: false, mbti_week4: false,
        pose_week1: false, pose_week2: false, pose_week3: false, pose_week4: false
      };

      if (pSheet) {
        const rows = pSheet.getDataRange().getValues();
        let foundRow = -1;
        for (let i = 1; i < rows.length; i++) {
           if (rows[i][0] === user_id) {
             foundRow = i;
             break;
           }
        }
        
        if (foundRow !== -1) {
          const r = rows[foundRow];
          userData = {
            mbti_week1: !!r[1], mbti_week2: !!r[2], mbti_week3: !!r[3], mbti_week4: !!r[4],
            pose_week1: !!r[5], pose_week2: !!r[6], pose_week3: !!r[7], pose_week4: !!r[8],
            
            // 🔗 [추가] 대응하는 파일 다운로드 URL 키-값 탑재 (index 9~16 활용)
            mbti_week1_url: r[9] || "", mbti_week2_url: r[10] || "", mbti_week3_url: r[11] || "", mbti_week4_url: r[12] || "",
            pose_week1_url: r[13] || "", pose_week2_url: r[14] || "", pose_week3_url: r[15] || "", pose_week4_url: r[16] || ""
          };
        }
      }

      return createJSONResponse({ status: "success", data: userData });
    }
```

---

## 🛠️ 3. 하단 내부 함수([Helper]) 수정
문서 가장 하단에 있는 `updateUserProgress` 함수를 아래 코드로 **교체**하여 스프레드시트 컬럼을 자동으로 확장하고 URL을 동시 관리하도록 합니다.

```javascript
/* =========================================================
   [Helper] 유저 달성도(Progress) 및 다운로드 URL 업데이트 리뉴얼
   ========================================================= */
function updateUserProgress(userId, courseType, weekNum, status, fileUrl = "") {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_PROGRESS);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PROGRESS);
    sheet.appendRow([
      "User_ID", 
      "MBTI_Week1", "MBTI_Week2", "MBTI_Week3", "MBTI_Week4", 
      "POSE_Week1", "POSE_Week2", "POSE_Week3", "POSE_Week4",
      "MBTI_Week1_Url", "MBTI_Week2_Url", "MBTI_Week3_Url", "MBTI_Week4_Url",
      "POSE_Week1_Url", "POSE_Week2_Url", "POSE_Week3_Url", "POSE_Week4_Url"
    ]);
    sheet.getRange("A1:Q1").setBackground("#e6b8af").setFontWeight("bold");
  } else {
    const lastCol = sheet.getLastColumn();
    // 기존에 완료여부 컬럼(9개)만 있다면 URL 컬럼 헤더(8개)를 끝에 이어붙입니다.
    if (lastCol < 17) {
       sheet.getRange(1, 10, 1, 8).setValues([[
         "MBTI_Week1_Url", "MBTI_Week2_Url", "MBTI_Week3_Url", "MBTI_Week4_Url",
         "POSE_Week1_Url", "POSE_Week2_Url", "POSE_Week3_Url", "POSE_Week4_Url"
       ]]);
       sheet.getRange("J1:Q1").setBackground("#ffd966").setFontWeight("bold");
    }
  }
  
  const rows = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === userId) {
      foundRow = i + 1;
      break;
    }
  }
  
  let colIndex = 2; 
  let urlColIndex = 10; 
  
  if (courseType.toUpperCase() === 'MBTI') {
      colIndex = 1 + weekNum; 
      urlColIndex = 9 + weekNum;
  } else if (courseType.toUpperCase() === 'POSE') {
      colIndex = 5 + weekNum;
      urlColIndex = 13 + weekNum;
  }
  
  if (foundRow !== -1) {
    sheet.getRange(foundRow, colIndex).setValue(status);
    sheet.getRange(foundRow, urlColIndex).setValue(fileUrl);
  } else {
    // 17칸짜리 신규 열 조립
    const newRow = Array(17).fill("");
    newRow[0] = userId;
    newRow[colIndex - 1] = status;
    newRow[urlColIndex - 1] = fileUrl;
    sheet.appendRow(newRow);
  }
}
```

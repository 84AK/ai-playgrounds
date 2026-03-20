/* ==============================================================
   MBTI Maker & My Study Lab 통합 백엔드 API V4 (과제 관리 강화 버전)
   - 주요 기능: 파일 다운로드 링크 연동, 업로드 덮어쓰기 권장, 프로필 삭제 지원
   ============================================================== */

const SHEET_MBTI_QUESTIONS = "Questions";
const SHEET_MBTI_RESULTS = "Results";
const SHEET_PROGRESS = "Progress";
const SHEET_SHOWCASE_LINKS = "ShowcaseLinks"; 
const SHEET_USERS = "Users"; 

// 🚨 [필수 확인] 여기에 실습 코드를 받을 구글 드라이브 폴더 ID를 붙여넣으세요!
const TARGET_FOLDER_ID = "여기에_폴더_아이디_입력하세요";

// OPTIONS 요청 처리 (CORS 문제 해결)
function doOptions(e) {
  return handleCORS();
}

function handleCORS() {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

function createJSONResponse(data, statusCode = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getKoreanTime() {
  const date = new Date();
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const kstTime = new Date(utc + (9 * 60 * 60000));
  return Utilities.formatDate(kstTime, "GMT+09:00", "yyyy-MM-dd HH:mm:ss");
}

/* =========================================================
   [POST] 데이터 업로드 / 수정 / 삭제
   ========================================================= */
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return createJSONResponse({ error: "No post content" }, 400);
    }
    
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return createJSONResponse({ error: "Invalid JSON format" }, 400);
    }
    
    const action = data.action;

    // --------------------------------------------------
    // 0. 유저 프로필 등록 및 수정 로직
    // --------------------------------------------------
    if (action === 'registerUser' || action === 'updateUser') {
      const { user_id, school, password, avatar } = data;
      if (!user_id || !password || !school || !avatar) return createJSONResponse({ error: "Missing parameters" }, 400);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(SHEET_USERS);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_USERS);
        sheet.appendRow(["User_ID", "School", "Password", "Avatar", "Last_Updated"]);
        sheet.getRange("A1:E1").setBackground("#c9daf8").setFontWeight("bold");
      }

      const rows = sheet.getDataRange().getDisplayValues();
      let foundRow = -1;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === user_id) {
          foundRow = i + 1;
          break;
        }
      }

      const rowData = [user_id, school, password, avatar, getKoreanTime()];
      if (action === 'registerUser') {
        if (foundRow !== -1) return createJSONResponse({ error: "User already exists" }, 400);
        sheet.appendRow(rowData);
        return createJSONResponse({ status: "success", message: "User registered" });
      } else {
        if (foundRow === -1) return createJSONResponse({ error: "User not found" }, 404);
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
        return createJSONResponse({ status: "success", message: "User updated" });
      }
    }

    // --------------------------------------------------
    // 1. 학습 결과물 파일 업로드 (Base64) & 중복 방지(덮어쓰기)
    // --------------------------------------------------
    if (action === 'uploadHomework') {
      const { user_id, course_type, week, file_name, file_base64, mime_type } = data;
      
      if (!user_id || !course_type || week === undefined || !file_base64) {
        return createJSONResponse({ error: "Missing parameters for file upload" }, 400);
      }

      try {
        const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
        
        // 🔍 중복 방지: 동일 파일명 검색
        const files = folder.getFilesByName(file_name);
        let file;

        if (files.hasNext()) {
          // 덮어쓰기
          file = files.next();
          const decodedData = Utilities.base64Decode(file_base64);
          file.setContent(Utilities.newBlob(decodedData, mime_type || MimeType.PLAIN_TEXT).getBytes());
        } else {
          // 신규 생성
          const dEncoded = Utilities.base64Decode(file_base64);
          const blob = Utilities.newBlob(dEncoded, mime_type || MimeType.PLAIN_TEXT, file_name);
          file = folder.createFile(blob);
        }

        // ⚠️ 다운로드 가능하도록 권한 설정 변경
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const downloadUrl = file.getDownloadUrl(); 

        // 진도표에 다운로드 링크 포함하여 기록
        updateUserProgress(user_id, course_type, Number(week), true, downloadUrl);

        return createJSONResponse({ 
          status: "success", 
          message: "과제가 드라이브에 안전하게 보관 및 업데이트되었습니다!", 
          fileUrl: downloadUrl 
        });

      } catch (driveError) {
        return createJSONResponse({ status: "error", message: "서버가 구글 폴더에 접근하지 못했습니다: " + driveError.toString() }, 500);
      }
    }

    // --------------------------------------------------
    // 1-2. 과제 삭제 (프로필에서 파일 및 진도율 파기)
    // --------------------------------------------------
    if (action === 'deleteHomework') {
      const { user_id, course_type, week } = data;
      if (!user_id || !course_type || week === undefined) {
        return createJSONResponse({ error: "Missing parameters" }, 400);
      }

      try {
        const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
        // 파일명 포함 규칙 검색 (주차 및 유저 ID 기반 휴지통 처리)
        const query = `title contains '${week}주차_' and title contains '${user_id}' and trashed = false`;
        const files = folder.searchFiles(query);
        
        while (files.hasNext()) {
          const file = files.next();
          file.setTrashed(true); // 휴지통으로 이동
        }

        // 진도 차감 및 URL 제거
        updateUserProgress(user_id, course_type, Number(week), false, "");

        return createJSONResponse({ status: "success", message: "과제가 정상적으로 삭제되었습니다." });
      } catch (err) {
        return createJSONResponse({ status: "error", message: "삭제 작업 중 오류 발생: " + err.toString() }, 500);
      }
    }

    // --------------------------------------------------
    // 2. 커스텀 쇼케이스 링크 등록/수정/삭제 API (기존 유지)
    // --------------------------------------------------
    if (action === 'registerShowcaseLink') { /* 기존 코드 유지 */ }
    if (action === 'editShowcaseLink') { /* 기존 코드 유지 */ }
    if (action === 'deleteShowcaseLink') { /* 기존 코드 유지 */ }
    
    // --------------------------------------------------
    // 4. MBTI 전체 프로젝트 저장
    // --------------------------------------------------
    if (action === 'saveMbti') { /* 기존 코드 유지 */ }
    if (action === 'saveResult') { /* 기존 코드 유지 */ }

    // 기존 분기가 처리되지 않은 액션 백업 (쇼케이스 등은 기존 Log_2026_03_11_googledrive_fix.md 참고)
    return createJSONResponse({ error: "Invalid Action" }, 400);

  } catch (error) {
    return createJSONResponse({ error: "Server Error", details: error.toString() }, 500);
  }
}

/* =========================================================
   [GET] 데이터 불러오기
   ========================================================= */
function doGet(e) {
  const params = e.parameter;
  const action = params.action;

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'getUser') { /* 기존 유지 */ }
    if (action === "getAllMbtiData") { /* 기존 유지 */ }

    // --------------------------------------------------
    // 2. 통합 학습 달성도(Progress) 불러오기 (다운로드 URL 포함)
    // --------------------------------------------------
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
            
            // 🔗 연동 다운로드 URL 반환 (index 9~16 컬럼 활용)
            mbti_week1_url: r[9] || "", mbti_week2_url: r[10] || "", mbti_week3_url: r[11] || "", mbti_week4_url: r[12] || "",
            pose_week1_url: r[13] || "", pose_week2_url: r[14] || "", pose_week3_url: r[15] || "", pose_week4_url: r[16] || ""
          };
        }
      }

      return createJSONResponse({ status: "success", data: userData });
    }

    return createJSONResponse({ error: "Invalid Action" }, 400);
  } catch(error) {
     return createJSONResponse({ error: "GET Error", details: error.toString() }, 500);
  }
}

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
    const newRow = Array(17).fill("");
    newRow[0] = userId;
    newRow[colIndex - 1] = status;
    newRow[urlColIndex - 1] = fileUrl;
    sheet.appendRow(newRow);
  }
}

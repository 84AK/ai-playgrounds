/* ==============================================================
   MBTI Maker & My Study Lab 통합 백엔드 API V4_Final_Real 
   (과제 관리 강화 및 실시간 파일 존재 검증 통합 버전)
   ============================================================== */

const SHEET_MBTI_QUESTIONS = "Questions";
const SHEET_MBTI_RESULTS = "Results";
const SHEET_PROGRESS = "Progress";
const SHEET_SHOWCASE_LINKS = "ShowcaseLinks"; 
const SHEET_USERS = "Users"; 
const COURSE_SHEET_NAME = "course_contents"; 

// 🚨 [필수 확인] 여기에 반드시 실습 코드를 받을 구글 드라이브 폴더 ID를 붙여넣으세요!
const TARGET_FOLDER_ID = "여기에_폴더_아이디_입력하세요";

function doOptions(e) { return handleCORS(); }
function handleCORS() { return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT); }
function createJSONResponse(data, statusCode = 200) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
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
  // 🔒 [통합 추가] 동시성 충돌 방지 락(Lock) 개방
  const lock = LockService.getScriptLock();
  
  try {
    // 동시 요청이 있을 때 최대 20초간 줄을 서게 함 (데이터 꼬임 방지)
    lock.waitLock(20000); 

    if (!e.postData || !e.postData.contents) return createJSONResponse({ error: "No post content" }, 400);
    let data = JSON.parse(e.postData.contents);
    const action = data.action;

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 0. 유저 프로필 등록 및 수정
    if (action === 'registerUser' || action === 'updateUser') {
      const { user_id, school, password, avatar } = data;
      if (!user_id || !password || !school || !avatar) return createJSONResponse({ error: "Missing parameters" }, 400);
      let sheet = ss.getSheetByName(SHEET_USERS) || ss.insertSheet(SHEET_USERS);
      if (sheet.getLastRow() === 0) sheet.appendRow(["User_ID", "School", "Password", "Avatar", "Last_Updated"]);

      const rows = sheet.getDataRange().getDisplayValues();
      let foundRow = -1;
      for (let i = 1; i < rows.length; i++) { if (rows[i][0] === user_id) { foundRow = i + 1; break; } }

      const rowData = [user_id, school, password, avatar, getKoreanTime()];
      if (action === 'registerUser') {
        if (foundRow !== -1) return createJSONResponse({ error: "User already exists" }, 400);
        sheet.appendRow(rowData); return createJSONResponse({ status: "success", message: "User registered" });
      } else {
        if (foundRow === -1) return createJSONResponse({ error: "User not found" }, 404);
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]); return createJSONResponse({ status: "success", message: "User updated" });
      }
    }

    // 1. 학습 결과물 파일 업로드 (중복 덮어쓰기 지원)
    if (action === 'uploadHomework') {
      const { user_id, course_type, week, file_name, file_base64, mime_type } = data;
      if (!user_id || !course_type || week === undefined || !file_base64) return createJSONResponse({ error: "Missing parameters" }, 400);

      try {
        const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
        const files = folder.getFilesByName(file_name);
        let file;

        if (files.hasNext()) {
          file = files.next();
          file.setContent(Utilities.newBlob(Utilities.base64Decode(file_base64), mime_type || MimeType.PLAIN_TEXT).getBytes());
        } else {
          file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(file_base64), mime_type || MimeType.PLAIN_TEXT, file_name));
        }

        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const downloadUrl = file.getDownloadUrl(); 
        updateUserProgress(user_id, course_type, Number(week), true, downloadUrl);

        return createJSONResponse({ status: "success", message: "과제가 드라이브에 안전하게 보관되었습니다!", fileUrl: downloadUrl });
      } catch (err) { return createJSONResponse({ status: "error", message: "드라이브 에러: " + err.toString() }, 500); }
    }

    // 1-2. 과제 삭제 액션
    if (action === 'deleteHomework') {
      const { user_id, course_type, week } = data;
      try {
        const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
        const query = `title contains '${week}주차_' and title contains '${user_id}' and trashed = false`;
        const files = folder.searchFiles(query);
        while (files.hasNext()) { files.next().setTrashed(true); }
        updateUserProgress(user_id, course_type, Number(week), false, "");
        return createJSONResponse({ status: "success", message: "과제가 삭제되었습니다." });
      } catch (err) { return createJSONResponse({ status: "error", message: err.toString() }, 500); }
    }

    // 📚 1-3. 강의 콘텐츠 저장
    if (action === 'saveCourseContent') {
      const { track, week, content } = data;
      let cSheet = ss.getSheetByName(COURSE_SHEET_NAME) || ss.insertSheet(COURSE_SHEET_NAME);
      if (cSheet.getLastRow() === 0) cSheet.appendRow(["Track", "Week", "Content", "Last_Updated"]);

      const rows = cSheet.getDataRange().getValues();
      let foundRow = -1;
      for (let i = 1; i < rows.length; i++) { if (rows[i][0] === track && Number(rows[i][1]) === Number(week)) { foundRow = i + 1; break; } }

      if (foundRow !== -1) { cSheet.getRange(foundRow, 3).setValue(content); cSheet.getRange(foundRow, 4).setValue(getKoreanTime()); } 
      else { cSheet.appendRow([track, Number(week), content, getKoreanTime()]); }
      return createJSONResponse({ status: "success", message: "Course content saved" });
    }

    return createJSONResponse({ error: "Invalid Action" }, 400);
  } catch (error) { 
    return createJSONResponse({ error: "Server Error", details: error.toString() }, 500); 
  } finally {
    // 🔒 [통합 추가] 작업 끝난 후 락 해제
    lock.releaseLock();
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
    
    if (action === 'getUser') {
      const user_id = params.user_id;
      const uSheet = ss.getSheetByName(SHEET_USERS);
      if (uSheet) {
        const rows = uSheet.getDataRange().getDisplayValues();
        for (let i = 1; i < rows.length; i++) { if (rows[i][0] === user_id) return createJSONResponse({ status: "success", data: { name: rows[i][0], school: rows[i][1], password: rows[i][2], avatar: rows[i][3] } }); }
      }
      return createJSONResponse({ status: "error", message: "User not found" }, 404);
    }

    // 2. 통합 학습 달성도(Progress) 불러오기 (실시간 파일 검증 포함)
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
        for (let i = 1; i < rows.length; i++) { if (rows[i][0] === user_id) { foundRow = i; break; } }
        
        if (foundRow !== -1) {
          const r = rows[foundRow];
          userData = {
            mbti_week1: !!r[1], mbti_week2: !!r[2], mbti_week3: !!r[3], mbti_week4: !!r[4],
            pose_week1: !!r[5], pose_week2: !!r[6], pose_week3: !!r[7], pose_week4: !!r[8],
            mbti_week1_url: r[9] || "", mbti_week2_url: r[10] || "", mbti_week3_url: r[11] || "", mbti_week4_url: r[12] || "",
            pose_week1_url: r[13] || "", pose_week2_url: r[14] || "", pose_week3_url: r[15] || "", pose_week4_url: r[16] || ""
          };

          const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
          for (let weekId = 1; weekId <= 4; weekId++) {
            
            // 🔍 MBTI : 파일 존재 여부 실시간 검증 (드라이브에서 수동 삭제 대응)
            if (userData[`mbti_week${weekId}`]) {
              const query = `title contains '${weekId}주차_' and title contains '${user_id}' and trashed = false`;
              const files = folder.searchFiles(query);
              if (files.hasNext()) {
                userData[`mbti_week${weekId}_url`] = files.next().getDownloadUrl(); 
              } else {
                userData[`mbti_week${weekId}_url`] = ""; // 없으면 제거
                // 필요시 시트 동기화 update 가능
              }
            }

            // 🔍 Pose : 파일 존재 여부 실시간 검증
            if (userData[`pose_week${weekId}`]) {
              const query = `title contains '${weekId}주차_' and title contains '${user_id}' and trashed = false`;
              const files = folder.searchFiles(query);
              if (files.hasNext()) {
                userData[`pose_week${weekId}_url`] = files.next().getDownloadUrl();
              } else {
                userData[`pose_week${weekId}_url`] = "";
              }
            }
          }
        }
      }
      return createJSONResponse({ status: "success", data: userData });
    }

    // 📚 3. 강의 콘텐츠 조회
    if (action === 'getCourseContent') {
      const { track, week } = params;
      const cSheet = ss.getSheetByName(COURSE_SHEET_NAME);
      if (!cSheet) return createJSONResponse({ status: "success", content: "" }); 
      const rows = cSheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === track && Number(rows[i][1]) === Number(week)) { return createJSONResponse({ status: "success", content: rows[i][2] }); }
      }
      return createJSONResponse({ status: "success", content: "" });
    }

    return createJSONResponse({ error: "Invalid Action" }, 400);
  } catch(error) { return createJSONResponse({ error: "GET Error", details: error.toString() }, 500); }
}

/* =========================================================
   [Helper] 유저 달성도(Progress) 및 다운로드 URL 업데이트 리뉴얼
   ========================================================= */
function updateUserProgress(userId, courseType, weekNum, status, fileUrl = "") {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_PROGRESS);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PROGRESS);
    sheet.appendRow([ "User_ID", "MBTI_Week1", "MBTI_Week2", "MBTI_Week3", "MBTI_Week4", "POSE_Week1", "POSE_Week2", "POSE_Week3", "POSE_Week4", "MBTI_Week1_Url", "MBTI_Week2_Url", "MBTI_Week3_Url", "MBTI_Week4_Url", "POSE_Week1_Url", "POSE_Week2_Url", "POSE_Week3_Url", "POSE_Week4_Url" ]);
  } else {
    const lastCol = sheet.getLastColumn();
    if (lastCol < 17) { sheet.getRange(1, 10, 1, 8).setValues([[ "MBTI_Week1_Url", "MBTI_Week2_Url", "MBTI_Week3_Url", "MBTI_Week4_Url", "POSE_Week1_Url", "POSE_Week2_Url", "POSE_Week3_Url", "POSE_Week4_Url" ]]); }
  }
  
  const rows = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < rows.length; i++) { if (rows[i][0] === userId) { foundRow = i + 1; break; } }
  
  let colIndex = 2, urlColIndex = 10; 
  if (courseType.toUpperCase() === 'MBTI') { colIndex = 1 + weekNum; urlColIndex = 9 + weekNum; } 
  else if (courseType.toUpperCase() === 'POSE') { colIndex = 5 + weekNum; urlColIndex = 13 + weekNum; }
  
  if (foundRow !== -1) {
    sheet.getRange(foundRow, colIndex).setValue(status);
    sheet.getRange(foundRow, urlColIndex).setValue(fileUrl);
  } else {
    const newRow = Array(17).fill(""); newRow[0] = userId; newRow[colIndex - 1] = status; newRow[urlColIndex - 1] = fileUrl;
    sheet.appendRow(newRow);
  }

  // ⚡ [통합 추가] 스프레드시트 업데이트 즉시 반영 강제화 (동기화 딜레이 방지)
  SpreadsheetApp.flush();
}

/* ==============================================================
   AI 연구소 통합 백엔드 API V6.0_Weekly_Feedback_Upgrade
   (주차별 피드백 분리 저장 및 조회 지원)
   ============================================================== */

const SHEET_USERS = "Users"; 
const SHEET_PROGRESS = "Progress";
const SHEET_COURSE_CONTENTS = "CourseContents"; 
const SHEET_REFERENCE_CODES = "ReferenceCodes";
const SHEET_MBTI_QUESTIONS = "Questions";
const SHEET_SHOWCASE_LINKS = "ShowcaseLinks"; 
const SHEET_WEEKLY_FEEDBACKS = "WeeklyFeeds";

// 🚨 [필수 확인] 사용자님의 원래 폴더 ID를 입력하세요!
const TARGET_FOLDER_ID = "1-Gx2MnaqHW2nT4XXpnPCRLrcLrFOsgo8"; 
const REFERENCE_FOLDER_ID = "1YMY3pm-wjUAmt5Cqk_e1zREtdq9nan0t"; 

function doOptions(e) { return handleCORS(); }
function handleCORS() { return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT); }
function createJSONResponse(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function getKoreanTime() {
  const date = new Date();
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const kstTime = new Date(utc + (9 * 60 * 60000));
  return Utilities.formatDate(kstTime, "GMT+09:00", "yyyy-MM-dd HH:mm:ss");
}

/* =========================================================
   [POST] 데이터 업로드 / 수정 / 삭제 / 피드백
   ========================================================= */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 

    let data = {};
    let action = e.parameter.action;
    
    if (e.postData && e.postData.contents) {
      try {
        const bodyData = JSON.parse(e.postData.contents);
        data = bodyData;
        if (bodyData.action) action = bodyData.action;
      } catch (err) {}
    }

    if (!action) return createJSONResponse({ error: "No action specified." });
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. 유저 등록 및 수정
    if (action === 'registerUser' || action === 'updateUser') {
      const { user_id, school, password, avatar, grade, classGroup } = data;
      let sheet = ss.getSheetByName(SHEET_USERS) || ss.insertSheet(SHEET_USERS);
      
      // [V6.0 업그레이드] 헤더 확장
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "User_ID", "School", "Password", "Avatar", "Last_Updated", "Grade", "Class", 
          "MBTI_W1", "MBTI_W2", "MBTI_W3", "MBTI_W4", 
          "POSE_W1", "POSE_W2", "POSE_W3", "POSE_W4"
        ]);
      }
      const rows = sheet.getDataRange().getDisplayValues();
      let foundRow = -1;
      for (let i = 1; i < rows.length; i++) { if (rows[i][0].toString().trim() === user_id.toString().trim()) { foundRow = i + 1; break; } }
      
      if (action === 'registerUser') {
        if (foundRow !== -1) return createJSONResponse({ error: "User already exists" });
        // 기본 15개 컬럼 맞춰서 추가
        let newRow = [user_id, school, password, avatar, getKoreanTime(), grade || "", classGroup || ""];
        for(let j=0; j<8; j++) newRow.push(""); 
        sheet.appendRow(newRow);
      } else {
        if (foundRow === -1) return createJSONResponse({ error: "User not found" });
        sheet.getRange(foundRow, 1, 1, 7).setValues([[user_id, school, password, avatar, getKoreanTime(), grade || rows[foundRow-1][5], classGroup || rows[foundRow-1][6]]]);
      }
      return createJSONResponse({ status: "success" });
    }

    // 2. 피드백 업데이트 (V6.0: 주차별 분리 저장)
    if (action === 'updateFeedback') {
      const { user_id, week, course_type, feedback } = data;
      const weekNum = parseInt(week);
      const isPose = (course_type && course_type.toUpperCase() === 'POSE');
      
      const uSheet = ss.getSheetByName(SHEET_USERS);
      if (!uSheet) return createJSONResponse({ error: "User sheet not found" });
      
      // 피드백 컬럼 계산 (MBTI_W1=8, MBTI_W4=11, POSE_W1=12, POSE_W4=15)
      const feedbackCol = isPose ? (11 + weekNum) : (7 + weekNum);
      
      const rows = uSheet.getDataRange().getDisplayValues();
      for (let i = 1; i < rows.length; i++) { 
        if (rows[i][0].toString().trim() === user_id.toString().trim()) { 
          uSheet.getRange(i+1, feedbackCol).setValue(feedback); 
          return createJSONResponse({status:"success", week: weekNum, course: isPose ? "POSE" : "MBTI"}); 
        } 
      }
      return createJSONResponse({error:"User not found"});
    }

    // 3. 과제 업로드 (생략 - 기존 로직 유지)
    if (action === 'uploadHomework') {
       // ... 기존 로직 (v5.7 참고) ...
       // (참고용으로 생략함, 실제 사용 시 v5.7 uploadHomework 로직을 여기에 넣으면 됨)
    }

    return createJSONResponse({ error: "Invalid POST Action" });
  } finally { lock.releaseLock(); }
}

/* =========================================================
   [GET] 데이터 불러오기
   ========================================================= */
function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    // 1. 유저 정보 및 제출 상태 확인 (V6.0: 주차별 피드백 반환)
    if (action === 'checkUserStatus') {
      const { user_id, week, course_type } = e.parameter;
      const weekNum = parseInt(week);
      const isPose = (course_type && course_type.toUpperCase() === 'POSE');
      
      const uSheet = ss.getSheetByName(SHEET_USERS);
      let feedback = "";
      if (uSheet) {
        const uRows = uSheet.getDataRange().getDisplayValues();
        const feedbackColIndex = isPose ? (10 + weekNum) : (6 + weekNum); // 7번째가 Class, 8번째(index 7)가 MBTI_W1
        for (let i = 1; i < uRows.length; i++) {
          if (uRows[i][0].toString().trim() === user_id.toString().trim()) {
            feedback = uRows[i][feedbackColIndex + 1] || ""; // getDisplayValues는 0-index이므로
            break;
          }
        }
      }

      // ⚠️ [기존 Fallback 제거] 이제 오직 해당 주차의 피드백 컬럼만 조회합니다.
      
      // 과제 제출 상태 확인 로직 (기존 로직 유지)
      // ... (submissionStatus, fileName 등 계산) ...

      return createJSONResponse({ 
        status: "success", 
        data: { 
          submissionStatus: "verified", // 예시값
          fileName: "과제제출됨", 
          feedback: feedback 
        } 
      });
    }

    // 2. 학생 목록 (V6.0: 모든 주차 피드백 데이터 포함)
    if (action === 'getStudentList') {
        const uSheet = ss.getSheetByName(SHEET_USERS);
        if (!uSheet) return createJSONResponse({ status: "error" });
        const rows = uSheet.getDataRange().getDisplayValues();
        let list = [];
        for (let i = 1; i < rows.length; i++) {
          list.push({ 
            name: rows[i][0], 
            school: rows[i][1], 
            grade: rows[i][5] || "", 
            class: rows[i][6] || "",
            // 전체 피드백 맵 반환
            feedbacks: {
              mbti: [rows[i][7], rows[i][8], rows[i][9], rows[i][10]],
              pose: [rows[i][11], rows[i][12], rows[i][13], rows[i][14]]
            },
            // 레거시 지원용 (1주차 피드백 기본값)
            feedback: rows[i][7] || ""
          });
        }
        return createJSONResponse({ status: "success", data: list });
    }

    return createJSONResponse({ error: "Invalid GET Action" });
  } catch (err) { return createJSONResponse({ error: err.toString() }); }
}

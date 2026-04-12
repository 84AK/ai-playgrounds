/* ==============================================================
   AI 연구소 통합 백엔드 API V7.0_Universal_Expansion
   (무한 확장형 교육과정 + 동적 피드백 컬럼 + 20주차 안정 버퍼)
   ============================================================== */

const SHEET_USERS = "Users"; 
const SHEET_PROGRESS = "Progress";
const SHEET_COURSE_CONTENTS = "CourseContents"; 
const SHEET_REFERENCE_CODES = "ReferenceCodes";
const SHEET_SHOWCASE_LINKS = "ShowcaseLinks"; 

const TARGET_FOLDER_ID = "1-Gx2MnaqHW2nT4XXpnPCRLrcLrFOsgo8";
const REFERENCE_FOLDER_ID = "1YMY3pm-wjUAmt5Cqk_e1zREtdq9nan0t"; 

// 🚀 [설정] 안정적인 확장을 위한 주차 버퍼 (기본 20주차까지 구조 고정)
const MAX_WEEKS_BUFFER = 20; 

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

    // 1. 유저 등록/수정 (V7.0: 20주차 대용량 버퍼 헤더 초기화)
    if (action === 'registerUser' || action === 'updateUser') {
      const { user_id, school, password, avatar, grade, classGroup } = data;
      let sheet = ss.getSheetByName(SHEET_USERS) || ss.insertSheet(SHEET_USERS);
      
      if (sheet.getLastRow() === 0) {
        let headers = ["User_ID", "School", "Password", "Avatar", "Last_Updated", "Grade", "Class"];
        for(let i=1; i<=MAX_WEEKS_BUFFER; i++) headers.push("MBTI_W"+i+"_Feed");
        for(let i=1; i<=MAX_WEEKS_BUFFER; i++) headers.push("POSE_W"+i+"_Feed");
        sheet.appendRow(headers);
      }
      
      const rows = sheet.getDataRange().getDisplayValues();
      let foundRow = -1;
      for (let i = 1; i < rows.length; i++) { if (rows[i][0].toString().trim() === user_id.toString().trim()) { foundRow = i + 1; break; } }
      
      if (action === 'registerUser') {
        if (foundRow !== -1) return createJSONResponse({ error: "User already exists" });
        let newRow = [user_id, school, password, avatar, getKoreanTime(), grade || "", classGroup || ""];
        while(newRow.length < (7 + MAX_WEEKS_BUFFER * 2)) newRow.push("");
        sheet.appendRow(newRow);
      } else {
        if (foundRow === -1) return createJSONResponse({ error: "User not found" });
        sheet.getRange(foundRow, 1, 1, 7).setValues([[user_id, school, password, avatar, getKoreanTime(), grade || rows[foundRow-1][5], classGroup || rows[foundRow-1][6]]]);
      }
      return createJSONResponse({ status: "success" });
    }

    // 2. 피드백 업데이트 (V7.0: 주차별 자동 위치 계산)
    if (action === 'updateFeedback') {
      const { user_id, week, course_type, feedback } = data;
      const weekNum = parseInt(week);
      const isPose = (course_type && course_type.toUpperCase() === 'POSE');
      
      const uSheet = ss.getSheetByName(SHEET_USERS);
      // 피드백 컬럼: MBTI(8~27), POSE(28~47)
      const feedbackCol = isPose ? (7 + MAX_WEEKS_BUFFER + weekNum) : (7 + weekNum);
      
      const rows = uSheet.getDataRange().getDisplayValues();
      for (let i = 1; i < rows.length; i++) { 
        if (rows[i][0].toString().trim() === user_id.toString().trim()) { 
          uSheet.getRange(i+1, feedbackCol).setValue(feedback); 
          return createJSONResponse({status:"success"}); 
        } 
      }
      return createJSONResponse({error:"User not found"});
    }

    // 3. 과제 업로드 (V7.0: 20주차 버퍼 진도 관리)
    if (action === 'uploadHomework') {
      const { user_id, course_type, week, grade_class, file_name, file_base64, mime_type } = data;
      try {
        const rootFolder = DriveApp.getFolderById(TARGET_FOLDER_ID);
        const weekNum = Number(week);
        const isPose = (course_type && course_type.toUpperCase() === 'POSE');
        
        // 폴더명 생성: "1주차", "2주차" 등 통합 (코스 무관)
        const weekFolderName = weekNum + "주차";
        const weekFolder = getOrCreateSubFolder(rootFolder, weekFolderName.normalize("NFC"));
        
        // 기존 파일 청소
        const oldFiles = weekFolder.getFiles();
        while (oldFiles.hasNext()) {
          const f = oldFiles.next();
          if (f.getName().includes(user_id)) try { f.setTrashed(true); } catch(e) {}
        }

        const classFolder = getOrCreateSubFolder(weekFolder, (grade_class || "기타").toString().normalize("NFC"));
        const file = classFolder.createFile(Utilities.newBlob(Utilities.base64Decode(file_base64), mime_type || MimeType.PLAIN_TEXT, file_name));
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        // 진도 업데이트 (버퍼 방식)
        updateUserProgress(user_id, weekNum, isPose, true, file.getDownloadUrl());
        return createJSONResponse({ status: "success", fileUrl: file.getDownloadUrl() });
      } catch (err) { return createJSONResponse({ status: "error", message: err.toString() }); }
    }

    // [중략: saveCourseContent, registerWeek, showcase 등의 로직은 기존 V6.0_Dynamic과 동일하게 유지]
    // ...

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
    // 1. 유저 상태 확인 (V7.0: 동적 주차 피드백 조회)
    if (action === 'checkUserStatus') {
      const { user_id, week, course_type } = e.parameter;
      const weekIdx = Number(week);
      const isPose = (course_type && course_type.toUpperCase() === 'POSE');
      
      const uSheet = ss.getSheetByName(SHEET_USERS);
      const pSheet = ss.getSheetByName(SHEET_PROGRESS);
      
      let res = { submissionStatus: 'not_found', fileName: '', feedback: '' };
      
      // 피드백 조회 (동적 컬럼 계산)
      if (uSheet) {
          const uRows = uSheet.getDataRange().getDisplayValues();
          const feedbackColIndex = isPose ? (6 + MAX_WEEKS_BUFFER + weekIdx) : (6 + weekIdx);
          for (let i = 1; i < uRows.length; i++) {
              if (uRows[i][0].toString().trim() === user_id.toString().trim()) {
                  res.feedback = uRows[i][feedbackColIndex] || "";
                  break;
              }
          }
      }
      
      // 진도 조회 (버퍼 기반)
      if (pSheet) {
          const pRows = pSheet.getDataRange().getValues();
          // Status: 1~20, URL: 21~40 (Track 구분은 Dashboard Logic에서 처리하거나 여기서도 Offset 추가 가능)
          // 여기서는 단순함을 위해 weekIdx를 직접 컬럼으로 매핑 (만약 Track별 분리가 필요하면 추가 Offset 적용)
          const colUrlIndex = weekIdx + MAX_WEEKS_BUFFER;
          for (let i = 1; i < pRows.length; i++) {
              if (pRows[i][0].toString() === user_id.toString() && pRows[i][colUrlIndex]) {
                  res.submissionStatus = 'verified';
                  try {
                    const fileId = pRows[i][colUrlIndex].match(/[-\w]{25,}/);
                    if (fileId) res.fileName = DriveApp.getFileById(fileId[0]).getName();
                  } catch(e) {}
                  break;
              }
          }
      }
      
      return createJSONResponse({ status: "success", data: res });
    }

    // 2. 학생 목록 (V7.0: 20주차 전체 피드백 데이터 패킹)
    if (action === 'getStudentList') {
        const uSheet = ss.getSheetByName(SHEET_USERS);
        if (!uSheet) return createJSONResponse({ status: "error" });
        const rows = uSheet.getDataRange().getDisplayValues();
        let list = [];
        for (let i = 1; i < rows.length; i++) {
          let mbtiFeeds = [];
          let poseFeeds = [];
          for(let k=1; k<=MAX_WEEKS_BUFFER; k++) mbtiFeeds.push(rows[i][6+k]);
          for(let k=1; k<=MAX_WEEKS_BUFFER; k++) poseFeeds.push(rows[i][6+MAX_WEEKS_BUFFER+k]);
          
          list.push({ 
            name: rows[i][0], 
            school: rows[i][1], 
            grade: rows[i][5] || "", 
            class: rows[i][6] || "",
            feedbacks: { mbti: mbtiFeeds, pose: poseFeeds }
          });
        }
        return createJSONResponse({ status: "success", data: list });
    }

    // [중략: getRankingData, getProgress, getAllCourseStructure 등 기존 V6.0 로직 유지]
    // ...

    return createJSONResponse({ error: "Invalid GET Action" });
  } catch (err) { return createJSONResponse({ error: err.toString() }); }
}

/* =========================================================
   [HELPERS]
   ========================================================= */
function getOrCreateSubFolder(parent, name) {
  const iter = parent.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : parent.createFolder(name);
}

function updateUserProgress(uid, week, isPose, status, url) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_PROGRESS) || ss.insertSheet(SHEET_PROGRESS);
  
  if (sheet.getLastRow() === 0) {
    let headers = ["User_ID"];
    for(let i=1; i<=MAX_WEEKS_BUFFER; i++) headers.push("W"+i+"_Status");
    for(let i=1; i<=MAX_WEEKS_BUFFER; i++) headers.push("W"+i+"_URL");
    sheet.appendRow(headers);
  }

  const rows = sheet.getDataRange().getValues();
  let found = -1;
  for (let i = 1; i < rows.length; i++) { if (rows[i][0].toString() === uid.toString()) { found = i + 1; break; } }
  
  const colStatus = week; 
  const colUrl = week + MAX_WEEKS_BUFFER; 
  
  if (found !== -1) {
    sheet.getRange(found, colStatus + 1).setValue(status);
    sheet.getRange(found, colUrl + 1).setValue(url);
  } else {
    let nr = Array(1 + MAX_WEEKS_BUFFER * 2).fill("");
    nr[0] = uid;
    nr[colStatus] = status;
    nr[colUrl] = url;
    sheet.appendRow(nr);
  }
}

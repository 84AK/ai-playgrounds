/* ==============================================================
   AI 연구소 통합 백엔드 API V7.1_Hybrid_Intel_Core
   (지능형 시트 감지 + 하이브리드 오프셋 + 무한 확장 호환)
   ============================================================== */

const SHEET_USERS = "Users"; 
const SHEET_PROGRESS = "Progress";
const SHEET_COURSE_CONTENTS = "CourseContents"; 
const SHEET_REFERENCE_CODES = "ReferenceCodes";
const SHEET_SHOWCASE_LINKS = "ShowcaseLinks"; 

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
   [CORE] 지능형 레이아웃 감지 엔진 (V7.1 신규)
   ========================================================= */
function getSheetLayout(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return null;
  
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const layout = {
    maxWeeks: 12, // 기본값
    urlOffset: 12, // URL 시작점 (12주차 기준)
    feedbackOffset: 12, // POSE 피드백 시작점 (12주차 기준)
    headers: headers
  };

  if (sheetName === SHEET_PROGRESS) {
    // URL이 포함된 첫 번째 컬럼 찾기
    const urlIdx = headers.findIndex(h => h.toString().toLowerCase().includes("url"));
    if (urlIdx !== -1) {
      layout.urlOffset = urlIdx;
      layout.maxWeeks = urlIdx - 1;
    }
  } else if (sheetName === SHEET_USERS) {
    // POSE 피드백이 시작되는 지점 찾기 (MBTI 피드백은 보통 8번째 열 고정)
    const poseIdx = headers.findIndex(h => h.toString().toUpperCase().includes("POSE_W1"));
    if (poseIdx !== -1) {
      layout.feedbackOffset = poseIdx - 7;
    }
  }
  
  return layout;
}

/* =========================================================
   [POST] 데이터 업로드 / 수정 / 피드백
   ========================================================= */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 

    let data = {};
    let action = e.parameter.action;
    if (e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); if (data.action) action = data.action; } catch (err) {}
    }
    if (!action) return createJSONResponse({ error: "No action specified." });
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. 피드백 업데이트 (V7.1: 레이아웃 감지형 저장)
    if (action === 'updateFeedback') {
      const { user_id, week, course_type, feedback } = data;
      const weekNum = parseInt(week);
      const isPose = (course_type && course_type.toUpperCase() === 'POSE');
      const uSheet = ss.getSheetByName(SHEET_USERS);
      if (!uSheet) return createJSONResponse({error:"Users sheet not found"});

      const layout = getSheetLayout(SHEET_USERS);
      // MBTI(8열부터), POSE(MBTI 다음부터)
      const feedbackCol = isPose ? (7 + layout.feedbackOffset + weekNum) : (7 + weekNum);
      
      const rows = uSheet.getDataRange().getDisplayValues();
      for (let i = 1; i < rows.length; i++) { 
        if (rows[i][0].toString().trim() === user_id.toString().trim()) { 
          uSheet.getRange(i+1, feedbackCol).setValue(feedback); 
          return createJSONResponse({status:"success"}); 
        } 
      }
      return createJSONResponse({error:"User not found"});
    }

    // 2. 과제 업로드 (V7.1: 레이아웃 감지형 진도 관리)
    if (action === 'uploadHomework') {
      const { user_id, course_type, week, grade_class, file_name, file_base64, mime_type } = data;
      try {
        const rootFolder = DriveApp.getFolderById(TARGET_FOLDER_ID);
        const weekNum = Number(week);
        const isPose = (course_type && course_type.toUpperCase() === 'POSE');
        
        const weekFolderName = weekNum + "주차";
        const weekFolder = getOrCreateSubFolder(rootFolder, weekFolderName.normalize("NFC"));
        
        const oldFiles = weekFolder.getFiles();
        while (oldFiles.hasNext()) {
          const f = oldFiles.next();
          if (f.getName().includes(user_id)) try { f.setTrashed(true); } catch(e) {}
        }

        const classFolder = getOrCreateSubFolder(weekFolder, (grade_class || "기타").toString().normalize("NFC"));
        const file = classFolder.createFile(Utilities.newBlob(Utilities.base64Decode(file_base64), mime_type || MimeType.PLAIN_TEXT, file_name));
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        updateUserProgress(user_id, weekNum, isPose, true, file.getDownloadUrl());
        return createJSONResponse({ status: "success", fileUrl: file.getDownloadUrl() });
      } catch (err) { return createJSONResponse({ status: "error", message: err.toString() }); }
    }

    // ... [기존 registerUser, registerWeek 등 유지] ...

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
    // 과제 및 피드백 상태 조회 (V7.1 핵심 수정)
    if (action === 'checkUserStatus') {
      const { user_id, week, course_type } = e.parameter;
      const weekIdx = Number(week);
      const isPose = (course_type && course_type.toUpperCase() === 'POSE');
      
      const uSheet = ss.getSheetByName(SHEET_USERS);
      const pSheet = ss.getSheetByName(SHEET_PROGRESS);
      let res = { submissionStatus: 'not_found', fileName: '', feedback: '' };
      
      // 1. 피드백 조회 (감지된 레이아웃 적용)
      if (uSheet) {
        const layout = getSheetLayout(SHEET_USERS);
        const uRows = uSheet.getDataRange().getDisplayValues();
        const feedbackColIndex = isPose ? (6 + layout.feedbackOffset + weekIdx) : (6 + weekIdx);
        for (let i = 1; i < uRows.length; i++) {
          if (uRows[i][0].toString().trim() === user_id.toString().trim()) {
            res.feedback = uRows[i][feedbackColIndex] || "";
            break;
          }
        }
      }
      
      // 2. 진도 조회 (감지된 레이아웃 적용)
      if (pSheet) {
        const layout = getSheetLayout(SHEET_PROGRESS);
        const pRows = pSheet.getDataRange().getValues();
        const colUrlIndex = weekIdx + layout.urlOffset;
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

    // 학생 목록 조회 (V7.1)
    if (action === 'getStudentList') {
        const uSheet = ss.getSheetByName(SHEET_USERS);
        if (!uSheet) return createJSONResponse({ status: "error" });
        const layout = getSheetLayout(SHEET_USERS);
        const rows = uSheet.getDataRange().getDisplayValues();
        let list = [];
        for (let i = 1; i < rows.length; i++) {
          let mbtiFeeds = [];
          let poseFeeds = [];
          // 감지된 오프셋만큼 데이터 수집
          for(let k=1; k<=layout.feedbackOffset; k++) mbtiFeeds.push(rows[i][6+k]);
          for(let k=1; k<=layout.feedbackOffset; k++) poseFeeds.push(rows[i][6+layout.feedbackOffset+k]);
          
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

    // 진도 전체 조회 (V7.1)
    if (action === 'getProgress') {
      const pSheet = ss.getSheetByName(SHEET_PROGRESS);
      if (!pSheet) return createJSONResponse({ status: "success", data: {} });
      const layout = getSheetLayout(SHEET_PROGRESS);
      const rows = pSheet.getDataRange().getValues();
      let data = {};
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0].toString() === e.parameter.user_id.toString()) {
          for(let j=1; j<=layout.maxWeeks; j++) {
            data[`week${j}`] = !!rows[i][j];
            data[`week${j}_url`] = rows[i][j + layout.urlOffset] || "";
          }
          break;
        }
      }
      return createJSONResponse({ status: "success", data: data });
    }

    // ... [나머지 기능 유지] ...
    
    return createJSONResponse({ error: "Invalid GET Action" });
  } catch (err) { return createJSONResponse({ error: err.toString() }); }
}

function updateUserProgress(uid, week, isPose, status, url) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_PROGRESS);
  const layout = getSheetLayout(SHEET_PROGRESS);
  
  const rows = sheet.getDataRange().getValues();
  let found = -1;
  for (let i = 1; i < rows.length; i++) { if (rows[i][0].toString() === uid.toString()) { found = i + 1; break; } }
  
  const colStatus = week; 
  const colUrl = week + layout.urlOffset; 
  
  if (found !== -1) {
    sheet.getRange(found, colStatus + 1).setValue(status);
    sheet.getRange(found, colUrl + 1).setValue(url);
  } else {
    let nr = Array(sheet.getLastColumn()).fill("");
    nr[0] = uid;
    nr[colStatus] = status;
    nr[colUrl] = url;
    sheet.appendRow(nr);
  }
}

function getOrCreateSubFolder(parent, name) {
  const iter = parent.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : parent.createFolder(name);
}

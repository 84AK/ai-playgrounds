/* ==============================================================
   AI 연구소 통합 백엔드 API V7.4_Smart_Sync_Final
   (지능형 드라이브 동기화 + 상태 값 우선 반영 + 무한 확장)
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
  return Utilities.formatDate(new Date(utc + (9 * 60 * 60000)), "GMT+09:00", "yyyy-MM-dd HH:mm:ss");
}

/* =========================================================
   [CORE] 지능형 레이아웃 및 드라이브 동기화 엔진
   ========================================================= */
function getSheetLayout(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return null;
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const layout = { maxWeeks: 12, urlOffset: 12, fbOffset: 12 };
  
  if (sheetName === SHEET_PROGRESS) {
    const urlIdx = headers.findIndex(h => h.toString().toLowerCase().includes("url"));
    if (urlIdx !== -1) { layout.urlOffset = urlIdx; layout.maxWeeks = urlIdx - 1; }
  } else if (sheetName === SHEET_USERS) {
    const poseIdx = headers.findIndex(h => h.toString().toUpperCase().includes("POSE_W1"));
    if (poseIdx !== -1) { layout.fbOffset = poseIdx - 7; }
  }
  return layout;
}

// 드라이브 실시간 검증 및 시트 동기화 (V7.4 핵심 기능)
function validateAndSyncDriveEntry(uid, week, layout) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_PROGRESS);
  const rows = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i=1; i<rows.length; i++) if(rows[i][0] == uid) { foundRow = i+1; break; }
  
  if (foundRow === -1) return { status: 'not_found' };

  const colStatus = week + 1; // 1-based (B...)
  const colUrl = week + layout.urlOffset; // 1-based (N...)
  
  let status = sheet.getRange(foundRow, colStatus).getValue();
  let url = sheet.getRange(foundRow, colUrl).getValue();

  // 1. 상태값이 FALSE면 무조건 미제출로 처리
  if (status === false || status === "FALSE" || !status) return { status: 'not_found' };

  // 2. URL이 없으면 미제출
  if (!url) return { status: 'not_found' };

  // 3. 구글 드라이브 실제 존재 여부 확인
  try {
    const fileIdMatch = url.match(/[-\w]{25,}/);
    if (!fileIdMatch) throw "No ID";
    const file = DriveApp.getFileById(fileIdMatch[0]);
    if (file.isTrashed()) throw "Trashed";
    
    return { status: 'verified', fileName: file.getName(), url: url };
  } catch (e) {
    // 파일이 없거나 삭제됨 -> 시트 즉시 청소(Sync Back)
    sheet.getRange(foundRow, colStatus).setValue(false);
    sheet.getRange(foundRow, colUrl).setValue("");
    return { status: 'not_found' };
  }
}

/* =========================================================
   [POST] 데이터 처리
   ========================================================= */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
    let data = {};
    let action = e.parameter.action;
    if (e.postData && e.postData.contents) { data = JSON.parse(e.postData.contents); if (data.action) action = data.action; }
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'registerUser' || action === 'updateUser') {
      let sheet = ss.getSheetByName(SHEET_USERS) || ss.insertSheet(SHEET_USERS);
      const rows = sheet.getDataRange().getValues();
      let found = -1;
      for (let i=1; i<rows.length; i++) if(rows[i][0] == data.user_id) { found = i+1; break; }
      const val = [data.user_id, data.school, data.password, data.avatar, getKoreanTime(), data.grade, data.classGroup];
      if (action === 'registerUser') { if(found!==-1) return createJSONResponse({error:"Exists"}); sheet.appendRow(val); }
      else { if(found===-1) return createJSONResponse({error:"NotFound"}); sheet.getRange(found, 1, 1, 7).setValues([val]); }
      return createJSONResponse({ status: "success" });
    }

    if (action === 'updateFeedback') {
      const layout = getSheetLayout(SHEET_USERS);
      const col = (data.course_type === 'POSE') ? (7 + layout.fbOffset + parseInt(data.week)) : (7 + parseInt(data.week));
      const sheet = ss.getSheetByName(SHEET_USERS);
      const rows = sheet.getDataRange().getDisplayValues();
      let ok = false;
      for (let i=1; i<rows.length; i++) if(rows[i][0] == data.user_id) { sheet.getRange(i+1, col).setValue(data.feedback); ok = true; break; }
      return createJSONResponse(ok ? {status:"success"} : {error:"NotFound"});
    }

    if (action === 'uploadHomework') {
      const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
      const file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(data.file_base64), data.mime_type, data.file_name));
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      updateUserProgress(data.user_id, parseInt(data.week), true, file.getDownloadUrl());
      return createJSONResponse({ status: "success", fileUrl: file.getDownloadUrl() });
    }

    if (action === 'saveCourseContent' || action === 'registerWeek') {
      let sheet = ss.getSheetByName(SHEET_COURSE_CONTENTS) || ss.insertSheet(SHEET_COURSE_CONTENTS);
      const rows = sheet.getDataRange().getValues();
      let found = -1;
      for (let i=1; i<rows.length; i++) if(rows[i][0] == data.track && rows[i][1] == data.week) { found = i+1; break; }
      const val = [data.track, data.week, data.title || "", data.content || "", getKoreanTime()];
      if (found !== -1) sheet.getRange(found, 1, 1, 5).setValues([val]); else sheet.appendRow(val);
      return createJSONResponse({ status: "success" });
    }

    if (action === 'saveShowcaseLink') {
      let sheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS) || ss.insertSheet(SHEET_SHOWCASE_LINKS);
      sheet.appendRow([data.user_id, data.track, data.week, data.url, getKoreanTime()]);
      return createJSONResponse({ status: "success" });
    }

    return createJSONResponse({ error: "Invalid Action" });
  } finally { lock.releaseLock(); }
}

/* =========================================================
   [GET] 데이터 불러오기
   ========================================================= */
function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    if (action === 'checkUserStatus') {
      const layoutU = getSheetLayout(SHEET_USERS), layoutP = getSheetLayout(SHEET_PROGRESS);
      const week = parseInt(e.parameter.week);
      const uid = e.parameter.user_id;

      // 1. 드라이브 실시간 동기화 및 검증
      const syncResult = validateAndSyncDriveEntry(uid, week, layoutP);
      
      let res = { submissionStatus: syncResult.status, fileName: syncResult.fileName || '', feedback: '' };
      
      // 2. 피드백 조회
      const uRows = ss.getSheetByName(SHEET_USERS).getDataRange().getDisplayValues();
      const fCol = (e.parameter.course_type === 'POSE') ? (6 + layoutU.fbOffset + week) : (6 + week);
      for (let i=1; i<uRows.length; i++) if(uRows[i][0] == uid) { res.feedback = uRows[i][fCol] || ""; break; }
      
      return createJSONResponse({ status: "success", data: res });
    }

    if (action === 'getAllCourseStructure') {
      const s = ss.getSheetByName(SHEET_COURSE_CONTENTS);
      if(!s) return createJSONResponse({ status:"success", data:[] });
      const rows = s.getDataRange().getDisplayValues();
      let data = []; for (let i=1; i<rows.length; i++) data.push({ track: rows[i][0], week: parseInt(rows[i][1]), title: rows[i][2] });
      return createJSONResponse({ status: "success", data: data });
    }

    if (action === 'getCourseContent') {
      const rows = ss.getSheetByName(SHEET_COURSE_CONTENTS).getDataRange().getValues();
      for (let i=1; i<rows.length; i++) if(rows[i][0] == e.parameter.track && rows[i][1] == e.parameter.week) return createJSONResponse({ status:"success", title:rows[i][2], content:rows[i][3] });
      return createJSONResponse({ error: "Not Found" });
    }

    if (action === 'getProgress') {
      const uid = e.parameter.user_id;
      const layout = getSheetLayout(SHEET_PROGRESS);
      let d = {};
      // 매 주차별로 실시간 동기화 검증 수행 (대시보드의 정확성 보장)
      for(let j=1; j<=layout.maxWeeks; j++) {
        const sync = validateAndSyncDriveEntry(uid, j, layout);
        d[`week${j}`] = (sync.status === 'verified');
        d[`week${j}_url`] = sync.url || "";
      }
      return createJSONResponse({ status: "success", data: d });
    }

    if (action === 'getRankingData') {
      const layout = getSheetLayout(SHEET_PROGRESS);
      const pRows = ss.getSheetByName(SHEET_PROGRESS).getDataRange().getValues();
      const uRows = ss.getSheetByName(SHEET_USERS).getDataRange().getDisplayValues();
      let ranks = [];
      for(let i=1; i<pRows.length; i++) {
        let count = 0; 
        for(let j=1; j<=layout.maxWeeks; j++) if(pRows[i][j] === true || pRows[i][j] === "TRUE") count++;
        let uInfo = uRows.find(r => r[0] == pRows[i][0]);
        ranks.push({ name: pRows[i][0], class: uInfo ? uInfo[6] : "기타", submissions: count });
      }
      return createJSONResponse({ status:"success", data: ranks });
    }

    if (action === 'getStudentList') {
        const layout = getSheetLayout(SHEET_USERS);
        const rows = ss.getSheetByName(SHEET_USERS).getDataRange().getDisplayValues();
        let list = [];
        for (let i=1; i<rows.length; i++) {
          let mf = [], pf = [];
          for(let k=1; k<=layout.fbOffset; k++) { mf.push(rows[i][6+k]); pf.push(rows[i][6+layout.fbOffset+k]); }
          list.push({ name: rows[i][0], school: rows[i][1], grade: rows[i][5], class: rows[i][6], feedbacks: { mbti: mf, pose: pf } });
        }
        return createJSONResponse({ status: "success", data: list });
    }

    if (action === 'getShowcaseLinks') {
      const sheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS);
      if(!sheet) return createJSONResponse({ status:"success", data:[] });
      const rows = sheet.getDataRange().getDisplayValues();
      let data = []; for (let i=1; i<rows.length; i++) data.push({ user_id: rows[i][0], track: rows[i][1], week: rows[i][2], url: rows[i][3], date: rows[i][4] });
      return createJSONResponse({ status: "success", data: data });
    }

    return createJSONResponse({ error: "Invalid Action" });
  } catch (err) { return createJSONResponse({ error: err.toString() }); }
}

function updateUserProgress(uid, week, status, url) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROGRESS);
  const layout = getSheetLayout(SHEET_PROGRESS);
  const rows = sheet.getDataRange().getValues();
  let found = -1;
  for (let i=1; i<rows.length; i++) if(rows[i][0] == uid) { found = i+1; break; }
  
  const colStatus = week + 1;
  const colUrl = week + layout.urlOffset;
  
  if (found !== -1) { 
    sheet.getRange(found, colStatus).setValue(status); 
    sheet.getRange(found, colUrl).setValue(url); 
  } else { 
    let nr = Array(sheet.getLastColumn() || (layout.urlOffset + 12)).fill(""); 
    nr[0] = uid; nr[week] = status; nr[week + layout.urlOffset - 1] = url; 
    sheet.appendRow(nr); 
  }
}

/* ==============================================================
   AI 연구소 통합 백엔드 API V5.7_Sequential_Unification
   (연속 주차 지원 + 통합 폴더링 + 커리큘럼 동적 로드)
   ============================================================== */

const SHEET_USERS = "Users"; 
const SHEET_PROGRESS = "Progress";
const SHEET_COURSE_CONTENTS = "CourseContents"; 
const SHEET_REFERENCE_CODES = "ReferenceCodes";
const SHEET_MBTI_QUESTIONS = "Questions";
const SHEET_SHOWCASE_LINKS = "ShowcaseLinks"; 
const SHEET_WEEKLY_FEEDBACKS = "WeeklyFeeds";

// 🚨 [필수 확인] 사용자님의 원래 폴더 ID입니다!
const TARGET_FOLDER_ID = "1-Gx2MnaqHW2nT4XXpnPCRLrcLrFOsgo8"; // 실제 값 확인 필요
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
      if (sheet.getLastRow() === 0) sheet.appendRow(["User_ID", "School", "Password", "Avatar", "Last_Updated", "Grade", "Class", "Feedback"]);
      const rows = sheet.getDataRange().getDisplayValues();
      let foundRow = -1;
      for (let i = 1; i < rows.length; i++) { if (rows[i][0].toString().trim() === user_id.toString().trim()) { foundRow = i + 1; break; } }
      if (action === 'registerUser') {
        if (foundRow !== -1) return createJSONResponse({ error: "User already exists" });
        sheet.appendRow([user_id, school, password, avatar, getKoreanTime(), grade || "", classGroup || "", ""]);
      } else {
        if (foundRow === -1) return createJSONResponse({ error: "User not found" });
        sheet.getRange(foundRow, 1, 1, 7).setValues([[user_id, school, password, avatar, getKoreanTime(), grade || rows[foundRow-1][5], classGroup || rows[foundRow-1][6]]]);
      }
      return createJSONResponse({ status: "success" });
    }

    // 2. 과제 업로드 (개편: 연속 주차 폴더링)
    if (action === 'uploadHomework') {
      const { user_id, course_type, week, grade_class, file_name, file_base64, mime_type } = data;
      try {
        const rootFolder = DriveApp.getFolderById(TARGET_FOLDER_ID);
        const weekNum = Number(week);
        // [개편] 트랙 구분 없이 "X주차" 통일
        const weekFolderName = weekNum.toString() + "주차";
        const weekFolder = getOrCreateSubFolder(rootFolder, weekFolderName.normalize("NFC"));
        
        const searchQuery = "title contains '" + weekFolderName + "' and title contains '" + user_id + "'";
        const oldFiles = weekFolder.searchFiles(searchQuery);
        while (oldFiles.hasNext()) {
          const oldFile = oldFiles.next();
          try { oldFile.setTrashed(true); } catch(e) { console.error("Error trashing file: " + e); }
        }

        const classFolder = getOrCreateSubFolder(weekFolder, (grade_class || "기타").toString().normalize("NFC"));
        const file = classFolder.createFile(Utilities.newBlob(Utilities.base64Decode(file_base64), mime_type || MimeType.PLAIN_TEXT, file_name));
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        updateUserProgress(user_id, weekNum, true, file.getDownloadUrl());
        return createJSONResponse({ status: "success", fileUrl: file.getDownloadUrl() });
      } catch (err) { return createJSONResponse({ status: "error", message: err.toString() }); }
    }

    // 3. 강의 콘텐츠 저장 (개편: Title 컬럼 추가)
    if (action === 'saveCourseContent') {
      const { track, week, title, content } = data;
      let cSheet = ss.getSheetByName(SHEET_COURSE_CONTENTS) || ss.insertSheet(SHEET_COURSE_CONTENTS);
      const rows = cSheet.getDataRange().getValues();
      let foundRow = -1;
      const t = track.toString().trim().toUpperCase();
      const w = Number(week);
      
      // 헤더 설정 (구조: Track, Week, Title, Content, UpdatedAt)
      if (cSheet.getLastRow() === 0) {
        cSheet.appendRow(["Track", "Week", "Title", "Content", "UpdatedAt"]);
      }

      for (let i = 1; i < rows.length; i++) { 
        if ((rows[i][0]||"").toString().toUpperCase() === t && Number(rows[i][1]) === w) { foundRow = i+1; break; } 
      }
      if (foundRow !== -1) {
        // [수정] Title(3), Content(4), UpdatedAt(5) 업데이트
        cSheet.getRange(foundRow, 3, 1, 3).setValues([[title || rows[foundRow-1][2] || "", content, getKoreanTime()]]);
      } else {
        cSheet.appendRow([t, w, title || "", content, getKoreanTime()]);
      }
      return createJSONResponse({ status: "success" });
    }

    // 4. 피드백 업데이트
    if (action === 'updateFeedback') {
      const { user_id, feedback } = data;
      const uSheet = ss.getSheetByName(SHEET_USERS);
      const rows = uSheet.getDataRange().getDisplayValues();
      for (let i = 1; i < rows.length; i++) { if (rows[i][0].toString().trim() === user_id.toString().trim()) { uSheet.getRange(i+1, 8).setValue(feedback); return createJSONResponse({status:"success"}); } }
      return createJSONResponse({error:"User not found"});
    }

    // 5. 쇼케이스 등록/수정/삭제 (기존 유지)
    if (['registerShowcaseLink','editShowcaseLink','deleteShowcaseLink','toggleShowcaseStatus'].includes(action)) {
      let sheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS) || ss.insertSheet(SHEET_SHOWCASE_LINKS);
      const { timestamp, author, title, description, url, password, type, status } = data;
      if (sheet.getLastRow() === 0) sheet.appendRow(["Timestamp", "Author", "Title", "Description", "URL", "Password", "Type", "Status"]);

      if (action === 'registerShowcaseLink') { 
        sheet.appendRow([getKoreanTime(), author, title, description, url, password, type, "visible"]); 
        return createJSONResponse({status:"success"}); 
      }

      const displayRows = sheet.getDataRange().getDisplayValues(); 
      const rows = sheet.getDataRange().getValues();
      let foundRow = -1;
      for (let i = 1; i < displayRows.length; i++) { if (displayRows[i][0].toString() === timestamp.toString()) { foundRow = i+1; break; } }
      if (foundRow === -1) return createJSONResponse({error:"Not found"});
      if (action === 'toggleShowcaseStatus') { sheet.getRange(foundRow, 8).setValue(status); return createJSONResponse({status:"success"}); }
      if (rows[foundRow-1][5].toString() !== password.toString()) return createJSONResponse({error:"Invalid password"});
      if (action === 'editShowcaseLink') { sheet.getRange(foundRow, 2, 1, 6).setValues([[author, title, description, url, password, type]]); }
      else { sheet.deleteRow(foundRow); }
      return createJSONResponse({status:"success"});
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
    // 1. 유저 정보 (로그인용)
    if (action === 'getUser') {
      const uSheet = ss.getSheetByName(SHEET_USERS);
      const rows = uSheet.getDataRange().getDisplayValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0].toString().trim() === e.parameter.user_id.toString().trim()) {
          return createJSONResponse({ status: "success", data: { name: rows[i][0], school: rows[i][1], password: rows[i][2], avatar: rows[i][3], grade: rows[i][5], classGroup: rows[i][6], feedback: rows[i][7]||"" } });
        }
      }
      return createJSONResponse({ status: "error", message: "User not found" });
    }

    // 2. 랭킹 데이터 (개편: 절대 주차 매핑)
    if (action === 'getRankingData') {
      const uSheet = ss.getSheetByName(SHEET_USERS);
      const pSheet = ss.getSheetByName(SHEET_PROGRESS);
      const uRows = uSheet.getDataRange().getValues();
      const pRows = pSheet ? pSheet.getDataRange().getValues() : [];
      const pMap = {};
      // [개편] 8주차 기준 전체 진행도 맵핑
      pRows.slice(1).forEach(r => { pMap[r[0]] = [r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8]]; });
      const list = uRows.slice(1).map(r => {
        const uid = r[0]; const p = pMap[uid] || Array(8).fill(false);
        let pts = 0; p.forEach(s => { if (s === true || s === "TRUE") pts += 10; });
        return { name: uid, avatar: r[3], grade: r[5], classGroup: r[6], points: pts, progress: p };
      });
      return createJSONResponse({ status: "success", data: list.sort((a,b)=>b.points - a.points) });
    }

    // 3. 진도 데이터 조회 (개편: 절대 주차 매핑)
    if (action === 'getProgress') {
      const pSheet = ss.getSheetByName(SHEET_PROGRESS);
      let data = {}; // { week1: false, ..., week1_url: "" }
      for (let i = 1; i <= 8; i++) { data[`week${i}`] = false; data[`week${i}_url`] = ""; }
      
      if (pSheet) {
        const rows = pSheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === e.parameter.user_id) {
            for (let w = 1; w <= 8; w++) {
              data[`week${w}`] = !!rows[i][w];
              data[`week${w}_url`] = rows[i][w+8] || "";
            }
            break;
          }
        }
      }
      return createJSONResponse({ status: "success", data: data });
    }

    // 4. 강의 콘텐츠 조회 (개편: Title 포함)
    if (action === 'getCourseContent') {
      const { track, week } = e.parameter;
      const cSheet = ss.getSheetByName(SHEET_COURSE_CONTENTS);
      if (!cSheet) return createJSONResponse({ status: "success", content: "", title: "" });
      const rows = cSheet.getDataRange().getValues();
      const t = track.toString().toUpperCase(); const w = Number(week);
      for (let i = 1; i < rows.length; i++) { 
        if ((rows[i][0]||"").toString().toUpperCase() === t && Number(rows[i][1]) === w) {
          return createJSONResponse({ status: "success", content: rows[i][3], title: rows[i][2] }); 
        }
      }
      return createJSONResponse({ status: "success", content: "", title: "" });
    }

    // [추가] 4.1 모든 주차 구조 조회 (Dynamic UI용)
    if (action === 'getAllCourseStructure') {
      const cSheet = ss.getSheetByName(SHEET_COURSE_CONTENTS);
      if (!cSheet) return createJSONResponse({ status: "success", data: [] });
      const rows = cSheet.getDataRange().getValues();
      const list = rows.slice(1).map(r => ({ track: r[0], week: r[1], title: r[2] }));
      return createJSONResponse({ status: "success", data: list });
    }

    // 5. 하이브리드 정답 코드 조회 (기존 유지)
    if (action === 'getReferenceCode') {
      const track = (e.parameter.course_type || e.parameter.track || "MBTI").toUpperCase();
      const week = Number(e.parameter.week);
      let rSheet = ss.getSheetByName(SHEET_REFERENCE_CODES);
      if (rSheet) {
        const rows = rSheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) { if ((rows[i][0]||"").toString().toUpperCase() === track && Number(rows[i][1]) === week) return createJSONResponse({ status:"success", content:rows[i][2], source:"sheet" }); }
      }
      const driveCode = getReferenceCodeFromDrive(week, track);
      if (driveCode) return createJSONResponse({ status:"success", content:driveCode, source:"drive" });
      return createJSONResponse({ status: "success", content: "" });
    }

    // [기타] 기존 getAllMbtiData, getDriveFileBase64 등 유지
    if (action === 'getAllMbtiData') {
      const showcaseSheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS);
      const userSheet = ss.getSheetByName(SHEET_USERS);
      let list = []; let uMap = {};
      if (showcaseSheet) {
        const fullRows = showcaseSheet.getDataRange().getValues();
        const displayRows = showcaseSheet.getDataRange().getDisplayValues();
        for (let i = 1; i < fullRows.length; i++) {
          list.push({ timestamp: displayRows[i][0], author: fullRows[i][1], title: fullRows[i][2], description: fullRows[i][3], url: fullRows[i][4], password: fullRows[i][5], type: fullRows[i][6], status: fullRows[i][7] || "visible" });
        }
      }
      if (userSheet) { userSheet.getDataRange().getValues().slice(1).forEach(r => { uMap[r[0]] = { avatar:r[3], school:r[1], grade:r[5], classGroup:r[6] }; }); }
      return createJSONResponse({ status: "success", data: { showcase_links: list, users: uMap } });
    }

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

function updateUserProgress(uid, week, status, url) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_PROGRESS) || ss.insertSheet(SHEET_PROGRESS);
  const rows = sheet.getDataRange().getValues();
  let found = -1;
  const weekNum = Number(week);
  for (let i = 1; i < rows.length; i++) { if (rows[i][0] === uid) { found = i + 1; break; } }
  
  // [개편] 절대 주차 인덱스 매핑 (Week 1 -> Col 2, Week 1 URL -> Col 10)
  let col = 1 + weekNum; 
  let urlCol = 9 + weekNum; 
  
  if (found !== -1) { sheet.getRange(found, col).setValue(status); sheet.getRange(found, urlCol).setValue(url); }
  else { let nr = Array(17).fill(""); nr[0] = uid; nr[col-1] = status; nr[urlCol-1] = url; sheet.appendRow(nr); }
}

function getReferenceCodeFromDrive(week, type) {
  try {
    const folder = DriveApp.getFolderById(REFERENCE_FOLDER_ID);
    const file = findFileRecursive(folder, week, type);
    if (file) return file.getMimeType().includes("document") ? DocumentApp.openById(file.getId()).getBody().getText() : file.getBlob().getDataAsString();
  } catch (e) {} return null;
}

function findFileRecursive(folder, week, type) {
  const target = (week.toString() + "주차").normalize("NFC");
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next(); const n = f.getName().normalize("NFC");
    if (n.includes(target) && (n.includes("정답") || n.includes("Reference"))) return f;
  }
  const subs = folder.getFolders();
  while (subs.hasNext()) { const found = findFileRecursive(subs.next(), week, type); if (found) return found; }
  return null;
}

/* ==============================================================
   AI 연구소 통합 백엔드 API V9.8_Master_Ultimate_Full_Final
   (모든 기능 100% 복구 + 삭제 인증 해결 + 관리자 승인 최적화)
   ============================================================== */

const SHEET_USERS = "Users"; 
const SHEET_PROGRESS = "Progress";
const SHEET_COURSE_CONTENTS = "CourseContents"; 
const SHEET_REFERENCE_CODES = "ReferenceCodes";
const SHEET_SHOWCASE_LINKS = "ShowcaseLinks"; 
const SHEET_ADMINS = "Admins";

const TARGET_FOLDER_ID = "1-Gx2MnaqHW2nT4XXpnPCRLrcLrFOsgo8";
const REFERENCE_FOLDER_ID = "1YMY3pm-wjUAmt5Cqk_e1zREtdq9nan0t"; 

function hashPassword(pass) {
  if (!pass) return "";
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pass);
  let hash = "";
  for (var i = 0; i < digest.length; i++) { // [FIX] i 변수 선언 추가
    let byte = digest[i];
    if (byte < 0) byte += 256;
    let bStr = byte.toString(16);
    if (bStr.length == 1) bStr = "0" + bStr;
    hash += bStr;
  }
  return hash;
}

function doOptions(e) { return handleCORS(); }
function handleCORS() { return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT); }
function createJSONResponse(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function getKoreanTime() {
  const date = new Date();
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return Utilities.formatDate(new Date(utc + (9 * 60 * 60000)), "GMT+09:00", "yyyy-MM-dd HH:mm:ss");
}

/* [NEW] 지능형 헤더 맵핑 엔진 */
function getHeaderMap(sheet) {
  if (!sheet) return {};
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const map = {};
  headers.forEach((h, i) => {
    const head = h.toString().toLowerCase().trim();
    if (head.includes("트랙") || head.includes("track")) map.track = i;
    else if (head.includes("주차") || head.includes("week")) map.week = i;
    else if (head.includes("제목") || head.includes("title")) map.title = i;
    else if (head.includes("내용") || head.includes("content")) map.content = i;
  });
  return map;
}

/* [CORE] 지능형 레이아웃 엔진 */
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

/* [V7.6] 드라이브 정밀 전수 조사 엔진 */
function syncDriveToSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pSheet = ss.getSheetByName(SHEET_PROGRESS);
  const layout = getSheetLayout(SHEET_PROGRESS);
  const root = DriveApp.getFolderById(TARGET_FOLDER_ID);
  
  const rows = pSheet.getDataRange().getValues();
  const idRowMap = {};
  for(let i=1; i<rows.length; i++) idRowMap[rows[i][0].toString().trim()] = i + 1;

  let updateCount = 0;
  const weekFolders = root.getFolders();
  
  while(weekFolders.hasNext()) {
    const weekFolder = weekFolders.next();
    const weekName = weekFolder.getName();
    const weekMatch = weekName.match(/^(\d+)주차$/);
    if (!weekMatch) continue;
    
    const weekNum = parseInt(weekMatch[1]);
    updateCount += processFolderRecursively(weekFolder, weekNum, idRowMap, pSheet, layout);
  }
  return updateCount;
}

function processFolderRecursively(folder, weekNum, idRowMap, pSheet, layout) {
  let count = 0;
  const files = folder.getFiles();
  while(files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    const parts = name.split('_');
    if (parts.length < 3) continue;
    
    const studentName = parts[2].split('.')[0].trim();
    const row = idRowMap[studentName];
    if (row) {
      const colStatus = weekNum + 1;
      const colUrl = weekNum + layout.urlOffset;
      pSheet.getRange(row, colStatus).setValue(true);
      pSheet.getRange(row, colUrl).setValue(file.getDownloadUrl());
      count++;
    }
  }
  const subs = folder.getFolders();
  while(subs.hasNext()) count += processFolderRecursively(subs.next(), weekNum, idRowMap, pSheet, layout);
  return count;
}

/* [POST] 데이터 처리 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
    let data = {};
    let action = e.parameter.action;
    if (e.postData && e.postData.contents) { data = JSON.parse(e.postData.contents); if (data.action) action = data.action; }
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'syncDriveToSheet') {
      const count = syncDriveToSheet();
      return createJSONResponse({ status: "success", count: count });
    }

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
      const parentFolder = DriveApp.getFolderById(TARGET_FOLDER_ID);
      const trackFolder = getOrCreateSubFolder(parentFolder, data.course_type || "기타");
      const weekFolder = getOrCreateSubFolder(trackFolder, (data.week + "주차") || "미지정주차");
      const targetFolder = getOrCreateSubFolder(weekFolder, data.grade_class || "일반");

      const existingFiles = targetFolder.getFiles();
      while (existingFiles.hasNext()) {
        const f = existingFiles.next();
        if (f.getName().indexOf(data.file_name.split('.')[0]) !== -1) f.setTrashed(true);
      }

      const file = targetFolder.createFile(Utilities.newBlob(Utilities.base64Decode(data.file_base64), data.mime_type, data.file_name));
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

    if (action === 'registerShowcaseLink' || action === 'saveShowcaseLink') {
      let sheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS) || ss.insertSheet(SHEET_SHOWCASE_LINKS);
      if (sheet.getLastRow() === 0) sheet.appendRow(["Timestamp", "Author", "Title", "Description", "Url", "Password", "category", "Empty", "visible"]);
      sheet.appendRow([getKoreanTime(), data.author || data.user_id, data.title || "무제", data.description || "", data.url, (data.password || "").toString(), data.type || "CUSTOM", "", "visible"]);
      return createJSONResponse({ status: "success" });
    }

    if (action === 'editShowcaseLink' || action === 'deleteShowcaseLink') {
      const sheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS);
      const rows = sheet.getDataRange().getDisplayValues(); 
      let found = -1;
      const targetTs = data.timestamp?.toString().trim();
      const inputPass = (data.password || "").toString().trim();
      
      for (let i=1; i<rows.length; i++) {
        if (rows[i][0].toString().trim() === targetTs && rows[i][5].toString().trim() === inputPass) {
          found = i + 1; break;
        }
      }
      if (found === -1) return createJSONResponse({ error: "Unauthorized" });
      
      if (action === 'editShowcaseLink') {
        sheet.getRange(found, 2, 1, 6).setValues([[data.author, data.title, data.description, data.url, inputPass, data.type]]);
      } else {
        sheet.deleteRow(found);
      }
      return createJSONResponse({ status: "success" });
    }

    if (action === 'adminLogin') {
      let sheet = ss.getSheetByName(SHEET_ADMINS) || ss.insertSheet(SHEET_ADMINS);
      const rows = sheet.getDataRange().getValues();
      if (rows.length <= 1) { 
        sheet.appendRow([data.name, "super_admin", hashPassword(data.password), "active", getKoreanTime()]);
        return createJSONResponse({ status: "success", role: "super_admin", name: data.name });
      }
      let found = -1;
      for (let i=1; i<rows.length; i++) if (rows[i][0].toString().trim() === data.name.trim()) { found = i + 1; break; }
      if (found === -1) return createJSONResponse({ error: "NotFound" });
      
      const role = rows[found-1][1], savedHash = rows[found-1][2], status = rows[found-1][3];
      
      if (status === "requested" && role === "applicant") return createJSONResponse({ status: "pending", message: "승인 대기 중" });
      
      if ((role === "admin" || role === "super_admin") && (!savedHash || status === "approved")) {
         sheet.getRange(found, 3).setValue(hashPassword(data.password));
         sheet.getRange(found, 4).setValue("active");
         return createJSONResponse({ status: "success", role: role, name: data.name });
      }
      
      if (hashPassword(data.password) === savedHash) return createJSONResponse({ status: "success", role: role, name: data.name });
      return createJSONResponse({ error: "InvalidPassword" });
    }

    if (action === 'requestAdmin') {
      let sheet = ss.getSheetByName(SHEET_ADMINS) || ss.insertSheet(SHEET_ADMINS);
      if (sheet.getLastRow() === 0) sheet.appendRow(["이름", "역할", "비밀번호_해시", "상태", "생성일"]);
      const rows = sheet.getDataRange().getValues();
      for (let i=1; i<rows.length; i++) if(rows[i][0].toString().trim() === data.name.trim()) return createJSONResponse({error:"Exists"});
      sheet.appendRow([data.name, "applicant", "", "requested", getKoreanTime()]);
      return createJSONResponse({ status: "success" });
    }

    if (action === 'setAdminPassword') {
       let sheet = ss.getSheetByName(SHEET_ADMINS);
       const rows = sheet.getDataRange().getValues();
       let found = -1;
       for (let i=1; i<rows.length; i++) if(rows[i][0].toString().trim() === data.name.trim()) { found = i + 1; break; }
       if (found === -1) return createJSONResponse({error:"NotFound"});
       sheet.getRange(found, 3).setValue(hashPassword(data.password));
       sheet.getRange(found, 4).setValue("active");
       return createJSONResponse({ status: "success" });
    }
  } finally { lock.releaseLock(); }
}

/* [GET] 데이터 불러오기 */
function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    if (action === 'testConnection') return createJSONResponse({ status: "success", message: "연결 성공 (V9.8 Master Final)", spreadsheetName: ss.getName() });

    if (action === 'getDriveFileBase64') {
      const fileId = e.parameter.fileId;
      try {
        const file = DriveApp.getFileById(fileId);
        if (file.isTrashed()) throw "Trashed";
        const blob = file.getBlob();
        return createJSONResponse({ status: "success", data: Utilities.base64Encode(blob.getBytes()), mimeType: blob.getContentType(), name: file.getName() });
      } catch (err) {
        const sSheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS);
        if (sSheet) {
          const sRows = sSheet.getDataRange().getDisplayValues();
          let vIdx = -1;
          for (let c = 0; c < sRows[0].length; c++) if (sRows[0][c].toLowerCase().includes("visible")) vIdx = c;
          for (let i = 1; i < sRows.length; i++) if (sRows[i][4].includes(fileId)) sSheet.getRange(i+1, (vIdx === -1 ? 9 : vIdx+1)).setValue("hidden");
        }
        return createJSONResponse({ status: "error", message: "FileNotFound" });
      }
    }

    if (action === 'getUser') {
      const sheet = ss.getSheetByName(SHEET_USERS);
      const rows = sheet.getDataRange().getValues();
      const uid = e.parameter.user_id;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] == uid) return createJSONResponse({ status: "success", data: { name: rows[i][0], school: rows[i][1], password: rows[i][2], avatar: rows[i][3], grade: rows[i][5], classGroup: rows[i][6] } });
      }
      return createJSONResponse({ error: "NotFound" });
    }

    if (action === 'checkUserStatus') {
      const week = parseInt(e.parameter.week), uid = e.parameter.user_id, layoutP = getSheetLayout(SHEET_PROGRESS);
      const syncResult = validateAndSyncDriveEntry(uid, week, layoutP);
      let res = { submissionStatus: syncResult.status, fileName: syncResult.fileName || '', feedback: '' };
      const uRows = ss.getSheetByName(SHEET_USERS).getDataRange().getDisplayValues();
      const layoutU = getSheetLayout(SHEET_USERS);
      const fCol = (e.parameter.course_type === 'POSE') ? (6 + layoutU.fbOffset + week) : (6 + week);
      for (let i=1; i<uRows.length; i++) if(uRows[i][0] == uid) { res.feedback = uRows[i][fCol] || ""; break; }
      return createJSONResponse({ status: "success", data: res });
    }

    if (action === 'getAllCourseStructure') {
      const s = ss.getSheetByName(SHEET_COURSE_CONTENTS);
      if(!s) return createJSONResponse({ status:"success", data:[] });
      const rows = s.getDataRange().getDisplayValues(), map = getHeaderMap(s);
      let data = []; 
      for (let i=1; i<rows.length; i++) {
        const tr = rows[i][map.track ?? 0]?.toString().trim();
        if (tr) data.push({ track: tr, week: parseInt(rows[i][map.week ?? 1]) || 0, title: rows[i][map.title ?? 2] || "" });
      }
      return createJSONResponse({ status: "success", data: data });
    }

    if (action === 'getCourseContent') {
      const s = ss.getSheetByName(SHEET_COURSE_CONTENTS);
      const rows = s.getDataRange().getValues(), map = getHeaderMap(s);
      const targetTrack = (e.parameter.track || "").toLowerCase().trim(), targetWeek = parseInt(e.parameter.week);
      for (let i=1; i<rows.length; i++) {
        if((rows[i][map.track ?? 0]||"").toString().toLowerCase().trim() === targetTrack && parseInt(rows[i][map.week ?? 1]) === targetWeek) {
          return createJSONResponse({ status: "success", title: rows[i][map.title ?? 2] || "", content: rows[i][map.content ?? 3] || "" });
        }
      }
      return createJSONResponse({ error: "NotFound" });
    }

    if (action === 'getProgress') {
      const uid = e.parameter.user_id, layout = getSheetLayout(SHEET_PROGRESS);
      let d = {};
      for(let j=1; j<=layout.maxWeeks; j++) {
        const sync = validateAndSyncDriveEntry(uid, j, layout);
        d[`week${j}`] = (sync.status === 'verified');
        d[`week${j}_url`] = sync.url || "";
      }
      return createJSONResponse({ status: "success", data: d });
    }

    if (action === 'getRankingData') {
      const layout = getSheetLayout(SHEET_PROGRESS), pSheet = ss.getSheetByName(SHEET_PROGRESS);
      const pRows = pSheet ? pSheet.getDataRange().getValues() : [];
      const uSheet = ss.getSheetByName(SHEET_USERS);
      const uRows = uSheet ? uSheet.getDataRange().getDisplayValues() : [];
      let ranks = [];
      for(let i=1; i<pRows.length; i++) {
        let count = 0, progressArr = [];
        for(let j=1; j<=layout.maxWeeks; j++) {
          const submitted = (pRows[i][j] === true || pRows[i][j] === "TRUE" || pRows[i][j] === "true");
          if(submitted) count++;
          progressArr.push(submitted);
        }
        let uInfo = uRows.find(r => r[0].toString().trim() == pRows[i][0].toString().trim());
        ranks.push({ name: pRows[i][0], grade: uInfo ? uInfo[5] : "", classGroup: uInfo ? uInfo[6] : "기타", points: count * 10, avatar: uInfo ? uInfo[3] : "👤", progress: progressArr });
      }
      return createJSONResponse({ status:"success", data: ranks });
    }

    if (action === 'getStudentList') {
        const uSheet = ss.getSheetByName(SHEET_USERS), uRows = uSheet.getDataRange().getDisplayValues();
        const pRows = ss.getSheetByName(SHEET_PROGRESS).getDataRange().getValues(), layoutP = getSheetLayout(SHEET_PROGRESS);
        const fbOffset = getSheetLayout(SHEET_USERS).fbOffset;
        let list = [];
        for (let i=1; i<uRows.length; i++) {
          const name = uRows[i][0].toString().trim();
          if(!name) continue;
          let progressArr = Array(12).fill(false), pRow = pRows.find(r => r[0].toString().trim() === name);
          if (pRow) for(let j=1; j<=layoutP.maxWeeks; j++) progressArr[j-1] = (pRow[j] === true || pRow[j] === "TRUE");
          let mf = [], pf = [];
          for(let k=1; k<=fbOffset; k++) { mf.push(uRows[i][6+k] || ""); pf.push(uRows[i][6+fbOffset+k] || ""); }
          list.push({ name: name, school: uRows[i][1], grade: uRows[i][5], class: uRows[i][6], feedbacks: { mbti: mf, pose: pf }, progress: progressArr });
        }
        return createJSONResponse({ status: "success", data: list });
    }

    if (action === 'getAllMbtiData') {
      const results = { showcase_links: [], users: {} };
      const sSheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS);
      if (sSheet) {
        const sRows = sSheet.getDataRange().getDisplayValues();
        let vCol = -1;
        for (let c = 0; c < sRows[0].length; c++) if (sRows[0][c].toLowerCase().includes("visible")) vCol = c;
        for (let i = 1; i < sRows.length; i++) if ((sRows[i][vCol === -1 ? 8 : vCol] || "").trim().toLowerCase() === "visible") {
          results.showcase_links.push({ Timestamp: sRows[i][0], Author: sRows[i][1], Title: sRows[i][2], Description: sRows[i][3], Url: sRows[i][4], Password: sRows[i][5], category: sRows[i][6] });
        }
      }
      const uSheet = ss.getSheetByName(SHEET_USERS);
      if (uSheet) {
        const uRows = uSheet.getDataRange().getDisplayValues();
        for (let i = 1; i < uRows.length; i++) results.users[uRows[i][0]] = { avatar: uRows[i][3], school: uRows[i][1], grade: uRows[i][5], classGroup: uRows[i][6] };
      }
      return createJSONResponse({ status: "success", data: results });
    }

    if (action === 'getShowcaseLinks') {
      const sheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS);
      if(!sheet) return createJSONResponse({ status:"success", data:[] });
      const rows = sheet.getDataRange().getDisplayValues();
      let data = []; 
      for (let i=1; i<rows.length; i++) if (rows[i][8] === "visible") data.push({ user_id: rows[i][1], author: rows[i][1], title: rows[i][2], description: rows[i][3], url: rows[i][4], timestamp: rows[i][0] });
      return createJSONResponse({ status: "success", data: data });
    }

    if (action === 'getAdminStatus') {
      const name = e.parameter.name, sheet = ss.getSheetByName(SHEET_ADMINS);
      if (!sheet) return createJSONResponse({ status: "not_found" });
      const rows = sheet.getDataRange().getValues();
      for (let i=1; i<rows.length; i++) if (rows[i][0].toString().trim() === name.trim()) return createJSONResponse({ status: "success", name: rows[i][0], role: rows[i][1], adminStatus: rows[i][3], hasPassword: !!rows[i][2] });
      return createJSONResponse({ status: "not_found" });
    }

    if (action === 'getAdmins') {
      const sheet = ss.getSheetByName(SHEET_ADMINS);
      const rows = sheet ? sheet.getDataRange().getDisplayValues() : [];
      let data = [];
      for (let i=1; i<rows.length; i++) data.push({ name: rows[i][0], role: rows[i][1], status: rows[i][3], createdAt: rows[i][4] });
      return createJSONResponse({ status: "success", data: data });
    }

    return createJSONResponse({ error: "Invalid Action" });
  } catch (err) { return createJSONResponse({ error: err.toString() }); }
}

function validateAndSyncDriveEntry(uid, week, layout) {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(SHEET_PROGRESS), rows = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i=1; i<rows.length; i++) if(rows[i][0] == uid) { foundRow = i+1; break; }
  if (foundRow === -1) return { status: 'not_found' };
  const colStatus = week + 1, colUrl = week + layout.urlOffset;
  let status = sheet.getRange(foundRow, colStatus).getValue(), url = sheet.getRange(foundRow, colUrl).getValue();
  if (!status || !url) return { status: 'not_found' };
  try {
    const fileIdMatch = url.match(/[-\w]{25,}/);
    if (!fileIdMatch) throw "No ID";
    const file = DriveApp.getFileById(fileIdMatch[0]);
    if (file.isTrashed()) throw "Trashed";
    return { status: 'verified', fileName: file.getName(), url: url };
  } catch (e) {
    sheet.getRange(foundRow, colStatus).setValue(false);
    sheet.getRange(foundRow, colUrl).setValue("");
    return { status: 'not_found' };
  }
}

function updateUserProgress(uid, week, status, url) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROGRESS);
  const rows = sheet.getDataRange().getValues(), layout = getSheetLayout(SHEET_PROGRESS);
  let found = -1;
  for (let i=1; i<rows.length; i++) if(rows[i][0] === uid) { found = i+1; break; }
  const colS = week + 1, colU = week + layout.urlOffset;
  if (found !== -1) { sheet.getRange(found, colS).setValue(status); sheet.getRange(found, colU).setValue(url); }
  else { let nr = Array(25).fill(""); nr[0] = uid; nr[week] = status; nr[week + 12] = url; sheet.appendRow(nr); }
}

function getOrCreateSubFolder(parent, name) {
  const iter = parent.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : parent.createFolder(name);
}

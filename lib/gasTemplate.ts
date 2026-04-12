export const GAS_TEMPLATE_CODE = `/* ==============================================================
   AI 연구소 통합 백엔드 API V7.6_Master_ReconSafe_Final
   (주차 폴더 정밀 매칭 + 드라이브 전수 조사 + 마스터 컨트롤)
   ============================================================== */

const SHEET_USERS = "Users"; 
const SHEET_PROGRESS = "Progress";
const SHEET_COURSE_CONTENTS = "CourseContents"; 
const SHEET_REFERENCE_CODES = "ReferenceCodes";
const SHEET_SHOWCASE_LINKS = "ShowcaseLinks"; 

const TARGET_FOLDER_ID = "{{FOLDER_ID}}";
const REFERENCE_FOLDER_ID = ""; 

function doOptions(e) { return handleCORS(); }
function handleCORS() { return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT); }
function createJSONResponse(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function getKoreanTime() {
  const date = new Date();
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return Utilities.formatDate(new Date(utc + (9 * 60 * 60000)), "GMT+09:00", "yyyy-MM-dd HH:mm:ss");
}

/* [NEW] 지능형 헤더 맵핑 엔진 (V7.8.2) */
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
    
    // [V7.6 핵심 수정] "1주차", "5주차" 처럼 숫자로 시작하고 한국어 '주차'로 끝나는 폴더만 매칭
    const weekMatch = weekName.match(/^(\\d+)주차$/);
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
      
      // [V2.0] 스마트 계층형 폴더 생성 로직
      const trackFolder = getOrCreateSubFolder(parentFolder, data.course_type || "기타");
      const weekFolder = getOrCreateSubFolder(trackFolder, (data.week + "주차") || "미지정주차");
      const targetFolder = getOrCreateSubFolder(weekFolder, data.grade_class || "일반");

      // [V2.1] 기존 파일 정리 (재제출 시 덮어쓰기 효과)
      const existingFiles = targetFolder.getFiles();
      while (existingFiles.hasNext()) {
        const f = existingFiles.next();
        // 파일명이 현재 업로드하려는 파일명과 같거나, 확장자만 다른 동일 학생 파일인 경우 삭제
        if (f.getName().indexOf(data.file_name.split('.')[0]) !== -1) {
          f.setTrashed(true);
        }
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

    if (action === 'saveShowcaseLink') {
      let sheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS) || ss.insertSheet(SHEET_SHOWCASE_LINKS);
      sheet.appendRow([data.user_id, data.track, data.week, data.url, getKoreanTime()]);
      return createJSONResponse({ status: "success" });
    }

    return createJSONResponse({ error: "Invalid Action" });
  } finally { lock.releaseLock(); }
}

/* [GET] 데이터 불러오기 */
function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    if (action === 'testConnection') {
      return createJSONResponse({ status: "success", message: "연결 성공 (V7.6 Master)" });
    }

    if (action === 'getUser') {
      const sheet = ss.getSheetByName(SHEET_USERS);
      const rows = sheet.getDataRange().getValues();
      const uid = e.parameter.user_id;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] == uid) {
          return createJSONResponse({
            status: "success",
            data: {
              name: rows[i][0],
              school: rows[i][1],
              password: rows[i][2],
              avatar: rows[i][3],
              grade: rows[i][5],
              classGroup: rows[i][6]
            }
          });
        }
      }
      return createJSONResponse({ error: "NotFound" });
    }

    if (action === 'checkUserStatus') {
      const layoutU = getSheetLayout(SHEET_USERS), layoutP = getSheetLayout(SHEET_PROGRESS);
      const week = parseInt(e.parameter.week);
      const uid = e.parameter.user_id;

      const syncResult = validateAndSyncDriveEntry(uid, week, layoutP);
      let res = { submissionStatus: syncResult.status, fileName: syncResult.fileName || '', feedback: '' };
      
      const uRows = ss.getSheetByName(SHEET_USERS).getDataRange().getDisplayValues();
      const fCol = (e.parameter.course_type === 'POSE') ? (6 + layoutU.fbOffset + week) : (6 + week);
      for (let i=1; i<uRows.length; i++) if(uRows[i][0] == uid) { res.feedback = uRows[i][fCol] || ""; break; }
      
      return createJSONResponse({ status: "success", data: res });
    }

    if (action === 'getAllCourseStructure') {
      const s = ss.getSheetByName(SHEET_COURSE_CONTENTS);
      if(!s) return createJSONResponse({ status:"success", data:[] });
      const rows = s.getDataRange().getDisplayValues();
      const map = getHeaderMap(s);
      
      // 기본 인덱스 설정 (헤더 감지 실패 시 폴백)
      const idx = {
        track: map.track ?? 0,
        week: map.week ?? 1,
        title: map.title ?? 2
      };

      let data = []; 
      for (let i=1; i<rows.length; i++) {
        const tr = rows[i][idx.track]?.toString().trim() || "";
        if (!tr) continue; // 트랙명이 없으면 건너뜀
        data.push({ 
          track: tr, 
          week: parseInt(rows[i][idx.week]) || 0, 
          title: rows[i][idx.title] || "" 
        });
      }
      return createJSONResponse({ status: "success", data: data });
    }

    if (action === 'getCourseContent') {
      const s = ss.getSheetByName(SHEET_COURSE_CONTENTS);
      if(!s) return createJSONResponse({ error: "Sheet Not Found" });
      const rows = s.getValues(); // Markdown의 경우 DisplayValues보다 원본 Values가 안전함
      const map = getHeaderMap(s);
      
      const idx = {
        track: map.track ?? 0,
        week: map.week ?? 1,
        title: map.title ?? 2,
        content: map.content ?? 3
      };

      const targetTrack = (e.parameter.track || "").toLowerCase().trim();
      const targetWeek = parseInt(e.parameter.week);

      for (let i=1; i<rows.length; i++) {
        const rowTrack = (rows[i][idx.track] || "").toString().toLowerCase().trim();
        const rowWeek = parseInt(rows[i][idx.week]);
        
        if(rowTrack === targetTrack && rowWeek === targetWeek) {
          return createJSONResponse({ 
            status: "success", 
            title: rows[i][idx.title] || "", 
            content: rows[i][idx.content] || "" 
          });
        }
      }
      return createJSONResponse({ error: "Not Found" });
    }

    if (action === 'getProgress') {
      const uid = e.parameter.user_id;
      const layout = getSheetLayout(SHEET_PROGRESS);
      let d = {};
      for(let j=1; j<=layout.maxWeeks; j++) {
        const sync = validateAndSyncDriveEntry(uid, j, layout);
        d[\`week\${j}\`] = (sync.status === 'verified');
        d[\`week\${j}_url\`] = sync.url || "";
      }
      return createJSONResponse({ status: "success", data: d });
    }

    if (action === 'getRankingData') {
      const layout = getSheetLayout(SHEET_PROGRESS);
      const pRows = ss.getSheetByName(SHEET_PROGRESS).getDataRange().getValues();
      const uRows = ss.getSheetByName(SHEET_USERS).getDataRange().getDisplayValues();
      let ranks = [];
      for(let i=1; i<pRows.length; i++) {
        let count = 0; for(let j=1; j<=layout.maxWeeks; j++) if(pRows[i][j] === true || pRows[i][j] === "TRUE") count++;
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

function validateAndSyncDriveEntry(uid, week, layout) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_PROGRESS);
  const rows = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i=1; i<rows.length; i++) if(rows[i][0] == uid) { foundRow = i+1; break; }
  if (foundRow === -1) return { status: 'not_found' };
  const colStatus = week + 1, colUrl = week + layout.urlOffset;
  let status = sheet.getRange(foundRow, colStatus).getValue();
  let url = sheet.getRange(foundRow, colUrl).getValue();
  if (status === false || status === "FALSE" || !status || !url) return { status: 'not_found' };
  try {
    const fileIdMatch = url.match(/[-\\w]{25,}/);
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
  const layout = getSheetLayout(SHEET_PROGRESS);
  const rows = sheet.getDataRange().getValues();
  let found = -1;
  for (let i=1; i<rows.length; i++) if(rows[i][0] === uid) { found = i+1; break; }
  const colS = week + 1, colU = week + layout.urlOffset;
  if (found !== -1) { sheet.getRange(found, colS).setValue(status); sheet.getRange(found, colU).setValue(url); }
  else { let nr = Array(sheet.getLastColumn() || (layout.urlOffset+12)).fill(""); nr[0] = uid; nr[week] = status; nr[week + layout.urlOffset - 1] = url; sheet.appendRow(nr); }
}

function getOrCreateSubFolder(parent, name) {
  const iter = parent.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : parent.createFolder(name);
}
`;

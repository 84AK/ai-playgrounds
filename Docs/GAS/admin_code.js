/* ==============================================================
   AI 연구소 통합 백엔드 API V7.6_Master_Pure_Edition
   (독립 연구소 최적화 + 과제 수정 버그 패치 V14.1 반영)
   ============================================================== */

const SHEET_USERS = 'Users'; 
const SHEET_PROGRESS = 'Progress';
const SHEET_COURSE_CONTENTS = 'CourseContents'; 
const SHEET_REFERENCE_CODES = 'ReferenceCodes';
const SHEET_SHOWCASE_LINKS = 'ShowcaseLinks'; 

const TARGET_FOLDER_ID = '여기에_폴더_ID를_넣으세요';
const REFERENCE_FOLDER_ID = ''; 

function hashPassword(pass) {
  if (!pass) return '';
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pass);
  let hash = '';
  for (var i = 0; i < digest.length; i++) {
    var byte = digest[i];
    if (byte < 0) byte += 256;
    var bStr = byte.toString(16);
    if (bStr.length == 1) bStr = '0' + bStr;
    hash += bStr;
  }
  return hash;
}

function doOptions(e) { return handleCORS(); }
function handleCORS() { return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT); }
function createJSONResponse(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function getKoreanTime() {
  var date = new Date();
  var utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return Utilities.formatDate(new Date(utc + (9 * 60 * 60000)), 'GMT+09:00', 'yyyy-MM-dd HH:mm:ss');
}

function getHeaderMap(sheet) {
  if (!sheet) return {};
  var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  var map = {};
  headers.forEach(function(h, i) {
    var head = h.toString().toLowerCase().trim();
    if (head.indexOf('트랙') !== -1 || head.indexOf('track') !== -1) map.track = i;
    else if (head.indexOf('주차') !== -1 || head.indexOf('week') !== -1) map.week = i;
    else if (head.indexOf('제목') !== -1 || head.indexOf('title') !== -1) map.title = i;
    else if (head.indexOf('내용') !== -1 || head.indexOf('content') !== -1) map.content = i;
  });
  return map;
}

function getSheetLayout(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return null;
  var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  var layout = { maxWeeks: 12, urlOffset: 12, fbOffset: 12 };
  if (sheetName === SHEET_PROGRESS) {
    var urlIdx = -1;
    for(var i=0; i<headers.length; i++) {
      if(headers[i].toString().toLowerCase().indexOf('url') !== -1) { urlIdx = i; break; }
    }
    if (urlIdx !== -1) { layout.urlOffset = urlIdx; layout.maxWeeks = urlIdx - 1; }
  } else if (sheetName === SHEET_USERS) {
    var poseIdx = -1;
    for(var i=0; i<headers.length; i++) {
      if(headers[i].toString().toUpperCase().indexOf('POSE_W1') !== -1) { poseIdx = i; break; }
    }
    if (poseIdx !== -1) { layout.fbOffset = poseIdx - 7; }
  }
  return layout;
}

function syncDriveToSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var pSheet = ss.getSheetByName(SHEET_PROGRESS);
  var layout = getSheetLayout(SHEET_PROGRESS);
  var root = DriveApp.getFolderById(TARGET_FOLDER_ID);
  
  var rows = pSheet.getDataRange().getValues();
  var idRowMap = {};
  for(var i=1; i<rows.length; i++) idRowMap[rows[i][0].toString().trim()] = i + 1;

  var updateCount = 0;
  var weekFolders = root.getFolders();
  
  while(weekFolders.hasNext()) {
    var weekFolder = weekFolders.next();
    var weekName = weekFolder.getName();
    var weekMatch = weekName.match(/[0-9]+/);
    if (!weekMatch || weekName.indexOf('주차') === -1) continue;
    
    var weekNum = parseInt(weekMatch[0]);
    updateCount += processFolderRecursively(weekFolder, weekNum, idRowMap, pSheet, layout);
  }
  return updateCount;
}

function processFolderRecursively(folder, weekNum, idRowMap, pSheet, layout) {
  var count = 0;
  var files = folder.getFiles();
  while(files.hasNext()) {
    var file = files.next();
    var name = file.getName();
    var parts = name.split('_');
    if (parts.length < 3) continue;
    
    var studentName = parts[2].split('.')[0].trim();
    var row = idRowMap[studentName];
    if (row) {
      var colStatus = weekNum + 1;
      var colUrl = weekNum + layout.urlOffset;
      pSheet.getRange(row, colStatus).setValue(true);
      pSheet.getRange(row, colUrl).setValue(file.getDownloadUrl());
      count++;
    }
  }
  var subs = folder.getFolders();
  while(subs.hasNext()) count += processFolderRecursively(subs.next(), weekNum, idRowMap, pSheet, layout);
  return count;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
    var data = {};
    var action = e.parameter.action;
    if (e.postData && e.postData.contents) { data = JSON.parse(e.postData.contents); if (data.action) action = data.action; }
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'syncDriveToSheet') return createJSONResponse({ status: 'success', count: syncDriveToSheet() });

    if (action === 'uploadHomework') {
      var parentFolder = DriveApp.getFolderById(TARGET_FOLDER_ID);
      var trackFolder = getOrCreateSubFolder(parentFolder, data.course_type || '기타');
      var weekFolder = getOrCreateSubFolder(trackFolder, (data.week + '주차') || '미지정주차');
      var targetFolder = getOrCreateSubFolder(weekFolder, data.grade_class || '일반');
      
      var targetStem = data.file_name.split('.')[0].trim();
      var existingFiles = targetFolder.getFiles();
      while (existingFiles.hasNext()) {
        var f = existingFiles.next();
        var fStem = f.getName().split('.')[0].trim();
        if (fStem === targetStem) { 
          try { f.setTrashed(true); } catch(err) { console.warn('Delete failed:', err); }
        }
      }
      var file = targetFolder.createFile(Utilities.newBlob(Utilities.base64Decode(data.file_base64), data.mime_type, data.file_name));
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      updateUserProgress(data.user_id, parseInt(data.week), true, file.getDownloadUrl());
      return createJSONResponse({ status: 'success', fileUrl: file.getDownloadUrl() });
    }

    if (action === 'registerUser' || action === 'updateUser') {
      var sheet = ss.getSheetByName(SHEET_USERS) || ss.insertSheet(SHEET_USERS);
      var rows = sheet.getDataRange().getValues();
      var found = -1;
      for (var i=1; i<rows.length; i++) if(rows[i][0] == data.user_id) { found = i+1; break; }
      var val = [data.user_id, data.school, data.password, data.avatar, getKoreanTime(), data.grade, data.classGroup];
      if (action === 'registerUser') { if(found!==-1) return createJSONResponse({error:'Exists'}); sheet.appendRow(val); }
      else { if(found===-1) return createJSONResponse({error:'NotFound'}); sheet.getRange(found, 1, 1, 7).setValues([val]); }
      return createJSONResponse({ status: 'success' });
    }

    if (action === 'saveCourseContent' || action === 'registerWeek') {
      var sheet = ss.getSheetByName(SHEET_COURSE_CONTENTS) || ss.insertSheet(SHEET_COURSE_CONTENTS);
      var rows = sheet.getDataRange().getValues();
      var found = -1;
      for (var i=1; i<rows.length; i++) if(rows[i][0] == data.track && rows[i][1] == data.week) { found = i+1; break; }
      var val = [data.track, data.week, data.title || '', data.content || '', getKoreanTime()];
      if (found !== -1) sheet.getRange(found, 1, 1, 5).setValues([val]); else sheet.appendRow(val);
      return createJSONResponse({ status: 'success' });
    }

    if (action === 'registerShowcaseLink' || action === 'saveShowcaseLink') {
      var sheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS) || ss.insertSheet(SHEET_SHOWCASE_LINKS);
      if (sheet.getLastRow() === 0) sheet.appendRow(['Timestamp', 'Author', 'Title', 'Description', 'Url', 'Password', 'category', 'Empty', 'visible']);
      sheet.appendRow([getKoreanTime(), data.author || data.user_id, data.title || '무제', data.description || '', data.url, (data.password || '').toString(), data.type || 'CUSTOM', '', 'visible']);
      return createJSONResponse({ status: 'success' });
    }

    if (action === 'editShowcaseLink' || action === 'deleteShowcaseLink') {
      var sheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS);
      var rows = sheet.getDataRange().getDisplayValues();
      var found = -1;
      var targetTs = data.timestamp ? data.timestamp.toString().trim() : '';
      var inputPass = (data.password || '').toString().trim();
      for (var i=1; i<rows.length; i++) {
        if (rows[i][0].toString().trim() === targetTs && rows[i][5].toString().trim() === inputPass) { found = i + 1; break; }
      }
      if (found === -1) return createJSONResponse({ error: 'Unauthorized' });
      if (action === 'editShowcaseLink') sheet.getRange(found, 2, 1, 6).setValues([[data.author, data.title, data.description, data.url, inputPass, data.type]]);
      else sheet.deleteRow(found);
      return createJSONResponse({ status: 'success' });
    }
  } finally { lock.releaseLock(); }
}

function doGet(e) {
  var action = e.parameter.action, ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    if (action === 'testConnection') return createJSONResponse({ status: 'success', message: '연결 성공 (V7.6 Master Final)', spreadsheetName: ss.getName() });
    if (action === 'getUser') {
      var sheet = ss.getSheetByName(SHEET_USERS), rows = sheet.getDataRange().getValues(), uid = e.parameter.user_id;
      for (var i = 1; i < rows.length; i++) if (rows[i][0] == uid) return createJSONResponse({ status: 'success', data: { name: rows[i][0], school: rows[i][1], password: rows[i][2], avatar: rows[i][3], grade: rows[i][5], classGroup: rows[i][6] } });
      return createJSONResponse({ error: 'NotFound' });
    }
    if (action === 'checkUserStatus') {
      var week = parseInt(e.parameter.week), uid = e.parameter.user_id, layoutP = getSheetLayout(SHEET_PROGRESS);
      var syncResult = validateAndSyncDriveEntry(uid, week, layoutP);
      var res = { submissionStatus: syncResult.status, fileName: syncResult.fileName || '', feedback: '' };
      var uRows = ss.getSheetByName(SHEET_USERS).getDataRange().getDisplayValues(), layoutU = getSheetLayout(SHEET_USERS);
      var fCol = (e.parameter.course_type === 'POSE') ? (6 + layoutU.fbOffset + week) : (6 + week);
      for (var i=1; i<uRows.length; i++) if(uRows[i][0] == uid) { res.feedback = uRows[i][fCol] || ''; break; }
      return createJSONResponse({ status: 'success', data: res });
    }
    return createJSONResponse({ error: 'Invalid Action' });
  } catch (err) { return createJSONResponse({ error: err.toString() }); }
}

function validateAndSyncDriveEntry(uid, week, layout) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(SHEET_PROGRESS), rows = sheet.getDataRange().getValues();
  var foundRow = -1;
  for (var i=1; i<rows.length; i++) if(rows[i][0] == uid) { foundRow = i + 1; break; }
  if (foundRow === -1) return { status: 'not_found' };
  var colStatus = week + 1, colUrl = week + layout.urlOffset;
  var status = sheet.getRange(foundRow, colStatus).getValue(), url = sheet.getRange(foundRow, colUrl).getValue();
  if (!status || !url) return { status: 'not_found' };
  try {
    var fileIdMatch = url.match(/[-\w]{25,}/);
    var file = DriveApp.getFileById(fileIdMatch[0]);
    if (file.isTrashed()) throw 'Trashed';
    return { status: 'verified', fileName: file.getName(), url: url };
  } catch (e) {
    sheet.getRange(foundRow, colStatus).setValue(false);
    sheet.getRange(foundRow, colUrl).setValue('');
    return { status: 'not_found' };
  }
}

function updateUserProgress(uid, week, status, url) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROGRESS);
  var rows = sheet.getDataRange().getValues(), layout = getSheetLayout(SHEET_PROGRESS);
  var found = -1;
  for (var i = 1; i < rows.length; i++) if(rows[i][0] === uid) { found = i + 1; break; }
  if (found !== -1) { sheet.getRange(found, week + 1).setValue(status); sheet.getRange(found, week + layout.urlOffset).setValue(url); }
  else { var nr = Array(25).fill(''); nr[0] = uid; nr[week] = status; nr[week + 12] = url; sheet.appendRow(nr); }
}

function getOrCreateSubFolder(parent, name) {
  var iter = parent.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : parent.createFolder(name);
}
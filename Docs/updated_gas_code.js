/* ==============================================================
   AI 연구소 통합 백엔드 API V5.3_Final_Merged (랭킹 + 콘텐츠수정 + 하이브리드정답)
   ============================================================== */

const SHEET_USERS = "Users"; 
const SHEET_PROGRESS = "Progress";
const SHEET_COURSE_CONTENTS = "CourseContents"; 
const SHEET_REFERENCE_CODES = "ReferenceCodes"; // 정답 코드 시트 (없으면 자동생성)
const SHEET_MBTI_QUESTIONS = "Questions";
const SHEET_MBTI_RESULTS = "Results";
const SHEET_SHOWCASE_LINKS = "ShowcaseLinks"; 
const SHEET_WEEKLY_FEEDBACKS = "WeeklyFeedbacks";

// 🚨 [필수 확인] 기존에 사용하시던 폴더 ID를 그대로 유지하세요!
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

    // ✅ [리다이렉트 대응] URL 파라미터와 Body 데이터를 통합하여 action 추출
    let data = {};
    let action = e.parameter.action; // URL 파라미터 우선 확인 (302 리다이렉트 대응)
    
    if (e.postData && e.postData.contents) {
      try {
        const bodyData = JSON.parse(e.postData.contents);
        data = bodyData;
        if (bodyData.action) action = bodyData.action; // Body에 있으면 덮어씀
      } catch (err) {
        // JSON 파싱 실패 시 무시
      }
    }

    if (!action) return createJSONResponse({ error: "No action specified. Post content might be missing." });
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 0. 유저 등록 및 수정 (기존 유지)
    if (action === 'registerUser' || action === 'updateUser') {
      const { user_id, school, password, avatar, grade, classGroup } = data;
      let sheet = ss.getSheetByName(SHEET_USERS) || ss.getSheetByName(SHEET_USERS.toLowerCase()) || ss.insertSheet(SHEET_USERS);
      if (sheet.getLastRow() === 0) sheet.appendRow(["User_ID", "School", "Password", "Avatar", "Last_Updated", "Grade", "Class", "Feedback"]);

      const rows = sheet.getDataRange().getDisplayValues();
      let foundRow = -1;
      for (let i = 1; i < rows.length; i++) { 
        if (rows[i][0].toString().trim() === user_id.toString().trim()) { foundRow = i + 1; break; } 
      }

      if (action === 'registerUser') {
        if (foundRow !== -1) return createJSONResponse({ error: "User already exists" });
        sheet.appendRow([user_id, school, password, avatar, getKoreanTime(), grade || "", classGroup || "", ""]);
        return createJSONResponse({ status: "success" });
      } else {
        if (foundRow === -1) return createJSONResponse({ error: "User not found" });
        sheet.getRange(foundRow, 1, 1, 7).setValues([[user_id, school, password, avatar, getKoreanTime(), grade || rows[foundRow-1][5], classGroup || rows[foundRow-1][6]]]);
        return createJSONResponse({ status: "success" });
      }
    }

    // 1. 과제 업로드 (기존 유지)
    if (action === 'uploadHomework') {
      const { user_id, course_type, week, grade_class, file_name, file_base64, mime_type } = data;
      try {
        const rootFolder = DriveApp.getFolderById(TARGET_FOLDER_ID);
        const weekNum = Number(week);
        const weekFolderName = (course_type && course_type.toUpperCase() === 'POSE')
          ? `POSE_Week${weekNum}`.normalize("NFC")
          : (week.toString() + "주차").normalize("NFC");
        const weekFolder = getOrCreateSubFolder(rootFolder, weekFolderName);
        const classFolderName = (grade_class || "기타").toString().normalize("NFC");
        const targetFolder = getOrCreateSubFolder(weekFolder, classFolderName);
        
        const files = targetFolder.getFilesByName(file_name);
        let file;
        if (files.hasNext()) {
          file = files.next();
          file.setContent(Utilities.newBlob(Utilities.base64Decode(file_base64), mime_type || MimeType.PLAIN_TEXT).getBytes());
        } else {
          file = targetFolder.createFile(Utilities.newBlob(Utilities.base64Decode(file_base64), mime_type || MimeType.PLAIN_TEXT, file_name));
        }
        
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        updateUserProgress(user_id, course_type, Number(week), true, file.getDownloadUrl());
        
        return createJSONResponse({ status: "success", fileUrl: file.getDownloadUrl(), path: weekFolderName + " > " + classFolderName });
      } catch (err) { 
        return createJSONResponse({ status: "error", message: err.toString() }); 
      }
    }

    // 2. 피드백 업데이트 (기존 유지)
    if (action === 'updateFeedback') {
      const { user_id, week, feedback } = data;
      if (week) {
        const weekNum = week.toString();
        let fSheet = ss.getSheetByName(SHEET_WEEKLY_FEEDBACKS) || ss.insertSheet(SHEET_WEEKLY_FEEDBACKS);
        if (fSheet.getLastRow() === 0) fSheet.appendRow(["User_ID", "Week", "Feedback", "Updated_At"]);
        const rows = fSheet.getDataRange().getValues();
        let foundRow = -1;
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0].toString().trim() === user_id.toString().trim() && rows[i][1].toString().trim() === weekNum) {
            foundRow = i + 1; break;
          }
        }
        if (foundRow !== -1) fSheet.getRange(foundRow, 3, 1, 2).setValues([[feedback, getKoreanTime()]]);
        else fSheet.appendRow([user_id, weekNum, feedback, getKoreanTime()]);
        return createJSONResponse({ status: "success" });
      } else {
        let uSheet = ss.getSheetByName(SHEET_USERS) || ss.getSheetByName(SHEET_USERS.toLowerCase());
        const uRows = uSheet.getDataRange().getDisplayValues();
        for (let i = 1; i < uRows.length; i++) {
          if (uRows[i][0].toString().trim() === user_id.toString().trim()) {
            uSheet.getRange(i + 1, 8).setValue(feedback);
            return createJSONResponse({ status: "success" });
          }
        }
        return createJSONResponse({ error: "User not found" });
      }
    }

    // ✅ [추가] 3. 강의 콘텐츠 저장 (보안 및 유연한 시트 검색 적용)
    if (action === 'saveCourseContent') {
      const track = (data.track || e.parameter.track || "").toString().trim().toUpperCase();
      const week = Number(data.week || e.parameter.week);
      const content = data.content || "";
      
      let cSheet = getFlexibleSheet(ss, SHEET_COURSE_CONTENTS, "course", "content");
      const rows = cSheet.getDataRange().getValues();
      let foundRow = -1;

      for (let i = 1; i < rows.length; i++) {
        const rowTrack = (rows[i][0] || "").toString().trim().toUpperCase();
        const rowWeek = Number(rows[i][1]);
        if (rowTrack === track && rowWeek === week) {
          foundRow = i + 1;
          break;
        }
      }

      if (foundRow !== -1) {
        cSheet.getRange(foundRow, 3).setValue(content);
        cSheet.getRange(foundRow, 4).setValue(getKoreanTime()); 
      } else {
        cSheet.appendRow([track, week, content, getKoreanTime()]);
      }
      return createJSONResponse({ status: "success", savedTo: cSheet.getName() });
    }

    return createJSONResponse({ error: "Invalid Action in doPost: " + action });
  } finally {
    lock.releaseLock();
  }
}

/* =========================================================
   [GET] 데이터 불러오기
   ========================================================= */
function doGet(e) {
  const params = e.parameter;
  const action = params.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    // 0. 유저 정보 조회 (기존 유지)
    if (action === 'getUser') {
      const uSheet = ss.getSheetByName(SHEET_USERS) || ss.getSheetByName(SHEET_USERS.toLowerCase());
      if (!uSheet) return createJSONResponse({ status: "error", message: "Sheet not found" });
      const rows = uSheet.getDataRange().getDisplayValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0].toString().trim() === params.user_id.toString().trim()) {
          return createJSONResponse({ 
            status: "success", 
            data: { name: rows[i][0], school: rows[i][1], password: rows[i][2], avatar: rows[i][3], grade: rows[i][5], classGroup: rows[i][6], feedback: rows[i][7] || "" } 
          });
        }
      }
      return createJSONResponse({ status: "error", message: "User not found" });
    }

    // 1. 전체 학생 및 진도 랭킹 데이터 조회 (기존 유지)
    if (action === 'getRankingData') {
      const uSheet = ss.getSheetByName(SHEET_USERS) || ss.getSheetByName(SHEET_USERS.toLowerCase());
      const pSheet = ss.getSheetByName(SHEET_PROGRESS);
      if (!uSheet) return createJSONResponse({ error: "User sheet not found" });
      const uRows = uSheet.getDataRange().getDisplayValues();
      const pRows = pSheet ? pSheet.getDataRange().getValues() : [];
      const progressMap = {};
      for (let i = 1; i < pRows.length; i++) {
        const uid = pRows[i][0].toString().trim();
        if (uid) {
          progressMap[uid] = {
            mbti: [pRows[i][1], pRows[i][2], pRows[i][3], pRows[i][4]],
            pose: [pRows[i][5], pRows[i][6], pRows[i][7], pRows[i][8]]
          };
        }
      }
      const rankingList = [];
      for (let i = 1; i < uRows.length; i++) {
        const uid = uRows[i][0].toString().trim();
        if (!uid) continue;
        const p = progressMap[uid] || { mbti: [false, false, false, false], pose: [false, false, false, false] };
        let totalPoints = 0;
        const allProgress = [...p.mbti, ...p.pose];
        allProgress.forEach(status => {
          if (status === true || status === "TRUE") totalPoints += 10;
        });
        rankingList.push({
          name: uid, avatar: uRows[i][3] || "", grade: uRows[i][5] || "", classGroup: uRows[i][6] || "", points: totalPoints, mbtiProgress: p.mbti, poseProgress: p.pose
        });
      }
      rankingList.sort((a, b) => b.points - a.points);
      return createJSONResponse({ status: "success", data: rankingList });
    }

    // ✅ [추가] 2. 강의 콘텐츠 조회
    if (action === 'getCourseContent') {
      const track = (params.track || "").toString().trim().toUpperCase();
      const week = Number(params.week);
      
      let cSheet = getFlexibleSheet(ss, SHEET_COURSE_CONTENTS, "course", "content");
      const rows = cSheet.getDataRange().getValues();
      
      for (let i = 1; i < rows.length; i++) {
        const rowTrack = (rows[i][0] || "").toString().trim().toUpperCase();
        const rowWeek = Number(rows[i][1]);
        if (rowTrack === track && rowWeek === week) {
          return createJSONResponse({ status: "success", content: rows[i][2], source: "sheet", sheetName: cSheet.getName() });
        }
      }
      return createJSONResponse({ status: "success", content: "", message: "No match found" });
    }

    // ✅ [추가] 3. 정적 정답 코드 조회 (하이브리드 방식)
    if (action === 'getReferenceCode') {
      const track = (params.course_type || params.track || "MBTI").toString().trim().toUpperCase();
      const week = Number(params.week);
      
      // 1순위: 시드 시트에서 찾기
      let rSheet = ss.getSheetByName(SHEET_REFERENCE_CODES) || ss.getSheetByName("ReferenceCodes");
      if (rSheet) {
        const rows = rSheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          const rowTrack = (rows[i][0] || "").toString().trim().toUpperCase();
          const rowWeek = Number(rows[i][1]);
          if (rowTrack === track && rowWeek === week) {
            return createJSONResponse({ status: "success", content: rows[i][2], source: "sheet" });
          }
        }
      }
      
      // 2순위: 구글 드라이브 폴더에서 찾기
      const driveContent = getReferenceCodeFromDrive(week, track);
      if (driveContent) {
        return createJSONResponse({ status: "success", content: driveContent, source: "drive" });
      }

      return createJSONResponse({ status: "success", content: "", message: "Reference not found" });
    }

    // 기존 액션들 유지
    if (action === 'getProgress') {
      const { user_id } = params;
      const pSheet = ss.getSheetByName(SHEET_PROGRESS);
      let userData = { mbti_week1: false, mbti_week2: false, mbti_week3: false, mbti_week4: false, pose_week1: false, pose_week2: false, pose_week3: false, pose_week4: false };
      if (pSheet) {
        const rows = pSheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === user_id) {
            userData = {
              mbti_week1: !!rows[i][1], mbti_week2: !!rows[i][2], mbti_week3: !!rows[i][3], mbti_week4: !!rows[i][4],
              pose_week1: !!rows[i][5], pose_week2: !!rows[i][6], pose_week3: !!rows[i][7], pose_week4: !!rows[i][8]
            };
            break;
          }
        }
      }
      return createJSONResponse({ status: "success", data: userData });
    }

    if (action === 'getStudentList') {
        const uSheet = ss.getSheetByName(SHEET_USERS) || ss.getSheetByName(SHEET_USERS.toLowerCase());
        if (!uSheet) return createJSONResponse({ status: "error" });
        const rows = uSheet.getDataRange().getDisplayValues();
        let list = [];
        for (let i = 1; i < rows.length; i++) {
          list.push({ 
            name: rows[i][0], school: rows[i][1], grade: rows[i][5] || "", class: rows[i][6] || "", feedback: rows[i][7] || "" 
          });
        }
        return createJSONResponse({ status: "success", data: list });
    }

    return createJSONResponse({ error: "Invalid Action in doGet: " + action });
  } catch (err) { return createJSONResponse({ error: err.toString() }); }
}


/* =========================================================
   [HELPERS] 유틸리티 함수들
   ========================================================= */

// 📂 폴더 생성 및 반환 함수
function getOrCreateSubFolder(parentFolder, folderName) {
  const folderNameNFC = folderName.normalize("NFC");
  const subFolders = parentFolder.getFoldersByName(folderNameNFC);
  if (subFolders.hasNext()) return subFolders.next();
  return parentFolder.createFolder(folderNameNFC);
}

// 📂 하위 폴더 포함 모든 파일을 찾는 재귀 함수
function findFileBySubfolders(folder, userId, week, isReference = false, courseType = "MBTI") {
  const files = folder.getFiles();
  const weekNum = week.toString().normalize("NFC");
  let weekTarget = (weekNum + "주차").normalize("NFC");
  if (courseType && courseType.toUpperCase() === 'POSE') {
    weekTarget = (`POSE_Week${weekNum}`).normalize("NFC");
  }
  const userIdClean = userId.toString().normalize("NFC");
  
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName().normalize("NFC");
    const cleanName = name.replace(/\s/g, ""); 
    if (isReference) {
      const keywords = ["정답", "해설", "모범", "reference", "ref"];
      const hasKeyword = keywords.some(k => name.toLowerCase().includes(k.normalize("NFC")));
      if (cleanName.includes(weekTarget) && hasKeyword) return file;
    } else {
      if (cleanName.includes(weekTarget) && name.includes(userIdClean)) return file;
    }
  }
  const subFolders = folder.getFolders();
  while (subFolders.hasNext()) {
    const found = findFileBySubfolders(subFolders.next(), userId, week, isReference, courseType);
    if (found) return found;
  }
  return null;
}

// 📂 구글 드라이브에서 정답 코드 가져오기 전용
function getReferenceCodeFromDrive(week, courseType) {
  try {
    const folder = DriveApp.getFolderById(REFERENCE_FOLDER_ID);
    const file = findFileBySubfolders(folder, "", week, true, courseType);
    if (file) {
      const mime = file.getMimeType();
      if (mime === "application/vnd.google-apps.document") {
        return DocumentApp.openById(file.getId()).getBody().getText();
      } 
      return file.getBlob().getDataAsString();
    }
  } catch (e) { console.error(e); }
  return null;
}

// 📂 시트 이름을 유연하게 찾아주는 함수
function getFlexibleSheet(ss, defaultName, term1, term2) {
  let sheet = ss.getSheetByName(defaultName);
  if (sheet) return sheet;
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const sName = sheets[i].getName().toLowerCase();
    if (sName.includes(term1) && sName.includes(term2)) return sheets[i];
  }
  return ss.insertSheet(defaultName);
}

// 주차별 진행도 업데이트
function updateUserProgress(userId, courseType, weekNum, status, fileUrl = "") {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_PROGRESS) || ss.insertSheet(SHEET_PROGRESS);
  const rows = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < rows.length; i++) { if (rows[i][0] === userId) { foundRow = i + 1; break; } }
  let colIndex = courseType.toUpperCase() === 'MBTI' ? 1 + weekNum : 5 + weekNum;
  let urlColIndex = courseType.toUpperCase() === 'MBTI' ? 9 + weekNum : 13 + weekNum;
  if (foundRow !== -1) {
    sheet.getRange(foundRow, colIndex).setValue(status);
    sheet.getRange(foundRow, urlColIndex).setValue(fileUrl);
  } else {
    let newRow = Array(17).fill(""); newRow[0] = userId; newRow[colIndex-1] = status; newRow[urlColIndex-1] = fileUrl;
    sheet.appendRow(newRow);
  }
}

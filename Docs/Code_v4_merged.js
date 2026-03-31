/* ==============================================================
   AI 연구소 통합 백엔드 API V5.1_Showcase_Merged (최종 보완 버전)
   ============================================================== */

const SHEET_USERS = "Users"; 
const SHEET_PROGRESS = "Progress";
const SHEET_COURSE_CONTENTS = "CourseContents"; 
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

// 🌐 하위 폴더 포함 모든 파일을 찾는 재귀 함수
function findFileBySubfolders(folder, userId, week, isReference = false) {
  const files = folder.getFiles();
  const weekNum = week.toString().normalize("NFC");
  const weekTarget = (weekNum + "주차").normalize("NFC");
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
    const found = findFileBySubfolders(subFolders.next(), userId, week, isReference);
    if (found) return found;
  }
  return null;
}

// 📂 폴더 생성 및 반환 함수
function getOrCreateSubFolder(parentFolder, folderName) {
  const folderNameNFC = folderName.normalize("NFC");
  const subFolders = parentFolder.getFoldersByName(folderNameNFC);
  if (subFolders.hasNext()) {
    return subFolders.next();
  } else {
    return parentFolder.createFolder(folderNameNFC);
  }
}

/* =========================================================
   [POST] 데이터 업로드 / 수정 / 삭제 / 피드백
   ========================================================= */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); 

    if (!e.postData || !e.postData.contents) return createJSONResponse({ error: "No post content" });
    let data = JSON.parse(e.postData.contents);
    const action = data.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 0. 유저 등록 및 수정
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

    // 1. 과제 업로드
    if (action === 'uploadHomework') {
      const { user_id, course_type, week, grade_class, file_name, file_base64, mime_type } = data;
      try {
        const rootFolder = DriveApp.getFolderById(TARGET_FOLDER_ID);
        // ✅ [2026-03-31 수정] course_type에 따라 폴더명 분기
        //    POSE → "POSE_Week1" ~ "POSE_Week4"
        //    MBTI (그 외) → 기존 "1주차" ~ "4주차" 방식 유지
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

    // 2. 피드백 업데이트
    if (action === 'updateFeedback') {
      const { user_id, week, feedback } = data;
      
      if (week) {
        const weekNum = week.toString();
        let fSheet = ss.getSheetByName(SHEET_WEEKLY_FEEDBACKS) || ss.insertSheet(SHEET_WEEKLY_FEEDBACKS);
        if (fSheet.getLastRow() === 0) fSheet.appendRow(["User_ID", "Week", "Feedback", "Updated_At"]);
        const rows = fSheet.getDataRange().getValues();
        let foundRow = -1;
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0].toString().trim() === user_id.toString().trim() && 
              rows[i][1].toString().trim() === weekNum) {
            foundRow = i + 1; break;
          }
        }
        if (foundRow !== -1) fSheet.getRange(foundRow, 3, 1, 2).setValues([[feedback, getKoreanTime()]]);
        else fSheet.appendRow([user_id, weekNum, feedback, getKoreanTime()]);
        return createJSONResponse({ status: "success", scope: "weekly" });
      } else {
        let uSheet = ss.getSheetByName(SHEET_USERS) || ss.getSheetByName(SHEET_USERS.toLowerCase());
        const uRows = uSheet.getDataRange().getDisplayValues();
        for (let i = 1; i < uRows.length; i++) {
          if (uRows[i][0].toString().trim() === user_id.toString().trim()) {
            uSheet.getRange(i + 1, 8).setValue(feedback);
            return createJSONResponse({ status: "success", scope: "global" });
          }
        }
        return createJSONResponse({ error: "User not found" });
      }
    }

    // 3. 강의 콘텐츠 저장
    if (action === 'saveCourseContent') {
      const { track, week, content } = data;
      let cSheet = ss.getSheetByName(SHEET_COURSE_CONTENTS) || ss.insertSheet(SHEET_COURSE_CONTENTS);
      const rows = cSheet.getDataRange().getValues();
      let foundRow = -1;
      for (let i = 1; i < rows.length; i++) { if (rows[i][0] === track && Number(rows[i][1]) === Number(week)) { foundRow = i + 1; break; } }
      if (foundRow !== -1) { cSheet.getRange(foundRow, 3).setValue(content); } 
      else { cSheet.appendRow([track, Number(week), content, getKoreanTime()]); }
      return createJSONResponse({ status: "success" });
    }

    return createJSONResponse({ error: "Invalid Action" });
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
    // 0. 유저 정보 조회
    if (action === 'getUser') {
      const uSheet = ss.getSheetByName(SHEET_USERS) || ss.getSheetByName(SHEET_USERS.toLowerCase());
      if (!uSheet) return createJSONResponse({ status: "error", message: "Sheet not found" });
      
      const rows = uSheet.getDataRange().getDisplayValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0].toString().trim() === params.user_id.toString().trim()) {
          return createJSONResponse({ 
            status: "success", 
            data: { 
              name: rows[i][0], 
              school: rows[i][1], 
              password: rows[i][2], 
              avatar: rows[i][3],
              grade: rows[i][5],
              classGroup: rows[i][6],
              feedback: rows[i][7] || "" 
            } 
          });
        }
      }
      return createJSONResponse({ status: "error", message: "User not found" });
    }

    // ─── [추가] 쇼케이스 통합 데이터 조회 (V5.1 Merged) ───
    if (action === 'getAllMbtiData') {
      const result = { questions: [], showcase_links: [], users: {} };
      
      // A. Questions 시트 (MBTI 작품)
      const qSheet = ss.getSheetByName(SHEET_MBTI_QUESTIONS);
      if (qSheet) {
        const data = qSheet.getDataRange().getValues();
        const headers = data[0];
        for (let i = 1; i < data.length; i++) {
          let obj = {}; headers.forEach((h, j) => { obj[h] = data[i][j]; });
          result.questions.push(obj);
        }
      }

      // B. ShowcaseLinks 시트 (커스텀 등록 작품)
      const sSheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS);
      if (sSheet) {
        const data = sSheet.getDataRange().getValues();
        const headers = data[0];
        for (let i = 1; i < data.length; i++) {
          let obj = {}; headers.forEach((h, j) => { obj[h] = data[i][j]; });
          result.showcase_links.push(obj);
        }
      }

      // C. Users 시트 매핑 (F열:학년, G열:반 구조 반영)
      const uSheet = ss.getSheetByName(SHEET_USERS) || ss.getSheetByName(SHEET_USERS.toLowerCase());
      if (uSheet) {
        const data = uSheet.getDataRange().getDisplayValues();
        for (let i = 1; i < data.length; i++) {
          const uid = data[i][0].toString().trim();
          if (uid) {
            result.users[uid] = { 
              avatar: data[i][3] || "",
              school: data[i][1] || "",
              grade: data[i][5] || "",
              classGroup: data[i][6] || ""
            };
          }
        }
      }
      return createJSONResponse({ status: "success", data: result });
    }

    // 1. 상세 상태 확인
    if (action === 'checkUserStatus') {
      const { user_id, week } = params;
      const weekNum = parseInt(week);
      
      let sheetStatus = "not_found", fileUrl = "", fileName = "";
      const pSheet = ss.getSheetByName(SHEET_PROGRESS);
      if (pSheet) {
        const pRows = pSheet.getDataRange().getValues();
        for (let i = 1; i < pRows.length; i++) {
          if (pRows[i][0].toString().trim() === user_id.toString().trim()) {
            const val = pRows[i][weekNum];
            if (val === true || val === "TRUE") sheetStatus = "verified";
            fileUrl = pRows[i][weekNum + 8] || ""; 
            break;
          }
        }
      }

      const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
      const file = findFileBySubfolders(folder, user_id, week);
      if (file) {
        fileName = file.getName();
        if (sheetStatus === "not_found") sheetStatus = "verified"; 
        if (!fileUrl) fileUrl = file.getDownloadUrl();
      }

      let feedback = "";
      const fSheet = ss.getSheetByName(SHEET_WEEKLY_FEEDBACKS);
      if (fSheet) {
        const fRows = fSheet.getDataRange().getDisplayValues();
        const weekStr = week.toString();
        for (let i = 1; i < fRows.length; i++) {
          if (fRows[i][0].toString().trim() === user_id.toString().trim() && 
              fRows[i][1].toString().trim() === weekStr) {
            feedback = fRows[i][2] || "";
            break;
          }
        }
      }

      if (!feedback) {
        const uSheet = ss.getSheetByName(SHEET_USERS) || ss.getSheetByName(SHEET_USERS.toLowerCase());
        if (uSheet) {
          const uRows = uSheet.getDataRange().getDisplayValues();
          for (let i = 1; i < uRows.length; i++) { 
            if (uRows[i][0].toString().trim() === user_id.toString().trim()) { 
              feedback = uRows[i][7] || ""; 
              break; 
            } 
          }
        }
      }

      return createJSONResponse({ 
        status: "success", 
        data: { 
          submissionStatus: sheetStatus, 
          fileName: fileName || (fileUrl ? "과제제출완료" : ""), 
          feedback: feedback, 
          fileUrl: fileUrl 
        } 
      });
    }

    // 2. 전체 학생 목록
    if (action === 'getStudentList') {
      const uSheet = ss.getSheetByName(SHEET_USERS) || ss.getSheetByName(SHEET_USERS.toLowerCase());
      if (!uSheet) return createJSONResponse({ status: "error" });
      const rows = uSheet.getDataRange().getDisplayValues();
      let list = [];
      for (let i = 1; i < rows.length; i++) {
        list.push({ 
          name: rows[i][0], 
          school: rows[i][1], 
          grade: rows[i][5] || "", 
          class: rows[i][6] || "", 
          feedback: rows[i][7] || "" 
        });
      }
      return createJSONResponse({ status: "success", data: list });
    }

    // 3. 전체 진도 조회
    if (action === 'getProgress') {
      const { user_id } = params;
      const pSheet = ss.getSheetByName(SHEET_PROGRESS);
      let userData = { mbti_week1: false, mbti_week2: false, mbti_week3: false, mbti_week4: false, pose_week1: false, pose_week2: false, pose_week3: false, pose_week4: false };
      
      if (pSheet) {
        const rows = pSheet.getDataRange().getValues();
        let foundRow = -1;
        for (let i = 1; i < rows.length; i++) { if (rows[i][0] === user_id) { foundRow = i; break; } }
        if (foundRow !== -1) {
          const r = rows[foundRow];
          userData = {
            mbti_week1: !!r[1], mbti_week2: !!r[2], mbti_week3: !!r[3], mbti_week4: !!r[4],
            pose_week1: !!r[5], pose_week2: !!r[6], pose_week3: !!r[7], pose_week4: !!r[8]
          };
        }
      }
      return createJSONResponse({ status: "success", data: userData });
    }

    // 4. 강의 콘텐츠 조회
    if (action === 'getCourseContent') {
      const guessName = SHEET_COURSE_CONTENTS.toLowerCase();
      let cSheet = ss.getSheetByName(SHEET_COURSE_CONTENTS);
      if (!cSheet) {
        const sheets = ss.getSheets();
        for (let s = 0; s < sheets.length; s++) {
          const sName = sheets[s].getName().toLowerCase();
          if (sName.includes("course") && sName.includes("content")) {
            cSheet = sheets[s];
            break;
          }
        }
      }
      
      if (!cSheet) return createJSONResponse({ content: "", version: "v3_final", error: "Sheet not found" });
      
      const rows = cSheet.getDataRange().getValues();
      const targetTrack = params.track.toString().replace(/\s/g, "").toUpperCase();
      const targetWeek = Number(params.week);
      
      for (let i = 1; i < rows.length; i++) {
        const rowTrack = rows[i][0].toString().replace(/\s/g, "").toUpperCase();
        const rowWeek = Number(rows[i][1]);
        if (rowTrack === targetTrack && rowWeek === targetWeek) {
          return createJSONResponse({ status: "success", content: rows[i][2], version: "v3_final" });
        }
      }
      return createJSONResponse({ content: "", version: "v3_final", message: "No match found" });
    }

    // 5. 정답 코드 조회 
    if (action === 'getReferenceCode') {
      const { week } = params;
      const content = getReferenceCode(week); 
      return createJSONResponse({ status: "success", content: content });
    }

    return createJSONResponse({ error: "Invalid Action" });
  } catch (err) { return createJSONResponse({ error: err.toString() }); }
}

// 정답 코드 조회 로직
function getReferenceCode(week) {
  try {
    const folder = DriveApp.getFolderById(REFERENCE_FOLDER_ID);
    const file = findFileBySubfolders(folder, "", week, true);
    if (file) {
      const mime = file.getMimeType();
      if (mime === "application/vnd.google-apps.document") {
        return DocumentApp.openById(file.getId()).getBody().getText();
      } 
      return file.getBlob().getDataAsString();
    }
    return "";
  } catch (err) {
    Logger.log("Reference Code Error: " + err.toString());
    return "";
  }
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

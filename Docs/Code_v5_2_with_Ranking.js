/* ==============================================================
   AI 연구소 통합 백엔드 API V5.2_Ranking_Merged (랭킹 시스템 추가 버전)
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
            data: { name: rows[i][0], school: rows[i][1], password: rows[i][2], avatar: rows[i][3], grade: rows[i][5], classGroup: rows[i][6], feedback: rows[i][7] || "" } 
          });
        }
      }
      return createJSONResponse({ status: "error", message: "User not found" });
    }

    // 1. 전체 학생 및 진도 랭킹 데이터 조회 (NEW)
    if (action === 'getRankingData') {
      const uSheet = ss.getSheetByName(SHEET_USERS) || ss.getSheetByName(SHEET_USERS.toLowerCase());
      const pSheet = ss.getSheetByName(SHEET_PROGRESS);
      
      if (!uSheet) return createJSONResponse({ error: "User sheet not found" });
      
      const uRows = uSheet.getDataRange().getDisplayValues();
      const pRows = pSheet ? pSheet.getDataRange().getValues() : [];
      
      // 진도 데이터 맵 생성
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
        
        // 점수 계산 (제출 1건당 10점)
        let totalPoints = 0;
        const allProgress = [...p.mbti, ...p.pose];
        allProgress.forEach(status => {
          if (status === true || status === "TRUE") totalPoints += 10;
        });
        
        rankingList.push({
          name: uid,
          avatar: uRows[i][3] || "",
          grade: uRows[i][5] || "",
          classGroup: uRows[i][6] || "",
          points: totalPoints,
          mbtiProgress: p.mbti,
          poseProgress: p.pose
        });
      }
      
      // 점수 높은 순으로 정렬 (동점 시 이름 가나다순)
      rankingList.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return a.name.localeCompare(b.name);
      });
      
      return createJSONResponse({ status: "success", data: rankingList });
    }

    // 기존 액션들 (getProgress 등) 유지
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

    // getStudentList 유지
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

    return createJSONResponse({ error: "Invalid Action" });
  } catch (err) { return createJSONResponse({ error: err.toString() }); }
}

// 📂 폴더 생성 및 반환 함수
function getOrCreateSubFolder(parentFolder, folderName) {
  const folderNameNFC = folderName.normalize("NFC");
  const subFolders = parentFolder.getFoldersByName(folderNameNFC);
  if (subFolders.hasNext()) return subFolders.next();
  return parentFolder.createFolder(folderNameNFC);
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

/* ==============================================================
   AI 연구소 통합 백엔드 API V5.6_Final_Perfect_Merged
   (로그인 + 하이브리드 정답 + 강의실 + 쇼케이스 라이브 프리뷰)
   ============================================================== */

const SHEET_USERS = "Users"; 
const SHEET_PROGRESS = "Progress";
const SHEET_COURSE_CONTENTS = "CourseContents"; 
const SHEET_REFERENCE_CODES = "ReferenceCodes";
const SHEET_MBTI_QUESTIONS = "Questions";
const SHEET_MBTI_RESULTS = "Results";
const SHEET_SHOWCASE_LINKS = "ShowcaseLinks"; 
const SHEET_WEEKLY_FEEDBACKS = "WeeklyFeeds";

// 🚨 [필수 확인] 사용자님의 원래 폴더 ID입니다!
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

    // 2. 과제 업로드
    if (action === 'uploadHomework') {
      const { user_id, course_type, week, grade_class, file_name, file_base64, mime_type } = data;
      try {
        const rootFolder = DriveApp.getFolderById(TARGET_FOLDER_ID);
        const weekNum = Number(week);
        const weekFolderName = (course_type && course_type.toUpperCase() === 'POSE') ? `POSE_Week${weekNum}` : (week.toString() + "주차");
        const weekFolder = getOrCreateSubFolder(rootFolder, weekFolderName.normalize("NFC"));
        
        // [수정] 방안 B: 해당 주차 폴더 전체에서 이 학생의 기존 파일 검색 및 삭제
        // 파일명에 닉네임이 포함된 모든 파일을 찾아 휴지통으로 보냅니다.
        const searchQuery = "title contains '" + weekFolderName + "' and title contains '" + user_id + "'";
        const oldFiles = weekFolder.searchFiles(searchQuery);
        while (oldFiles.hasNext()) {
          const oldFile = oldFiles.next();
          try { oldFile.setTrashed(true); } catch(e) { console.error("Error trashing file: " + e); }
        }

        const classFolder = getOrCreateSubFolder(weekFolder, (grade_class || "기타").toString().normalize("NFC"));
        
        // 새 파일 생성
        const file = classFolder.createFile(Utilities.newBlob(Utilities.base64Decode(file_base64), mime_type || MimeType.PLAIN_TEXT, file_name));
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        updateUserProgress(user_id, course_type, weekNum, true, file.getDownloadUrl());
        return createJSONResponse({ status: "success", fileUrl: file.getDownloadUrl() });
      } catch (err) { return createJSONResponse({ status: "error", message: err.toString() }); }
    }

    // 3. 강의 콘텐츠 저장
    if (action === 'saveCourseContent') {
      const { track, week, content } = data;
      let cSheet = ss.getSheetByName(SHEET_COURSE_CONTENTS) || ss.insertSheet(SHEET_COURSE_CONTENTS);
      const rows = cSheet.getDataRange().getValues();
      let foundRow = -1;
      const t = track.toString().trim().toUpperCase();
      const w = Number(week);
      for (let i = 1; i < rows.length; i++) { if ((rows[i][0]||"").toString().toUpperCase() === t && Number(rows[i][1]) === w) { foundRow = i+1; break; } }
      if (foundRow !== -1) cSheet.getRange(foundRow, 3, 1, 2).setValues([[content, getKoreanTime()]]);
      else cSheet.appendRow([t, w, content, getKoreanTime()]);
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

    // 5. 쇼케이스 등록/수정/삭제
    if (['registerShowcaseLink','editShowcaseLink','deleteShowcaseLink','toggleShowcaseStatus'].includes(action)) {
      let sheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS) || ss.insertSheet(SHEET_SHOWCASE_LINKS);
      const { timestamp, author, title, description, url, password, type, status } = data;
      
      // 헤더 설정 (Status 열 추가됨)
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "Author", "Title", "Description", "URL", "Password", "Type", "Status"]);
      }

      if (action === 'registerShowcaseLink') { 
        sheet.appendRow([getKoreanTime(), author, title, description, url, password, type, "visible"]); 
        return createJSONResponse({status:"success"}); 
      }

      const rows = sheet.getDataRange().getValues();
      const displayRows = sheet.getDataRange().getDisplayValues(); // 💡 더 정확한 비교를 위해 DisplayValues 사용
      let foundRow = -1;
      
      for (let i = 1; i < displayRows.length; i++) { 
        if (displayRows[i][0].toString() === timestamp.toString()) { 
          foundRow = i+1; break; 
        } 
      }

      if (foundRow === -1) return createJSONResponse({error:"Not found"});

      // 관리자 강제 상태 변경인 경우 비밀번호 체크 생략 가능 (필요시 추가)
      if (action === 'toggleShowcaseStatus') {
        sheet.getRange(foundRow, 8).setValue(status);
        return createJSONResponse({status:"success"});
      }

      // 수정/삭제 시 비밀번호 확인
      if (rows[foundRow-1][5].toString() !== password.toString()) return createJSONResponse({error:"Invalid password"});
      
      if (action === 'editShowcaseLink') { 
        sheet.getRange(foundRow, 2, 1, 6).setValues([[author, title, description, url, password, type]]); 
      }
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

    // 2. 랭킹 데이터
    if (action === 'getRankingData') {
      const uSheet = ss.getSheetByName(SHEET_USERS);
      const pSheet = ss.getSheetByName(SHEET_PROGRESS);
      const uRows = uSheet.getDataRange().getValues();
      const pRows = pSheet ? pSheet.getDataRange().getValues() : [];
      const pMap = {};
      pRows.slice(1).forEach(r => { pMap[r[0]] = { mbti: [r[1],r[2],r[3],r[4]], pose: [r[5],r[6],r[7],r[8]] }; });
      const list = uRows.slice(1).map(r => {
        const uid = r[0]; const p = pMap[uid] || { mbti: [false,false,false,false], pose: [false,false,false,false] };
        let pts = 0; [...p.mbti, ...p.pose].forEach(s => { if (s === true || s === "TRUE") pts += 10; });
        return { name: uid, avatar: r[3], grade: r[5], classGroup: r[6], points: pts, mbtiProgress: p.mbti, poseProgress: p.pose };
      });
      return createJSONResponse({ status: "success", data: list.sort((a,b)=>b.points - a.points) });
    }

    // 3. 프리뷰용 드라이브 파일 Base64
    if (action === 'getDriveFileBase64') {
      try {
        const file = DriveApp.getFileById(e.parameter.fileId); const blob = file.getBlob();
        return createJSONResponse({ status: "success", data: Utilities.base64Encode(blob.getBytes()), mimeType: blob.getContentType(), name: file.getName() });
      } catch (err) { return createJSONResponse({ status: "error", message: "Error: " + err.toString() }); }
    }

    // 4. 유저 진도 조회
    if (action === 'getProgress') {
      const pSheet = ss.getSheetByName(SHEET_PROGRESS);
      let data = { mbti_week1:false, mbti_week2:false, mbti_week3:false, mbti_week4:false, pose_week1:false, pose_week2:false, pose_week3:false, pose_week4:false };
      if (pSheet) {
        const rows = pSheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === e.parameter.user_id) {
            data = {
              mbti_week1: !!rows[i][1], mbti_week2: !!rows[i][2], mbti_week3: !!rows[i][3], mbti_week4: !!rows[i][4],
              pose_week1: !!rows[i][5], pose_week2: !!rows[i][6], pose_week3: !!rows[i][7], pose_week4: !!rows[i][8],
              mbti_week1_url: rows[i][9], mbti_week2_url: rows[i][10], mbti_week3_url: rows[i][11], mbti_week4_url: rows[i][12],
              pose_week1_url: rows[i][13], pose_week2_url: rows[i][14], pose_week3_url: rows[i][15], pose_week4_url: rows[i][16]
            }; break;
          }
        }
      }
      return createJSONResponse({ status: "success", data: data });
    }

    // 5. 강의 콘텐츠 조회
    if (action === 'getCourseContent') {
      const { track, week } = e.parameter;
      const cSheet = ss.getSheetByName(SHEET_COURSE_CONTENTS);
      if (!cSheet) return createJSONResponse({ status: "success", content: "" });
      const rows = cSheet.getDataRange().getValues();
      const t = track.toString().toUpperCase(); const w = Number(week);
      for (let i = 1; i < rows.length; i++) { if ((rows[i][0]||"").toString().toUpperCase() === t && Number(rows[i][1]) === w) return createJSONResponse({ status: "success", content: rows[i][2] }); }
      return createJSONResponse({ status: "success", content: "" });
    }

    // [추가] 5.1 과제 제출 상세 상태 확인 (UploadHomework.tsx용)
    if (action === 'checkUserStatus') {
      const { user_id, week, course_type } = e.parameter;
      const pSheet = ss.getSheetByName(SHEET_PROGRESS);
      const uSheet = ss.getSheetByName(SHEET_USERS);
      const isPose = (course_type && course_type.toUpperCase() === 'POSE');
      let res = { submissionStatus: 'not_found', fileName: '', feedback: '' };
      
      if (pSheet) {
          const pRows = pSheet.getDataRange().getValues();
          const weekIdx = Number(week);
          const colUrl = isPose ? 12 + weekIdx : 8 + weekIdx; // MBTI: Week1=index 9 (J), POSE: Week1=index 13 (N) 
          // 💡 weekIdx가 1부터 시작하므로 Index 보정 (Week1 -> Index 9이면, 8 + 1)
          for (let i = 1; i < pRows.length; i++) {
              if (pRows[i][0] === user_id && pRows[i][colUrl]) {
                  res.submissionStatus = 'verified';
                  try {
                    const fileId = pRows[i][colUrl].match(/[-\w]{25,}/);
                    if (fileId) res.fileName = DriveApp.getFileById(fileId[0]).getName();
                  } catch(e) {}
                  break;
              }
          }
      }
      if (uSheet) {
          const uRows = uSheet.getDataRange().getDisplayValues();
          for (let i = 1; i < uRows.length; i++) {
              if (uRows[i][0] === user_id) { res.feedback = uRows[i][7] || ""; break; }
          }
      }
      return createJSONResponse({ status: "success", data: res });
    }

    // 6. 하이브리드 정답 코드 조회 (시트 + 드라이브)
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

    // 7. 쇼케이스 전체 데이터
    if (action === 'getAllMbtiData') {
      const showcaseSheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS);
      const userSheet = ss.getSheetByName(SHEET_USERS);
      let list = []; let uMap = {};
      
      if (showcaseSheet) {
        const fullRows = showcaseSheet.getDataRange().getValues();
        const displayRows = showcaseSheet.getDataRange().getDisplayValues(); // 💡 웹과 시트 간 Timestamp 일치를 위해 사용
        
        for (let i = 1; i < fullRows.length; i++) {
          list.push({
            timestamp: displayRows[i][0], // 문자열 형식으로 가져옴
            author: fullRows[i][1],
            title: fullRows[i][2],
            description: fullRows[i][3],
            url: fullRows[i][4],
            password: fullRows[i][5],
            type: fullRows[i][6],
            status: fullRows[i][7] || "visible" // 기본값 visible
          });
        }
      }
      
      if (userSheet) {
        userSheet.getDataRange().getValues().slice(1).forEach(r => { 
          uMap[r[0]] = { avatar:r[3], school:r[1], grade:r[5], classGroup:r[6] }; 
        });
      }
      return createJSONResponse({ status: "success", data: { showcase_links: list, users: uMap } });
    }

    // 8. 학생 관리 명단 조회
    if (action === 'getStudentList') {
        const rows = ss.getSheetByName(SHEET_USERS).getDataRange().getDisplayValues();
        return createJSONResponse({ status: "success", data: rows.slice(1).map(r => ({ name: r[0], school: r[1], grade: r[5], class: r[6], feedback: r[7] })) });
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

function updateUserProgress(uid, type, week, status, url) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_PROGRESS) || ss.insertSheet(SHEET_PROGRESS);
  const rows = sheet.getDataRange().getValues();
  let found = -1;
  for (let i = 1; i < rows.length; i++) { if (rows[i][0] === uid) { found = i + 1; break; } }
  let col = type.toUpperCase() === 'MBTI' ? 1 + week : 5 + week;
  let urlCol = type.toUpperCase() === 'MBTI' ? 9 + week : 13 + week;
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
  const target = (type === 'POSE' ? `POSE_Week${week}` : `${week}주차`).normalize("NFC");
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next(); const n = f.getName().normalize("NFC");
    if (n.includes(target) && (n.includes("정답") || n.includes("Reference"))) return f;
  }
  const subs = folder.getFolders();
  while (subs.hasNext()) { const found = findFileRecursive(subs.next(), week, type); if (found) return found; }
  return null;
}

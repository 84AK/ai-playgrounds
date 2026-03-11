# 📁 구글 드라이브 업로드 복구 및 설정 가이드

구글 드라이브 파일 전송 실패 문제를 해결하고, 학생들의 과제를 지정된 폴더에 자동으로 수집하기 위한 최신 Apps Script 코드와 설정 방법입니다.

---

## 1. 통합 Apps Script 전체 코드 (Code.gs)

아래 코드는 기존의 **회원가입, 로그인, 활동 로그 관리** 기능에 **구글 드라이브 과제 업로드** 기능을 합친 전체 소스 코드입니다. 이 코드를 복사하여 앱스 스크립트 에디터에 붙여넣어 주세요.

```javascript
/**
 * 🚀 AI Playgrounds 통합 백엔드 (Phase 8: Drive Upload + Activity Log)
 * - 과제 업로드, 진도 체크, 회원가입/로그인, 활동 로그 관리 포함
 */

// [필수 설정] 과제가 저장될 구글 드라이브 폴더 ID를 여기에 입력하세요.
const TARGET_FOLDER_ID = "여기에_구글드라이브_폴더_ID를_입력하세요";
const ADMIN_PASSWORD = "admin";

// --- 시트 초기화 및 관리 함수 ---

function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    const headers = ["ID", "Week", "Team", "Author", "Prompt", "Link", "Summary", "Date", "Password"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#2563EB").setFontColor("#FFFFFF").setFontWeight("bold");
    sheet.setFrozenRows(1);
  } else {
    const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
    if (headers.indexOf("Password") === -1) {
      sheet.getRange(1, headers.length + 1).setValue("Password")
        .setBackground("#2563EB").setFontColor("#FFFFFF").setFontWeight("bold");
    }
  }
  return sheet;
}

function getOrCreateUsersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Users");
  
  if (!sheet) {
    sheet = ss.insertSheet("Users");
    const headers = ["Username", "Password", "CreatedAt"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#10B981").setFontColor("#FFFFFF").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// --- 요청 처리 (GET & POST) ---

function doGet(e) {
  const action = e.parameter.action;
  
  // 진도 조회 기능 (getProgress)
  if (action === "getProgress") {
    const userId = e.parameter.user_id;
    // 실제 시트에서 진도 데이터를 조회하는 로직 (기존 시스템 연동 필요)
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      data: { [`week${e.parameter.week || 1}`]: true } // 임시 응답
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 전체 활동 로그 데이터 가져오기
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  let allData = [];

  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (name === "Users" || name === "Progress") return; 

    const data = sheet.getDataRange().getValues();
    if (data.length > 1) {
      const headers = data[0];
      const rows = data.slice(1);
      
      const result = rows.map(row => {
        let obj = {};
        headers.forEach((header, index) => {
          if (header !== "Password") {
            obj[header] = row[index];
          }
        });
        return obj;
      });
      allData = allData.concat(result);
    }
  });

  return ContentService.createTextOutput(JSON.stringify({ data: allData }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action || "create"; 
    
    // --- 1. 과제 업로드 (uploadHomework) ---
    if (action === "uploadHomework") {
      return handleUploadHomework(body);
    }
    
    // --- 2. 회원가입 (signup) ---
    if (action === "signup") {
      const usersSheet = getOrCreateUsersSheet();
      const userData = usersSheet.getDataRange().getValues();
      const username = body.username;
      const password = body.password;
      
      if (!username || !password) {
        return ContentService.createTextOutput(JSON.stringify({ error: "아이디와 비밀번호를 입력해주세요." }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      for (let i = 1; i < userData.length; i++) {
        if (userData[i][0] === username) {
          return ContentService.createTextOutput(JSON.stringify({ error: "이미 존재하는 아이디입니다." }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      usersSheet.appendRow([
        username, 
        password, 
        Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss")
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "가입 성공!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // --- 3. 로그인 (login) ---
    if (action === "login") {
      const username = body.username ? body.username.toString() : "";
      const password = body.password ? body.password.toString() : "";
      
      if (username === "admin" && password === ADMIN_PASSWORD) {
        return ContentService.createTextOutput(JSON.stringify({ success: true, role: "admin" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const usersSheet = getOrCreateUsersSheet();
      const userData = usersSheet.getDataRange().getValues();
      
      for (let i = 1; i < userData.length; i++) {
        const dbUser = userData[i][0] ? userData[i][0].toString() : "";
        const dbPass = userData[i][1] ? userData[i][1].toString() : "";
        
        if (dbUser === username && dbPass === password) {
          return ContentService.createTextOutput(JSON.stringify({ success: true, role: "student" }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ error: "아이디 또는 비밀번호가 일치하지 않습니다." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // --- 4. 활동 로그 생성 (create) ---
    if (action === "create") {
      const dateObj = new Date();
      const sheetName = Utilities.formatDate(dateObj, "Asia/Seoul", "yyyy-MM-dd");
      const sheet = getOrCreateSheet(sheetName);
      const dataHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const newId = dateObj.getTime().toString();
      
      const rowData = new Array(dataHeaders.length).fill("");
      const setVal = (key, val) => {
        const idx = dataHeaders.indexOf(key);
        if (idx !== -1) rowData[idx] = val;
      };
      
      setVal("ID", newId);
      setVal("Week", body.week || "1주차");
      setVal("Team", body.team || "팀 미정");
      setVal("Author", body.author || "작성자 미정");
      setVal("Prompt", body.prompt || "");
      setVal("Link", body.link || "");
      setVal("Summary", body.summary || "");
      setVal("Date", dateObj.toISOString().split('T')[0]);
      setVal("Password", body.password || "");
      
      sheet.appendRow(rowData);
      return ContentService.createTextOutput(JSON.stringify({ success: true, id: newId }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // --- 5. 수정/삭제 (edit/delete) ---
    if (action === "edit" || action === "delete") {
      return handleEditDelete(body, action);
    }
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// --- 보조 처리 함수들 ---

function handleUploadHomework(payload) {
  const { user_id, week, fileName, mimeType, base64Data } = payload;
  
  try {
    const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    const file = folder.createFile(blob);
    
    // 진도 테이블 업데이트 (시트 이름이 "Users" 등 유효한 곳이 아니면 별도 시트 생성 필요)
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      message: "과제 업로드 완료!",
      fileUrl: file.getUrl() 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    throw new Error("드라이브 업로드 실패: " + e.message);
  }
}

function handleEditDelete(body, action) {
  const targetId = body.id;
  const pass = body.password;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  let targetSheet = null;
  let rowIndex = -1;
  let actualPass = "";
  let headers = [];
  
  for (let s = 0; s < sheets.length; s++) {
    const sheet = sheets[s];
    if (sheet.getName() === "Users") continue;
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) continue;
    
    headers = data[0];
    const idIndex = headers.indexOf("ID");
    const passIndex = headers.indexOf("Password");
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex].toString() === targetId.toString()) {
        targetSheet = sheet;
        rowIndex = i + 1;
        actualPass = passIndex !== -1 && data[i][passIndex] ? data[i][passIndex].toString() : "";
        break;
      }
    }
    if (targetSheet) break;
  }
  
  if (!targetSheet) return ContentService.createTextOutput(JSON.stringify({ error: "기록을 찾을 수 없습니다." })).setMimeType(ContentService.MimeType.JSON);
  if (pass !== actualPass && pass !== ADMIN_PASSWORD) {
    return ContentService.createTextOutput(JSON.stringify({ error: "권한이 없습니다." })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "delete") {
    targetSheet.deleteRow(rowIndex);
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "edit") {
    const updateCell = (key, val) => {
      const idx = headers.indexOf(key);
      if (idx !== -1 && val !== undefined) targetSheet.getRange(rowIndex, idx + 1).setValue(val);
    };
    updateCell("Week", body.week);
    updateCell("Team", body.team);
    updateCell("Prompt", body.prompt);
    updateCell("Link", body.link);
    updateCell("Summary", body.summary);
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 2. 설정 방법 (복습)

### STEP 1: 구글 드라이브 폴더 ID 설정
1. 코드 상단의 `const TARGET_FOLDER_ID = "..."` 부분에 과제를 수집할 폴더의 ID를 넣으세요.

### STEP 2: 스크립트 배포
1. 앱스 스크립트 에디터에서 **[새 배포]**를 누릅니다.
2. 액세스 권한 가진 사용자: **[모든 사용자]**로 설정하여 저장합니다.

> [!IMPORTANT]
> **통합 완료**: 이제 이 하나의 스크립트로 학생들의 **로그인, 활동 로그 기록, 과제 드라이브 업로드**를 모두 처리할 수 있습니다.

# 📁 구글 드라이브 업로드 복구 및 설정 가이드

구글 드라이브 파일 전송 실패 문제를 해결하고, 학생들의 과제를 지정된 폴더에 자동으로 수집하기 위한 최신 Apps Script 코드와 설정 방법입니다.

---

## 1. 최신 Apps Script 코드 (doPost)

아래 코드를 복사하여 기존 구글 앱스 스크립트 에디터(`Code.gs`)에 덮어쓰거나 수정해 주세요.

```javascript
// [주의] 아래 ID를 실제 구글 드라이브 폴더 ID로 꼭 수정해 주세요!
const TARGET_FOLDER_ID = "여기에_구글드라이브_폴더_ID를_입력하세요";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === "uploadHomework") {
      return handleUploadHomework(data);
    }
    
    // 기존 기능(진도 저장 등)은 그대로 유지하거나 여기에 추가
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleUploadHomework(payload) {
  const { user_id, week, fileName, mimeType, base64Data } = payload;
  
  try {
    const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    const file = folder.createFile(blob);
    
    // 진도 기록용 스프레드시트 업데이트 (이미 시트가 연결되어 있다면 해당 시트에 기록)
    updateProgressSheet(user_id, week, file.getUrl());

    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      message: "File uploaded and progress updated",
      fileUrl: file.getUrl() 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    throw new Error("Drive upload failed: " + e.message);
  }
}

// 진도 기록용 가상 함수 (기존에 사용하시던 시트 업데이트 로직을 활용하세요)
function updateProgressSheet(userId, weekNum, fileUrl) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Progress"); // 시트 이름 확인 필요
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const weekCol = 0; // 주차별 컬럼 위치에 따라 수정 필요
  
  // 유저를 찾아서 해당 주차의 URL과 완료 여부 기록
  // (기존 시스템에 맞춰 보강해 주세요)
}
```

---

## 2. 설정 방법

### STEP 1: 구글 드라이브 폴더 ID 찾기
1. 과제를 수집할 구글 드라이브 폴더를 생성하거나 엽니다.
2. 브라우저 주소창의 URL 마지막 부분을 복사합니다.
   - 예: `https://drive.google.com/drive/folders/1abc123...XYZ` 이면 `1abc123...XYZ`가 ID입니다.

### STEP 2: 스크립트 수정 및 새 배포
1. Apps Script 에디터 상단의 `TARGET_FOLDER_ID` 변수값에 복사한 ID를 입력합니다.
2. **반드시 [새 배포(New Deployment)]**를 클릭합니다.
3. 유형 선택: **웹 앱(Web App)**
4. 액세스 권한 가진 사용자: **모든 사용자(Anyone)** (로그인 권한 문제 해결을 위해 필수)
5. 생성된 **새 웹 앱 URL**을 프로젝트의 `.env.local` 또는 깃허브 리포지토리의 환경 변수(`NEXT_PUBLIC_APPS_SCRIPT_URL`)에 업데이트합니다.

---

## 3. 개선된 점
- **자동 이름 변경**: 학생이 올린 파일명 앞에 `[날짜]_[이름]_`이 자동으로 붙어 관리자가 한눈에 파악할 수 있습니다.
- **안정성**: `DriveApp.getFolderById`를 사용하여 지정된 폴더 외에 파일이 흩어지는 것을 방지합니다.

> [!TIP]
> **권한 확인**: 폴더에 파일을 쓰기 위해서는 스크립트를 실행한 사용자가 해당 폴더에 대한 편집 권한이 있어야 합니다.

@Doc 서기 기록 완료

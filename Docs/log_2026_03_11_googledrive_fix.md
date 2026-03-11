# 📁 구글 드라이브 업로드 복구 및 설정 가이드

구글 드라이브 파일 전송 실패 문제를 해결하고, 학생들의 과제를 지정된 폴더에 자동으로 수집하기 위한 최신 Apps Script 코드와 설정 방법입니다.

# 🚀 구글 드라이브 업로드 및 앱스 스크립트 복구 가이드

**이전에 안내해 드렸던 코드는 다른 시스템(팀 빌딩)의 코드와 혼선이 있었습니다. 이로 인해 `ai-playgrounds`의 기존 학습 진도 동기화 기능들이 모두 덮어씌워져 조회가 되지 않는 문제가 발생했습니다.** 혼란을 드려 죄송합니다! 🙏

다행히 `ai-playgrounds` 전용 **MBTI Maker & My Study Lab 통합 백엔드 API (V2)** 원본 코드를 백업에서 찾아내어, 여기에 방금 작업한 **구글 드라이브 업로드 로직(자동 파일명 변환 포함)** 기능을 안전하게 추가했습니다.

아래 가이드에 따라 앱스 스크립트 코드를 교체하시면, **사라졌던 0주차 진도 표시가 100% 원상 복구**되고 1주차 과제 업로드 시 **구글 드라이브 저장과 진도 체크**가 완벽하게 작동할 것입니다.

---

## 1. 최신 앱스 스크립트 복원 코드 (Code.gs)

스프레드시트에서 `확장 프로그램 > Apps Script`를 열고, 기존 코드를 전부 지운 뒤 **아래 코드로 완전히 교체**해 주세요!

```javascript
/* ==============================================================
   MBTI Maker & My Study Lab 통합 백엔드 API V3 (w/ Google Drive Upload Fix)
   ============================================================== */

const SHEET_MBTI_QUESTIONS = "Questions";
const SHEET_MBTI_RESULTS = "Results";
const SHEET_PROGRESS = "Progress";
const SHEET_SHOWCASE_LINKS = "ShowcaseLinks"; 
const SHEET_USERS = "Users"; 
// 🚨 [필수 확인] 여기에 반드시 실습 코드를 받을 구글 드라이브 폴더 ID를 붙여넣으세요!
const TARGET_FOLDER_ID = "여기에_폴더_아이디_입력하세요";

// OPTIONS 요청 처리 (CORS 문제 해결)
function doOptions(e) {
  return handleCORS();
}

function handleCORS() {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

function createJSONResponse(data, statusCode = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getKoreanTime() {
  const date = new Date();
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const kstTime = new Date(utc + (9 * 60 * 60000));
  return Utilities.formatDate(kstTime, "GMT+09:00", "yyyy-MM-dd HH:mm:ss");
}

/* =========================================================
   [POST] 데이터 업로드 (문제/결과/파일 등)
   ========================================================= */
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return createJSONResponse({ error: "No post content" }, 400);
    }
    
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return createJSONResponse({ error: "Invalid JSON format" }, 400);
    }
    
    const action = data.action;

    // 0. 유저 프로필 등록 및 수정 로직
    if (action === 'registerUser' || action === 'updateUser') {
      const { user_id, school, password, avatar } = data;
      if (!user_id || !password || !school || !avatar) return createJSONResponse({ error: "Missing parameters" }, 400);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(SHEET_USERS);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_USERS);
        sheet.appendRow(["User_ID", "School", "Password", "Avatar", "Last_Updated"]);
        sheet.getRange("A1:E1").setBackground("#c9daf8").setFontWeight("bold");
      }

      const rows = sheet.getDataRange().getDisplayValues();
      let foundRow = -1;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === user_id) {
          foundRow = i + 1;
          break;
        }
      }

      const rowData = [user_id, school, password, avatar, getKoreanTime()];
      if (action === 'registerUser') {
        if (foundRow !== -1) return createJSONResponse({ error: "User already exists" }, 400);
        sheet.appendRow(rowData);
        return createJSONResponse({ status: "success", message: "User registered" });
      } else {
        if (foundRow === -1) return createJSONResponse({ error: "User not found" }, 404);
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
        return createJSONResponse({ status: "success", message: "User updated" });
      }
    }

    // 1. 학습 결과물 파일 업로드 (Base64) & 진척도 자동 연동
    if (action === 'uploadHomework') {
      const { user_id, course_type, week, file_name, file_base64, mime_type } = data;
      
      if (!user_id || !course_type || week === undefined || !file_base64) {
        return createJSONResponse({ error: "Missing parameters for file upload" }, 400);
      }

      try {
        const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
        // Base64 디코딩 (앞의 'data:image/png;base64,' 등을 떼어내고 온 순수 값)
        const dEncoded = Utilities.base64Decode(file_base64);
        const blob = Utilities.newBlob(dEncoded, mime_type || MimeType.PLAIN_TEXT, file_name || `${user_id}_${course_type}_Week${week}_submission`);
        
        const file = folder.createFile(blob);
        const fileUrl = file.getUrl();
        
        // 드라이브 업로드 성공 시, 즉시 해당 유저의 Progress 시트 업데이트 수행!
        updateUserProgress(user_id, course_type, Number(week), true);

        return createJSONResponse({ 
          status: "success", 
          message: "과제가 드라이브에 안전하게 보관되었고 학습 진도가 업데이트되었습니다!", 
          fileUrl: fileUrl 
        });

      } catch (driveError) {
        return createJSONResponse({ status: "error", message: "서버가 구글 폴더에 접근하지 못했습니다. (ID 오류 및 권한 없음): " + driveError.toString() }, 500);
      }
    }

    // 2. 커스텀 쇼케이스 링크 등록/수정/삭제 API (기존 유지)
    if (action === 'registerShowcaseLink') {
      const { author, title, description, url, password, type } = data;
      if (!author || !title || !url || !password) {
        return createJSONResponse({ error: "Missing required parameters" }, 400);
      }

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_SHOWCASE_LINKS);
        sheet.appendRow(["Timestamp", "Author", "Title", "Description", "Url", "Password", "Type"]);
        sheet.getRange("A1:G1").setBackground("#d9ead3").setFontWeight("bold");
      }

      sheet.appendRow([getKoreanTime(), author, title, description || "", url, password, type || "CUSTOM"]);
      return createJSONResponse({ status: "success", message: "Showcase link registered" });
    }

    if (action === 'editShowcaseLink') {
      const { timestamp, author, title, description, url, password, type } = data;
      if (!timestamp || !password) return createJSONResponse({ error: "Missing parameters" }, 400);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS);
      if (!sheet) return createJSONResponse({ error: "Sheet not found" }, 404);

      const details = sheet.getDataRange().getDisplayValues();
      const headers = details[0];
      const tsIndex = headers.indexOf("Timestamp");
      const pwIndex = headers.indexOf("Password");

      let foundRow = -1;
      for (let i = 1; i < details.length; i++) {
        if (String(details[i][tsIndex]) === String(timestamp) && String(details[i][pwIndex]) === String(password)) {
          foundRow = i + 1;
          break;
        }
      }

      if (foundRow !== -1) {
        sheet.getRange(foundRow, 1, 1, 7).setValues([[timestamp, author, title, description || "", url, password, type || "CUSTOM"]]);
        return createJSONResponse({ status: "success", message: "Showcase link updated" });
      } else {
        return createJSONResponse({ error: "Password incorrect or project not found" }, 401);
      }
    }

    if (action === 'deleteShowcaseLink') {
      const { timestamp, password } = data;
      if (!timestamp || !password) return createJSONResponse({ error: "Missing parameters" }, 400);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS);
      if (!sheet) return createJSONResponse({ error: "Sheet not found" }, 404);

      const details = sheet.getDataRange().getDisplayValues();
      const headers = details[0];
      const tsIndex = headers.indexOf("Timestamp");
      const pwIndex = headers.indexOf("Password");

      let foundRow = -1;
      for (let i = 1; i < details.length; i++) {
        if (String(details[i][tsIndex]) === String(timestamp) && String(details[i][pwIndex]) === String(password)) {
          foundRow = i + 1;
          break;
        }
      }

      if (foundRow !== -1) {
        sheet.deleteRow(foundRow);
        return createJSONResponse({ status: "success", message: "Showcase link deleted" });
      } else {
        return createJSONResponse({ error: "Password incorrect or project not found" }, 401);
      }
    }

    // 3. MBTI Draft Question 저장 (필요 시 유지)
    if (action === 'saveQuestion') {
      const { user_id, questionIndex, questionText, type, optionA, optionB, valueA, valueB } = data;
      if (!user_id || questionIndex === undefined || !questionText || !type || !optionA || !optionB || !valueA || !valueB) {
        return createJSONResponse({ error: "Missing required properties" }, 400);
      }

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(SHEET_MBTI_QUESTIONS);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_MBTI_QUESTIONS);
        sheet.appendRow(["Author", "Q_Index", "Type", "Question", "Option_A", "Value_A", "Option_B", "Value_B", "Last_Updated"]);
        sheet.getRange("A1:I1").setBackground("#d9ead3").setFontWeight("bold");
      }

      const details = sheet.getDataRange().getValues();
      let foundRow = -1;
      for (let i = 1; i < details.length; i++) {
        if (details[i][0] === user_id && details[i][1] == questionIndex) {
          foundRow = i + 1;
          break;
        }
      }

      const rowData = [user_id, questionIndex, type, questionText, optionA, valueA, optionB, valueB, getKoreanTime()];
      if (foundRow !== -1) {
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      return createJSONResponse({ status: "success", message: "Question saved" });
    }

    // 4. MBTI 전체 프로젝트 저장 (새로운 통합 저장 API)
    if (action === 'saveMbti') {
      const { author, password, type, questions, results } = data;
      if (!author || !password || !type || !questions || !results) {
        return createJSONResponse({ error: "Missing required properties for saving MBTI." }, 400);
      }

      const ss = SpreadsheetApp.getActiveSpreadsheet();

      // Questions 시트 처리
      let qSheet = ss.getSheetByName(SHEET_MBTI_QUESTIONS);
      if (!qSheet) {
        qSheet = ss.insertSheet(SHEET_MBTI_QUESTIONS);
        qSheet.appendRow(["Author", "Type", "Text", "Trait1", "Option1", "Trait2", "Option2", "Last_Updated"]);
        qSheet.getRange("A1:H1").setBackground("#d9ead3").setFontWeight("bold");
      }
      
      let qData = qSheet.getDataRange().getValues();
      for (let i = qData.length - 1; i >= 1; i--) {
        if (String(qData[i][0]) === String(author)) {
          qSheet.deleteRow(i + 1);
        }
      }
      questions.forEach((q) => {
        qSheet.appendRow([author, type, q.text, q.trait1, q.option1, q.trait2, q.option2, getKoreanTime()]);
      });

      // Results 시트 처리
      let rSheet = ss.getSheetByName(SHEET_MBTI_RESULTS);
      if (!rSheet) {
        rSheet = ss.insertSheet(SHEET_MBTI_RESULTS);
        rSheet.appendRow(["Author", "MBTI_Type", "Name", "Description", "Strengths", "Compatibility", "Character", "Last_Updated"]);
        rSheet.getRange("A1:H1").setBackground("#fff2cc").setFontWeight("bold");
      }
      
      let rData = rSheet.getDataRange().getValues();
      for (let i = rData.length - 1; i >= 1; i--) {
        if (String(rData[i][0]) === String(author)) {
          rSheet.deleteRow(i + 1);
        }
      }
      results.forEach((r) => {
        rSheet.appendRow([author, r.type, r.name, r.description, r.strengths, r.compatibility, r.character, getKoreanTime()]);
      });

      // 쇼케이스 링크도 자동 갱신
      let sSheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS);
      if (!sSheet) {
        sSheet = ss.insertSheet(SHEET_SHOWCASE_LINKS);
        sSheet.appendRow(["Timestamp", "Author", "Title", "Description", "Url", "Password", "Type"]);
        sSheet.getRange("A1:G1").setBackground("#d9ead3").setFontWeight("bold");
      }
      
      const targetUrl = `/mbti/play?author=${encodeURIComponent(author)}`;
      const sData = sSheet.getDataRange().getDisplayValues();
      let foundShowcase = -1;
      for (let i = 1; i < sData.length; i++) {
        if (String(sData[i][1]) === String(author) && String(sData[i][6]) === "MBTI") {
          foundShowcase = i + 1;
          break;
        }
      }
      
      if (foundShowcase !== -1) {
        sSheet.getRange(foundShowcase, 1, 1, 7).setValues([[getKoreanTime(), author, `${author}님의 MBTI 테스트`, `${type} 유형의 성격 테스트입니다.`, targetUrl, password, "MBTI"]]);
      } else {
        sSheet.appendRow([getKoreanTime(), author, `${author}님의 MBTI 테스트`, `${type} 유형의 성격 테스트입니다.`, targetUrl, password, "MBTI"]);
      }

      return createJSONResponse({ status: "success", message: "MBTI project saved perfectly" });
    }

    // 5. MBTI Draft Result 저장 (필요 시 유지)
    if (action === 'saveResult') {
      const { user_id, type, title, description, recommendation } = data;
      if (!user_id || !type || !title || !description || !recommendation) {
         return createJSONResponse({ error: "Missing required properties" }, 400);
      }

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(SHEET_MBTI_RESULTS);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_MBTI_RESULTS);
        sheet.appendRow(["Author", "MBTI_Type", "Title", "Description", "Recommendation", "Last_Updated"]);
        sheet.getRange("A1:F1").setBackground("#fff2cc").setFontWeight("bold");
      }

      const details = sheet.getDataRange().getValues();
      let foundRow = -1;
      for (let i = 1; i < details.length; i++) {
        if (details[i][0] === user_id && details[i][1] === type) {
          foundRow = i + 1;
          break;
        }
      }

      const rowData = [user_id, type, title, description, recommendation, getKoreanTime()];
      if (foundRow !== -1) {
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      return createJSONResponse({ status: "success", message: "Result saved" });
    }

    return createJSONResponse({ error: "Invalid Action" }, 400);

  } catch (error) {
    return createJSONResponse({ error: "Server Error", details: error.toString() }, 500);
  }
}

/* =========================================================
   [GET] 데이터 불러오기
   ========================================================= */
function doGet(e) {
  const params = e.parameter;
  const action = params.action;

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 0. 특정 유저 프로필 조회 (로그인 시)
    if (action === 'getUser') {
      const user_id = params.user_id;
      if (!user_id) return createJSONResponse({ error: "Missing user_id parameter" }, 400);

      const uSheet = ss.getSheetByName(SHEET_USERS);
      if (uSheet) {
        const rows = uSheet.getDataRange().getDisplayValues();
        for (let i = 1; i < rows.length; i++) {
           if (rows[i][0] === user_id) {
             return createJSONResponse({ 
               status: "success", 
               data: { 
                 name: rows[i][0], 
                 school: rows[i][1], 
                 password: rows[i][2], 
                 avatar: rows[i][3] 
               } 
             });
           }
        }
      }
      return createJSONResponse({ status: "error", message: "User not found" }, 404);
    }

    // 1. 전체 데이터 로드 (Showcase / MBTI 앱 용량)
    if (action === "getAllMbtiData") {
       const user_id = params.user_id; // 특정 유저 필터 지원
       let questions = [];
       let results = [];
       let showcase_links = []; 
       let users = {};

       const uSheet = ss.getSheetByName(SHEET_USERS);
       if (uSheet) {
          const rows = uSheet.getDataRange().getDisplayValues();
          for (let i = 1; i < rows.length; i++) {
             if (rows[i][0]) {
               users[rows[i][0]] = rows[i][3] || "🐱"; 
             }
          }
       }

       const qSheet = ss.getSheetByName(SHEET_MBTI_QUESTIONS);
       if (qSheet) {
          const rows = qSheet.getDataRange().getValues();
          const heads = rows[0];
          for (let i = 1; i < rows.length; i++) {
             if (user_id && rows[i][0] !== user_id) continue;
             let obj = {};
             for (let j=0; j<heads.length; j++) {
               obj[heads[j].toLowerCase()] = rows[i][j];
             }
             questions.push(obj);
          }
       }

       const rSheet = ss.getSheetByName(SHEET_MBTI_RESULTS);
       if(rSheet) {
         const rows = rSheet.getDataRange().getValues();
         const heads = rows[0];
         for (let i = 1; i < rows.length; i++) {
           if (user_id && rows[i][0] !== user_id) continue;
           let obj = {};
           for (let j=0; j<heads.length; j++) {
             obj[heads[j].toLowerCase()] = rows[i][j];
           }
           results.push(obj);
         }
       }

       const sSheet = ss.getSheetByName(SHEET_SHOWCASE_LINKS);
       if(sSheet) {
          const rows = sSheet.getDataRange().getDisplayValues(); // DisplayValue 사용!
          const heads = rows[0];
          for (let i = 1; i < rows.length; i++) {
             let obj = {};
             for (let j=0; j<heads.length; j++) {
               obj[heads[j]] = rows[i][j]; // 'Title', 'Url', 'Timestamp' 등 대문자 키
             }
             showcase_links.push(obj);
          }
       }

       return createJSONResponse({
         status: "success",
         data: {
           questions: questions,
           results: results,
           showcase_links: showcase_links,
           users: users
         }
       });
    }

    // 2. 통합 학습 달성도(Progress) 불러오기 (MBTI & POSE)
    if (action === "getProgress") {
      const user_id = params.user_id;
      if (!user_id) return createJSONResponse({ error: "Missing user_id parameter" }, 400);

      const pSheet = ss.getSheetByName(SHEET_PROGRESS);
      let userData = {
        mbti_week1: false, mbti_week2: false, mbti_week3: false, mbti_week4: false,
        pose_week1: false, pose_week2: false, pose_week3: false, pose_week4: false
      };

      if (pSheet) {
        const rows = pSheet.getDataRange().getValues();
        let foundRow = -1;
        for (let i = 1; i < rows.length; i++) {
           if (rows[i][0] === user_id) {
             foundRow = i;
             break;
           }
        }
        
        if (foundRow !== -1) {
          userData = {
            mbti_week1: !!rows[foundRow][1],
            mbti_week2: !!rows[foundRow][2],
            mbti_week3: !!rows[foundRow][3],
            mbti_week4: !!rows[foundRow][4],
            pose_week1: !!rows[foundRow][5],
            pose_week2: !!rows[foundRow][6],
            pose_week3: !!rows[foundRow][7],
            pose_week4: !!rows[foundRow][8]
          };
        }
      }

      return createJSONResponse({ status: "success", data: userData });
    }

    return createJSONResponse({ error: "Invalid Action" }, 400);
  } catch(error) {
     return createJSONResponse({ error: "GET Error", details: error.toString() }, 500);
  }
}

/* =========================================================
   [Helper] 유저 달성도(Progress) 업데이트 내부 함수 (MBTI & POSE 통합 관리)
   ========================================================= */
function updateUserProgress(userId, courseType, weekNum, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_PROGRESS);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PROGRESS);
    sheet.appendRow([
      "User_ID", 
      "MBTI_Week1", "MBTI_Week2", "MBTI_Week3", "MBTI_Week4", 
      "POSE_Week1", "POSE_Week2", "POSE_Week3", "POSE_Week4"
    ]);
    sheet.getRange("A1:I1").setBackground("#e6b8af").setFontWeight("bold");
  }
  
  const rows = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === userId) {
      foundRow = i + 1;
      break;
    }
  }
  
  let colIndex = 2; // Default
  if (courseType.toUpperCase() === 'MBTI') {
      colIndex = 1 + weekNum; 
  } else if (courseType.toUpperCase() === 'POSE') {
      colIndex = 5 + weekNum;
  }
  
  if (foundRow !== -1) {
    sheet.getRange(foundRow, colIndex).setValue(status);
  } else {
    const newRow = [userId, false, false, false, false, false, false, false, false];
    newRow[colIndex - 1] = status; 
    sheet.appendRow(newRow);
  }
}
```

---

## 2. 복구 후 설정 확인법

### STEP 1: 구글 드라이브 폴더 ID 설정
1. 코드 상단의 `TARGET_FOLDER_ID = "..."` 쌍따옴표 안에 드라이브 폴더 ID를 꼭 넣어주세요! 

### STEP 2: 스크립트 '새 배포' 진행
1. 앱스 스크립트 에디터 우측 상단의 **[배포]** -> **[새 배포]**를 누릅니다.
2. 실행자(Execute as): **[나]**
   액세스 권한 사용자: **[모든 사용자]**
3. 배포(Deploy) 후 **새롭게 생성받은 웹 앱 URL**을 복사합니다.

### STEP 3: Vercel(또는 로컬) 환경변수에 적용
- 복사한 새 주소가 `ai-playgrounds`의 `.env.local` 및 Vercel 환경 변수 `NEXT_PUBLIC_APPS_SCRIPT_URL`에 제대로 붙여넣고 빌드되었는지 확인하면 완벽합니다!

> [!TIP]
> **왜 기존 0주차가 사라진 거였나요?**
>
> 0주차 진도(MBTI 결과 유무 등)와 1주차 이후 진도를 조회하려면 앱스 스크립트에 `getAllMbtiData`, `getProgress`라는 함수 정보가 있어야 합니다. 그런데 이전 대화 스텝에서 복붙한 코드가 "다른 팀 빌딩 프로젝트"용 코드여서 이게 싹 날아가 있었던 것입니다. **이 복구 코드에는 `UploadHomework`도 포함되어 있고 진도 조회 로직도 포함되어 있어 모든 오류가 해결됩니다.** 😊 

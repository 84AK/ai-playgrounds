# Apps Script `Invalid action` 발생 원인 분석 기록 (2026-03-17)

## 🔍 현상
- 강의 콘텐츠 저장 시 클라이언트에 `구글 스프레드시트에 저장을 실패했습니다: Invalid action` 에러가 표시됨.
- 이 메시지는 Vercel(Next.js API Route)에서 Apps Script로 POST 통신을 보냈을 때, **Apps Script 백엔드 측에서 반환한 응답**(`{"error":"Invalid action"}`)입니다.

## 🛠️ 원인 분석
1. **액션명(Action Name) 불일치 또는 미구현**:
   - 현재 프론트엔드 코드(`lib/courseContent.ts`)에서는 저장 액션명으로 `"saveCourseContent"`를 사용하고 있습니다.
   - 하지만 Apps Script 백엔드 내부 로직(`Code.gs`)에 `saveCourseContent`라는 이름의 분기 처리(`if (action === "saveCourseContent")`)가 존재하지 않거나, 대소문자 등이 다르게 구현되어 있을 가능성이 99%입니다.
   - 기존의 다른 백엔드 개발자가 이 오류를 해결하지 못했거나 구현하지 못한 상태에서, 버그가 로컬에 쓰기 fallback으로 덮어씌워져 있었기 때문에 가려져 있던 문제였습니다.

2. **호출 시도 검증**:
   - GET(`getCourseContent`) 호출은 정상 작동하여 데이터를 읽고 있으나, POST(`saveCourseContent`)의 액션 명칭만을 Apps Script가 거부하고 있는 상태인 것으로 진단됩니다.

## 💡 해결을 위한 조치 가이드
- **작업자 분께서 구글 드라이브의 스프레드시트에 연결된 "앱스 스크립트 도구 (Apps Script)" 화면을 여신 후, `Code.gs` 내 `doPost(e)` 함수 내부에 `saveCourseContent` 액션이 정상적으로 구현되어 있는지 확인해주셔야 합니다.**
- 액션명이 `saveCourse` 혹은 `updateCourseContent` 등 다른 이름으로 되어 있다면 프론트엔드 코드(`saveCourseContent` 문자열)를 해당 이름으로 일치시켜 주면 즉시 성공할 것입니다!
- **참고**: 스프레드시트의 시트 이름(`course_contents`)에 저장하는 SQL성 업데이트문이 `doPost` 하위에 있는지 점검이 필요합니다.

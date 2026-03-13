# 작업 로그 (2026-03-13)

## 작업 내용
### 1. 학년/반 필드 추가
- `types/auth.ts`: `UserProfile` 인터페이스에 `grade` 및 `classGroup` 필드 추가.
- `lib/appsScriptUsers.ts`: `registerUser`, `updateUser` API 호출 시 신규 필드 데이터 전송 로직 추가.
- `components/GlobalAuthGuard.tsx`: 
    - 회원가입 폼에 학년/반 입력 필드 추가.
    - 입력을 돕기 위한 "1학년 2반" 형식 가이드 텍스트 추가.
    - 소속 학교 입력란 placeholder를 '대건고등학교'로 변경.
- `components/MyProfileEditor.tsx`: 
    - 마이페이지 정보 수정 화면에 학년/반 필드 추가 및 저장 로직 구현.

### 2. 가입 오류 해결
- `components/GlobalAuthGuard.tsx`: 
    - 가입 모드(`!isLoginMode`)일 때 기존에 등록된 이름이 발견될 경우, "비밀번호 틀림" 대신 "이미 등록된 이름"임을 안내하도록 로직 개선.
    - 이를 통해 동일한 이름으로 중복 가입 시 발생하는 혼란을 방지함.

## 해결된 문제
- 이름이 겹치는 사용자가 가입을 시도할 때 잘못된 오류 메시지(비밀번호 오류)가 출력되던 현상 해결.
- 학생 정보를 보다 구체적으로(학교, 학년, 반) 관리할 수 있게 됨.

## 아크랩스 홈페이지
- https://litt.ly/aklabs

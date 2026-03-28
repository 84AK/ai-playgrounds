# 2026-03-28 쇼케이스 백엔드(GAS) 복구 및 강화 작업 로그 (Doc / Scribe)

## 1. 개요
프론트엔드 작업 후 쇼케이스가 비어있던 근본 원인을 파악하여 백엔드(Apps Script) 코드를 수정했습니다. 누락된 API 액션을 추가하고, 필터링에 필수적인 유저의 학년/반 정보를 저장할 수 있도록 로직을 보강했습니다.

## 2. 작업 상세 내역

### 🛠️ 백엔드 유저 프로필 저장 로직 수정 (Fixer)
- **대상 파일**: `Docs/Code_v4_merged.js`
- **수정 사항**: 
    - `registerUser` 및 `updateUser` 액션에서 `grade`(학년)와 `classGroup`(반) 파라미터를 받아 시트에 기록하도록 수정.
    - `Users` 시트의 헤더 구조를 `[User_ID, School, Grade, Class, Password, Avatar, Last_Updated]` 순서로 확장.
    - 기존 유저 조회(`getUser`) 시에도 확장된 모든 필드를 반환하도록 매핑 로직 개선.

### 🔍 `getAllMbtiData` 액션 추가 (Architect)
- **문제점**: 프론트엔드에서 `getAllMbtiData`를 호출하나 백엔드에 해당 핸들러가 없어 "Invalid Action" 오류 발생.
- **해결**: `doGet` 함수 내에 `getAllMbtiData` 케이스를 추가하여 다음 데이터를 통합 반환함.
    - `Questions` 시트 (MBTI 결과물)
    - `ShowcaseLinks` 시트 (사용자 등록 커스텀 링크)
    - `Users` 시트 (학교, 학년, 반 정보가 포함된 전체 유저 맵)

### ✨ 프론트엔드 연동 정합성 확보 (Worker)
- 백엔드에서 반환하는 유저 데이터 객체 키(`school`, `grade`, `classGroup`)를 프론트엔드에서 기대하는 형식과 일치시켜 즉각적인 필터링이 가능하도록 구성함.

## 3. 사용자 조치 필요 사항 (중요)
1. 수정된 [Code_v4_merged.js](file:///Users/byunmose/Desktop/vibe_coding/Tutorial/AI_Study/ai-playgrounds/Docs/Code_v4_merged.js)의 전체 코드를 복사합니다.
2. 구글 앱스 스크립트(GAS) 편집기에 붙여넣습니다.
3. **배포 -> 새 배포**를 클릭하여 새로운 버전을 생성하고 배포합니다.
4. (선택 사항) `Users` 시트에 이미 데이터가 있다면 `School` 컬럼 뒤에 `Grade`와 `Class` 컬럼(열)을 수동으로 삽입해 주시면 더욱 정확하게 작동합니다.

---
**기록일: 2026-03-28**
**서기: antigravity**

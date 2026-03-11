# 작업 로그 - 마크다운 이미지 슬라이더(캐러셀) 및 에디터 툴바 기능 추가

## 일시
2026년 3월 9일

## 작업 역할
Blueprint(건축가), Worker(작업자), UI Polish(디자이너) & Doc(서기)

## 기능 개요 (Overview)
- 관리자가 코스 페이지를 작성할 때 여러 장의 이미지를 슬라이드로 넘겨볼 수 있는 **캐러셀(Carousel)** 기능을 구현했습니다.
- 마크다운 작성을 더 쉽고 빠르게 할 수 있도록 편집기 상단에 **마크다운 툴바(Markdown Toolbar)**를 추가했습니다.

## 상세 구현 내용 (Implementation Details)

### 1. 이미지 캐러셀 컴포넌트 (`components/ImageCarousel.tsx` 신규 생성)
- `react-markdown`의 커스텀 컴포넌트 변환 기능을 활용하기 위해, 특정 코드 블록(````carousel````)에 대해 렌더링을 가로채는 방식 채택.
- **주요 UI 특징**:
  - `aspect-video` (16:9 비율) 유지 및 Tailwind CSS를 활용한 유리 질감(Glassmorphism)과 모던한 디자인 
  - 좌우 슬라이드 내비게이션 버튼 (호버 시 표시됨)
  - 하단 페이지네이션 번호 (현재 슬라이드 위치 표시)
  - 이미지 간 자연스러운 `transform: translateX` 애니메이션 이동

### 2. 마크다운 렌더러 연동 (`components/MarkdownContent.tsx` 수정)
- `ReactMarkdown`의 `components.code` 렌더 함수를 오버라이드.
- 파싱 언어가 `carousel`인 경우 블록 안의 텍스트를 줄바꿈(`\n`) 기준으로 분리하여 이미지 URL 배열로 만들고, 새로 만든 `<ImageCarousel images={urls} />` 컴포넌트를 반환.

### 3. 마크다운 에디터 툴바 (`components/MarkdownToolbar.tsx` 신규 생성 및 적용)
- 편집기 textarea 조작의 편의성을 위해 상단에 Quick-insert 버튼 모음 생성.
- **지원 기능**: H1, H2, H3, 굵게, 기울임, 인용, 코드 블록, 링크, 이미지 삽입 및 **특별 캐러셀 블록 추가 버튼**
- 편집기 커서 위치(selectionStart, selectionEnd)를 계산하여 정확한 위치에 마크다운 포맷팅 텍스트를 삽입하고 다시 포커싱하는 로직 구현.
- `app/admin/course/page.tsx` 내 `AdminCourseEditorPanel` 컴포넌트 위에 부착 완료.

## 비고 (Notes)
- 변경된 내용은 로컬 빌드(`npm run build`) 테스트를 통과했습니다.
- 이제 관리자는 마크다운 작성 시 버튼 하나로 복잡한 문법을 쉽게 커서 위치에 삽입할 수 있어 작성 편의성이 대폭 상향되었습니다.

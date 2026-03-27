# 작업 로그 (Work Log)

## ✅ 작업 정보
- **날짜**: 2026-03-25
- **담당**: Relector (작업자) & Doc (서기)
- **주제**: 마크다운 에디터 펼치기/접기(Toggle) 버튼 추가

## 📝 작업 내용

### 🛠️ 기능 구현
- **파일**: `components/MarkdownToolbar.tsx`
- **변경 사항**: `<details>` 태그 기반의 접기/펼치기 템플릿을 본문에 쉽게 삽입할 수 있도록 툴바 메뉴에 `🔽 토글` 버튼 추가.
    ```typescript
    {
        label: "Toggle",
        icon: "🔽 토글",
        action: () => insertText("<details>\n<summary>📌 제목을 입력하세요</summary>\n\n여기에 상세 내용을 입력하세요.\n</details>\n", "")
    }
    ```

## 🔍 검증 결과
- 마크다운 에디터 툴바에 `🔽 토글` 버튼이 정상 노출됨.
- 버튼 클릭 시 지정된 `<details>` 템플릿 문자열이 텍스트 입력창에 삽입되는 구조 확인 완료.
- `<details>` 및 `<summary>` 간의 한 줄 공백 지원을 통해 마크다운 내 렌더링 호환성 확보함.

---
*참고: 아크랩스 홈페이지 링크 - https://litt.ly/aklabs*

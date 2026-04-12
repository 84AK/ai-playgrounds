# 작업 로그: 주차별 목차 레이아웃 수정 (2026-04-11)

## 1. 개요
주차별 목차 리스트에서 제목의 길이가 길어질 경우, 우측의 상태 버튼(미제출/완료)이 부모 컨테이너 영역을 벗어나는 현상을 해결함.

## 2. 발생한 문제
- **현상**: 긴 텍스트 입력 시 Flexbox 컨테이너의 너비 계산 오류로 우측 버튼이 밀려나거나 잘림.
- **원인**: `flex items-center justify-between` 구조에서 왼쪽 자식 요소가 콘텐츠 크기에 맞춰 무한히 확장됨. `truncate` 클래스가 적용되어 있었으나, 부모 요소에 너비 제한(`min-width: 0` 또는 `flex-sub-item` 속성)이 없어 효과가 무지함.

## 3. 해결 방법
- **파일**: `components/StudyLabPanel.tsx`
- **수정 사항**:
    - 제목 영역을 감싸는 `div`에 `min-w-0` 클래스를 추가하여 최소 너비 제한을 해제(0으로 설정)함으로써 `truncate`가 동작할 수 있는 환경 조성.
    - `flex-1`을 추가하여 해당 영역이 가용한 최대 공간을 차지하되 버튼 영역을 침범하지 않게 설정.
    - 불필요한 `pr-2` 패딩을 제거하여 말줄임표가 자연스럽게 표시되도록 조정.

## 4. 구현 상세 (Implementation)
```tsx
// 수정 전
<div className="flex items-center gap-2">
  ...
  <span className="... truncate pr-2">
    {item.week}주차: {item.title}
  </span>
</div>

// 수정 후
<div className="flex items-center gap-2 min-w-0 flex-1">
  ...
  <span className="... truncate">
    {item.week}주차: {item.title}
  </span>
</div>
```

## 5. 결과 및 회고
- 제목이 길어지더라도 우측 버튼의 위치가 고정되어 UI 일관성이 유지됨.
- Flexbox 레이아웃에서 `truncate` 속성을 사용할 때는 반드시 부모 요소의 너비 제약 조건을 확인해야 한다는 점을 재표명함.

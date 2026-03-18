# 개인정보 보호 조치 적용 가이드라인 (타 앱 적용용)

본 가이드는 **교육부 학습지원 소프트웨어 필수기준**을 기반으로, 다른 Next.js/React 프로젝트에 '개인정보 보호 안내 팝업' 및 '상시 푸터'를 손쉽게 이식하기 위한 매뉴얼입니다.

---

## 📌 주요 3단 핵심 구성품

타 앱에 이식할 때 아래 3가지 요소를 세트로 구성합니다.

1.  **정책 문서 (`PrivacyPolicy.md`)**: 이용자 설명용 텍스트 (초안 바탕으로 수정 가능)
2.  **안내 모달 (`PrivacyModal.tsx`)**: 최초 진입 시 보이는 정보성 팝업 / `localStorage` 제어
3.  **고정 푸터 (`Footer.tsx`)**: 상시 접근 연동용 하단 바
4.  **상세 모달 (`PrivacyPolicyModal.tsx`)**: 푸터 클릭 시 상세 Markdown 뷰 탑재

---

## 🛠️ 이식/적용 4단계 Step-by-Step

### Step 1. 정책 초안 생성
상세 방침 서식을 앱 내 Docs 영역이나 `.env` 상에 하드코딩 또는 임포트할 수 있도록 마크다운 텍스트를 구성합니다.

- **필수 포함 항목**: 수집 목적, 수집 항목(최소화), 보유 기관, 만 14세 미만 동의 기준, 권리 행사 방법(삭제 등).

---

### Step 2. 컴포넌트 이식 (`src/components/`)
컴포넌트는 응집도를 높이기 위해 별도 모듈로 분리합니다.

#### 💡 안내 팝업 (`PrivacyModal.tsx`) 핵심 로직
- **`AnimatePresence` + `framer-motion`**을 활용해 부드럽게 등장시킵니다.
- **체크박스 로직**:
  ```tsx
  const handleConfirm = () => {
    onToggleDoNotShowToday(isChecked) // 하루 비노출 처리 트리거
    onClose()
  }
  ```

#### 💡 상세 방침 모달 (`PrivacyPolicyModal.tsx`) 핵심 로직
- `react-markdown`으로 렌더링하여 관리 및 수정이 용이하게 합니다.

#### 💡 하단 푸터 (`Footer.tsx`) 핵심 로직
- 상시 하단 연동 단추(`개인정보 처리방침`) 공급.

---

### Step 3. 페이지 주입 (`src/app/page.tsx` 또는 `layout.tsx`)

메인 화면(Dashboard 등)의 마운트 시점에 LocalStorage 검증을 수행합니다.

```tsx
// 1. 상태 추가 (팝업 노출 여부 등)
const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false)
const [isPrivacyPolicyModalOpen, setIsPrivacyPolicyModalOpen] = useState(false)

// 2. LocalStorage 로직 주입 (useEffect 내)
useEffect(() => {
  const hideUntil = localStorage.getItem("hidePrivacyModalUntil")
  if (!hideUntil || new Date(hideUntil) < new Date()) {
     setIsPrivacyModalOpen(true) // 기간이 만료되었거나 없을 때만 팝업 가시화
  }
}, [])

// 3. '하루 보지 않기' 핸들러
const handleToggleDoNotShowToday = (checked: boolean) => {
  if (checked) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0) // 자정 만료 세팅
    localStorage.setItem("hidePrivacyModalUntil", tomorrow.toISOString())
  }
}
```

---

## 🎨 2026 디자인 팁 (Aesthetics)

현대적이고 고급스러운 연출을 위한 가이드:
1.  **배경 흐림 효과 (Backdrop Blur)**: `backdrop-blur-md bg-black/70` 활용으로 부각 효과.
2.  **Bento Box 분할**: 팝업 내 단락을 `bg-white/5 border-white/10` 단위의 카드로 분리하여 밀도 있는 정보 가시성을 확보.
3.  **마이크로 인터랙션**: 푸터 링크 호버 시 색 변화 및 아이콘 반입반출 애니메이션 추가.

---
*가이드 작성 완료. 타 프로젝트 적용 시 해당 가이드의 Step을 복사 후 컴포넌트 명칭만 조작하면 즉시 가동 가능합니다.*

# 작업 로그 - 캐러셀 내 구글 드라이브 이미지 엑스박스(깨짐) 현상 수정

## 일시
2026년 3월 9일

## 작업 역할
Fix(해결사) & Doc(서기)

## 상황 (Context)
- 관리자 페이지의 캐러셀(슬라이더) 기능 테스트 중, **구글 드라이브를 통해 공유한 이미지 링크(`https://drive.google.com/uc?id=...` 등)**를 넣었을 때 이미지가 엑스박스로 뜨며 제대로 표시되지 않는 현상 발생.

## 원인 분석 (Root Cause)
- 본래 `uc?id=` 형태의 구글 드라이브 링크는 과거에는 이미지 직접 표시용(Direct Embedding)으로 많이 쓰였으나, 최근 구글 드라이브 보안 정책(CORS 및 iframe/서드파티 쿠키 차단)이 강화되면서 브라우저 렌더링 엔진에서 해당 링크를 `<img>` 태그의 `src`로 직접 읽어오는 것을 종종 차단합니다.
- 용량이 조금만 크면 바이러스 검사 경고 HTML 페이지로 리다이렉트되면서 이미지가 아닌 HTML 문서를 불러오게 되어 이미지가 깨집니다.

## 해결책 및 수정 사항 (Resolution)
1. **Drive URL 변환 로직 추가**: 
   - `components/ImageCarousel.tsx` 내부 컴포넌트에 사용자가 입력한 구글 드라이브 기본 공유 링크를 **가장 안정적인 다이렉트 이미지 서빙 도메인(`lh3.googleusercontent.com/d/[ID]`)**으로 자동 변환해주는 `convertGoogleDriveUrl` 함수를 추가.
   - 정규식(Regex)을 사용하여 사용자 URL에서 고유 ID 부분만 쏙 빼낸 뒤 올바른 포맷으로 재구성합니다.
   
```typescript
// components/ImageCarousel.tsx 에 추가된 로직 부분
const convertGoogleDriveUrl = (url: string) => {
    const trimmed = url.trim();
    const ucMatch = trimmed.match(/drive\.google\.com\/uc\?.*?id=([^&/]+)/);
    const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    
    const id = (ucMatch && ucMatch[1]) || (fileMatch && fileMatch[1]);
    if (id) {
        return `https://lh3.googleusercontent.com/d/${id}`;
    }
    return trimmed; // 구글 드라이브가 아니면 원본 주소 반환
};
```

## 비고 (Notes)
- 변경된 내용은 로컬 빌드 테스트를 무사히 통과했습니다.
- 이제 사용자가 단순히 구글 드라이브에서 "링크 복사"를 눌러 나온 주소를 번거로운 변환 없이 그대로 붙여넣어도 캐러셀 컴포넌트 내부에서 똑똑하게 변환하여 학생들의 화면에 예쁘게 렌더링 해줄 것입니다!

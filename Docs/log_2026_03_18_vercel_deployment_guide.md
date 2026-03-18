# [Vercel 배포 분석 및 가이드 Log] - 2026.03.18

## 1. 개요 (Overview)
- **작업 목적**: GitHub에 배포된 코드를 Vercel(표준 Next.js 앱)로 원활하게 배포 전환하기 위한 분석 및 사전 준비 사항 확인.
- **담당 역할**: 건축가(Architect), 서기(Doc)

## 2. 작업 내역 (Work Logs)

### 2.1. 프로젝트 구조 및 설정 분석
- **프로젝트 타입**: Next.js (App Router 기반)
- **`next.config.ts` 검토**:
  ```typescript
  const enableStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
  
  const nextConfig: NextConfig = {
    output: enableStaticExport ? "export" : undefined,
    basePath: enableStaticExport ? "/ai-playgrounds" : undefined,
    // ...
  };
  ```
  - **분석 결과**: `NEXT_PUBLIC_STATIC_EXPORT` 환경 변수가 `"true"`일 때만 정적 내보내기(`output: 'export'`)가 활성화됩니다.
  - Vercel에 직접 배포 시 해당 환경 변수가 주어지지 않으므로, **자동으로 표준 Next.js 기능(SSR, Dynamic Route 등)을 사용할 수 있는 상태로 빌드가 수행**됩니다.

### 2.2. 하드코딩 경로 검증
- 기존 GitHub Pages 배포 시 사용했던 서브 패스(`/ai-playgrounds`)가 코드 내(에셋 참조, 컴포넌트 링크 등)에 **하드코딩되어 있지 않음**을 `grep_search`를 통해 검증 완료했습니다.
  - Vercel 배포 시 `basePath`가 제거되어도 라우팅 및 이미지 로드가 정상 작동할 것입니다.

---

## 3. 에러 발생 및 수정 내역 (Error & Fix)
- **별도의 오류가 식별되지 않았으며 기존 코드가 이미 정상 지원하도록 구성되어 있어 수정 사항이 없습니다.**

---

## 4. 해결 내용 및 전달 사항 (Resolution)
- **조치**: 코드 변경이 불필요함을 검증 완료하였으며, 배포 시 추가 설정해야 할 환경 변수를 파악했습니다.

### Vercel 배포 가이드
1. **깃허브 저장소 연결**: Vercel Dashboard에서 대상 저장소를 불러옵니다.
2. **환경 변수 구성**: Vercel 프로젝트 설정의 `Environment Variables`에 아래 키를 추가해 주세요.
   - `NEXT_PUBLIC_APPS_SCRIPT_URL` : (기존 `.env.local`에 포함된 값 입력)
3. **빌드**: `NEXT_PUBLIC_STATIC_EXPORT` 변수는 설정하지 마시거나 빈값으로 두어 기본 Next.js 앱 빌드가 구동되도록 합니다.

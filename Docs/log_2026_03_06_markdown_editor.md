# 작업 로그: 코스 페이지 마크다운 에디터 및 관리자 기능 추가

**날짜:** 2026년 3월 6일

## 구현 목표
코스 안내 페이지(`/course/[weekId]`)에서 마크다운 내용을 관리자 권한으로 직접 편집하고 저장할 수 있는 기능을 추가합니다.

## 수정 및 구현 사항
1. **관리자 인증 추가**
   - 파일: `app/actions/admin-actions.ts`, `app/admin/page.tsx`
   - 내용: 간단한 비밀번호 기반의 로그인 시스템 구축 (`admin_session` 쿠키 발급).
   - *로컬 테스트를 위해 초기 비밀번호를 "admin"으로 설정함.*

2. **서버 액션을 활용한 마크다운 저장**
   - 파일: `app/actions/course-actions.ts`
   - 내용: 클라이언트에서 넘겨온 마크다운 문자열을 `Docs/mbti_week{weekId}.md` 파일에 저장하고, 저장 성공 시 `revalidatePath`를 호출해 변경된 UI를 즉시 반영할 수 있게 구현.

3. **마크다운 편집 에디터 구현**
   - 파일: `app/course/[weekId]/CourseEditor.tsx` (신규 컴포넌트)
   - 내용: `isAdmin` prop을 통해 관리자에게만 [편집] 버튼을 보여줍니다. 편집 모드 진입 시, 좌측에는 마크다운 작성 에디터, 우측에는 실시간 Preview 기능을 제공합니다. 추가적인 무거운 라이브러리 없이 기존의 `react-markdown` 모듈을 활용하여 구현하였습니다.

4. **코스 페이지와 에디터 연동**
   - 파일: `app/course/[weekId]/page.tsx`
   - 내용: 기존의 정적인 `ReactMarkdown` 마크다운 렌더링 부분을 걷어내고, 서버 컴포넌트 단에서 관리자 여부를 파악(`isAdmin()`)하여 클라이언트 컴포넌트인 `CourseEditor`에 주입해 동적으로 에디터가 동작할 수 있도록 연결하였습니다.

## 참고 사항
- `.env.local` 파일에 `ADMIN_PASSWORD` (예: `ADMIN_PASSWORD=my_secure_pw`)를 지정하여 보안성을 높일 수 있습니다. 미지정 시 "admin"이 기본값으로 사용됩니다.

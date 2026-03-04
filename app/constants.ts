// 구글 스프레드시트 배포 URL (Apps Script)
// 로컬 테스트 시에는 .env.local 파일에 NEXT_PUBLIC_APPS_SCRIPT_URL 값을 설정해주세요.
// 깃허브 페이지를 통해 배포될 때는 리포지토리 Settings > Secrets에서 환경 변수가 주입되어 실행됩니다.

export const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";

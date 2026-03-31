// [보안] APPS_SCRIPT_URL은 이제 서버사이드 프록시(/api/proxy-apps-script)에서만 사용됩니다.
// 브라우저 직속 호출 방지를 위해 NEXT_PUBLIC_ 접두사가 없는 APPS_SCRIPT_URL 사용을 권장합니다.
export const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";

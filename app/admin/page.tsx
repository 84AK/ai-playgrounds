import { cookies } from "next/headers";
import AdminDashboardClient from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  
  // 서버 사이드에서 쿠키 읽기
  const teacherNameCookie = cookieStore.get("custom_teacher_name");
  const adminSessionCookie = cookieStore.get("admin_session");
  const customUrlCookie = cookieStore.get("custom_gs_url");
  const customPassCookie = cookieStore.get("custom_admin_password");
  
  const teacherName = teacherNameCookie ? decodeURIComponent(teacherNameCookie.value) : "";
  const isLoggedIn = !!adminSessionCookie;
  const isCustom = !!(customUrlCookie || customPassCookie);

  return (
    <AdminDashboardClient 
      initialTeacherName={teacherName} 
      initialIsLoggedIn={isLoggedIn} 
      initialIsCustom={isCustom}
    />
  );
}

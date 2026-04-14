"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ClientNavbar from "./ClientNavbar";
import Footer from "./Footer";
import PrivacyModal from "./PrivacyModal";
import PrivacyPolicyModal from "./PrivacyPolicyModal";
import MaintenanceOverlay from "./MaintenanceOverlay";
import BackendStatus from "./BackendStatus";

interface LayoutClientWrapperProps {
  children: React.ReactNode;
}

export default function LayoutClientWrapper({ children }: LayoutClientWrapperProps) {
  const [isPrivacyPolicyModalOpen, setIsPrivacyPolicyModalOpen] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // 1. 매직 링크(URL 파라미터) 감지 및 연동
    const setupGsUrl = searchParams.get("setup_gs_url");
    const setupFolderId = searchParams.get("setup_folder_id");
    const setupTeacherName = searchParams.get("teacher_name");

    if (setupGsUrl) {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      
      const targetUrl = decodeURIComponent(setupGsUrl);
      // 쿠키 저장
      document.cookie = `custom_gs_url=${encodeURIComponent(targetUrl)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
      if (setupFolderId) {
        document.cookie = `custom_folder_id=${encodeURIComponent(setupFolderId)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
      }
      if (setupTeacherName) {
        document.cookie = `custom_teacher_name=${encodeURIComponent(setupTeacherName)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
      }

      // [V8.1] 선생님 성함/시트명 자동 로드 시도 (이름 정보가 없을 경우만)
      const fetchTeacherName = async () => {
        try {
          const res = await fetch("/api/proxy-apps-script?action=testConnection", {
            headers: { "x-custom-gs-url": targetUrl }
          });
          const data = await res.json();
          if (data.spreadsheetName) {
            document.cookie = `custom_teacher_name=${encodeURIComponent(data.spreadsheetName)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
          }
        } catch (e) { console.error("Auto fetch teacher name failed"); }
        
        alert("✨ 선생님의 수업 환경과 성공적으로 연결되었습니다!");
        
        // URL 파라미터 제거 (Clean URL)
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
        
        // 상태 반영을 위한 새로고침
        router.refresh();
      };

      fetchTeacherName();
    }

    // 2. 환경 변수 기반 점검 모드 확인 (기본 시스템 점검)
    if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true") {
      setIsMaintenance(true);
    }

    // 3. [NEW] 구글 시트 기반 점검 모드 확인 (지능형 타겟팅 점검 - V12.0)
    const checkCustomMaintenance = async () => {
      // 관리자 페이지는 점검 모드 체크에서 제외
      const pathname = window.location.pathname;
      if (pathname.startsWith('/admin') || pathname.startsWith('/setup')) {
        return;
      }

      // 쿠키에서 연결된 선생님 성함 가져오기
      const cookies = document.cookie.split("; ");
      const teacherNameCookie = cookies.find(row => row.startsWith("custom_teacher_name="));
      const teacherName = teacherNameCookie ? decodeURIComponent(teacherNameCookie.split("=")[1]) : "";
      
      try {
        const res = await fetch(`/api/proxy-apps-script?action=getAdmins`);
        const data = await res.json();
        
        if (data.status === "success" && data.data) {
          // 1단계: 슈퍼 관리자가 점검 중인가? (전체 차단)
          const superAdminMaintenance = data.data.find((a: any) => 
            a.role === 'super_admin' && a.status === 'maintenance'
          );

          if (superAdminMaintenance) {
            console.log("🚨 연구소 전체 점검 모드(Super Admin) 활성화됨");
            setIsMaintenance(true);
            return;
          }

          // 2단계: 나의 선생님이 점검 중인가? (개별 차단)
          if (teacherName) {
            const myTeacherMaintenance = data.data.find((a: any) => 
              a.name === teacherName && a.status === 'maintenance'
            );
            
            if (myTeacherMaintenance) {
              console.log("🚧 해당 수업 점검 모드 감지됨:", myTeacherMaintenance.name);
              setIsMaintenance(true);
            }
          }
        }
      } catch (err) {
        console.error("Failed to check custom maintenance status", err);
      }
    };

    checkCustomMaintenance();
  }, [searchParams, router]);

  if (isMaintenance) {
    return <MaintenanceOverlay isVisible={true} />;
  }

  return (
    <>
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 -z-10 bg-[#FDFAEF]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: "-2s" }} />
      </div>

      <ClientNavbar />

      <main className="pt-12 pb-20 px-6 max-w-7xl mx-auto min-h-[calc(100vh-80px)] bg-transparent">
        {children}
      </main>

      <Footer onOpenPrivacyPolicy={() => setIsPrivacyPolicyModalOpen(true)} />

      {/* Global Modals */}
      <PrivacyModal onOpenPolicy={() => setIsPrivacyPolicyModalOpen(true)} />
      
      <PrivacyPolicyModal 
        isOpen={isPrivacyPolicyModalOpen} 
        onClose={() => setIsPrivacyPolicyModalOpen(false)} 
      />

      {/* [NEW] Backend Connection Status Bar (Global) */}
      <BackendStatus />
    </>
  );
}

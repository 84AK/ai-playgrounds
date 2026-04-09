"use client";

import { useState, useEffect } from "react";
import ClientNavbar from "./ClientNavbar";
import Footer from "./Footer";
import PrivacyModal from "./PrivacyModal";
import PrivacyPolicyModal from "./PrivacyPolicyModal";
import MaintenanceOverlay from "./MaintenanceOverlay";

interface LayoutClientWrapperProps {
  children: React.ReactNode;
}

export default function LayoutClientWrapper({ children }: LayoutClientWrapperProps) {
  const [isPrivacyPolicyModalOpen, setIsPrivacyPolicyModalOpen] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    // 환경 변수 기반 점검 모드 확인
    if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMaintenance(true);
    }
  }, []);

  if (isMaintenance) {
    return <MaintenanceOverlay isVisible={true} />;
  }

  return (
    <>
      {/* Background Decorative Elements (Moved from layout.tsx) */}
      <div className="fixed inset-0 -z-10 bg-[#FDFAEF]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: "-2s" }} />
      </div>

      <ClientNavbar />

      <main className="pt-12 pb-20 px-6 max-w-7xl mx-auto min-h-[calc(100vh-80px)] bg-transparent shadow-none border-0">
        {children}
      </main>

      <Footer onOpenPrivacyPolicy={() => setIsPrivacyPolicyModalOpen(true)} />

      {/* Global Modals */}
      <PrivacyModal onOpenPolicy={() => setIsPrivacyPolicyModalOpen(true)} />
      
      <PrivacyPolicyModal 
        isOpen={isPrivacyPolicyModalOpen} 
        onClose={() => setIsPrivacyPolicyModalOpen(false)} 
      />
    </>
  );
}

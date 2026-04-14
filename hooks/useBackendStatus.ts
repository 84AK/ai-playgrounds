"use client";

import { useState, useEffect } from "react";

export interface BackendStatusState {
    isCustom: boolean;
    teacherName: string;
    trackNames: Record<string, string>;
}

export default function useBackendStatus() {
    const [status, setStatus] = useState<BackendStatusState>({
        isCustom: false,
        teacherName: "",
        trackNames: {}
    });

    useEffect(() => {
        const checkStatus = () => {
            const cookies = document.cookie.split("; ");
            const gsUrl = cookies.find(row => row.startsWith("custom_gs_url="));
            const tName = cookies.find(row => row.startsWith("custom_teacher_name="));
            const trackCookie = cookies.find(row => row.startsWith("custom_track_names="));
            
            const isCustom = !!(gsUrl && gsUrl.split("=")[1]);
            let teacherName = tName ? decodeURIComponent(tName.split("=")[1]) : "";
            
            // [NEW] 관리자 이름이 있을 경우 이름 연동 보강
            if (!teacherName) {
                const adminName = cookies.find(row => row.startsWith("admin_name="));
                if (adminName) teacherName = decodeURIComponent(adminName.split("=")[1]);
            }
            
            let trackNames: Record<string, string> = {};
            if (trackCookie) {
                try {
                    trackNames = JSON.parse(decodeURIComponent(trackCookie.split("=")[1]));
                } catch (e) {
                    console.error("Failed to parse track names cookie");
                }
            }
            
            setStatus(prev => {
                const namesChanged = JSON.stringify(prev.trackNames) !== JSON.stringify(trackNames);
                if (prev.isCustom === isCustom && prev.teacherName === teacherName && !namesChanged) return prev;
                return { isCustom, teacherName, trackNames };
            });
        };

        checkStatus();
        const interval = setInterval(checkStatus, 2000); // 쿠키 변경 감지
        
        // 커스텀 이벤트 지원 (강제 새로고침 시 유용)
        const handleForceCheck = () => checkStatus();
        window.addEventListener("backend:changed", handleForceCheck);

        return () => {
            clearInterval(interval);
            window.removeEventListener("backend:changed", handleForceCheck);
        };
    }, []);

    const getTrackName = (originalName: string) => {
        return status.trackNames[originalName] || originalName;
    };

    return { ...status, getTrackName };
}

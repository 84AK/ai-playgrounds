"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { APPS_SCRIPT_URL } from "../../constants";
import type { UserProfile } from "@/components/GlobalAuthGuard";

export default function UploadHomework({ weekId }: { weekId: number }) {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [modal, setModal] = useState<{ isOpen: boolean, type: 'success' | 'error', message: string }>({ isOpen: false, type: 'success', message: '' });

    useEffect(() => {
        const saved = localStorage.getItem("lab_user_profile");
        if (saved) setProfile(JSON.parse(saved));
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setErrorMsg("");
        }
    };

    const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                let encoded = reader.result?.toString().split(",")[1] || "";
                if (encoded.length % 4 > 0) {
                    encoded += "=".repeat(4 - (encoded.length % 4));
                }
                resolve(encoded);
            };
            reader.onerror = (error) => reject(error);
        });

    const handleUpload = async () => {
        if (!profile) {
            setErrorMsg("수강생 등록(로그인)이 필요합니다.");
            return;
        }
        if (!file) {
            setErrorMsg("업로드할 결과물 파일을 선택해주세요. (포즈 모델 링크를 담은 txt 파일 등)");
            return;
        }

        setIsUploading(true);
        setErrorMsg("");

        try {
            const base64Data = await toBase64(file);

            const payload = {
                action: "uploadHomework",
                user_id: profile.name,
                week: weekId,
                courseType: "POSE", // THIS IS CRITICAL FOR DIFFERENTIATING
                fileName: `[POSE]${file.name}`,
                mimeType: file.type || "text/plain",
                base64Data: base64Data
            };

            await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify(payload),
            });

            // Check successful upload directly via GET
            setTimeout(async () => {
                try {
                    const checkRes = await fetch(`${APPS_SCRIPT_URL}?action=getProgress&user_id=${encodeURIComponent(profile.name)}`);
                    const checkResult = await checkRes.json();

                    if (checkResult && checkResult.data && checkResult.data[`pose_week${weekId}`] === true) {
                        setModal({
                            isOpen: true,
                            type: 'success',
                            message: `✨ 축하합니다! AI 포즈 게임 ${weekId}주차 학습 파일이 제출되었습니다.`
                        });
                    } else {
                        setModal({
                            isOpen: true,
                            type: 'error',
                            message: `⚠️ 업로드 실패: 파일이 전송되지 않았거나, 구글 시트에 진행 상황이 기록되지 않았습니다.\n\n앱스 스크립트를 새로 배포하거나, courseType이 POSE로 올바르게 처리되도록 백엔드가 업데이트되었는지 확인해주세요.`
                        });
                    }
                } catch (e) {
                    setModal({ isOpen: true, type: 'error', message: '진척도를 검증하는 중 오류가 발생했습니다. 백엔드 주소를 확인해주세요.' });
                }
                setIsUploading(false);
            }, 3000);

        } catch (err) {
            console.error(err);
            setErrorMsg("파일 업로드 중 클라이언트 측 에러가 발생했습니다.");
            setIsUploading(false);
        }
    };

    const closeModal = () => {
        if (modal.type === 'success') {
            router.push('/');
        } else {
            setModal({ ...modal, isOpen: false });
        }
    };

    return (
        <div className="bg-blue-900/10 p-8 rounded-3xl border border-blue-500/30 backdrop-blur-sm relative">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">
                    📤
                </div>
                <div>
                    <h3 className="text-xl font-black">{weekId}주차 과제 제출</h3>
                    <p className="text-sm text-muted-foreground font-medium">실습한 티처블 머신 모델 링크(.txt)나 코드를 업로드하세요.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="border-2 border-dashed border-blue-500/30 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 bg-background/50 hover:bg-background transition-colors relative">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".html,.css,.js,.zip,.json,.md,.txt"
                    />
                    {file ? (
                        <div className="flex flex-col items-center gap-2 text-blue-500 font-bold">
                            <span className="text-2xl">📄</span>
                            <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
                            <span className="text-2xl">👇</span>
                            <span>여기를 클릭하거나 파일을 드래그하여 첨부하세요.</span>
                            <span className="text-xs opacity-60">지원 파일: txt, html, css, js, zip 등</span>
                        </div>
                    )}
                </div>

                {errorMsg && (
                    <p className="text-destructive text-sm font-bold bg-destructive/10 p-3 rounded-lg">{errorMsg}</p>
                )}

                <button
                    onClick={handleUpload}
                    disabled={isUploading || !file}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                    {isUploading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            업로드 중... (구글 드라이브 연동)
                        </>
                    ) : (
                        "🚀 POSE 결과물 제출 및 완료 마크하기"
                    )}
                </button>
            </div>

            {/* Modal Popup */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background max-w-md w-full p-8 rounded-3xl shadow-2xl border border-border scale-in-center animate-in zoom-in-95 duration-200">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${modal.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                            {modal.type === 'success' ? (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            )}
                        </div>
                        <h3 className="text-2xl font-black text-center mb-4">{modal.type === 'success' ? '업로드 성공!' : '제출 실패'}</h3>
                        <p className="text-muted-foreground text-center font-medium leading-relaxed whitespace-pre-wrap">{modal.message}</p>

                        <button
                            onClick={closeModal}
                            className={`w-full mt-8 py-4 rounded-xl font-black text-white transition-colors ${modal.type === 'success' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-destructive hover:bg-destructive/90'}`}
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { delay, getAppsScriptJson, postAppsScript } from "@/lib/appsScriptClient";
import { readLocalProfile } from "@/hooks/useLocalProfile";
import type { UserProfile } from "@/types/auth";

export default function UploadHomework({ weekId }: { weekId: number }) {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [modal, setModal] = useState<{ isOpen: boolean, type: 'success' | 'error', message: string }>({ isOpen: false, type: 'success', message: '' });

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
        const profile: UserProfile | null = readLocalProfile();

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

            const ext = file.name.split('.').pop() || "";
            
            const gradeStr = profile?.grade ? `${profile.grade}학년` : "";
            const classStr = profile?.classGroup ? `${profile.classGroup}반` : "";
            const userInfoStr = (gradeStr || classStr) ? `${gradeStr}${classStr}_` : "";
            
            const sanitizedNickname = profile.name.replace(/[^a-z0-9가-힣]/gi, '');
            const finalFileName = `${weekId}주차_${userInfoStr}${sanitizedNickname}.${ext}`;

            const payload = {
                action: "uploadHomework",
                user_id: profile.name,
                course_type: "POSE",
                week: weekId,
                file_name: finalFileName,
                mime_type: file.type || "application/octet-stream",
                file_base64: base64Data
            };

            await postAppsScript(payload);
            await delay(3000);

            const checkResult = await getAppsScriptJson<{ data?: Record<string, boolean> }>(
                new URLSearchParams({
                    action: "getProgress",
                    user_id: profile.name,
                })
            );

            if (checkResult?.data?.[`pose_week${weekId}`] === true) {
                setModal({
                    isOpen: true,
                    type: "success",
                    message: `✨ 축하합니다! AI 포즈 게임 ${weekId}주차 학습 파일이 제출되었습니다.`,
                });
            } else {
                setModal({
                    isOpen: true,
                    type: "error",
                    message: `⚠️ 업로드 실패: 파일이 전송되지 않았거나, 구글 시트에 진행 상황이 기록되지 않았습니다.\n\n앱스 스크립트를 새로 배포하거나, courseType이 POSE로 올바르게 처리되도록 백엔드가 업데이트되었는지 확인해주세요.`,
                });
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("파일 업로드 또는 검증 중 오류가 발생했습니다. Apps Script URL과 배포 상태를 확인해주세요.");
            setIsUploading(false);
            return;
        }

        setIsUploading(false);
    };

    const closeModal = () => {
        if (modal.type === 'success') {
            router.push('/');
        } else {
            setModal({ ...modal, isOpen: false });
        }
    };

    return (
        <section className="relative overflow-hidden rounded-[40px] border-2 border-[#2F3D4A] bg-white p-8 shadow-[6px_6px_0px_0px_#2F3D4A]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-blue-500/10 via-blue-500/[0.02] to-transparent" />
            <div className="relative flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl border-2 border-[#2F3D4A] shadow-[2px_2px_0px_0px_#2F3D4A]">
                    📤
                </div>
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600">Next Action</p>
                    <h3 className="mt-1 text-xl font-black text-[#2F3D4A]">{weekId}주차 과제 제출</h3>
                    <p className="text-sm text-slate-600 font-medium">실습한 티처블 머신 모델 링크(.txt)나 코드를 업로드하세요.</p>
                </div>
            </div>

            <div className="relative space-y-4">
                <div className="border-2 border-dashed border-[#2F3D4A]/20 p-8 rounded-[32px] flex flex-col items-center justify-center gap-4 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 relative cursor-pointer min-h-[200px]">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        accept=".html,.css,.js,.zip,.json,.md,.txt"
                    />
                    {file ? (
                        <div className="flex flex-col items-center gap-2 text-blue-600 font-bold animate-in zoom-in-95 duration-200">
                            <span className="text-3xl">📄</span>
                            <span className="text-[#2F3D4A]">{file.name}</span>
                            <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
                            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl mb-1 border-2 border-[#2F3D4A]/10 transition-all group-hover:border-blue-400 group-hover:bg-blue-50 group-hover:text-blue-500">
                                👇
                            </div>
                            <span className="font-bold text-[#2F3D4A]/90">여기를 클릭하거나 파일을 드래그하여 첨부하세요</span>
                            <span className="text-xs text-slate-400 font-medium">지원 파일: txt, html, css, js, zip 등</span>
                        </div>
                    )}
                </div>

                {errorMsg && (
                    <p className="text-destructive text-sm font-bold bg-destructive/10 p-3 rounded-xl border border-destructive/20">{errorMsg}</p>
                )}

                <button
                    onClick={handleUpload}
                    disabled={isUploading || !file}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black disabled:opacity-30 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2 border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A]"
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
        </section>
    );
}

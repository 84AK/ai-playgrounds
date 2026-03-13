"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { delay, getAppsScriptJson, postAppsScript } from "@/lib/appsScriptClient";

import { readLocalProfile } from "@/hooks/useLocalProfile";

interface UploadHomeworkProps {
    weekId: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function UploadHomework({ weekId, isOpen, onClose }: UploadHomeworkProps) {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [modal, setModal] = useState<{ isOpen: boolean, type: 'success' | 'error', message: string }>({ isOpen: false, type: 'success', message: '' });

    if (!isOpen) return null;

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
        const profile = readLocalProfile();
        const nickname = profile?.name ?? "";

        if (!nickname) {
            setErrorMsg("수강생 등록(로그인)이 필요합니다. 홈화면에서 닉네임을 입력해주세요.");
            return;
        }
        if (!file) {
            setErrorMsg("업로드할 결과물 파일을 선택해주세요.");
            return;
        }

        setIsUploading(true);
        setErrorMsg("");

        try {
            const base64Data = await toBase64(file);

            // 자동 파일명 생성: YYYYMMDD_학년반_이름_원래파일명
            const now = new Date();
            const dateStr = now.getFullYear() + 
                           String(now.getMonth() + 1).padStart(2, '0') + 
                           String(now.getDate()).padStart(2, '0');
            
            const gradeStr = profile?.grade ? `${profile.grade}학년` : "";
            const classStr = profile?.classGroup ? `${profile.classGroup}반` : "";
            const userInfoStr = (gradeStr || classStr) ? `${gradeStr}${classStr}_` : "";
            
            const sanitizedNickname = nickname.replace(/[^a-z0-9가-힣]/gi, ''); // 특수문자 제거
            const finalFileName = `${dateStr}_${userInfoStr}${sanitizedNickname}_${file.name}`;

            const payload = {
                action: "uploadHomework",
                user_id: nickname,
                course_type: "MBTI", 
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
                    user_id: nickname,
                })
            );

            const isSuccess = checkResult?.data?.[`mbti_week${weekId}`] === true || checkResult?.data?.[`week${weekId}`] === true;

            if (isSuccess) {
                setModal({
                    isOpen: true,
                    type: "success",
                    message: `✨ 축하합니다! ${weekId}주차 학습 코드가 구글 드라이브에 제출되었습니다.`,
                });
            } else {
                setModal({
                    isOpen: true,
                    type: "error",
                    message: `⚠️ 업로드 실패: 제출 결과를 확인하지 못했습니다.`,
                });
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("파일 업로드 중 오류가 발생했습니다.");
            setIsUploading(false);
            return;
        }

        setIsUploading(false);
    };

    const closeModal = () => {
        if (modal.type === 'success') {
            onClose();
            router.push('/');
        } else {
            setModal({ ...modal, isOpen: false });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-start p-4 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto py-12 lg:py-24">
            <section className="relative w-full max-w-2xl rounded-[40px] border border-white/10 bg-card p-6 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300 my-auto">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all z-10"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="relative mb-8 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-2xl border border-primary/20 shadow-inner">
                        🚀
                    </div>
                    <div>
                        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-primary/70">Submission</p>
                        <h3 className="mt-1 text-2xl font-black">{weekId}주차 결과물 제출</h3>
                        <p className="text-[15px] text-muted-foreground font-medium">완성된 프로젝트를 구글 드라이브에 안전하게 보관합니다.</p>
                    </div>
                </div>

                {/* 제출 지침 공지 영역 */}
                <div className="mb-8 p-6 rounded-[30px] bg-primary/5 border border-primary/10 space-y-3">
                    <div className="flex gap-3 items-center">
                        <span className="text-xl">📦</span>
                        <p className="text-sm font-black text-primary uppercase tracking-wider">업로드 가이드</p>
                    </div>
                    <div className="space-y-2 text-[14px] text-foreground/80 leading-relaxed font-medium">
                        <p>• 여러 개의 파일인 경우 반드시 <span className="text-primary font-bold underline underline-offset-4 decoration-2">압축파일(.zip)</span>로 묶어서 제출해 주세요.</p>
                        <p>• 파일명은 <span className="text-primary font-bold">오늘날짜_학년반_이름_원래파일명</span> 형식으로 서버에서 자동 변환됩니다.</p>
                        <p className="text-[12px] text-muted-foreground pt-1 italic opacity-80">* 예시: 20250313_2학년6반_홍길동_project.zip</p>
                    </div>
                </div>

                <div className="relative space-y-6">
                    <div className="group relative border-2 border-dashed border-white/10 p-10 rounded-[32px] flex flex-col items-center justify-center gap-5 bg-black/10 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-pointer overflow-hidden">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            accept=".html,.css,.js,.zip,.json,.md"
                        />
                        {file ? (
                            <div className="flex flex-col items-center gap-3 text-primary animate-in zoom-in duration-200">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl mb-1 shadow-lg border border-primary/20">
                                    📄
                                </div>
                                <span className="font-bold text-lg">{file.name}</span>
                                <span className="text-xs bg-primary/10 px-3 py-1 rounded-full">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-muted-foreground transition-transform group-hover:scale-105 duration-300">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-1 border border-white/5 transition-colors group-hover:border-primary/20">
                                    📤
                                </div>
                                <span className="font-black text-sm">여기를 클릭하거나 파일을 드래그하세요</span>
                                <span className="text-xs opacity-60">zip, html, js, css 등 지원</span>
                            </div>
                        )}
                    </div>

                    {errorMsg && (
                        <div className="flex items-center gap-2 text-destructive text-sm font-bold bg-destructive/10 p-4 rounded-2xl border border-destructive/20 animate-in slide-in-from-top-2">
                            <span>⚠️</span> {errorMsg}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-white/5 text-foreground rounded-2xl font-black hover:bg-white/10 transition-all border border-white/5"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={isUploading || !file}
                            className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all flex justify-center items-center gap-3 shadow-xl shadow-primary/20"
                        >
                            {isUploading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    제출하는 중...
                                </>
                            ) : (
                                "✅ 제출 완료하기"
                            )}
                        </button>
                    </div>
                </div>

                {/* Modal Popup (Internal to Upload) */}
                {modal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-background max-w-sm w-full p-10 rounded-[40px] shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 text-center">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${modal.type === 'success' ? 'bg-green-500/10 text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'bg-destructive/10 text-destructive shadow-[0_0_30px_rgba(239,68,68,0.2)]'}`}>
                                {modal.type === 'success' ? (
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                )}
                            </div>
                            <h3 className="text-2xl font-black mb-4">{modal.type === 'success' ? '제출 성공!' : '제출 실패'}</h3>
                            <p className="text-muted-foreground font-medium leading-relaxed whitespace-pre-wrap mb-8 text-[15px]">{modal.message}</p>

                            <button
                                onClick={closeModal}
                                className={`w-full py-5 rounded-[20px] font-black text-white transition-all shadow-lg ${modal.type === 'success' ? 'bg-primary hover:bg-primary/90 shadow-primary/20' : 'bg-destructive hover:bg-destructive/90 shadow-destructive/20'}`}
                            >
                                {modal.type === 'success' ? '메인으로 이동' : '다시 시도'}
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

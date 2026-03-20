"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { delay, getAppsScriptJson, postAppsScript } from "@/lib/appsScriptClient";
import { readLocalProfile } from "@/hooks/useLocalProfile";

interface UploadHomeworkProps {
    weekId: number;
}

export default function UploadHomework({ weekId }: UploadHomeworkProps) {
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

        // 🛡️ [추가] 파일 크기 제한 (20MB) - Apps Script 과부하 방지
        const MAX_SIZE = 20 * 1024 * 1024; 
        if (file.size > MAX_SIZE) {
            setErrorMsg("파일 크기가 너무 큽니다. 20MB 이하의 파일만 제출할 수 있습니다.");
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
            
            const sanitizedNickname = nickname.replace(/[^a-z0-9가-힣]/gi, '');
            const finalFileName = `${weekId}주차_${userInfoStr}${sanitizedNickname}.${ext}`;

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
            router.push('/');
        } else {
            setModal({ ...modal, isOpen: false });
        }
    };

    return (
        <section id="submission-section" className="relative w-full max-w-4xl mx-auto mt-24 scroll-mt-32">
            <div className="relative overflow-hidden rounded-[40px] border-2 border-[#2F3D4A] bg-white p-8 md:p-12 shadow-[6px_6px_0px_0px_#2F3D4A]">
                {/* Background Glow */}
                <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px]" />

                <div className="relative mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[24px] bg-amber-100 flex items-center justify-center text-3xl border-2 border-[#2F3D4A] shadow-[2px_2px_0px_0px_#2F3D4A]">
                            🚀
                        </div>
                        <div>
                        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-primary mb-1">Submission Area</p>
                            <h3 className="text-3xl font-black text-[#2F3D4A]">{weekId}주차 결과물 제출하기</h3>
                            <p className="mt-1 text-[16px] text-slate-600 font-medium">완성된 프로젝트를 구글 드라이브에 안전하게 보관합니다.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-12">
                    {/* Left: Upload Area */}
                    <div className="space-y-6">
                        <div className="group relative border-2 border-dashed border-[#2F3D4A]/20 p-12 rounded-[40px] flex flex-col items-center justify-center gap-6 bg-slate-50 hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 cursor-pointer overflow-hidden min-h-[320px]">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                accept=".html,.css,.js,.zip,.json,.md"
                            />
                            {file ? (
                                <div className="flex flex-col items-center gap-4 text-primary animate-in zoom-in duration-300">
                                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-4xl mb-2 shadow-2xl border border-primary/20">
                                        📄
                                    </div>
                                    <div className="text-center">
                                        <h4 className="font-black text-xl mb-1">{file.name}</h4>
                                        <p className="text-sm opacity-70 font-bold">{(file.size / 1024).toFixed(1)} KB • 업로드 대기 중</p>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); setFile(null); }}
                                        className="mt-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors relative z-20"
                                    >
                                        파일 삭제
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-muted-foreground transition-transform group-hover:scale-105 duration-500">
                                    <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-4xl mb-2 border-2 border-[#2F3D4A]/10 transition-all group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary">
                                        📤
                                    </div>
                                    <div className="text-center">
                                        <span className="block font-black text-lg text-[#2F3D4A] group-hover:text-primary transition-colors">여기를 클릭하거나 파일을 드래그하세요</span>
                                        <span className="block text-sm text-slate-500 mt-1 font-medium">zip, html, js, css 등 지원</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {errorMsg && (
                            <div className="flex items-center gap-3 text-destructive text-sm font-bold bg-destructive/10 p-5 rounded-[24px] border border-destructive/20 animate-in slide-in-from-top-2">
                                <span className="text-xl">⚠️</span> {errorMsg}
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={isUploading || !file}
                            className="w-full py-6 bg-primary text-white rounded-[24px] text-lg font-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-all flex justify-center items-center gap-4 border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] relative group overflow-hidden"
                        >
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                            {isUploading ? (
                                <>
                                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    제출하는 중...
                                </>
                            ) : (
                                <><span>✅</span> 과제 제출 완료하기</>
                            )}
                        </button>
                    </div>

                    {/* Right: Guide Card */}
                    <div className="p-8 rounded-[40px] bg-primary/5 border border-primary/10 flex flex-col justify-between">
                        <div>
                            <div className="flex gap-4 items-center mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center text-xl shadow-lg shadow-primary/20">
                                    📦
                                </div>
                                <h4 className="font-black text-primary uppercase tracking-widest text-sm">업로드 가이드</h4>
                            </div>
                            
                            <ul className="space-y-6">
                                <li className="flex gap-4">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                    <p className="text-[15px] leading-relaxed text-foreground/80 font-medium">
                                        여러 개의 파일인 경우 반드시 <span className="text-primary font-bold underline underline-offset-4">압축파일(.zip)</span>로 묶어서 제출해 주세요.
                                    </p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                    <p className="text-[15px] leading-relaxed text-foreground/80 font-medium">
                                        파일명은 <span className="text-primary font-bold">주차_학년반_이름.확장자</span> 형식으로 자동 변환됩니다.
                                    </p>
                                </li>
                            </ul>
                        </div>

                        <div className="mt-10 pt-8 border-t border-primary/10">
                            <p className="text-[12px] text-muted-foreground italic font-medium opacity-80 mb-2">
                                * 변환 예시: 
                            </p>
                            <div className="p-3 rounded-xl bg-primary/10 font-mono text-[11px] text-primary/80 font-bold break-all">
                                {weekId}주차_2학년6반_홍길동.zip
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success/Error Modal (Scoped within section) */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-300">
                    <div className="bg-background max-w-sm w-full p-12 rounded-[48px] shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300 text-center">
                        <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-8 ${modal.type === 'success' ? 'bg-green-500/10 text-green-500 shadow-[0_0_40px_rgba(34,197,94,0.3)]' : 'bg-destructive/10 text-destructive shadow-[0_0_40px_rgba(239,68,68,0.3)]'}`}>
                            {modal.type === 'success' ? (
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            )}
                        </div>
                        <h3 className="text-3xl font-black mb-4">{modal.type === 'success' ? '제출 성공!' : '제출 실패'}</h3>
                        <p className="text-muted-foreground font-medium leading-relaxed mb-10 text-[16px]">{modal.message}</p>

                        <button
                            onClick={closeModal}
                            className={`w-full py-5 rounded-[24px] font-black text-white transition-all shadow-xl ${modal.type === 'success' ? 'bg-primary hover:bg-primary/90 shadow-primary/20' : 'bg-destructive hover:bg-destructive/90 shadow-destructive/20'}`}
                        >
                            {modal.type === 'success' ? '메인으로 이동' : '다시 시도'}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

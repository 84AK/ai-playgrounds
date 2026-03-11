"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { delay, getAppsScriptJson, postAppsScript } from "@/lib/appsScriptClient";

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
        const nickname = typeof window !== "undefined" ? localStorage.getItem("lab_nickname") ?? "" : "";

        if (!nickname) {
            setErrorMsg("수강생 등록(로그인)이 필요합니다. 홈화면에서 닉네임을 입력해주세요.");
            return;
        }
        if (!file) {
            setErrorMsg("업로드할 결과물(코드) 파일을 선택해주세요.");
            return;
        }

        setIsUploading(true);
        setErrorMsg("");

        try {
            const base64Data = await toBase64(file);

            // 자동 파일명 생성: YYYYMMDD_닉네임_원래파일명
            const now = new Date();
            const dateStr = now.getFullYear() + 
                           String(now.getMonth() + 1).padStart(2, '0') + 
                           String(now.getDate()).padStart(2, '0');
            const sanitizedNickname = nickname.replace(/[^a-z0-9가-힣]/gi, ''); // 특수문자 제거
            const finalFileName = `${dateStr}_${sanitizedNickname}_${file.name}`;

            const payload = {
                action: "uploadHomework",
                user_id: nickname,
                week: weekId,
                fileName: finalFileName,
                mimeType: file.type || "application/octet-stream",
                base64Data: base64Data
            };

            await postAppsScript(payload);
            await delay(3000);

            const checkResult = await getAppsScriptJson<{ data?: Record<string, boolean> }>(
                new URLSearchParams({
                    action: "getProgress",
                    user_id: nickname,
                })
            );

            if (checkResult?.data?.[`week${weekId}`] === true) {
                setModal({
                    isOpen: true,
                    type: "success",
                    message: `✨ 축하합니다! ${weekId}주차 학습 코드가 구글 드라이브에 제출되었습니다.`,
                });
            } else {
                setModal({
                    isOpen: true,
                    type: "error",
                    message: `⚠️ 업로드 실패: 지정된 구글 드라이브에 파일이 전송되지 않았습니다.\n\n앱스 스크립트 최신 코드를 [새 배포]로 다시 퍼블리싱 했는지(새 URL 적용 포함), 또는 구글 드라이브 접근 권한을 "모든 사용자"에게 허용했는지 확인해주세요. 자세한 이유는 Apps Script의 [실행 로그] 메뉴에서 찾을 수 있습니다.`,
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
        <section className="relative overflow-hidden rounded-[30px] border border-white/8 bg-white/[0.035] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/12 via-primary/[0.03] to-transparent" />
            <div className="relative mb-6 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center text-xl border border-primary/20">
                    📁
                </div>
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/45">Next Action</p>
                    <h3 className="mt-1 text-xl font-black">{weekId}주차 과제 제출</h3>
                    <p className="text-sm text-white/58 font-medium">실습한 코드 파일을 업로드하여 학습을 완료하세요.</p>
                </div>
            </div>

            {/* 제출 지침 공지 영역 */}
            <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3 items-start group hover:bg-primary/10 transition-colors">
                <span className="text-lg mt-0.5 animate-pulse">📢</span>
                <div className="space-y-1">
                    <p className="text-xs font-black text-primary uppercase tracking-wider">제출 안내 및 주의사항</p>
                    <p className="text-[13px] text-white/80 leading-relaxed font-medium">
                        파일은 반드시 <span className="text-primary font-bold underline underline-offset-4">압축(.zip)</span>하여 제출해 주세요. <br/>
                        파일명은 <span className="opacity-60 italic text-[11px]">20250311_홍길동</span> 형식으로 자동 변환되어 저장되니 안심하셔도 좋습니다!
                    </p>
                </div>
            </div>

            <div className="relative space-y-4">
                <div className="border border-white/10 p-6 rounded-[24px] flex flex-col items-center justify-center gap-4 bg-black/20 hover:bg-black/25 transition-colors relative">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".html,.css,.js,.zip,.json,.md"
                    />
                    {file ? (
                        <div className="flex flex-col items-center gap-2 text-primary font-bold">
                            <span className="text-2xl">📄</span>
                            <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-white/60 text-sm">
                            <span className="text-2xl">👇</span>
                            <span>여기를 클릭하거나 파일을 드래그하여 첨부하세요.</span>
                            <span className="text-xs opacity-60">지원 파일: html, css, js, zip 등</span>
                        </div>
                    )}
                </div>

                {errorMsg && (
                    <p className="text-destructive text-sm font-bold bg-destructive/10 p-3 rounded-xl border border-destructive/20">{errorMsg}</p>
                )}

                <button
                    onClick={handleUpload}
                    disabled={isUploading || !file}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
                >
                    {isUploading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            업로드 중... (구글 드라이브 연동)
                        </>
                    ) : (
                        "✅ 결과물 제출 및 완료 마크하기"
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
                            className={`w-full mt-8 py-4 rounded-xl font-black text-white transition-colors ${modal.type === 'success' ? 'bg-primary hover:bg-primary/90' : 'bg-destructive hover:bg-destructive/90'}`}
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { delay, getAppsScriptJson, postAppsScript } from "@/lib/appsScriptClient";
import { readLocalProfile } from "@/hooks/useLocalProfile";
import MarkdownContent from "@/components/MarkdownContent";
import imageCompression from "browser-image-compression";

interface UploadHomeworkProps {
    track: string;
    weekId: number;
}

export default function UploadHomework({ track, weekId }: UploadHomeworkProps) {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [modal, setModal] = useState<{ isOpen: boolean, type: 'success' | 'error' | 'feedback', message: string }>({ isOpen: false, type: 'success', message: '' });
    
    const [statusData, setStatusData] = useState<{
        submissionStatus: 'not_found' | 'verified' | 'format_mismatch';
        fileName: string;
        feedback: string;
    }>({ submissionStatus: 'not_found', fileName: '', feedback: '' });
    
    const [isChecking, setIsChecking] = useState(true);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    
    // [추가] 업로드 프로그레스 상태
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStep, setUploadStep] = useState<string>("");

    useEffect(() => {
        checkSubmissionStatus();
    }, [track, weekId]);

    const checkSubmissionStatus = async () => {
        const profile = readLocalProfile();
        const nickname = profile?.name ?? "";
        if (!nickname) {
            setIsChecking(false);
            return;
        }

        try {
            const res = await getAppsScriptJson<{ 
                data: { submissionStatus: any, fileName: string, feedback: string } 
            }>(new URLSearchParams({
                action: "checkUserStatus",
                user_id: nickname,
                week: weekId.toString(),
                course_type: track
            }));

            if (res.data) {
                setStatusData({
                    submissionStatus: res.data.submissionStatus,
                    fileName: res.data.fileName,
                    feedback: res.data.feedback
                });
            }
        } catch (err) {
            console.error("Status check failed:", err);
        } finally {
            setIsChecking(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
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
            setErrorMsg("수강생 등록(로그인)이 필요합니다.");
            return;
        }
        if (!file) {
            setErrorMsg("업로드할 결과물 파일을 선택해주세요.");
            return;
        }

        const MAX_SIZE = 20 * 1024 * 1024; 
        if (file.size > MAX_SIZE) {
            setErrorMsg("파일 크기가 너무 큽니다. 20MB 이하의 파일만 제출할 수 있습니다.");
            return;
        }

        if (statusData.submissionStatus === 'verified') {
            const confirmed = window.confirm(
                `이미 제출된 [${statusData.fileName || "과제"}] 파일이 있습니다.\n\n새로운 파일로 교체하시겠습니까?`
            );
            if (!confirmed) return;
        }

        setIsUploading(true);
        setErrorMsg("");
        setUploadProgress(10);
        setUploadStep("파일 분석 중...");

        try {
            let fileToUpload = file;

            // [지능형 압축 엔진] 이미지 파일(JPG, PNG, WEBP)인 경우에만 다이어트 실행
            const isImage = file.type.startsWith("image/");
            if (isImage) {
                setUploadStep("이미지 고품질 다이어트 중... 🏃‍♂️");
                const options = {
                    maxSizeMB: 1, 
                    maxWidthOrHeight: 1920,
                    useWebWorker: true
                };
                try {
                    const compressedBlob = await imageCompression(file, options);
                    fileToUpload = new File([compressedBlob], file.name, { type: file.type });
                    setUploadProgress(40);
                } catch (compressionErr) {
                    console.warn("Compression failed, using original:", compressionErr);
                }
            } else {
                setUploadStep("파일 무결성 검사 중... 🔒");
                await delay(800);
                setUploadProgress(30);
            }

            setUploadStep("데이터 전송 준비 중...");
            const base64Data = await toBase64(fileToUpload);
            setUploadProgress(50);
            setUploadStep("구글 드라이브로 쾌속 전송 중... 🚀");

            const ext = fileToUpload.name.split('.').pop() || "";
            const gradeStr = profile?.grade ? `${profile.grade}학년` : "";
            const classStr = profile?.classGroup ? `${profile.classGroup}반` : "";
            const userInfoStr = (gradeStr || classStr) ? `${gradeStr}${classStr}_` : "";
            
            const sanitizedNickname = nickname.replace(/[^a-z0-9가-힣]/gi, '');
            const finalFileName = `${track}_${weekId}주차_${userInfoStr}${sanitizedNickname}.${ext}`;

            const payload = {
                action: "uploadHomework",
                user_id: nickname,
                course_type: track,
                week: weekId,
                grade_class: userInfoStr.replace('_', '') || "일반",
                file_name: finalFileName,
                mime_type: fileToUpload.type || "application/octet-stream",
                file_base64: base64Data
            };

            const response = await postAppsScript(payload);
            
            // [에러 가드] 서버 응답이 성공이 아닌 경우 즉시 팝업 표시
            if (response.status !== "success") {
                throw new Error(response.message || "구글 드라이브 서버 응답 오류");
            }

            setUploadProgress(85);
            setUploadStep("최종 제출 상태 확인 중...");

            await delay(2000);

            const checkResult = await getAppsScriptJson<{ data?: Record<string, boolean> }>(
                new URLSearchParams({
                    action: "getProgress",
                    user_id: nickname,
                })
            );

            setUploadProgress(100);

            if (checkResult?.data?.[`week${weekId}`] === true) {
                setModal({
                    isOpen: true,
                    type: "success",
                    message: `✨ 축하합니다! ${track} ${weekId}주차 과제가 제출되었습니다.`,
                });
                checkSubmissionStatus();
            } else {
                setModal({
                    isOpen: true,
                    type: "error",
                    message: `⚠️ 업로드 실패: 제출 결과를 확인하지 못했습니다.\n네트워크 상태나 관리자 설정을 확인해 주세요.`,
                });
            }
        } catch (err: any) {
            console.error("Upload error details:", err);
            setModal({
                isOpen: true,
                type: "error",
                message: `❌ 업로드 중 치명적 오류가 발생했습니다.\n\n원인: ${err.message || "알 수 없는 에러"}\n(관리자 URL 또는 폴더 ID 설정을 확인해 주세요.)`,
            });
            setErrorMsg("파일 업로드에 실패했습니다. 다시 시도해 주세요.");
        } finally {
            setIsUploading(false);
            setUploadStep("");
            setUploadProgress(0);
        }
    };

    const closeModal = () => {
        setModal({ ...modal, isOpen: false });
    };

    return (
        <section id="submission-section" className="relative w-full max-w-4xl mx-auto mt-24 scroll-mt-32">
            <div className="relative overflow-hidden rounded-[40px] border-2 border-[#2F3D4A] bg-white p-8 md:p-12 shadow-[6px_6px_0px_0px_#2F3D4A]">
                <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isChecking ? (
                        <div className="p-6 rounded-[32px] border-2 border-slate-100 bg-slate-50 animate-pulse flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-200" />
                            <div className="text-sm font-black text-slate-300 italic">상태 확인 중...</div>
                        </div>
                    ) : (
                        <>
                            <div className={`p-6 rounded-[32px] border-2 transition-all flex items-center gap-4 ${statusData.submissionStatus === 'verified' ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border ${statusData.submissionStatus === 'verified' ? 'bg-green-500 text-white border-green-400' : 'bg-slate-300 text-white border-slate-200'}`}>
                                    {statusData.submissionStatus === 'verified' ? '✅' : '❓'}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Submit Status</p>
                                    <h4 className="font-black text-[#2F3D4A] truncate max-w-[150px]">
                                        {statusData.submissionStatus === 'verified' ? '제출 완료' : '미제출 상태'}
                                    </h4>
                                    {statusData.submissionStatus === 'verified' && statusData.fileName && (
                                        <p className="text-[10px] text-green-600 font-bold truncate max-w-[140px] mt-0.5">
                                            📄 {statusData.fileName}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <div 
                                onClick={() => statusData.feedback && setIsFeedbackModalOpen(true)}
                                className={`p-6 rounded-[32px] border-2 border-slate-200 bg-white shadow-sm flex items-center gap-4 group transition-all ${statusData.feedback ? 'cursor-pointer hover:border-primary/30 hover:shadow-md' : 'cursor-default'}`}
                            >
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-xl border border-indigo-100 group-hover:bg-primary/10 transition-colors shrink-0">💬</div>
                                <div className="overflow-hidden flex-1">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Feedback</p>
                                    <h4 className="font-black text-[#2F3D4A] line-clamp-1">{statusData.feedback || "피드백 대기 중"}</h4>
                                    {statusData.feedback && (
                                        <p className="text-[10px] text-primary font-bold mt-0.5 animate-pulse">피드백 확인하기 &rarr;</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="relative mb-12 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[24px] bg-amber-100 flex items-center justify-center text-3xl border-2 border-[#2F3D4A] shadow-[2px_2px_0px_0px_#2F3D4A]">📤</div>
                    <div>
                        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-primary mb-1">Mission Complete</p>
                        <h3 className="text-3xl font-black text-[#2F3D4A]">
                            {weekId}주차 결과물 {statusData.submissionStatus === 'verified' ? "수정" : "제출"}
                        </h3>
                        <p className="mt-1 text-[16px] text-slate-600 font-medium">
                            {statusData.submissionStatus === 'verified' 
                                ? "이미 과제를 제출했습니다. 새로운 파일로 교체하시겠습니까?" 
                                : "완성된 프로젝트를 구글 드라이브에 안전하게 보관하세요."}
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="group relative border-2 border-dashed border-[#2F3D4A]/20 p-12 rounded-[40px] flex flex-col items-center justify-center gap-6 bg-slate-50 hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 cursor-pointer min-h-[220px]">
                        <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        {file ? (
                            <div className="flex flex-col items-center gap-4 text-primary animate-in zoom-in duration-300">
                                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-3xl mb-1 shadow-xl border border-primary/20">📄</div>
                                <div className="text-center">
                                    <h4 className="font-black text-lg mb-1">{file.name}</h4>
                                    <p className="text-xs opacity-70 font-bold">{(file.size / 1024).toFixed(1)} KB • 준비 완료</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                <div className="w-16 h-16 rounded-[24px] bg-slate-100 flex items-center justify-center text-3xl mb-1 border-2 border-[#2F3D4A]/10 group-hover:bg-primary/5 group-hover:text-primary transition-all">👇</div>
                                <div className="text-center font-black">
                                    {statusData.submissionStatus === 'verified' ? "교체할 새 파일을 올려주세요" : "여기에 파일을 올려주세요"}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={isUploading || !file}
                        className={`w-full py-6 rounded-[24px] text-lg font-black disabled:opacity-30 disabled:cursor-not-allowed transition-all flex flex-col justify-center items-center gap-2 border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] relative group overflow-hidden ${
                            isUploading ? 'bg-slate-100 text-slate-400' : 'bg-primary text-white hover:bg-primary/90'
                        }`}
                    >
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                        
                        {isUploading ? (
                            <div className="w-full px-8 py-3 bg-[#111111]/5 rounded-[20px] border border-[#111111]/10">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[13px] font-black text-black animate-pulse flex items-center gap-2">
                                         <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                                         {uploadStep}
                                    </span>
                                    <span className="text-[14px] font-black text-black bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">{uploadProgress}%</span>
                                </div>
                                <div className="w-full h-4 bg-slate-200/50 rounded-full overflow-hidden border-2 border-slate-200">
                                    <div 
                                        className="h-full bg-gradient-to-r from-primary via-[#60A5FA] to-primary transition-all duration-700 ease-out shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <span>{statusData.submissionStatus === 'verified' ? '🔄' : '✅'}</span> 
                                {statusData.submissionStatus === 'verified' ? '과제 수정하기 (다시 제출)' : '과제 제출 완료하기'}
                            </div>
                        )}
                    </button>
                    {errorMsg && <p className="text-center text-xs font-black text-destructive">{errorMsg}</p>}
                </div>
            </div>

            {/* Modal Components */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-background max-w-sm w-full p-10 rounded-[48px] shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300 text-center text-white">
                        <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-6 ${modal.type === 'success' ? 'bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]' : 'bg-destructive shadow-[0_0_30px_rgba(239,68,68,0.4)]'}`}>
                            <span className="text-3xl">{modal.type === 'success' ? '✅' : '⚠️'}</span>
                        </div>
                        <h3 className="text-3xl font-black mb-4 text-black">{modal.type === 'success' ? '제출 성공!' : '제출 실패'}</h3>
                        <p className="text-black font-black leading-relaxed mb-10 text-[18px] whitespace-pre-wrap">{modal.message}</p>
                        <button type="button" onClick={closeModal} className="w-full py-5 rounded-[24px] font-black text-white bg-primary shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all">확인</button>
                    </div>
                </div>
            )}
            
            {isFeedbackModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white max-w-2xl w-full max-h-[80vh] overflow-hidden rounded-[40px] shadow-2xl border-2 border-[#2F3D4A] flex flex-col">
                        <div className="p-8 border-b-2 border-[#2F3D4A] bg-amber-50 flex items-center justify-between">
                            <h3 className="text-xl font-black text-[#2F3D4A]">{weekId}주차 과제 피드백</h3>
                            <button onClick={() => setIsFeedbackModalOpen(false)} className="text-slate-400 text-3xl font-black">&times;</button>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1">
                            <MarkdownContent content={statusData.feedback} />
                        </div>
                        <div className="p-8 border-t-2 border-[#2F3D4A] bg-slate-50">
                            <button onClick={() => setIsFeedbackModalOpen(false)} className="w-full py-4 bg-[#2F3D4A] text-white rounded-[20px] font-black">확인했습니다</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { delay, getAppsScriptJson, postAppsScript } from "@/lib/appsScriptClient";
import { readLocalProfile } from "@/hooks/useLocalProfile";
import MarkdownContent from "@/components/MarkdownContent";
import type { UserProfile } from "@/types/auth";

interface UploadHomeworkProps {
    weekId: number;
}

export default function UploadHomework({ weekId }: UploadHomeworkProps) {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [modal, setModal] = useState<{ isOpen: boolean, type: 'success' | 'error' | 'feedback', message: string }>({ isOpen: false, type: 'success', message: '' });
    
    // [추가] 제출 상태 및 피드백 관련 상태
    const [statusData, setStatusData] = useState<{
        submissionStatus: 'not_found' | 'verified' | 'format_mismatch';
        fileName: string;
        feedback: string;
    }>({ submissionStatus: 'not_found', fileName: '', feedback: '' });
    
    const [isChecking, setIsChecking] = useState(true);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

    // 페이지 로드 시 제출 상태 확인
    useEffect(() => {
        checkSubmissionStatus();
    }, [weekId]);

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
                course_type: "POSE"
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

        // [추가] 재제출 컨펌 로직
        if (statusData.submissionStatus === 'verified') {
            const confirmed = window.confirm(
                `이미 제출된 [${statusData.fileName || "과제"}] 파일이 있습니다.\n\n새로운 파일로 교체하시겠습니까? (이전 파일은 휴지통으로 이동됩니다.)`
            );
            if (!confirmed) return;
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
                course_type: "POSE",
                week: weekId,
                grade_class: userInfoStr.replace('_', '') || "기타", // ✅ [추격] 학년반 데이터 추가
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

            // 앱스스크립트에서 보낸 소문자 키 확인
            if (checkResult?.data?.[`pose_week${weekId}`] === true) {
                setModal({
                    isOpen: true,
                    type: "success",
                    message: `✨ 축하합니다! AI 포즈 게임 ${weekId}주차 학습 파일이 제출되었습니다.`,
                });
                checkSubmissionStatus(); // 상단 상태 업데이트
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
        } finally {
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
        <section id="submission-section" className="relative w-full max-w-4xl mx-auto mt-20 scroll-mt-32">
            <div className="relative overflow-hidden rounded-[40px] border-2 border-[#2F3D4A] bg-white p-8 md:p-12 shadow-[6px_6px_0px_0px_#2F3D4A]">
                {/* Background Glow */}
                <div className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />

                {/* Status Banners (Bento Style) */}
                <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isChecking ? (
                        <>
                            <div className="p-6 rounded-[32px] border-2 border-slate-100 bg-slate-50 animate-pulse flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-200" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 w-20 bg-slate-200 rounded" />
                                    <div className="text-sm font-black text-slate-300 italic">상태 확인 중...</div>
                                </div>
                            </div>
                            <div className="p-6 rounded-[32px] border-2 border-slate-100 bg-slate-50 animate-pulse flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-200" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 w-20 bg-slate-200 rounded" />
                                    <div className="text-sm font-black text-slate-300 italic">피드백 조회 중...</div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={`p-6 rounded-[32px] border-2 transition-all flex items-center justify-between ${
                                statusData.submissionStatus === 'verified' ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border ${
                                        statusData.submissionStatus === 'verified' ? 'bg-blue-500 text-white border-blue-400' : 'bg-slate-300 text-white border-slate-200'
                                    }`}>
                                        {statusData.submissionStatus === 'verified' ? '✅' : '❓'}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Submit Status</p>
                                        <h4 className="font-black text-[#2F3D4A]">
                                            {statusData.submissionStatus === 'verified' ? (
                                                <span className="flex flex-col">
                                                    <span>과제 제출 완료</span>
                                                    {statusData.fileName && (
                                                        <span className="text-[10px] text-blue-600 font-medium truncate max-w-[150px]">
                                                            📄 {statusData.fileName}
                                                        </span>
                                                    )}
                                                </span>
                                            ) : '미제출 상태'}
                                        </h4>
                                    </div>
                                </div>
                            </div>
                            
                            <div 
                                onClick={() => statusData.feedback && setIsFeedbackModalOpen(true)}
                                className={`p-6 rounded-[32px] border-2 border-slate-200 bg-white shadow-sm flex items-center justify-between group hover:border-blue-400/30 transition-all ${statusData.feedback ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
                            >
                                <div className="flex items-center gap-4 w-full">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-xl border border-blue-100 group-hover:bg-blue-100 transition-colors shrink-0">
                                        💬
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Teacher Feedback</p>
                                        <h4 className="font-black text-[#2F3D4A] line-clamp-1">
                                            {statusData.feedback || "피드백을 기다리고 있어요."}
                                        </h4>
                                    </div>
                                    {statusData.feedback && (
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            보기 →
                                        </span>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="relative mb-12 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[24px] bg-blue-100 flex items-center justify-center text-3xl border-2 border-[#2F3D4A] shadow-[2px_2px_0px_0px_#2F3D4A]">
                        📤
                    </div>
                    <div>
                        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-blue-600 mb-1">Next Action</p>
                        <h3 className="text-3xl font-black text-[#2F3D4A]">{weekId}주차 결과물 제출</h3>
                        <p className="mt-1 text-[16px] text-slate-600 font-medium">실습한 코드나 티처블 머신 링크(.txt)를 업로드하세요.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8">
                    <div className="space-y-6">
                        <div className="group relative border-2 border-dashed border-[#2F3D4A]/20 p-12 rounded-[40px] flex flex-col items-center justify-center gap-6 bg-slate-50 hover:border-blue-400/40 hover:bg-blue-50/50 transition-all duration-500 cursor-pointer min-h-[280px]">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                accept=".html,.css,.js,.zip,.json,.md,.txt"
                            />
                            {file ? (
                                <div className="flex flex-col items-center gap-4 text-blue-600 animate-in zoom-in duration-300">
                                    <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center text-4xl mb-2 shadow-2xl border border-blue-500/20">
                                        📄
                                    </div>
                                    <div className="text-center">
                                        <h4 className="font-black text-xl mb-1">{file.name}</h4>
                                        <p className="text-sm opacity-70 font-bold">{(file.size / 1024).toFixed(1)} KB • 준비 완료</p>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); setFile(null); }}
                                        className="mt-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors relative z-20"
                                    >
                                        다른 파일 선택
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-slate-400 transition-transform group-hover:scale-105 duration-500">
                                    <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl mb-1 border-2 border-[#2F3D4A]/10 transition-all group-hover:border-blue-400/20 group-hover:bg-blue-50 group-hover:text-blue-500">
                                        👇
                                    </div>
                                    <div className="text-center">
                                        <span className="block font-black text-lg text-[#2F3D4A] group-hover:text-blue-600 transition-colors">클릭하거나 파일을 드래그하세요</span>
                                        <span className="block text-sm text-slate-400 mt-1 font-medium">txt, html, zip 등 모든 형식 지원</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {errorMsg && (
                            <div className="flex items-center gap-3 text-sm font-bold p-5 rounded-[24px] border border-destructive/20 text-destructive bg-destructive/10 animate-in slide-in-from-top-2">
                                ⚠️ {errorMsg}
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={isUploading || !file}
                            className="w-full py-6 bg-blue-600 text-white rounded-[24px] text-lg font-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-500 transition-all flex justify-center items-center gap-4 border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A]"
                        >
                            {isUploading ? (
                                <>
                                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    제출 중...
                                </>
                            ) : (
                                <>
                                    <span>{statusData.submissionStatus === 'verified' ? '🔄' : '🚀'}</span> 
                                    {statusData.submissionStatus === 'verified' ? '과제 수정하기 (다시 제출)' : 'POSE 결과물 제출 완료'}
                                </>
                            )}
                        </button>
                    </div>

                    <div className="p-8 rounded-[40px] bg-blue-50/50 border border-blue-100 flex flex-col justify-between">
                        <div>
                            <div className="flex gap-4 items-center mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-200">
                                    📘
                                </div>
                                <h4 className="font-black text-blue-600 uppercase tracking-widest text-sm">제출 규정</h4>
                            </div>
                            
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-sm font-medium text-slate-600">
                                    <span className="text-blue-500">✔</span> 본인이 직접 완성한 코드 및 모델 링크만 인정됩니다.
                                </li>
                                <li className="flex gap-3 text-sm font-medium text-slate-600">
                                    <span className="text-blue-500">✔</span> 여러 파일을 제출할 경우 .zip 압축 제출을 권장합니다.
                                </li>
                            </ul>
                        </div>

                        <div className="mt-8 pt-6 border-t border-blue-100">
                            <p className="text-[11px] text-slate-400 italic font-medium mb-2">* 폴더명 자동 생성 예시:</p>
                            <div className="p-3 rounded-xl bg-white border border-blue-100 font-mono text-[10px] text-blue-600/70 font-bold">
                                POSE_Week{weekId} / {readLocalProfile()?.grade}학년{readLocalProfile()?.classGroup}반 / {readLocalProfile()?.name}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Components (Reuse same logic as MBTI) */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white max-w-sm w-full p-10 rounded-[48px] shadow-2xl border-2 border-[#2F3D4A] animate-in zoom-in-95 duration-300 text-center">
                        <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-6 ${
                            modal.type === 'success' ? 'bg-green-500 text-white' : 'bg-destructive text-white'
                        }`}>
                            {modal.type === 'success' ? (
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            )}
                        </div>
                        <h3 className="text-2xl font-black mb-3">{modal.type === 'success' ? '제출 완료!' : '제출 실패'}</h3>
                        <p className="text-slate-500 font-medium leading-relaxed mb-8">{modal.message}</p>
                        <button onClick={closeModal} className="w-full py-4 bg-blue-600 text-white rounded-[20px] font-black shadow-lg">
                            {modal.type === 'success' ? '확인' : '다시 시도'}
                        </button>
                    </div>
                </div>
            )}

            {isFeedbackModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white max-w-2xl w-full max-h-[80vh] overflow-hidden rounded-[40px] shadow-2xl border-2 border-[#2F3D4A] animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-8 border-b-2 border-[#2F3D4A] bg-blue-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl shadow-lg">
                                    👨‍🏫
                                </div>
                                <div>
                                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Teacher Feedback</p>
                                    <h3 className="text-xl font-black text-[#2F3D4A]">{weekId}주차 피드백</h3>
                                </div>
                            </div>
                            <button onClick={() => setIsFeedbackModalOpen(false)} className="text-slate-400 hover:text-blue-600">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1">
                            <div className="bg-slate-50 p-6 rounded-[24px] border-2 border-dashed border-slate-200">
                                <MarkdownContent content={statusData.feedback} className="p-0 border-none" />
                            </div>
                        </div>
                        <div className="p-8 border-t-2 border-[#2F3D4A] bg-slate-50 text-right">
                            <button onClick={() => setIsFeedbackModalOpen(false)} className="px-10 py-4 bg-blue-600 text-white rounded-[20px] font-black">
                                확인했습니다
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

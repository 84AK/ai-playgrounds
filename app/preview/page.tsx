"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getAppsScriptJson } from "@/lib/appsScriptClient";
import { processDriveFile } from "@/lib/zipParser";

function PreviewEngine() {
  const searchParams = useSearchParams();
  const rawUrl = searchParams.get("url");
  const [loadingMsg, setLoadingMsg] = useState("🚀 구글 드라이브와 교신 중...");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!rawUrl) {
      setErrorMsg("유효한 URL이 제공되지 않았습니다.");
      return;
    }

    // 구글 드라이브 파일 ID 추출 (drive.google.com/open?id=xxx 또는 /file/d/xxx/view)
    let fileId = "";
    try {
      const urlObj = new URL(rawUrl);
      if (rawUrl.includes("id=")) {
        fileId = urlObj.searchParams.get("id") || "";
      } else if (rawUrl.includes("/file/d/")) {
        fileId = rawUrl.split("/file/d/")[1].split("/")[0];
      }
    } catch (e) {
      // 일반 URL 이라면 바로 iframe src로 던지기
      setPreviewSrc(rawUrl);
      return;
    }

    if (!fileId) {
      // 드라이브 링크가 아닌 일반 웹 링크라면 곧바로 로드
      setPreviewSrc(rawUrl);
      return;
    }

    const fetchArchiveAndPreview = async () => {
      try {
        // 1. GAS 백엔드에서 Base64로 인코딩된 데이터를 받아옴
        const result = await getAppsScriptJson<{ status: string, data: string, mimeType: string, name: string }>(new URLSearchParams({
          action: "getDriveFileBase64",
          fileId: fileId
        }));

        if (result.status !== "success" || !result.data) {
          throw new Error("과제 파일을 가져올 수 없습니다. 권한 문제이거나 파일이 삭제되었을 수 있습니다.");
        }

        setLoadingMsg("📦 압축 파일을 브라우저에서 푸는 중...");

        // 2. 받은 Base64 데이터를 파싱하여 구동 가능한 가상 주소 생성
        const parsed = await processDriveFile(result.data, result.mimeType || "", result.name || "");
        
        setPreviewSrc(parsed.previewUrl);

      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "로딩 중 오류가 발생했습니다.");
      }
    };

    fetchArchiveAndPreview();
  }, [rawUrl]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg text-center space-y-6">
          <div className="text-6xl text-rose-500">🚨</div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">앗, 파일을 열 수 없어요!</h2>
          <p className="text-sm font-bold text-slate-600 bg-rose-50 p-4 rounded-xl">{errorMsg}</p>
          <a href={rawUrl || ""} target="_blank" rel="noreferrer" className="inline-block w-full py-4 rounded-xl bg-primary text-white font-black hover:bg-primary/90 transition-all">
            그냥 원본 링크로 직접 다운로드하기
          </a>
        </div>
      </div>
    );
  }

  if (!previewSrc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#2F3D4A] space-y-6">
        <div className="w-24 h-24 border-8 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <h2 className="text-xl font-black text-white tracking-widest animate-pulse">{loadingMsg}</h2>
        <p className="text-sm font-medium text-white/50">파일 용량에 따라 최대 10~20초가 소요될 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex flex-col">
       <div className="h-12 bg-slate-900 border-b border-white/10 flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-3">
             <span className="text-primary font-black uppercase tracking-widest text-xs border border-primary px-2 py-0.5 rounded">Live Engine</span>
             <span className="text-white/60 text-xs font-medium">로컬 브라우저 내 가상 환경에서 실행 중입니다.</span>
          </div>
          <button onClick={() => window.close()} className="text-white/40 hover:text-white transition-colors text-xs font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md">
            창 닫기 ✕
          </button>
       </div>
       <iframe
         src={previewSrc}
         className="w-full flex-1 bg-white border-none"
         sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
         title="Live Preview"
       />
    </div>
  );
}

export default function PreviewPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center text-xl font-bold">로딩 중...</div>}>
            <PreviewEngine />
        </Suspense>
    )
}

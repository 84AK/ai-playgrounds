import JSZip from 'jszip';

// Base64 문자열을 Uint8Array로 변환하는 헬퍼 함수
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// ZIP 또는 HTML 파일 데이터를 파싱해서 브라우저 Iframe에 띄울 수 있는 Blob URL 반환
export async function processDriveFile(base64Data: string, mimeType: string, fileName: string) {
  const bytes = base64ToUint8Array(base64Data);

  // 1. 단일 HTML 파일인 경우 (MIME 타입이 HTML이거나 파일명이 .html로 끝날 때)
  if (mimeType.includes("text/html") || fileName.toLowerCase().endsWith(".html")) {
    const htmlContent = new TextDecoder("utf-8").decode(bytes);
    const iframeBlob = new Blob([htmlContent], { type: 'text/html' });
    const previewUrl = URL.createObjectURL(iframeBlob);
    return { previewUrl, isZip: false };
  }

  // 2. ZIP 파일인 경우 (그 외는 모두 ZIP으로 간주하여 시도)
  const zip = new JSZip();
  let contents;
  try {
    contents = await zip.loadAsync(bytes);
  } catch (err) {
    throw new Error("올바른 ZIP 압축 파일 또는 구동 가능한 HTML 파일이 아닙니다.");
  }

  let htmlContent = '';
  let cssContent = '';
  let jsContent = '';
  const assets: Record<string, Blob> = {};

  // 파일 분류 및 로드
  const fileArray = Object.values(contents.files).filter(f => !f.dir && !f.name.includes('__MACOSX'));
  
  for (const zipEntry of fileArray) {
    const fn = zipEntry.name.split('/').pop()?.toLowerCase() || "";
    
    if (fn === 'index.html' || fn === 'main.html' || fn === 'app.html') {
      // index.html 우선, 없다면 html 파일 아무거나
      if (!htmlContent || fn === 'index.html') {
          htmlContent = await zipEntry.async('string');
      }
    } else if (fn.endsWith('.html') && !htmlContent) {
      htmlContent = await zipEntry.async('string');
    } else if (fn.endsWith('.css')) {
      cssContent += await zipEntry.async('string') + '\n/*---*/\n';
    } else if (fn.endsWith('.js')) {
      jsContent += await zipEntry.async('string') + '\n/*---*/\n';
    } else if (fn.match(/\.(png|jpe?g|gif|svg|webp|ico)$/)) {
      assets[zipEntry.name] = await zipEntry.async('blob');
    }
  }

  if (!htmlContent) {
    throw new Error('압축 파일 내에 실행 가능한 HTML 파일(index.html 등)이 없습니다.');
  }

  let processedHtml = htmlContent;
  let processedCss = cssContent;
  let processedJs = jsContent;

  const assetUrls: Record<string, string> = {};
  for (const [assetPath, assetBlob] of Object.entries(assets)) {
    assetUrls[assetPath] = URL.createObjectURL(assetBlob);
  }

  // [개선] 모든 소스(HTML, CSS, JS)에서 에셋 경로를 발견하면 Blob URL로 치환하는 함수
  const applyAssetUrls = (source: string) => {
    let result = source;
    for (const [fullPath, blobUrl] of Object.entries(assetUrls)) {
      const fileName = fullPath.split('/').pop();
      if (!fileName) continue;

      const escapedName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 정규식 설명: 
      // 1. 인용구나 괄호로 시작되는 경로 문자열 매칭
      // 2. 파일명 앞에 경로(/assets/ 등)가 붙어있어도 함께 매칭되도록 [A-Za-z0-9_./-]* 추가
      // 3. gi 옵션으로 대소문자 무시 및 전체 검색
      const pathRegex = new RegExp(`(["'\\(])([A-Za-z0-9_./-]*${escapedName})(["'\\)])`, 'gi');
      result = result.replace(pathRegex, `$1${blobUrl}$3`);
    }
    return result;
  };

  // 모든 소스 코드에 치환 적용
  processedHtml = applyAssetUrls(processedHtml);
  processedCss = applyAssetUrls(processedCss);
  processedJs = applyAssetUrls(processedJs);

  // 기존 링크 제거 (중복 실행 방지)
  processedHtml = processedHtml.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '<!-- CSS Removed -->');
  processedHtml = processedHtml.replace(/<script[^>]*src=[^>]*><\/script>/gi, '<!-- JS Removed -->');

  // CSS/JS를 HTML 내부에 Inject
  let iframeHtml = processedHtml;
  
  if (processedCss) {
    const styleTag = `\n<style>\n${processedCss}\n</style>\n`;
    if (iframeHtml.includes('</head>')) {
      iframeHtml = iframeHtml.replace('</head>', `${styleTag}</head>`);
    } else {
      iframeHtml = styleTag + iframeHtml;
    }
  }

  if (processedJs) {
    const scriptTag = `\n<script>\n${processedJs}\n</script>\n`;
    if (iframeHtml.includes('</body>')) {
      iframeHtml = iframeHtml.replace('</body>', `${scriptTag}</body>`);
    } else {
      iframeHtml += scriptTag;
    }
  }

  const iframeBlob = new Blob([iframeHtml], { type: 'text/html' });
  const previewUrl = URL.createObjectURL(iframeBlob);

  return { previewUrl, isZip: true };
}

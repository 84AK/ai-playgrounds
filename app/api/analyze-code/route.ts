import { NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function POST(request: Request) {
  try {
    const { fileUrl, referenceCode, objective, week } = await request.json();
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const authHeader = request.headers.get('Authorization');

    // 1. 관리자 인증 체크
    if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
      return NextResponse.json({ error: 'Unauthorized: 관리자 인증이 필요합니다.' }, { status: 401 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key is not configured' }, { status: 500 });
    }

    // 1. 구글 드라이브 파일 다운로드 및 압축 해제 (서버측 처리로 CORS 회피)
    const studentFiles: { name: string; content: string }[] = [];
    if (fileUrl) {
      try {
        const fileRes = await fetch(fileUrl);
        if (!fileRes.ok) throw new Error(`파일 다운로드 실패: ${fileRes.status}`);
        
        const arrayBuffer = await fileRes.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        for (const [filename, file] of Object.entries(zip.files)) {
          if (!file.dir && (filename.endsWith('.html') || filename.endsWith('.css') || filename.endsWith('.js'))) {
            const content = await file.async("string");
            studentFiles.push({ name: filename, content: content });
          }
        }
      } catch (err: any) {
        console.error('File Processing Error:', err);
        return NextResponse.json({ error: `파일 처리 중 오류 발생: ${err.message}` }, { status: 500 });
      }
    }

    if (studentFiles.length === 0) {
      return NextResponse.json({ error: '분석할 학생 코드가 없거나 파일 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    // 2. Gemini 3.1 Pro API URL

    // Gemini 2.5 Pro API URL (2026년 현재 가장 안정적이고 뛰어난 모델)
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

    const prompt = `
[역할]
당신은 학생의 코드를 분석하고 성장을 실질적으로 돕는 담백하고 전문적인 프론트엔드 선생님입니다.

[제약 사항]
- 절대 자기소개나 도입부 문구(예: 안녕하세요, 저는 누구입니다...)를 넣지 마세요.
- 첫 문장은 반드시 "### 💌 ${week}주차 과제 피드백"으로 시작하세요.
- 수식어구나 미사여구를 최대한 배제하고, 핵심만 전달하는 '담백한 선생님'의 어조를 사용하세요.
- 각 항목은 불필요한 서술 없이 간결한 개조식 또는 짧은 문장으로 작성하세요.

[분석 대상]
1. 학습 목표 (${week}주차): ${objective}
2. 선생님 정답 코드: ${referenceCode}
3. 학생 제출 코드: ${studentFiles.map((f: any) => `파일: ${f.name}\n내용:\n${f.content}`).join('\n\n---\n\n')}

[응답 구성 가이드]
### 💌 ${week}주차 과제 피드백

**✅ 좋았던 점**
(학습 목표 달성도, 코드의 깔끔함, 창의적인 시도 등 핵심 장점 2~3가지)

**🚨 보완하면 좋을 점**
(정답 코드와의 차이점, 버그 가능성, 성능 개선 제안 등 실질적인 보완점 2~3가지)

**💡 한 줄 가이드**
(다음 단계로 나아가기 위한 가장 중요한 핵심 조언 한 문장)

[평가 점수: X/100]

[주의] 모든 내용은 한국어로 작성하며, 끊김 없이 완성된 문장으로 마무리하세요.
`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5, // 조금 더 일관성 있고 담백한 답변을 위해 온도를 낮춤
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096, // 끊김 방지
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Gemini API error');
    }

    const aiFeedback = data.candidates?.[0]?.content?.parts?.[0]?.text || '피드백을 생성할 수 없습니다.';
    
    return NextResponse.json({ feedback: aiFeedback });
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

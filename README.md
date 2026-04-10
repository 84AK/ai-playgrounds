# 🚀 AI Labs - Student Learning & Project Ecosystem

인공지능 연구소(AI Playgrounds)는 학생들이 AI 기술을 학습하고, 자신의 프로젝트를 실시간으로 전시 및 관리할 수 있는 통합 교육 플랫폼입니다. 2026년 최신 웹 트렌드와 Google Workspace 연동 기술을 기반으로 구축되었습니다.

## ✨ 주요 기능
- **통합 대시보드**: 학생별 MBTI 및 POSE 학습 진도율 실시간 동기화 및 랭킹 시스템.
- **스마트 과제 관리**: Google Drive 연동을 통한 주차별 과제 자동 분류 및 재제출(자동 교치) 시스템.
- **라이브 쇼케이스**: 학생들이 제작한 웹 결과물을 브라우저 내 가상 환경에서 즉시 실행해 볼 수 있는 라이브 프리뷰 엔진.
- **선생님 피드백**: 제출된 과제에 대한 맞춤형 피드백 확인 및 실시간 반영.

## 🛠️ 기술 스택
- **Frontend**: Next.js 15 (App Router), Tailwind CSS (Bento Grid Layout), Framer Motion.
- **Backend**: Google Apps Script (GAS) API - 서버 사이드 프록시 통신.
- **Storage**: Google Drive API & Google Sheets (Database).
- **Core Logic**: JSZip 기반 브라우저 사이드 런타임 엔진.

## ⚙️ 설정 방법 (Getting Started)

1. **환경 변수 설정**:
   `.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 필요한 값을 입력합니다.
   ```bash
   cp .env.example .env.local
   ```

2. **패키지 설치**:
   ```bash
   npm install
   ```

3. **로컬 실행**:
   ```bash
   npm run dev
   ```

## 🔗 Official Link
- [아크랩스 (AkLabs)](https://litt.ly/aklabs)

---
© 2026 AI Playgrounds. Designed with Antigravity.

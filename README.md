# 🚀 AI Labs - Student Learning & Project Ecosystem

인공지능 연구소(AI Playgrounds)는 학생들이 AI 기술을 학습하고, 자신의 프로젝트를 실시간으로 전시 및 관리할 수 있는 통합 교육 플랫폼입니다. 2026년 최신 웹 트렌드와 **분산형 멀티 테넌트(Decentralized Multi-tenant)** 구조를 기반으로 구축되어, 각 교사가 독립적인 학습 환경을 즉시 구축할 수 있습니다.

## ✨ 주요 기능
- **분산형 전용 백엔드**: 교사별 독립적인 Google Sheets 및 Drive 환경 구축 (쿠키 기반 동적 라우팅).
- **통합 대시보드**: 학생별 학습 진도율 실시간 동기화 및 랭킹 시스템.
- **스마트 과제 관리**: 주차별/학년반별 자동 폴더 분류 및 지능형 재제출(자동 교체) 시스템 (GAS V7.8).
- **라이브 쇼케이스**: 학생들이 제작한 웹 결과물을 브라우저 내 가상 환경에서 즉시 실행해 볼 수 있는 라이브 프리뷰 엔진.
- **선생님 피드백**: 실시간 제출 확인 및 개별 맞춤 피드백 시스템.

## 🔗 Official Link
- **[아크랩스 (AkLabs) 공식 홈페이지] (https://litt.ly/aklabs)**

## ⚙️ 설정 방법 (Getting Started)

1. **환경 변수 설정**:
   `.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 필요한 값을 입력합니다.
   ```bash
   cp .env.example .env.local
   ```

2. **Apps Script 구축**:
   관리자 설정(Setup) 페이지에서 제공하는 V7.8 마스터 코드를 구글 앱스스크립트에 배포합니다.

3. **로컬 실행**:
   ```bash
   npm install
   npm run dev
   ```

---
© 2026 AI Playgrounds. Designed with Antigravity. Hosted by [AkLabs](https://litt.ly/aklabs).

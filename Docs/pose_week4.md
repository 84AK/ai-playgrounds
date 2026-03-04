```
# 4주차 학습 가이드: 게임 완성 및 배포

## 🎯 이번 시간 목표
- 게임을 나만의 스타일로 꾸밉니다
- 카카오톡 공유 기능을 추가합니다
- GitHub Pages로 게임을 배포합니다
- 친구들과 게임을 공유합니다

## ⏱️ 시간 배열 (60분)
- **0-20분**: 게임 디자인 커스터마이징
- **20-35분**: 카카오톡 공유 기능
- **35-50분**: GitHub Pages 배포
- **50-60분**: 최종 테스트 및 공유

---

## 📝 Step 1: 게임 커스터마이징 (20분)

### 강사 설명

```
"이제 여러분만의 개성을 담을 시간이에요!
AI한테 도움을 받아서 테마를 바꿔봅시다.
우주 테마? 바다 테마? 뭐든 가능해요!"
```

### 테마 선택하기

**학생 활동: 테마 브레인스토밍**
```
예시 테마:
- 우주 (로켓 + 운석)
- 바다 (잠수함 + 상어)
- 정글 (새 + 나무)
- 사막 (낙타 + 선인장)
- 미래 도시 (드론 + 건물)
```

### AI에게 테마 구현 요청

**ChatGPT/Claude에게 물어보기**
```
"내 비행기 게임을 우주 테마로 바꾸고 싶어.
배경을 별이 빛나는 우주로, 비행기를 로켓으로,
장애물을 운석으로 바꾸고 싶어.
코드를 어떻게 수정하면 될까?"```


### 테마별 코드 예시

**우주 테마**

javascript


```// 배경 그리기 (별이 반짝이는 우주)
let stars = [];

function initStars() {
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: Math.random() * 2 + 1
        });
    }
}

function drawBackground() {
    // 우주 배경 (어두운 그라데이션)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000428');
    gradient.addColorStop(1, '#004e92');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 별 그리기
    ctx.fillStyle = 'white';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 별 움직이기
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

initStars();```


**바다 테마**

javascript


```// 물결 효과
let waveOffset = 0;

function drawBackground() {
    // 바다 배경
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#006994');
    gradient.addColorStop(1, '#003d5c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 물결 그리기
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 10) {
            const y = 100 + i * 150 + Math.sin((x + waveOffset) * 0.02) * 20;
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
    
    waveOffset += 2;
}
```

### 색상 팔레트 변경

**AI에게 색상 추천 받기**
```
"우주 테마에 어울리는 색상 조합을 추천해줘.
배경색, 플레이어색, 장애물색, UI 색상."
```

**예시 응답**
```
우주 테마:
- 배경: #000428 → #004e92
- 로켓: #FF6B6B (빨간색)
- 운석: #8B7355 (회갈색)
- UI: #FFD700 (금색)
- 별: #FFFFFF (흰색)```


### 폰트 및 UI 스타일 변경

javascript


```// 구글 폰트 추가 (HTML head에)
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap" rel="stylesheet">

// CSS 스타일
body {
    font-family: 'Orbitron', sans-serif; // 우주 느낌 폰트
}

// UI 그리기
function drawUI() {
    // 네온 효과
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ff00';
    
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 32px Orbitron';
    ctx.fillText(`점수: ${score}```
, 20, 50);
    
    ctx.shadowBlur = 0; // 그림자 끄기
}

```

---

## 📝 Step 2: 카카오톡 공유 기능 (15분)

### 강사 설명
```
"이제 게임을 친구들한테 자랑할 시간이에요!
카카오톡으로 공유하는 기능을 만들어봅시다."```


### Kakao SDK 추가

**HTML에 스크립트 추가**

html


```<head>
    <!-- 카카오 SDK -->
    <script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.0/kakao.min.js"></script>
</head>
```

### 카카오 개발자 앱 키 발급

**학생 활동**
```
1. https://developers.kakao.com/ 접속
2. 로그인 (카카오 계정)
3. '내 애플리케이션' → '애플리케이션 추가하기'
4. 앱 이름: '포즈 비행기 게임'
5. JavaScript 키 복사```


### 카카오 SDK 초기화

javascript


```// 카카오 SDK 초기화 (페이지 로드 시)
Kakao.init('여러분의_JavaScript_키'); 

console.log(Kakao.isInitialized()); // true 확인```


### 공유 버튼 추가

**HTML**

html


```<button id="kakaoShareBtn" style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 15px 30px;
    font-size: 18px;
    background: #FEE500;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
">
    카카오톡 공유하기
</button>```


### 공유 기능 구현

javascript


```document.getElementById('kakaoShareBtn').addEventListener('click', () => {
    Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            title: '포즈 비행기 게임',
            description: `내 최고 점수: ${highScore}점! 나를 이길 수 있어?```
,
            imageUrl: 'https://여러분의게임주소/assets/thumbnail.png',
            link: {
                mobileWebUrl: 'https://여러분의게임주소',
                webUrl: 'https://여러분의게임주소'
            }
        },
        buttons: [
            {
                title: '게임 하러 가기',
                link: {
                    mobileWebUrl: 'https://여러분의게임주소',
                    webUrl: 'https://여러분의게임주소'
                }
            }
        ]
    });
});

```

### 썸네일 이미지 만들기

**AI에게 요청**
```
"포즈 비행기 게임의 카카오톡 공유용 썸네일을 만들어줘.
1200x630 크기, 게임 제목과 비행기 이미지가 들어가면 좋겠어."
```

---

## 📝 Step 3: GitHub Pages 배포 (15분)

### 강사 설명
```
"이제 게임을 인터넷에 올려서
전 세계 누구나 플레이할 수 있게 만들어요!
GitHub Pages는 무료로 웹사이트를 호스팅해줘요."
```

### GitHub 계정 만들기

**학생 활동**
```
1. https://github.com 접속
2. Sign up (회원가입)
3. 이메일 인증
4. Username 설정 (나중에 주소가 됨: username.github.io)
```

### GitHub Desktop 설치 (선택)

**방법 1: GitHub Desktop 사용 (쉬움)**
```
1. https://desktop.github.com 에서 다운로드
2. 설치 후 GitHub 계정 로그인
3. 'Create New Repository' 클릭
4. Name: pose-game (또는 원하는 이름)
5. Local Path: 게임 폴더 선택
6. Create Repository
```

**방법 2: 웹에서 직접 업로드**
```
1. GitHub.com에서 'New repository' 클릭
2. Repository name: pose-game
3. Public 선택
4. Create repository
5. 'uploading an existing file' 클릭
6. 게임 폴더의 모든 파일 드래그 앤 드롭
7. Commit changes
```

### GitHub Pages 활성화
```
1. Repository → Settings
2. 왼쪽 메뉴에서 'Pages' 클릭
3. Source: 'Deploy from a branch'
4. Branch: main (또는 master) 선택
5. Save
6. 5분 정도 기다리면 URL 생성됨!
```

### 배포 URL 확인
```
생성된 주소:
https://username.github.io/pose-game/

예시:
https://john-kim.github.io/pose-game/
```

### 🎯 체크포인트
- [ ] GitHub에 게임 파일 업로드 완료
- [ ] GitHub Pages 활성화 완료
- [ ] 웹 주소로 게임 접속 가능
- [ ] 친구 휴대폰에서도 접속 가능

---

## 📝 Step 4: 최종 테스트 및 마무리 (10분)

### 모바일 테스트

**학생 활동**
```
1. 휴대폰에서 게임 URL 접속
2. 웹캠 권한 허용
3. 포즈로 게임 테스트
4. 카카오톡 공유 테스트```


### 반응형 디자인 (보너스)

**모바일 최적화**

html


```<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

<style>
@media (max-width: 768px) {
    #gameCanvas {
        width: 100vw;
        height: 100vh;
    }
    
    #info {
        font-size: 16px;
        padding: 10px;
    }
}
</style>```


### README.md 작성

**GitHub README 추가**

markdown


```# 포즈 비행기 게임 🚀

## 소개
포즈 인식 AI로 조종하는 비행기 게임입니다.

## 플레이 방법
1. 웹캠 권한 허용
2. 왼쪽/오른쪽으로 몸을 기울여 비행기 조종
3. 떨어지는 구름을 피하세요!

## 기술 스택
- HTML5 Canvas
- JavaScript
- Teachable Machine (Pose Detection)

## 플레이하기
[게임 하러 가기](https://username.github.io/pose-game/)

## 개발자
- 이름: [여러분 이름]
- 이메일: [이메일]
```

### 최종 체크리스트
```
✅ 게임 기능
- [ ] 포즈로 캐릭터 조종
- [ ] 장애물 피하기
- [ ] 점수 시스템
- [ ] 게임 오버 / 재시작
- [ ] 최고 점수 기록

✅ 디자인
- [ ] 테마 적용 (우주/바다 등)
- [ ] 색상 조합
- [ ] 폰트 스타일
- [ ] UI 배치

✅ 공유 기능
- [ ] 카카오톡 공유 버튼
- [ ] 썸네일 이미지
- [ ] 점수 메시지

✅ 배포
- [ ] GitHub 업로드
- [ ] GitHub Pages 활성화
- [ ] 모바일 테스트
- [ ] 친구들과 공유
```

---

## 🎉 프로젝트 완성!

### 학생 발표 (선택)

**발표 구성**
```
1. 게임 소개 (30초)
   - 어떤 게임인가요?
   - 어떤 테마를 선택했나요?

2. 시연 (1분)
   - 직접 플레이해보기
   - 특별한 기능 보여주기

3. 제작 후기 (30초)
   - 재밌었던 점
   - 어려웠던 점
   - 배운 점
```

### 친구들과 점수 경쟁

**활동**
```
1. 모두의 게임 URL을 화이트보드에 적기
2. 돌아가면서 서로의 게임 플레이
3. 최고 점수 기록하기
4. 1등에게 상품! 🏆
```

---

## 🏠 추가 개선 아이디어

### 초급
1. **다른 포즈 추가**: 위/아래로 움직이기
2. **배경 음악**: 게임에 음악 추가
3. **파워업 아이템**: 무적, 슬로우 모션

### 중급
4. **스토리 모드**: 레벨별 스테이지
5. **멀티플레이어**: 친구와 동시에 플레이
6. **리더보드**: 전체 순위 표시 (Firebase 사용)

### 고급
7. **캐릭터 커스터마이징**: 비행기 색상/스킨 변경
8. **업적 시스템**: 100점 돌파, 완벽한 게임 등
9. **모바일 앱**: PWA로 앱처럼 설치

---

## 📚 마무리 및 다음 단계

### 배운 내용 정리
```
✅ AI 기술
- 티처블머신으로 포즈 학습
- 실시간 포즈 인식
- AI 모델을 웹에 연결

✅ 웹 개발
- HTML, CSS, JavaScript
- Canvas로 게임 만들기
- 이미지, 사운드 다루기

✅ 게임 개발
- 충돌 감지
- 애니메이션
- 게임 루프

✅ 배포 & 공유
- GitHub Pages
- 카카오톡 공유
- 모바일 최적화
```

### 다음에 도전해볼 것

**추천 프로젝트**
```
1. AI 채팅봇 만들기
2. 얼굴 인식으로 조종하는 게임
3. 음성 인식 명령 게임
4. VR/AR 게임 (A-Frame)
5. 멀티플레이어 온라인 게임
```

### 유용한 자료
```
📚 학습 자료
- MDN Web Docs (JavaScript 참고서)
- W3Schools (HTML/CSS 튜토리얼)
- Teachable Machine 공식 문서

🎮 게임 에셋
- OpenGameArt.org
- itch.io
- Kenney.nl

💬 커뮤니티
- Stack Overflow (질문)
- GitHub (코드 공유)
- Discord (개발자 커뮤니티)
```

---

## 💬 강사 마무리 멘트
```
"여러분, 정말 수고하셨어요! 🎉

4주 전에는 코딩이 뭔지도 몰랐는데,
이제 AI를 활용해서 게임을 만들고
인터넷에 배포까지 했어요!

더 중요한 건, 이제 여러분은
'어떻게 만들지?' 를 스스로 해결할 수 있어요.
AI에게 물어보고, 검색하고, 시도해보면서요.

이게 바로 '진짜 코딩 능력'이에요.

앞으로도 계속 재밌는 것들 만들어보세요!
여러분은 할 수 있어요! 💪

그리고 게임 URL 꼭 선생님한테 공유해주세요!
선생님도 도전해볼게요! 😄"
```

---

## 📊 교육 효과 평가 (강사용)

### 체크리스트
```
학습 목표 달성도:
□ AI 포즈 인식 이해
□ 웹 개발 기초 습득
□ 게임 로직 구현
□ 배포 및 공유 경험

학생 참여도:
□ 적극적으로 질문함
□ 창의적으로 커스터마이징함
□ 친구들과 협력함
□ 과제를 완수함

기술적 성취:
□ 티처블머신 활용
□ Canvas 그래픽 이해
□ 이벤트 처리
□ GitHub 사용법`
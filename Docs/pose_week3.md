```
# 3주차 학습 가이드: 3D 비행기 게임 만들기

## 🎯 이번 시간 목표
- 2D 게임을 3D처럼 보이게 만듭니다
- 비행기 이미지를 사용합니다
- 구름 장애물과 충돌 효과를 추가합니다
- 게임 시작/종료 화면을 만듭니다

## ⏱️ 시간 배열 (60분)
- **0-15분**: 비행기 이미지 추가 및 3D 효과
- **15-35분**: 구름 장애물 및 원근감 구현
- **35-50분**: 폭발 효과 및 사운드
- **50-60분**: 시작 화면 및 최종 테스트

---

## 📝 Step 1: 비행기 이미지 준비 (15분)

### 강사 설명

```
"지금까지는 동그라미로 캐릭터를 만들었죠?
이제 진짜 비행기처럼 보이게 만들어볼 거예요!
AI한테 비행기 이미지도 만들어달라고 할 수 있어요."
```

### AI로 이미지 생성하기

**학생 활동: AI에게 요청**
```
"간단한 픽셀아트 스타일의 빨간색 비행기 이미지를 만들어줘.
배경은 투명하게, PNG 형식으로."

또는

"게임에 사용할 만한 귀여운 비행기 그림을 그려줘.
측면에서 본 모습으로."
```

**또는 무료 이미지 사이트**
- OpenGameArt.org
- itch.io (무료 게임 에셋)
- Kenney.nl (무료 게임 에셋)

### 이미지 추가하기

**폴더 구조**
```
pose-game/
├── game.html
└── assets/
    ├── plane.png      (비행기)
    ├── cloud.png      (구름)
    └── explosion.png  (폭발 효과)```


### 이미지 로드 코드

**boilerplate/session3/game.html** (수정)

javascript


```// 이미지 로드
let images = {
    plane: new Image(),
    cloud: new Image(),
    explosion: new Image()
};

let imagesLoaded = 0;
const totalImages = 3;

// 이미지 로드 완료 체크
function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        init(); // 모든 이미지 로드되면 게임 시작
    }
}

images.plane.onload = onImageLoad;
images.cloud.onload = onImageLoad;
images.explosion.onload = onImageLoad;

images.plane.src = 'assets/plane.png';
images.cloud.src = 'assets/cloud.png';
images.explosion.src = 'assets/explosion.png';

// 초기화 함수
function init() {
    initPoseDetection();
    gameLoop();
}```


### 비행기 그리기 (원 대신)

javascript


```// 플레이어 업데이트
let player = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    width: 80,   // 이미지 너비
    height: 60,  // 이미지 높이
    speed: 8
};

// 비행기 그리기
function drawPlayer() {
    if (!gameOver) {
        ctx.drawImage(
            images.plane,
            player.x - player.width / 2,  // 중심 기준
            player.y - player.height / 2,
            player.width,
            player.height
        );
    }
}
```

### 🎯 체크포인트
- [ ] 비행기 이미지가 보이나요?
- [ ] 포즈로 비행기가 움직이나요?

---

## 📝 Step 2: 3D 원근감 효과 (20분)

### 강사 설명
```
"게임이 더 실감나게 보이려면 '원근감'이 필요해요.
멀리 있는 구름은 작게, 가까이 있는 구름은 크게 보이는 거죠.
비행기가 하늘을 날아가는 것처럼 보이게 만들어봅시다!"```


### 구름 장애물 (3D 효과)

javascript


```// 구름 생성
function createCloud() {
    const depth = Math.random(); // 0~1 사이 (깊이감)
    const scale = 0.3 + depth * 0.7; // 크기 (0.3~1.0)
    const speed = 2 + depth * 4; // 속도 (2~6)
    
    const cloud = {
        x: Math.random() * canvas.width,
        y: -100,
        width: 100 * scale,
        height: 60 * scale,
        speed: speed,
        depth: depth, // 깊이 (0=멀리, 1=가까이)
        alpha: 0.5 + depth * 0.5 // 투명도
    };
    
    obstacles.push(cloud);
}

// 구름 그리기
function drawObstacles() {
    // 깊이 순서로 정렬 (멀리 있는 것부터)
    obstacles.sort((a, b) => a.depth - b.depth);
    
    obstacles.forEach(cloud => {
        ctx.globalAlpha = cloud.alpha;
        ctx.drawImage(
            images.cloud,
            cloud.x - cloud.width / 2,
            cloud.y,
            cloud.width,
            cloud.height
        );
    });
    
    ctx.globalAlpha = 1.0; // 원래대로
}

// 구름 생성 간격 조정
setInterval(createCloud, 1500); // 1.5초마다```


### 배경 스크롤 효과 (하늘)

javascript


```// 배경 그리기
let bgY = 0;
function drawBackground() {
    // 그라데이션 배경
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');    // 하늘색
    gradient.addColorStop(0.5, '#B0E0E6');  // 연한 하늘
    gradient.addColorStop(1, '#E0F6FF');    // 더 연한 하늘
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 움직이는 구름 패턴 (선택)
    bgY += 0.5;
    if (bgY > canvas.height) bgY = 0;
}

// 게임 루프에 추가
function gameLoop() {
    if (gameOver) return;
    
    drawBackground(); // 맨 먼저!
    updatePlayer();
    updateObstacles();
    checkCollisions();
    drawObstacles();
    drawPlayer();
    drawUI(); // UI는 맨 나중에
    
    requestAnimationFrame(gameLoop);
}```


### UI 그리기

javascript


```function drawUI() {
    // 점수
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`점수: ${score}```
, 20, 50);
    
    // 현재 포즈
    ctx.font = '24px Arial';
    ctx.fillText(
```포즈: ${currentPose}```
, 20, 90);
    
    // 최고 점수
    ctx.font = '20px Arial';
    ctx.fillText(
```최고: ${highScore}```
, 20, 120);
}

// 최고 점수 변수
let highScore = 0;
```

---

## 📝 Step 3: 충돌 효과 및 사운드 (15분)

### 폭발 애니메이션

javascript

```
// 폭발 효과 데이터
let explosion = {
    active: false,
    x: 0,
    y: 0,
    frame: 0,
    maxFrames: 10
};

// 충돌 시 폭발 효과
function triggerExplosion(x, y) {
    explosion.active = true;
    explosion.x = x;
    explosion.y = y;
    explosion.frame = 0;
}

// 폭발 그리기
function drawExplosion() {
    if (!explosion.active) return;
    
    const size = 80 + explosion.frame * 10; // 점점 커짐
    const alpha = 1 - explosion.frame / explosion.maxFrames; // 점점 투명
    
    ctx.globalAlpha = alpha;
    ctx.drawImage(
        images.explosion,
        explosion.x - size / 2,
        explosion.y - size / 2,
        size,
        size
    );
    ctx.globalAlpha = 1.0;
    
    explosion.frame++;
    if (explosion.frame >= explosion.maxFrames) {
        explosion.active = false;
    }
}

// 충돌 감지 수정
function checkCollisions() {
    if (gameOver) return;
    
    obstacles.forEach((cloud, index) => {
        // 충돌 체크 (사각형끼리)
        if (player.x < cloud.x + cloud.width / 2 &&
            player.x + player.width / 2 > cloud.x &&
            player.y < cloud.y + cloud.height &&
            player.y + player.height / 2 > cloud.y) {
            
            // 게임 오버
            gameOver = true;
            triggerExplosion(player.x, player.y);
            
            // 최고 점수 업데이트
            if (score > highScore) {
                highScore = score;
            }
            
            setTimeout(showGameOver, 500); // 0.5초 후
        }
    });
}

// 게임 루프에 폭발 추가
function gameLoop() {
    if (gameOver) {
        drawExplosion(); // 폭발 애니메이션 계속
        if (explosion.active) {
            requestAnimationFrame(gameLoop);
        }
        return;
    }
    
    // ... 나머지 코드
}
```

### 사운드 효과 (선택)

**HTML5 Audio API 사용**

javascript

```
// 사운드 로드
const sounds = {
    explosion: new Audio('assets/explosion.mp3'),
    score: new Audio('assets/score.mp3')
};

// 점수 증가 시
function updateObstacles() {
    obstacles.forEach((cloud, index) => {
        cloud.y += cloud.speed;
        
        if (cloud.y > canvas.height) {
            obstacles.splice(index, 1);
            score++;
            sounds.score.play(); // 사운드 재생!
        }
    });
}

// 충돌 시
function checkCollisions() {
    // ... 충돌 감지 후
    sounds.explosion.play();
}

```

**AI에게 요청**
```
"게임에 사용할 짧은 효과음을 추천해줘.
폭발 소리와 점수 획득 소리가 필요해."```


---

## 📝 Step 4: 시작 화면 및 재시작 (10분)

### 게임 상태 관리

javascript


```// 게임 상태
let gameState = 'start'; // 'start', 'playing', 'gameover'

// 시작 화면
function drawStartScreen() {
    drawBackground();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('포즈 비행기 게임', canvas.width / 2, canvas.height / 2 - 100);
    
    ctx.font = '28px Arial';
    ctx.fillText('왼쪽/오른쪽으로 기울여서 비행기를 조종하세요', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '32px Arial';
    ctx.fillText('스페이스바를 눌러 시작', canvas.width / 2, canvas.height / 2 + 80);
    
    // 비행기 미리보기
    ctx.drawImage(
        images.plane,
        canvas.width / 2 - 40,
        canvas.height / 2 - 200,
        80, 60
    );
}

// 키보드 입력
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameState === 'start') {
            startGame();
        } else if (gameState === 'gameover') {
            restartGame();
        }
    }
});

// 게임 시작
function startGame() {
    gameState = 'playing';
    score = 0;
    obstacles = [];
    gameLoop();
}

// 게임 재시작
function restartGame() {
    gameState = 'playing';
    gameOver = false;
    score = 0;
    obstacles = [];
    player.x = canvas.width / 2;
    player.y = canvas.height - 150;
    gameLoop();
}

// 게임 오버 화면 수정
function showGameOver() {
    gameState = 'gameover';
    
    drawBackground();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('게임 오버!', canvas.width / 2, canvas.height / 2 - 60);
    
    ctx.font = '36px Arial';
    ctx.fillText(`점수: ${score}```
, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(
```최고: ${highScore}```
, canvas.width / 2, canvas.height / 2 + 60);
    
    ctx.font = '24px Arial';
    ctx.fillText('스페이스바로 다시 시작', canvas.width / 2, canvas.height / 2 + 120);
}

// 메인 게임 루프 수정
function gameLoop() {
    if (gameState === 'start') {
        drawStartScreen();
        requestAnimationFrame(gameLoop);
        return;
    }
    
    if (gameOver) {
        drawExplosion();
        if (explosion.active) {
            requestAnimationFrame(gameLoop);
        }
        return;
    }
    
    // 게임 플레이 중
    drawBackground();
    updatePlayer();
    updateObstacles();
    checkCollisions();
    drawObstacles();
    drawPlayer();
    drawUI();
    
    requestAnimationFrame(gameLoop);
}

```

---

## 🎮 Step 5: 최종 테스트 및 디버깅 (10분)

### 완성 체크리스트
- [ ] 시작 화면이 보임
- [ ] 스페이스바로 게임 시작
- [ ] 포즈로 비행기 조종
- [ ] 구름이 3D 원근감 있게 날아옴
- [ ] 충돌 시 폭발 효과
- [ ] 게임 오버 후 재시작 가능
- [ ] 최고 점수 기록

### 버그 수정 체크리스트

**자주 발생하는 문제**
```
1. 이미지가 안 보여요
   → 파일 경로 확인: assets/plane.png
   → 브라우저 콘솔(F12) 확인

2. 포즈 인식이 느려요
   → 웹캠 해상도 낮추기: const size = 200;

3. 게임이 너무 어려워요
   → 구름 생성 간격 늘리기: setInterval(..., 2000);
   → 구름 속도 줄이기: speed = 1 + depth * 3;

4. 충돌 감지가 이상해요
   → 히트박스 조정: player.width * 0.8```


### 성능 최적화

javascript


```// 오프스크린 캔버스 사용 (고급)
let offscreenCanvas = document.createElement('canvas');
let offscreenCtx = offscreenCanvas.getContext('2d');

// 배경을 미리 그려놓기
function preRenderBackground() {
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    
    const gradient = offscreenCtx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    
    offscreenCtx.fillStyle = gradient;
    offscreenCtx.fillRect(0, 0, canvas.width, canvas.height);
}

// 배경 그리기 (빠름!)
function drawBackground() {
    ctx.drawImage(offscreenCanvas, 0, 0);
}
```

---

## 🏠 과제 (선택)

1. **난이도 선택**: 쉬움/보통/어려움 선택 화면 만들기
2. **파워업**: 별 아이템 먹으면 무적 시간 추가
3. **다양한 장애물**: 새, 번개, 비행선 등 추가
4. **리더보드**: 친구들 점수 순위 표시 (AI에게 물어보기!)

---

## 📚 다음 시간 예고

**4주차: 게임 커스터마이징 & 배포**
- 내 스타일로 게임 꾸미기
- 카카오톡 공유 기능 추가
- GitHub Pages로 배포
- 친구들과 점수 경쟁!

---


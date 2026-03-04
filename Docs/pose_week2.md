```
# 2주차 학습 가이드: 포즈로 움직이는 캐릭터

## 🎯 이번 시간 목표
- Canvas로 화면에 그림을 그립니다
- 포즈에 따라 캐릭터가 좌우로 움직입니다
- 떨어지는 장애물을 피하는 미니게임을 만듭니다

## ⏱️ 시간 배열 (60분)
- **0-15분**: Canvas 기초 및 원 그리기
- **15-30분**: 포즈로 원 움직이기
- **30-50분**: 장애물 떨어뜨리고 충돌 감지
- **50-60분**: 게임 테스트 및 점수 추가

---

## 📝 Step 1: Canvas 이해하기 (15분)

### 새 파일 만들기
```
pose-game 폴더에 'game.html' 파일 생성```


### 기본 Canvas 코드

**boilerplate/session2/game.html**

html


```<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>포즈 게임</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: #1a1a2e;
            font-family: 'Noto Sans KR', sans-serif;
        }
        #gameCanvas {
            border: 3px solid #16213e;
            background: linear-gradient(to bottom, #0f3460, #16213e);
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        #info {
            position: absolute;
            top: 20px;
            left: 20px;
            color: white;
            font-size: 20px;
            background: rgba(0,0,0,0.5);
            padding: 15px;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <canvas id="gameCanvas" width="600" height="800"></canvas>
    <div id="info">
        <div>현재 포즈: <span id="currentPose">-</span></div>
        <div>점수: <span id="score">0</span></div>
    </div>

    <script>
        // Canvas 설정
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        // 캐릭터 (원) 그리기
        let player = {
            x: canvas.width / 2,  // 시작 위치 X (가운데)
            y: canvas.height - 100, // 시작 위치 Y (아래쪽)
            radius: 30,             // 원의 크기
            color: '#e94560'        // 빨간색
        };
        
        // 그리기 함수
        function drawPlayer() {
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
            ctx.fillStyle = player.color;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.closePath();
        }
        
        // 화면 지우기
        function clearCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // 게임 루프 (계속 반복)
        function gameLoop() {
            clearCanvas();
            drawPlayer();
            requestAnimationFrame(gameLoop);
        }
        
        // 게임 시작!
        gameLoop();
    </script>
</body>
</html>
```

### 학생 활동
```
1. 코드 복사해서 game.html에 붙여넣기
2. 브라우저에서 열기
3. 빨간 원이 보이는지 확인
```

### 💡 코드 설명

**좌표계 이해하기**
```
Canvas 좌표:
(0,0) ──────→ X축
 │
 │
 ↓
Y축

왼쪽 위가 (0, 0)
오른쪽 아래가 (600, 800)
```

**학생에게 질문**
```
"player.x = 100 으로 바꾸면 어떻게 될까요?"
"player.radius = 50 으로 바꾸면요?"```


---

## 📝 Step 2: 포즈로 캐릭터 움직이기 (15분)

### 티처블머신 모델 연결

**1주차 코드 가져오기**

html


```<!-- 티처블머신 라이브러리 추가 -->
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8/dist/teachablemachine-pose.min.js"></script>```


### 포즈 인식 코드 추가

javascript


```// 여기에 1주차에 만든 모델 URL 넣기
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/여러분의주소/";

let model, webcam, maxPredictions;
let currentPose = "Center"; // 현재 감지된 포즈

// 티처블머신 초기화
async function initPoseDetection() {
    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";
    
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
    
    // 웹캠 설정 (화면에는 안 보이게)
    const size = 200;
    const flip = true;
    webcam = new tmPose.Webcam(size, size, flip);
    await webcam.setup();
    await webcam.play();
    
    // 포즈 감지 시작
    window.requestAnimationFrame(poseLoop);
}

// 포즈 감지 루프
async function poseLoop() {
    webcam.update();
    await predictPose();
    window.requestAnimationFrame(poseLoop);
}

// 포즈 예측
async function predictPose() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);
    
    // 가장 높은 확률의 포즈 찾기
    let maxProb = 0;
    let detectedPose = "Center";
    
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > maxProb) {
            maxProb = prediction[i].probability;
            detectedPose = prediction[i].className;
        }
    }
    
    // 확신도가 70% 이상일 때만 적용
    if (maxProb > 0.7) {
        currentPose = detectedPose;
        document.getElementById('currentPose').innerText = currentPose;
    }
}

// 페이지 로드 시 포즈 감지 시작
initPoseDetection();```


### 포즈에 따라 캐릭터 움직이기

javascript


```// 캐릭터 위치 업데이트
function updatePlayer() {
    const speed = 8; // 이동 속도
    
    if (currentPose === "Left") {
        player.x -= speed;
    } else if (currentPose === "Right") {
        player.x += speed;
    }
    
    // 화면 밖으로 나가지 않게
    if (player.x < player.radius) {
        player.x = player.radius;
    }
    if (player.x > canvas.width - player.radius) {
        player.x = canvas.width - player.radius;
    }
}

// 게임 루프 수정
function gameLoop() {
    clearCanvas();
    updatePlayer(); // 추가!
    drawPlayer();
    requestAnimationFrame(gameLoop);
}
```

### 🎯 체크포인트
- [ ] 왼쪽으로 기울면 캐릭터가 왼쪽으로 움직이나요?
- [ ] 오른쪽으로 기울면 캐릭터가 오른쪽으로 움직이나요?
- [ ] 가운데 서면 캐릭터가 멈추나요?
- [ ] 화면 밖으로 나가지 않나요?

---

## 📝 Step 3: 장애물 만들기 (20분)

### 강사 설명
```
"이제 게임답게 만들어볼까요?
위에서 장애물이 떨어지고, 그걸 피해야 하는 거예요.
장애물에 맞으면 게임 오버!"```


### 장애물 데이터 구조

javascript


```// 장애물 배열
let obstacles = [];

// 장애물 생성
function createObstacle() {
    const obstacle = {
        x: Math.random() * (canvas.width - 40) + 20, // 랜덤 X 위치
        y: -30,                                       // 화면 위에서 시작
        width: 40,
        height: 40,
        speed: 3,
        color: '#f39c12'
    };
    obstacles.push(obstacle);
}

// 일정 시간마다 장애물 생성
setInterval(createObstacle, 2000); // 2초마다```


### 장애물 그리기 및 움직이기

javascript


```// 장애물 그리기
function drawObstacles() {
    obstacles.forEach(obs => {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        
        // 테두리
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
    });
}

// 장애물 업데이트
function updateObstacles() {
    obstacles.forEach((obs, index) => {
        obs.y += obs.speed; // 아래로 이동
        
        // 화면 밖으로 나가면 제거
        if (obs.y > canvas.height) {
            obstacles.splice(index, 1);
            // 점수 증가
            score++;
            document.getElementById('score').innerText = score;
        }
    });
}

// 점수 변수 추가
let score = 0;

// 게임 루프 수정
function gameLoop() {
    clearCanvas();
    updatePlayer();
    updateObstacles(); // 추가!
    drawPlayer();
    drawObstacles();   // 추가!
    requestAnimationFrame(gameLoop);
}
```

### 🎯 체크포인트
- [ ] 장애물이 위에서 떨어지나요?
- [ ] 2초마다 새로운 장애물이 생기나요?
- [ ] 장애물이 화면 아래로 사라지면 점수가 올라가나요?

---

## 📝 Step 4: 충돌 감지 (10분)

### 강사 설명
```
"이제 캐릭터와 장애물이 부딪혔는지 확인해야 해요.
수학 시간에 배운 '거리' 공식을 사용할 거예요!"```


### 충돌 감지 함수

javascript


```// 충돌 감지 (원과 사각형)
function checkCollision(player, obstacle) {
    // 사각형의 가장 가까운 점 찾기
    let closestX = Math.max(obstacle.x, Math.min(player.x, obstacle.x + obstacle.width));
    let closestY = Math.max(obstacle.y, Math.min(player.y, obstacle.y + obstacle.height));
    
    // 거리 계산
    let distanceX = player.x - closestX;
    let distanceY = player.y - closestY;
    let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    // 충돌 여부 반환
    return distance < player.radius;
}

// 게임 오버 플래그
let gameOver = false;

// 충돌 체크
function checkCollisions() {
    if (gameOver) return;
    
    obstacles.forEach(obs => {
        if (checkCollision(player, obs)) {
            gameOver = true;
            showGameOver();
        }
    });
}

// 게임 오버 화면
function showGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('게임 오버!', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = '32px Arial';
    ctx.fillText(`최종 점수: ${score}```
, canvas.width / 2, canvas.height / 2 + 20);
    
    ctx.font = '20px Arial';
    ctx.fillText('F5를 눌러 다시 시작', canvas.width / 2, canvas.height / 2 + 60);
}

// 게임 루프 수정
function gameLoop() {
    if (gameOver) {
        return; // 게임 오버면 멈춤
    }
    
    clearCanvas();
    updatePlayer();
    updateObstacles();
    checkCollisions(); // 추가!
    drawPlayer();
    drawObstacles();
    requestAnimationFrame(gameLoop);
}

```

---

## 🎮 Step 5: 최종 테스트 (10분)

### 완성 체크리스트
- [ ] 포즈로 캐릭터가 좌우로 움직임
- [ ] 장애물이 계속 떨어짐
- [ ] 장애물을 피하면 점수 증가
- [ ] 장애물에 맞으면 게임 오버
- [ ] 현재 포즈가 화면에 표시됨

### AI에게 개선 요청하기

**학생 활동: ChatGPT/Claude에게 물어보기**
```
"이 게임에 배경 음악을 추가하고 싶어요. 어떻게 하나요?"
"장애물 속도를 점점 빠르게 하고 싶어요."
"장애물 크기를 랜덤하게 하고 싶어요."```


### 💡 추가 기능 예시

**난이도 증가**

javascript


```// 점수에 따라 속도 증가
function updateObstacles() {
    obstacles.forEach((obs, index) => {
        obs.speed = 3 + Math.floor(score / 10); // 10점마다 속도 증가
        obs.y += obs.speed;
        
        if (obs.y > canvas.height) {
            obstacles.splice(index, 1);
            score++;
            document.getElementById('score').innerText = score;
        }
    });
}```


**장애물 크기 랜덤**

javascript


```function createObstacle() {
    const size = 30 + Math.random() * 40; // 30~70 사이
    const obstacle = {
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: 3,
        color: '#f39c12'
    };
    obstacles.push(obstacle);
}
```

---

## 🏠 과제 (선택)

1. **색상 바꾸기**: 캐릭터와 장애물 색상을 자유롭게 변경
2. **배경 추가**: Canvas에 별이나 구름 그리기
3. **난이도 조절**: 장애물 생성 간격 바꿔보기 (2초 → 1초)
4. **최고 점수**: localStorage로 최고 점수 저장하기 (AI에게 물어보기!)

---

## 📚 다음 시간 예고

**3주차: 3D 비행기 게임 만들기**
- 오늘 만든 게임을 한 단계 업그레이드!
- 비행기가 하늘을 날아다니는 게임
- 구름 장애물도 더 멋지게!
- 폭발 효과도 추가해볼까요?

---


## 🎯 이번 시간 목표

- 티처블머신으로 3가지 포즈를 학습시킵니다
- 웹캠으로 실시간 포즈 인식을 테스트합니다
- HTML에 티처블머신 모델을 연결합니다

## ⏱️ 시간 배열 (60분)

- **0-10분**: 티처블머신 소개 및 포즈 설계
- **10-30분**: 티처블머신에서 포즈 학습하기
- **30-45분**: HTML 기본 구조 만들고 모델 연결
- **45-60분**: 실시간 포즈 인식 테스트 및 디버깅

---

## 📝 Step 1: 티처블머신 이해하기 (10분)

### 학생 활동

1. **티처블머신 접속**
    - 주소: https://teachablemachine.withgoogle.com/
    - 'Get Started' 클릭
    - 'Pose Project' 선택
2. **포즈 3가지 설계하기**

   ```
Class 1: Left (왼쪽으로 기울기)
   Class 2: Center (정면 서기)
   Class 3: Right (오른쪽으로 기울기)
```

### 💡 꿀팁

- 포즈는 "확실하게" 차이가 나야 AI가 잘 인식합니다
- 나중에 게임할 때 편한 자세로 정하세요!

---

## 📝 Step 2: 포즈 학습시키기 (20분)

### Class 1: Left 포즈 학습

```
1. 'Class 1' 이름을 'Left'로 변경
2. 'Webcam' 버튼 클릭
3. 웹캠 권한 허용
4. 몸을 왼쪽으로 기울인 상태에서 'Hold to Record' 버튼을 3초간 누르기
5. 다양한 각도로 2-3번 더 녹화 (앉아서, 서서 등)
```

### Class 2: Center 포즈 학습

```
1. 'Add a class' 버튼 클릭
2. 'Class 2' 이름을 'Center'로 변경
3. 정면을 보고 똑바로 선 상태에서 녹화
4. 여러 각도로 2-3번 녹화
```

### Class 3: Right 포즈 학습

```
1. 'Add a class' 버튼 클릭
2. 'Class 3' 이름을 'Right'로 변경
3. 몸을 오른쪽으로 기울인 상태에서 녹화
4. 여러 각도로 2-3번 녹화
```

### 학습 시작!

```
1. 'Train Model' 버튼 클릭
2. 잠시 기다리면 학습 완료!
3. 'Preview' 화면에서 포즈를 바꿔가며 인식 테스트
```

### 🎯 체크포인트

- [ ]  3가지 포즈가 모두 잘 인식되나요?
- [ ]  각 포즈의 정확도가 80% 이상인가요?
- [ ]  빠르게 포즈를 바꿔도 잘 인식되나요?

---

## 📝 Step 3: 모델 내보내기 (5분)

### 모델 저장하기

```
1. 'Export Model' 버튼 클릭
2. 'Upload (shareable link)' 탭 선택
3. 'Upload my model' 버튼 클릭
4. 나오는 링크 복사 (나중에 사용!)
```

### 📋 예시

`모델 링크: https://teachablemachine.withgoogle.com/models/aBcDeFgH/`


### 💡 꿀팁

- 이 링크를 잃어버리면 모델을 다시 만들어야 해요!
- 메모장이나 카톡 '나와의 채팅'에 저장해두세요

---

## 📝 Step 4: HTML 기본 구조 만들기 (10분)

### VS Code 준비


```text
1. 바탕화면에 'pose-game' 폴더 만들기
2. VS Code에서 폴더 열기
3. 'index.html' 파일 만들기```


### 기본 HTML 작성




```text
"HTML은 웹페이지의 '뼈대'예요.
집을 지을 때 기둥과 벽을 먼저 세우는 것처럼,
HTML로 웹페이지의 구조를 먼저 만듭니다."```


**boilerplate/session1/index.html**

html


```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>포즈 인식 테스트</title>
    <style>
        body {
            font-family: 'Noto Sans KR', sans-serif;
            text-align: center;
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        #webcam-container {
            margin: 20px auto;
        }
        #label-container {
            margin-top: 20px;
        }
        .pose-label {
            font-size: 24px;
            padding: 10px;
            margin: 5px;
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
        }
        #status {
            font-size: 48px;
            font-weight: bold;
            margin: 30px;
            padding: 20px;
            background: rgba(255,255,255,0.3);
            border-radius: 20px;
        }
    </style>
</head>
<body>
    <h1>🤸 포즈 인식 테스트</h1>
    <p>왼쪽, 가운데, 오른쪽으로 몸을 기울여보세요!</p>
    
    <div id="webcam-container"></div>
    <div id="label-container"></div>
    <div id="status">준비 중...</div>

    <!-- 티처블머신 라이브러리 -->
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8/dist/teachablemachine-pose.min.js"></script>
    
    <script>
        // 여기에 JavaScript 코드가 들어갑니다
        // 다음 단계에서 작성할 거예요!
    </script>
</body>
</html>

```

```
### 🎯 체크포인트
- [ ] HTML 파일을 브라우저에서 열었을 때 화면이 보이나요?
- [ ] "포즈 인식 테스트" 제목이 보이나요?

---

## 📝 Step 5: 티처블머신 모델 연결하기 (15분)

### JavaScript 코드 작성



```
"이제 우리가 학습시킨 AI 모델을 웹페이지에 연결할 거예요.
티처블머신이 제공하는 '코드 조각'을 복사해서 사용하면 돼요!"```


### 모델 URL 설정

티처블머신에서 'Export Model' → 'TensorFlow.js' 탭에 있는 코드를 참고하여:

javascript


````html
<script>
    // 여기에 여러분의 모델 URL을 넣으세요!
    const URL = "https://teachablemachine.withgoogle.com/models/여러분의모델주소/";
    
    let model, webcam, ctx, labelContainer, maxPredictions;

    async function init() {
        // 모델 로드
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";
        
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // 웹캠 설정
        const size = 500;
        const flip = true; // 거울 모드
        webcam = new tmPose.Webcam(size, size, flip);
        await webcam.setup(); // 웹캠 권한 요청
        await webcam.play();
        window.requestAnimationFrame(loop);

        // 웹캠 화면을 페이지에 추가
        const canvas = document.getElementById("canvas");
        canvas.width = size; 
        canvas.height = size;
        ctx = canvas.getContext("2d");
        
        labelContainer = document.getElementById("label-container");
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.appendChild(document.createElement("div"));
        }
        
        document.getElementById("status").innerText = "준비 완료! 포즈를 취해보세요!";
    }

    async function loop(timestamp) {
        webcam.update();
        await predict();
        window.requestAnimationFrame(loop);
    }

    async function predict() {
        const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
        const prediction = await model.predict(posenetOutput);

        // 가장 높은 확률의 포즈 찾기
        let maxProb = 0;
        let maxClass = "";
        
        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction = prediction[i].className + ": " + 
                                  (prediction[i].probability * 100).toFixed(0) + "%";
            labelContainer.childNodes[i].innerHTML = classPrediction;
            labelContainer.childNodes[i].className = "pose-label";
            
            if (prediction[i].probability > maxProb) {
                maxProb = prediction[i].probability;
                maxClass = prediction[i].className;
            }
        }
        
        // 현재 포즈를 크게 표시
        if (maxProb > 0.7) { // 70% 이상 확신할 때만
            document.getElementById("status").innerText = maxClass;
        }
        
        drawPose(pose);
    }

    function drawPose(pose) {
        if (webcam.canvas) {
            ctx.drawImage(webcam.canvas, 0, 0);
            if (pose) {
                const minPartConfidence = 0.5;
                tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
                tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
            }
        }
    }
    
    // 페이지 로드되면 시작!
    init();
</script>```


### HTML에 캔버스 추가


```<div id="webcam-container"></div>```
 부분을 다음으로 교체:

html


```<div id="webcam-container">
    <canvas id="canvas"></canvas>
</div>
```

---

## 🎮 Step 6: 테스트 및 디버깅 (10분)

### 테스트 체크리스트
```
1. 파일 저장 (Ctrl + S 또는 Cmd + S)
2. 브라우저에서 index.html 열기
3. 웹캠 권한 허용
4. 포즈 바꿔가며 테스트
```

### 확인 사항
- [ ] 웹캠 화면이 보이나요?
- [ ] 내 몸의 골격(뼈대)이 그려지나요?
- [ ] 왼쪽으로 기울면 "Left"가 표시되나요?
- [ ] 가운데 서면 "Center"가 표시되나요?
- [ ] 오른쪽으로 기울면 "Right"가 표시되나요?
- [ ] 확률(%)이 표시되나요?

### 🐛 자주 발생하는 문제

**문제 1: 웹캠이 안 켜져요**
```
해결: 브라우저 주소창 옆 카메라 아이콘 클릭 → 허용
```

**문제 2: 모델을 불러올 수 없다고 나와요**
```
해결: URL 주소가 정확한지 확인
const URL = "https://teachablemachine.withgoogle.com/models/여러분의주소/";
                                                                    ↑ 마지막 / 있어야 함!
```

**문제 3: 포즈 인식이 잘 안 돼요**
```
해결: 티처블머신으로 돌아가서 포즈를 더 많이 학습시키기
      (각 포즈당 최소 50장 이상 권장)
```

---

## 🎯 오늘의 미션 완료!

### ✅ 완성 체크리스트
- [ ] 티처블머신에서 3가지 포즈 학습 완료
- [ ] HTML 파일에 모델 연결 완료
- [ ] 웹캠에서 실시간 포즈 인식 작동
- [ ] 왼쪽/가운데/오른쪽 포즈 모두 인식됨

### 🏠 과제 (선택)
1. **포즈 추가하기**: Class 4를 추가해서 "점프" 포즈 만들어보기
2. **배경 바꾸기**: CSS에서 `background```
 색상 변경해보기
3. **친구들과 비교**: 친구의 포즈로도 잘 인식되는지 테스트

---

## 📚 다음 시간 예고

**2주차: 포즈로 움직이는 캐릭터**
- 오늘 만든 포즈 인식을 활용해서
- 화면 속 캐릭터를 내 포즈로 움직여볼 거예요!
- 떨어지는 장애물을 피하는 미니게임도 만들어봅니다!

---


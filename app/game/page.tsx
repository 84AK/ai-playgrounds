"use client";

import { useState, useEffect, useRef } from "react";

// Add global type for window.tmPose
declare global {
    interface Window {
        tmPose: any;
    }
}

export default function GameCenter() {
    const [modelUrl, setModelUrl] = useState("");
    const [gameState, setGameState] = useState<"setup" | "loading" | "playing" | "gameover">("setup");
    const [score, setScore] = useState(0);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // TM References
    const modelRef = useRef<any>(null);
    const webcamRef = useRef<any>(null);

    // Canvas & Game References
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number | null>(null);
    const predictLoopRef = useRef<number | null>(null);

    // Active Pose State
    const currentPoseRef = useRef<string>("S"); // L, R, S

    // Load Scripts dynamically
    useEffect(() => {
        const loadScripts = async () => {
            if (window.tmPose) {
                setScriptLoaded(true);
                return;
            }

            const tfjs = document.createElement("script");
            tfjs.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js";
            document.head.appendChild(tfjs);

            tfjs.onload = () => {
                const tm = document.createElement("script");
                tm.src = "https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8/dist/teachablemachine-pose.min.js";
                document.head.appendChild(tm);
                tm.onload = () => setScriptLoaded(true);
            };
        };

        loadScripts();

        return () => {
            if (webcamRef.current) webcamRef.current.stop();
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            if (predictLoopRef.current) cancelAnimationFrame(predictLoopRef.current);
        };
    }, []);

    const initTeachableMachine = async () => {
        if (!modelUrl || !scriptLoaded) return;

        let url = modelUrl;
        if (!url.endsWith("/")) url += "/";

        const modelURL = url + "model.json";
        const metadataURL = url + "metadata.json";

        setGameState("loading");

        try {
            // Load the model and metadata
            modelRef.current = await window.tmPose.load(modelURL, metadataURL);

            // Convenience function to setup a webcam
            const size = 200;
            const flip = true; // whether to flip the webcam
            webcamRef.current = new window.tmPose.Webcam(size, size, flip);
            await webcamRef.current.setup(); // request access to the webcam
            await webcamRef.current.play();

            // Append webcam canvas to UI
            const wcContainer = document.getElementById("webcam-container");
            if (wcContainer) {
                wcContainer.innerHTML = "";
                wcContainer.appendChild(webcamRef.current.canvas);
                webcamRef.current.canvas.style.borderRadius = "1rem";
                webcamRef.current.canvas.style.width = "100%";
                webcamRef.current.canvas.style.height = "100%";
                webcamRef.current.canvas.style.objectFit = "cover";
            }

            setGameState("playing");
            startGame();
            predictLoop();

        } catch (e) {
            console.error(e);
            alert("모델 로딩 중 에러가 발생했습니다. URL이 올바른지 확인해주세요.");
            setGameState("setup");
        }
    };

    const predictLoop = async () => {
        if (!webcamRef.current || !modelRef.current) return;

        webcamRef.current.update(); // update the webcam frame
        const { pose, posenetOutput } = await modelRef.current.estimatePose(webcamRef.current.canvas);
        const prediction = await modelRef.current.predict(posenetOutput);

        let highestProb = 0;
        let bestClass = "S";

        for (let i = 0; i < prediction.length; i++) {
            if (prediction[i].probability > highestProb) {
                highestProb = prediction[i].probability;
                bestClass = prediction[i].className.toUpperCase();
            }
        }

        // Update ref for the game loop to use
        if (bestClass.includes("L") || bestClass === "LEFT") currentPoseRef.current = "L";
        else if (bestClass.includes("R") || bestClass === "RIGHT") currentPoseRef.current = "R";
        else currentPoseRef.current = "S";

        predictLoopRef.current = window.requestAnimationFrame(predictLoop);
    };

    const startGame = () => {
        setScore(0);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Make canvas full resolution
        canvas.width = canvas.parentElement?.clientWidth || 800;
        canvas.height = canvas.parentElement?.clientHeight || 600;

        let internalScore = 0;

        const player = {
            x: canvas.width / 2 - 25,
            y: canvas.height - 80,
            width: 50,
            height: 50,
            speed: Number(5) // Fix: explicitly type as number
        };

        const obstacles: any[] = [];
        let frameCount = 0;
        let isGameOver = false;

        const loop = () => {
            if (isGameOver) return;

            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Background Stars Effect
            ctx.fillStyle = "#ffffff";
            if (Math.random() > 0.8) {
                ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
            }

            // Move Player based on Pose
            if (currentPoseRef.current === "L") {
                player.x -= player.speed;
            } else if (currentPoseRef.current === "R") {
                player.x += player.speed;
            }

            // Boundary constraints
            if (player.x < 0) player.x = 0;
            if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

            // Draw Player (Rocket)
            ctx.fillStyle = "#3b82f6"; // Primary blue
            ctx.beginPath();
            ctx.moveTo(player.x + player.width / 2, player.y);
            ctx.lineTo(player.x + player.width, player.y + player.height);
            ctx.lineTo(player.x, player.y + player.height);
            ctx.closePath();
            ctx.fill();

            // Add exhaust flame
            ctx.fillStyle = frameCount % 10 < 5 ? "#ef4444" : "#f59e0b";
            ctx.beginPath();
            ctx.moveTo(player.x + player.width / 2 - 10, player.y + player.height);
            ctx.lineTo(player.x + player.width / 2 + 10, player.y + player.height);
            ctx.lineTo(player.x + player.width / 2, player.y + player.height + 20 + Math.random() * 10);
            ctx.closePath();
            ctx.fill();

            // Spawn Obstacles
            frameCount++;
            if (frameCount % 60 === 0) {
                obstacles.push({
                    x: Math.random() * (canvas.width - 40),
                    y: -40,
                    width: 40,
                    height: 40,
                    speed: 3 + Math.random() * 2 + (internalScore / 500) // Gets faster
                });
            }

            // Update and Draw Obstacles
            ctx.fillStyle = "#ef4444"; // Red asteroids
            for (let i = obstacles.length - 1; i >= 0; i--) {
                const obs = obstacles[i];
                obs.y += obs.speed;

                ctx.beginPath();
                ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
                ctx.fill();

                // Collision Detection (Circle vs Rect approx)
                if (
                    player.x < obs.x + obs.width &&
                    player.x + player.width > obs.x &&
                    player.y < obs.y + obs.height &&
                    player.y + player.height > obs.y
                ) {
                    isGameOver = true;
                    setGameState("gameover");
                }

                // Remove if off screen, add score
                if (obs.y > canvas.height) {
                    obstacles.splice(i, 1);
                    internalScore += 10;
                    setScore(internalScore);
                }
            }

            if (!isGameOver) {
                gameLoopRef.current = window.requestAnimationFrame(loop);
            }
        };

        loop();
    };

    const resetGame = () => {
        setGameState("playing");
        startGame();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-6 pt-32 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">🎮 AI 포즈 마스터 게임 센터</h1>
                    <p className="text-muted-foreground mt-2 font-medium">티처블 머신 모델을 연결하여 내 동작으로 우주선을 조종하세요!</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Control Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card bg-secondary/30 space-y-4 p-6 rounded-3xl border border-white/5">
                        <h2 className="font-black border-b border-border/50 pb-3 flex items-center gap-2">
                            <span className="text-primary">01.</span> 엔진 시동
                        </h2>

                        {(gameState === "setup" || gameState === "loading") ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Teachable Machine URL</label>
                                    <input
                                        type="text"
                                        placeholder="https://teachablemachine.../models/xyz/"
                                        className="w-full bg-background/80 p-4 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none transition-all font-medium border border-border/50"
                                        value={modelUrl}
                                        onChange={(e) => setModelUrl(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={initTeachableMachine}
                                    className="w-full py-4 bg-primary text-white rounded-xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20 flex justify-center items-center"
                                    disabled={!modelUrl || !scriptLoaded || gameState === "loading"}
                                >
                                    {gameState === "loading" ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "비행 준비 완료 (불러오기)"
                                    )}
                                </button>
                                {!scriptLoaded && <p className="text-xs text-amber-500 font-bold text-center">AI 엔진 로딩중...</p>}
                            </div>
                        ) : (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                                <p className="text-green-500 font-black text-sm">✅ 시스템 연결 완료</p>
                            </div>
                        )}
                    </div>

                    {/* WebCam Viewport (Hidden during setup) */}
                    <div className={`glass-card bg-secondary/30 p-4 rounded-3xl border border-white/5 transition-all duration-500 ${gameState !== "setup" && gameState !== "loading" ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
                        <div className="aspect-square bg-black/50 rounded-2xl overflow-hidden relative" id="webcam-container">
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs font-bold">Webcam Feed</div>
                        </div>
                    </div>

                    <div className="glass-card bg-secondary/30 space-y-4 p-6 rounded-3xl border border-white/5">
                        <h2 className="font-black border-b border-border/50 pb-3 flex items-center gap-2">
                            <span className="text-blue-500">02.</span> 조작 매뉴얼
                        </h2>
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-lg font-black group-hover:bg-primary group-hover:text-white transition-colors">L</div>
                                <span className="text-sm font-bold">왼쪽으로 피하기</span>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 text-lg font-black group-hover:bg-blue-500 group-hover:text-white transition-colors">R</div>
                                <span className="text-sm font-bold">오른쪽으로 피하기</span>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl border-2 border-white/10 flex items-center justify-center text-muted-foreground text-lg font-black group-hover:border-white/40 transition-colors">S</div>
                                <span className="text-sm font-bold">가운데 유지하기</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Game Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-slate-950 shadow-2xl shadow-primary/10 group border border-white/5">

                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10" />

                        {/* Overlays */}
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            {(gameState === "setup" || gameState === "loading") && (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-6 bg-background/80 backdrop-blur-sm pointer-events-auto">
                                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
                                        <span className="text-4xl">🚀</span>
                                    </div>
                                    <h3 className="text-4xl font-black italic text-white tracking-tighter">
                                        THE AI PILOT <br /><span className="text-primary">READY TO FLY?</span>
                                    </h3>
                                    <p className="text-sm text-muted-foreground font-medium">좌측 패널에 티처블 머신 모델 URL을 입력하세요.</p>
                                </div>
                            )}

                            {gameState === "playing" && (
                                <div className="absolute top-8 left-0 w-full flex justify-between px-10">
                                    <div className="glass px-6 py-3 rounded-2xl border border-white/10 flex flex-col backdrop-blur-md">
                                        <span className="text-[10px] font-black tracking-widest text-primary uppercase">Score</span>
                                        <span className="text-3xl font-black text-white leading-none">{score}</span>
                                    </div>

                                    <div className="glass px-6 py-3 rounded-2xl border border-white/10 flex flex-col items-center justify-center backdrop-blur-md">
                                        <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Current Pose</span>
                                        <span className="text-2xl font-black text-white leading-none mt-1">{currentPoseRef.current}</span>
                                    </div>
                                </div>
                            )}

                            {gameState === "gameover" && (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-6 bg-red-950/80 backdrop-blur-md pointer-events-auto">
                                    <h3 className="text-6xl font-black italic tracking-tighter text-red-500">
                                        GAME OVER
                                    </h3>
                                    <div className="space-y-1">
                                        <p className="text-lg text-white font-medium">최종 점수</p>
                                        <p className="text-5xl font-black text-white">{score}</p>
                                    </div>
                                    <button
                                        onClick={resetGame}
                                        className="mt-8 px-10 py-4 bg-white text-red-950 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl"
                                    >
                                        다시 도전하기 🔄
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Teacher's Note */}
                    <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 mt-6">
                        <h4 className="font-bold text-primary text-sm mb-2 flex items-center gap-2">
                            🧑‍🏫 선생님을 위한 팁
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                            학생들이 티처블머신에서 학습을 시킬 때, 배경과 명확히 구분되는 옷을 입거나 동작을 크게 하도록 지도해주세요. 모델 클래스명은 대문자/소문자 상관없이 L, R, S 키워드가 포함되면 작동합니다 (예: "L", "Left", "Move_L").
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

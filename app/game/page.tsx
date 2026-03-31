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
    // Active Pose State

    // Script loading moved to iframe

    const gameContainerRef = useRef<HTMLDivElement>(null);

    const initTeachableMachine = async () => {
        if (!modelUrl) return;
        setGameState("playing");
    };

    const toggleFullscreen = () => {
        if (!gameContainerRef.current) return;
        
        if (!document.fullscreenElement) {
            gameContainerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const resetGame = () => {
        setGameState("setup");
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
                                    disabled={!modelUrl || gameState === "loading"}
                                >
                                    {gameState === "loading" ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "비행 준비 완료 (불러오기)"
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                                <p className="text-green-500 font-black text-sm">✅ 시스템 연결 완료</p>
                            </div>
                        )}
                    </div>

                    {/* WebCam Viewport (Hidden during setup) - 게임 엔진 내부에서 관리하므로 제거 */}

                    <div className="glass-card bg-secondary/30 space-y-4 p-6 rounded-3xl border border-white/5">
                        <h2 className="font-black border-b border-border/50 pb-3 flex items-center gap-2">
                            <span className="text-blue-500">02.</span> 조작 매뉴얼
                        </h2>
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-lg font-black group-hover:bg-primary group-hover:text-white transition-colors">↑</div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700">UP</span>
                                    <span className="text-[10px] text-muted-foreground font-medium">위로 이동</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 text-lg font-black group-hover:bg-blue-500 group-hover:text-white transition-colors">↓</div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700">DOWN</span>
                                    <span className="text-[10px] text-muted-foreground font-medium">아래로 이동</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-lg font-black group-hover:bg-amber-500 group-hover:text-white transition-colors">←</div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700">LEFT</span>
                                    <span className="text-[10px] text-muted-foreground font-medium">왼쪽으로 이동</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 text-lg font-black group-hover:bg-purple-500 group-hover:text-white transition-colors">→</div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700">RIGHT</span>
                                    <span className="text-[10px] text-muted-foreground font-medium">오른쪽으로 이동</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Game Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div 
                        ref={gameContainerRef}
                        className="relative min-h-[500px] md:h-[750px] w-full rounded-[2.5rem] overflow-hidden bg-slate-950 shadow-2xl shadow-primary/10 group border border-white/5"
                    >
                        {/* 전체 화면 버튼 (플로팅) */}
                        <button
                            onClick={toggleFullscreen}
                            className="absolute top-6 right-6 z-30 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                            title="전체 화면"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                        </button>

                        {/* 통합된 비행기 게임 엔진 (Iframe) */}
                        {gameState === "playing" && (
                            <iframe
                                src={`/games/airplane-game.html?model=${encodeURIComponent(modelUrl)}`}
                                className="absolute inset-0 w-full h-full z-10 border-none"
                                allow="camera; microphone; display-capture; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                        )}

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

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-background/92 backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[12%] top-[18%] h-56 w-56 rounded-full bg-primary/18 blur-[110px]" />
                <div className="absolute bottom-[14%] right-[10%] h-64 w-64 rounded-full bg-blue-500/14 blur-[120px]" />
            </div>

            <div className="relative flex max-w-md flex-col items-center gap-6 px-8 text-center">
                <div className="relative flex h-24 w-24 items-center justify-center">
                    <div className="absolute h-24 w-24 rounded-full border-2 border-[#2F3D4A]/10 bg-white" />
                    <div className="absolute h-20 w-20 rounded-full border-2 border-primary/20 animate-ping" />
                    <div className="absolute h-14 w-14 rounded-full bg-primary/10 blur-md" />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white font-black border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A]">
                        AI
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.38em] text-primary/80">
                        Loading
                    </p>
                    <h2 className="text-3xl font-black tracking-tight text-[#2F3D4A]">
                        페이지 이동 중입니다
                    </h2>
                    <p className="text-sm leading-7 text-slate-600 font-medium">
                        학습 화면과 진행 데이터를 불러오는 중입니다. 잠시만 기다려 주세요.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary/80 [animation-delay:-0.1s]" />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary/60" />
                </div>
            </div>
        </div>
    );
}

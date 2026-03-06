export default function Loading() {
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-background/92 backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[12%] top-[18%] h-56 w-56 rounded-full bg-primary/18 blur-[110px]" />
                <div className="absolute bottom-[14%] right-[10%] h-64 w-64 rounded-full bg-blue-500/14 blur-[120px]" />
            </div>

            <div className="relative flex max-w-md flex-col items-center gap-6 px-8 text-center">
                <div className="relative flex h-24 w-24 items-center justify-center">
                    <div className="absolute h-24 w-24 rounded-full border border-white/10 bg-white/[0.03]" />
                    <div className="absolute h-20 w-20 rounded-full border border-primary/25 animate-ping" />
                    <div className="absolute h-14 w-14 rounded-full bg-primary/18 blur-md" />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_30px_rgba(129,140,248,0.35)]">
                        AI
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.38em] text-primary/80">
                        Loading
                    </p>
                    <h2 className="text-3xl font-black tracking-tight text-white">
                        페이지 이동 중입니다
                    </h2>
                    <p className="text-sm leading-7 text-white/60">
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

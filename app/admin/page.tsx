"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!password) {
            setError("비밀번호를 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const result = await res.json();

            if (res.ok && result.success) {
                router.push("/admin/course");
            } else {
                setError(result.error || "로그인 실패");
                setLoading(false);
            }
        } catch (err) {
            setError("서버 통신 중 오류가 발생했습니다.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
            <div className="max-w-md w-full p-8 border border-border rounded-3xl bg-secondary/5 backdrop-blur-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black tracking-tight mb-2">관리자 로그인</h1>
                    <p className="text-sm text-muted-foreground">코스 콘텐츠를 수정하기 위해 로그인하세요.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="password">
                            비밀번호
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            placeholder="비밀번호를 입력하세요"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 font-medium">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? "확인 중..." : "로그인"}
                    </button>
                    <p className="text-xs text-center text-muted-foreground pt-4">
                        로컬 테스트용 기본 비밀번호: admin
                    </p>
                </form>
            </div>
        </div>
    );
}

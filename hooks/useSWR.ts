"use client";

import { useState, useEffect, useCallback } from "react";
import { globalCache } from "@/lib/global-cache";

interface SWRResponse<T> {
    data: T | null;
    error: any;
    isValidating: boolean;
    mutate: () => Promise<void>;
}

/**
 * Custom lightweight SWR-like hook for data fetching with caching.
 * @param key Unique key for the cache (e.g., API URL + params)
 * @param fetcher Async function that returns the data
 * @param options Configuration options
 */
export default function useSWR<T>(
    key: string | null,
    fetcher: () => Promise<T>,
    options: { 
        revalidateOnFocus?: boolean;
        refreshInterval?: number;
    } = {}
): SWRResponse<T> {
    const cached = key ? globalCache.get(key) : null;
    const [data, setData] = useState<T | null>(cached ? cached.data : null);
    const [error, setError] = useState<any>(null);
    const [isValidating, setIsValidating] = useState(false);

    const fetchData = useCallback(async () => {
        if (!key) return;
        
        setIsValidating(true);
        try {
            const newData = await fetcher();
            globalCache.set(key, newData);
            setData(newData);
            setError(null);
        } catch (err) {
            console.error(`[useSWR] Fetch failed for ${key}:`, err);
            setError(err);
        } finally {
            setIsValidating(false);
        }
    }, [key, fetcher]);

    useEffect(() => {
        if (!key) return;

        // 초기 데이터가 없거나 캐시가 만료되었거나 관계없이 진입 시 무조건 백그라운드 갱신 시도
        fetchData();

        // 탭 포커스 시 자동 갱신
        if (options.revalidateOnFocus !== false) {
            const handleFocus = () => {
                fetchData();
            };
            window.addEventListener("focus", handleFocus);
            return () => window.removeEventListener("focus", handleFocus);
        }
    }, [key, fetchData, options.revalidateOnFocus]);

    // 주기적 갱신
    useEffect(() => {
        if (options.refreshInterval && key) {
            const interval = setInterval(fetchData, options.refreshInterval);
            return () => clearInterval(interval);
        }
    }, [key, fetchData, options.refreshInterval]);

    return { data, error, isValidating, mutate: fetchData };
}

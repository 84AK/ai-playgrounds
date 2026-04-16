/**
 * Lightweight global memory & persistence cache for API responses.
 * Implements Stale-While-Revalidate pattern by persisting to localStorage.
 */

type CacheValue = {
    data: any;
    timestamp: number;
};

// Memory cache for super-fast access during session
const memoryCache = new Map<string, CacheValue>();

// LocalStorage prefix
const STORAGE_PREFIX = "aklab_cache_";

export const globalCache = {
    set: (key: string, data: any) => {
        const value = {
            data,
            timestamp: Date.now()
        };
        // Update Memory
        memoryCache.set(key, value);
        
        // Update LocalStorage (client-side only)
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
            } catch (e) {
                console.warn("[globalCache] Failed to save to localStorage", e);
            }
        }
    },
    get: (key: string) => {
        // 1. Try Memory first
        if (memoryCache.has(key)) return memoryCache.get(key);
        
        // 2. Try LocalStorage
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem(STORAGE_PREFIX + key);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Update memory for next time
                    memoryCache.set(key, parsed);
                    return parsed;
                }
            } catch (e) {
                console.warn("[globalCache] Failed to read from localStorage", e);
            }
        }
        return undefined;
    },
    clear: () => {
        memoryCache.clear();
        if (typeof window !== "undefined") {
            Object.keys(localStorage)
                .filter(k => k.startsWith(STORAGE_PREFIX))
                .forEach(k => localStorage.removeItem(k));
        }
    },
    delete: (key: string) => {
        memoryCache.delete(key);
        if (typeof window !== "undefined") {
            localStorage.removeItem(STORAGE_PREFIX + key);
        }
    }
};

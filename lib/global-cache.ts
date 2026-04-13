/**
 * Lightweight global memory cache for API responses.
 * Helps prevent flickering and reduces redundant network requests.
 */

type CacheValue = {
    data: any;
    timestamp: number;
};

const cache = new Map<string, CacheValue>();

export const globalCache = {
    set: (key: string, data: any) => {
        cache.set(key, {
            data,
            timestamp: Date.now()
        });
    },
    get: (key: string) => {
        return cache.get(key);
    },
    clear: () => {
        cache.clear();
    },
    delete: (key: string) => {
        cache.delete(key);
    }
};

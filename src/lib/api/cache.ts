interface CacheItem {
    data: any
    timestamp: number
}

const cache = new Map<string, CacheItem>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export function getCached<T>(key: string): T | null {
    const item = cache.get(key)
    if (item && Date.now() - item.timestamp < CACHE_TTL) {
        console.log(`📦 Cache hit: ${key}`)
        return item.data as T
    }
    return null
}

export function setCached(key: string, data: any): void {
    cache.set(key, {
        data,
        timestamp: Date.now()
    })
    console.log(`💾 Cache set: ${key}`)
}

export function clearCache(): void {
    cache.clear();
    console.log('🧹 Cache limpo');
}

if (process.env.NODE_ENV === 'development') {
    clearCache();
}
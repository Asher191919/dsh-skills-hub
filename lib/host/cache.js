/**
 * Skills Hub — in-process TTL cache with stale-while-error support, plus
 * per-registry health bookkeeping.
 *
 * Only normalized upstream data is cached. Install state is computed per
 * request on top of cached data and is never cached, because the disk is the
 * authority for it.
 *
 * @module dsh-skills-hub/host/cache
 */
import { MARKET_SOURCES, } from "../shared/market.js";
/** Default cap: enough for a deep catalog crawl, small enough to stay bounded. */
const MAX_CACHE_ENTRIES = 500;
/**
 * Create the plugin-owned cache. One instance per fiber: HMR reload drops it
 * with the fiber, so a stale module never serves a disposed plugin's data.
 *
 * @param maxEntries - entry cap; oldest insertions are evicted first.
 * @returns the cache handle.
 */
export function createMarketCache(maxEntries = MAX_CACHE_ENTRIES) {
    const entries = new Map();
    return {
        get(key) {
            const entry = entries.get(key);
            if (entry === undefined)
                return undefined;
            if (Date.now() > entry.expiresAt)
                return undefined;
            // LRU touch: re-insert so eviction drops the least recently read key.
            entries.delete(key);
            entries.set(key, entry);
            return entry.value;
        },
        getStale(key) {
            const entry = entries.get(key);
            if (entry === undefined)
                return undefined;
            return { value: entry.value, storedAt: entry.storedAt };
        },
        set(key, value, ttlMs) {
            const now = Date.now();
            entries.delete(key);
            entries.set(key, { value, expiresAt: now + Math.max(0, ttlMs), storedAt: now });
            while (entries.size > maxEntries) {
                const oldest = entries.keys().next();
                if (oldest.done === true)
                    break;
                entries.delete(oldest.value);
            }
        },
        clear() {
            entries.clear();
        },
    };
}
/**
 * Create the health tracker. A failure after a recent success is `degraded`
 * (the registry worked a moment ago); repeated failure is `failed`.
 *
 * @returns the tracker handle.
 */
export function createSourceHealth() {
    const records = new Map();
    const clear = () => {
        records.clear();
        for (const source of MARKET_SOURCES) {
            records.set(source, { status: 'ok', lastOkAt: undefined, lastError: undefined });
        }
    };
    clear();
    return {
        recordSuccess(source) {
            records.set(source, { status: 'ok', lastOkAt: Date.now(), lastError: undefined });
        },
        recordFailure(source, error) {
            const previous = records.get(source);
            const wasHealthy = previous !== undefined && previous.status === 'ok' && previous.lastOkAt !== undefined;
            records.set(source, {
                status: wasHealthy ? 'degraded' : 'failed',
                lastOkAt: previous?.lastOkAt,
                lastError: error,
            });
        },
        get(source) {
            const record = records.get(source);
            if (record === undefined)
                return { status: 'ok' };
            return {
                status: record.status,
                ...(record.lastOkAt === undefined ? {} : { fetchedAt: record.lastOkAt }),
                ...(record.lastError === undefined ? {} : { error: record.lastError }),
            };
        },
        reset() {
            clear();
        },
    };
}

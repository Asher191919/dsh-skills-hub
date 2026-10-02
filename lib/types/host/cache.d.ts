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
import { type MarketSource, type SourceStatusInfo } from '../shared/market.ts';
/** Insertion-ordered TTL map with an entry cap. */
export interface MarketCache {
    /** The live entry, or `undefined` when missing or expired. */
    get<T>(key: string): T | undefined;
    /** The entry even when expired — the stale-while-error fallback. */
    getStale<T>(key: string): {
        value: T;
        storedAt: number;
    } | undefined;
    set(key: string, value: unknown, ttlMs: number): void;
    clear(): void;
}
/**
 * Create the plugin-owned cache. One instance per fiber: HMR reload drops it
 * with the fiber, so a stale module never serves a disposed plugin's data.
 *
 * @param maxEntries - entry cap; oldest insertions are evicted first.
 * @returns the cache handle.
 */
export declare function createMarketCache(maxEntries?: number): MarketCache;
/** Per-registry health, fed by the fetch helper and read by every response. */
export interface SourceHealth {
    recordSuccess(source: MarketSource): void;
    recordFailure(source: MarketSource, error: string): void;
    get(source: MarketSource): SourceStatusInfo;
    reset(): void;
}
/**
 * Create the health tracker. A failure after a recent success is `degraded`
 * (the registry worked a moment ago); repeated failure is `failed`.
 *
 * @returns the tracker handle.
 */
export declare function createSourceHealth(): SourceHealth;

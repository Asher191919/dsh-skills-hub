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

import {
  MARKET_SOURCES,
  type MarketSource,
  type SourceHealthStatus,
  type SourceStatusInfo,
} from '../shared/market.ts'

/** One stored value plus its expiry bookkeeping. */
interface CacheEntry {
  readonly value: unknown
  readonly expiresAt: number
  readonly storedAt: number
}

/** Insertion-ordered TTL map with an entry cap. */
export interface MarketCache {
  /** The live entry, or `undefined` when missing or expired. */
  get<T>(key: string): T | undefined
  /** The entry even when expired — the stale-while-error fallback. */
  getStale<T>(key: string): { value: T; storedAt: number } | undefined
  set(key: string, value: unknown, ttlMs: number): void
  clear(): void
}

/** Default cap: enough for a deep catalog crawl, small enough to stay bounded. */
const MAX_CACHE_ENTRIES = 500

/**
 * Create the plugin-owned cache. One instance per fiber: HMR reload drops it
 * with the fiber, so a stale module never serves a disposed plugin's data.
 *
 * @param maxEntries - entry cap; oldest insertions are evicted first.
 * @returns the cache handle.
 */
export function createMarketCache(maxEntries: number = MAX_CACHE_ENTRIES): MarketCache {
  const entries = new Map<string, CacheEntry>()

  return {
    get<T>(key: string): T | undefined {
      const entry = entries.get(key)
      if (entry === undefined) return undefined
      if (Date.now() > entry.expiresAt) return undefined
      // LRU touch: re-insert so eviction drops the least recently read key.
      entries.delete(key)
      entries.set(key, entry)
      return entry.value as T
    },

    getStale<T>(key: string): { value: T; storedAt: number } | undefined {
      const entry = entries.get(key)
      if (entry === undefined) return undefined
      return { value: entry.value as T, storedAt: entry.storedAt }
    },

    set(key: string, value: unknown, ttlMs: number): void {
      const now = Date.now()
      entries.delete(key)
      entries.set(key, { value, expiresAt: now + Math.max(0, ttlMs), storedAt: now })
      while (entries.size > maxEntries) {
        const oldest = entries.keys().next()
        if (oldest.done === true) break
        entries.delete(oldest.value)
      }
    },

    clear(): void {
      entries.clear()
    },
  }
}

/** One registry's last observed outcome. */
interface HealthRecord {
  status: SourceHealthStatus
  lastOkAt: number | undefined
  lastError: string | undefined
}

/** Per-registry health, fed by the fetch helper and read by every response. */
export interface SourceHealth {
  recordSuccess(source: MarketSource): void
  recordFailure(source: MarketSource, error: string): void
  get(source: MarketSource): SourceStatusInfo
  reset(): void
}

/**
 * Create the health tracker. A failure after a recent success is `degraded`
 * (the registry worked a moment ago); repeated failure is `failed`.
 *
 * @returns the tracker handle.
 */
export function createSourceHealth(): SourceHealth {
  const records = new Map<MarketSource, HealthRecord>()
  const clear = (): void => {
    records.clear()
    for (const source of MARKET_SOURCES) {
      records.set(source, { status: 'ok', lastOkAt: undefined, lastError: undefined })
    }
  }
  clear()

  return {
    recordSuccess(source: MarketSource): void {
      records.set(source, { status: 'ok', lastOkAt: Date.now(), lastError: undefined })
    },

    recordFailure(source: MarketSource, error: string): void {
      const previous = records.get(source)
      const wasHealthy = previous !== undefined && previous.status === 'ok' && previous.lastOkAt !== undefined
      records.set(source, {
        status: wasHealthy ? 'degraded' : 'failed',
        lastOkAt: previous?.lastOkAt,
        lastError: error,
      })
    },

    get(source: MarketSource): SourceStatusInfo {
      const record = records.get(source)
      if (record === undefined) return { status: 'ok' }
      return {
        status: record.status,
        ...(record.lastOkAt === undefined ? {} : { fetchedAt: record.lastOkAt }),
        ...(record.lastError === undefined ? {} : { error: record.lastError }),
      }
    },

    reset(): void {
      clear()
    },
  }
}

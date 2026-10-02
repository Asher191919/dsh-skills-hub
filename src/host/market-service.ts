/**
 * Skills Hub — catalog aggregation.
 *
 * One page of the marketplace is: a per-registry read (cached, independently
 * degraded), a cross-registry merge, the install-state annotation from disk,
 * the requested filters, a deterministic sort, and a page slice — in that
 * order. Filters run **after** the merge so a filtered page never has to be
 * re-fetched from both registries.
 *
 * Nothing here fails because one registry did: a failed read is reported in
 * `sources[].status` and the other registry still answers.
 *
 * @module dsh-skills-hub/host/market-service
 */

import {
  MARKET_LIMITS,
  MARKET_SOURCES,
  detectMarketLanguage,
  parseSkillId,
  type MarketFileContent,
  type MarketInstallFilter,
  type MarketListResponse,
  type MarketQuery,
  type MarketSecurityFilter,
  type MarketSkill,
  type MarketSkillDetail,
  type MarketSource,
  type MarketSourceFilter,
  type SourceStatusInfo,
} from '../shared/market.ts'
import type { MarketCache, SourceHealth } from './cache.ts'
import { badRequest, type HostLogger } from './errors.ts'
import type { InstallStateService } from './install-state.ts'
import { normalizeRegistryRelPath } from './paths.ts'
import type { MarketProvider, ProviderListPage } from './provider.ts'

/** Everything the catalog layer needs from the outside. */
export interface MarketServiceOptions {
  readonly providers: Readonly<Record<MarketSource, MarketProvider>>
  readonly cache: MarketCache
  readonly health: SourceHealth
  /** Catalog cache lifetime in milliseconds, from plugin config. */
  readonly cacheTtlMs: number
  readonly installState: InstallStateService
  readonly logger: HostLogger
}

/** The catalog facade the routes and tools call. */
export interface MarketService {
  list(query: MarketQuery, signal?: AbortSignal): Promise<MarketListResponse>
  detail(id: string, signal?: AbortSignal): Promise<MarketSkillDetail>
  file(id: string, filePath: string, signal?: AbortSignal): Promise<MarketFileContent>
  /** Drop every cached read; the next request re-reads upstream. */
  refresh(): void
  /** Current per-registry health. */
  sources(): Record<MarketSource, SourceStatusInfo>
}

// ─── Cursor ─────────────────────────────────────────────────────────────────

/** One registry's native cursor, merged into the single cursor the UI passes back. */
type MergedCursor = Partial<Record<MarketSource, string>>

/** Encode a merged cursor; `null` when every registry is exhausted. */
export function encodeCursor(cursor: MergedCursor): string | null {
  const keys = Object.keys(cursor)
  if (keys.length === 0) return null
  return Buffer.from(JSON.stringify(cursor), 'utf-8').toString('base64url')
}

/** Decode a merged cursor; `undefined` for anything malformed. */
export function decodeCursor(raw: string | null | undefined): MergedCursor | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8'))
  } catch {
    return undefined
  }
  if (typeof parsed !== 'object' || parsed === null) return undefined
  const cursor: MergedCursor = {}
  for (const source of MARKET_SOURCES) {
    const value = (parsed as Record<string, unknown>)[source]
    if (typeof value === 'string' && value !== '') cursor[source] = value
  }
  return cursor
}

// ─── Merge, filter, sort, page ──────────────────────────────────────────────

/**
 * Fold a SkillHub mirror into its ClawHub original.
 *
 * ClawHub is authoritative for everything it owns (the mirror is a copy of it),
 * so the SkillHub row disappears and only the data ClawHub does not have —
 * icon, scan verdict, tags — is folded onto the original. The mirror reference
 * is deliberately not surfaced: the client would have nothing to do with it.
 *
 * @param items - the merged page, in registry order.
 * @returns the deduped page, in the original order of the surviving entries.
 */
export function dedupeSkills(items: readonly MarketSkill[]): MarketSkill[] {
  const originals = new Map<string, MarketSkill>()
  for (const item of items) {
    if (item.source === 'clawhub') originals.set(item.slug, item)
  }

  const enriched = new Map<string, MarketSkill>()
  const foldedMirrors = new Set<string>()
  for (const item of items) {
    if (item.source !== 'skillhub') continue
    const upstreamSlug = item.upstream?.slug
    if (upstreamSlug === undefined || upstreamSlug === '') continue
    const original = originals.get(upstreamSlug)
    if (original === undefined) continue
    foldedMirrors.add(item.id)
    enriched.set(upstreamSlug, enrichFromMirror(enriched.get(upstreamSlug) ?? original, item))
  }

  const result: MarketSkill[] = []
  const emitted = new Set<string>()
  for (const item of items) {
    if (item.source === 'clawhub') {
      if (emitted.has(item.slug)) continue
      emitted.add(item.slug)
      result.push(enriched.get(item.slug) ?? item)
      continue
    }
    if (foldedMirrors.has(item.id)) continue
    result.push(item)
  }
  return result
}

/** Copy the SkillHub-only fields onto the ClawHub original. */
function enrichFromMirror(original: MarketSkill, mirror: MarketSkill): MarketSkill {
  return {
    ...original,
    ...(original.iconUrl === undefined && mirror.iconUrl !== undefined ? { iconUrl: mirror.iconUrl } : {}),
    ...(original.securityStatus === 'unknown' && mirror.securityStatus !== 'unknown'
      ? { securityStatus: mirror.securityStatus, ...(mirror.securityReports === undefined ? {} : { securityReports: mirror.securityReports }) }
      : {}),
    ...(original.tags.length === 0 && mirror.tags.length > 0 ? { tags: mirror.tags } : {}),
  }
}

/** The three post-merge filters, all `'all'`-tolerant. */
export interface ListFilters {
  readonly source?: MarketSourceFilter | undefined
  readonly security?: MarketSecurityFilter | undefined
  readonly install?: MarketInstallFilter | undefined
}

/**
 * Apply the source, security and install filters to a merged page.
 *
 * @param items - deduped entries with install state already resolved.
 * @param filters - the client's filter bar.
 * @returns the surviving entries, order preserved.
 */
export function applyListFilters(items: readonly MarketSkill[], filters: ListFilters): MarketSkill[] {
  return items.filter((item) => {
    const source = filters.source
    if (source !== undefined && source !== 'all' && item.source !== source) return false

    const security = filters.security
    if (security !== undefined && security !== 'all' && item.securityStatus !== security) return false

    const install = filters.install
    if (install !== undefined && install !== 'all') {
      if (install === 'installed' && item.installState !== 'installed') return false
      if (install === 'installable' && item.installState === 'installed') return false
    }
    return true
  })
}

/**
 * Order a page by popularity. The id tiebreak keeps paging stable when two
 * entries share a download count.
 */
export function sortSkills(items: readonly MarketSkill[]): MarketSkill[] {
  return [...items].sort((left, right) => {
    const byDownloads = right.stats.downloads - left.stats.downloads
    if (byDownloads !== 0) return byDownloads
    if (left.id === right.id) return 0
    return left.id < right.id ? -1 : 1
  })
}

/** Clamp a client-supplied page size into the supported range. */
export function clampLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return MARKET_LIMITS.pageSize
  const whole = Math.trunc(limit)
  return Math.min(100, Math.max(1, whole))
}

// ─── Detail-level installability ────────────────────────────────────────────

/**
 * Apply the file-level installability rules to a detail view. Only an entry
 * that is still `installable` can become `not-installable`: an already
 * installed skill stays installed, and an entry the disk rejected keeps the
 * stronger local verdict.
 *
 * @param detail - the detail with install state resolved.
 * @returns the detail with per-file sizes and installability resolved.
 */
export function applyFileLimits(detail: MarketSkillDetail): MarketSkillDetail {
  const files = detail.files.map((file) => ({ ...file, tooBig: file.size > MARKET_LIMITS.maxFileSize }))
  const result: MarketSkillDetail = { ...detail, files }
  if (result.installState !== 'installable') return result
  if (files.length === 0 || !files.some((file) => file.path === 'SKILL.md')) {
    return { ...result, installState: 'not-installable', notInstallableReason: 'empty-file-list' }
  }
  if (files.length > MARKET_LIMITS.maxFileCount) {
    return { ...result, installState: 'not-installable', notInstallableReason: 'too-many-files' }
  }
  if (files.some((file) => file.tooBig) || result.totalSize > MARKET_LIMITS.maxTotalSize) {
    return { ...result, installState: 'not-installable', notInstallableReason: 'file-too-large' }
  }
  return result
}

/** Whether a client-supplied preview path may be sent to a registry. */
export function isValidPreviewPath(filePath: unknown): boolean {
  return normalizeRegistryRelPath(filePath) !== null
}

// ─── Service ────────────────────────────────────────────────────────────────

/** One registry's read outcome for this request. */
interface ProviderOutcome {
  readonly page: ProviderListPage | null
  readonly status: SourceStatusInfo
}

/** Construction options for {@link createMarketService}. */
export function createMarketService(options: MarketServiceOptions): MarketService {
  const cacheTtl = Math.max(0, options.cacheTtlMs)

  const fetchPage = async (
    source: MarketSource,
    params: { q: string | undefined; cursor: string | undefined; limit: number },
    refresh: boolean,
    signal: AbortSignal | undefined,
  ): Promise<ProviderOutcome> => {
    const isSearch = params.q !== undefined && params.q !== ''
    const key = isSearch
      ? `search:${source}:${params.q ?? ''}:${params.cursor ?? ''}:${String(params.limit)}`
      : `list:${source}:${params.cursor ?? ''}:${String(params.limit)}`

    if (!refresh) {
      const cached = options.cache.get<ProviderListPage>(key)
      if (cached !== undefined) {
        return { page: cached, status: { status: 'ok', fetchedAt: Date.now(), fromCache: true } }
      }
    }

    try {
      const provider = options.providers[source]
      const page = isSearch
        ? await provider.search({ q: params.q ?? '', cursor: params.cursor, limit: params.limit, signal })
        : await provider.list({ cursor: params.cursor, limit: params.limit, signal })
      options.cache.set(key, page, cacheTtl)
      return { page, status: { status: 'ok', fetchedAt: Date.now(), fromCache: false } }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'registry read failed'
      options.logger.warn(`skills-hub: ${source} read failed: ${message}`)
      // Stale-while-error: an expired entry still beats an empty page. A
      // cancelled read is not a registry failure, so it is never "rescued".
      if (signal?.aborted === true) {
        return { page: null, status: { ...options.health.get(source), fromCache: false, error: message } }
      }
      const stale = options.cache.getStale<ProviderListPage>(key)
      if (stale !== undefined) {
        return {
          page: stale.value,
          status: { status: 'cached', fetchedAt: stale.storedAt, fromCache: true, error: message },
        }
      }
      return { page: null, status: { ...options.health.get(source), fromCache: false, error: message } }
    }
  }

  const detail = async (id: string, signal?: AbortSignal): Promise<MarketSkillDetail> => {
    const parsed = parseSkillId(id)
    if (parsed === null) throw badRequest(`invalid skill id: ${id === '' ? '(missing)' : id}`)

    const key = `detail:${parsed.source}:${parsed.slug}`
    let cached = options.cache.get<MarketSkillDetail>(key)
    if (cached === undefined) {
      try {
        cached = await options.providers[parsed.source].detail(parsed.slug, signal)
        options.cache.set(key, cached, cacheTtl)
      } catch (error) {
        const stale = options.cache.getStale<MarketSkillDetail>(key)
        if (stale === undefined || signal?.aborted === true) throw error
        options.logger.warn(`skills-hub: serving a cached detail for ${id}`)
        cached = stale.value
      }
    }
    const annotated = await options.installState.annotate(cached)
    return applyFileLimits(annotated)
  }

  return {
    async list(query: MarketQuery, signal?: AbortSignal): Promise<MarketListResponse> {
      const limit = clampLimit(query.limit)
      const cursor = decodeCursor(query.cursor)
      const firstPage = query.cursor === undefined || query.cursor === ''
      const question = query.q?.trim() ?? ''
      const activeSources: readonly MarketSource[] = query.source === undefined || query.source === 'all'
        ? MARKET_SOURCES
        : [query.source]

      const outcomes = new Map<MarketSource, ProviderOutcome>()
      await Promise.all(activeSources.map(async (source) => {
        const providerCursor = cursor?.[source]
        if (!firstPage && providerCursor === undefined) {
          // Absent from a non-first-page cursor: this registry is exhausted.
          outcomes.set(source, { page: { items: [] }, status: { status: 'ok', fromCache: true } })
          return
        }
        // ClawHub search has no pagination; cap it so it cannot dominate.
        const sourceLimit = question !== '' && source === 'clawhub' ? MARKET_LIMITS.searchResultCap : limit
        outcomes.set(source, await fetchPage(
          source,
          { q: question === '' ? undefined : question, cursor: providerCursor, limit: sourceLimit },
          query.refresh === true,
          signal,
        ))
      }))

      const merged: MarketSkill[] = []
      const next: MergedCursor = {}
      const status: Partial<Record<MarketSource, SourceStatusInfo>> = {}
      let total: number | undefined
      for (const source of MARKET_SOURCES) {
        const outcome = outcomes.get(source)
        if (outcome === undefined) {
          // Not queried for this request (filtered out by `source`).
          status[source] = { status: 'ok', fromCache: false }
          continue
        }
        status[source] = outcome.status
        if (outcome.page === null) continue
        merged.push(...outcome.page.items)
        if (outcome.page.nextCursor !== undefined && outcome.page.nextCursor !== '') {
          next[source] = outcome.page.nextCursor
        }
        if (typeof outcome.page.total === 'number') total = (total ?? 0) + outcome.page.total
      }

      const annotated = await options.installState.annotateAll(sortSkills(dedupeSkills(merged)))
      const filtered = applyListFilters(annotated, {
        source: query.source,
        security: query.security,
        install: query.install,
      })

      // A registry's `total` describes what *it* holds, not what survives a
      // post-merge filter. SkillHub reports ~177k skills while
      // `security=verified` can match none of the page actually fetched, so
      // reporting the upstream total would have the panel claim "177122 个技能"
      // above an empty grid. A narrowing filter suppresses it and the client
      // counts the page instead. A `source` filter does not narrow this way: it
      // is pushed upstream by querying that registry alone.
      const narrowed = (query.security ?? 'all') !== 'all' || (query.install ?? 'all') !== 'all'

      return {
        items: filtered.slice(0, limit),
        nextCursor: encodeCursor(next),
        sources: {
          clawhub: status.clawhub ?? { status: 'ok', fromCache: false },
          skillhub: status.skillhub ?? { status: 'ok', fromCache: false },
        },
        ...(total === undefined || narrowed ? {} : { total }),
        generatedAt: Date.now(),
      }
    },

    detail,

    async file(id: string, filePath: string, signal?: AbortSignal): Promise<MarketFileContent> {
      const parsed = parseSkillId(id)
      if (parsed === null) throw badRequest(`invalid skill id: ${id === '' ? '(missing)' : id}`)
      const relative = normalizeRegistryRelPath(filePath)
      if (relative === null) throw badRequest('invalid file path')

      const key = `file:${parsed.source}:${parsed.slug}:${relative}`
      const cached = options.cache.get<MarketFileContent>(key)
      if (cached !== undefined) return cached

      const fetched = await options.providers[parsed.source].fetchFile(parsed.slug, relative, signal)
      let content = fetched.content
      let truncated = false
      const bytes = Buffer.byteLength(content, 'utf-8')
      if (bytes > MARKET_LIMITS.previewTruncateBytes) {
        content = Buffer.from(content, 'utf-8').subarray(0, MARKET_LIMITS.previewTruncateBytes).toString('utf-8')
        truncated = true
      }
      const result: MarketFileContent = {
        path: relative,
        content,
        language: detectMarketLanguage(relative),
        size: fetched.size,
        truncated,
      }
      options.cache.set(key, result, cacheTtl)
      return result
    },

    refresh(): void {
      options.cache.clear()
    },

    sources(): Record<MarketSource, SourceStatusInfo> {
      return {
        clawhub: options.health.get('clawhub'),
        skillhub: options.health.get('skillhub'),
      }
    },
  }
}

/**
 * Skills Hub — SkillHub provider (https://api.skillhub.cn).
 *
 * Endpoints (verified against the live API by the reference implementation):
 *  - `GET /api/skills?page=&pageSize=&keyword=` → `{code, data:{skills[], total}, message}`
 *      The pagination parameter **must** be `pageSize` and the search parameter
 *      **must** be `keyword`; `limit` and `q` are silently ignored upstream.
 *  - `GET /api/v1/skills/{slug}`                → `{skill, owner, latestVersion, securityReports}`
 *  - `GET /api/v1/skills/{slug}/files`          → `{count, files:[{path, sha256, size}]}`
 *  - `GET /api/v1/skills/{slug}/file?path=`     → 302 to object storage (followed)
 *
 * SkillHub mirrors ClawHub skills: a mirrored entry carries `source: 'clawhub'`
 * plus `upstream_url`. That marker is preserved as `upstream` so the
 * aggregation layer can fold the mirror into the ClawHub original.
 *
 * @module dsh-skills-hub/host/providers/skillhub
 */

import {
  MARKET_ERROR_CODES,
  MARKET_LIMITS,
  detectMarketLanguage,
  meaningfulChangelog,
  skillId,
  type MarketSkill,
  type MarketSkillDetail,
  type MarketSource,
  type SecurityReport,
  type SecurityStatus,
} from '../../shared/market.ts'
import { MarketUpstreamError } from '../errors.ts'
import type { ProviderFetcher } from '../provider-fetch.ts'
import { maxRegistryFileBytes, statusError } from '../provider-fetch.ts'
import type { MarketProvider, ProviderFileEntry, ProviderListPage } from '../provider.ts'

/** A SkillHub entry; the detail endpoint spells fields differently to the list. */
interface SkillhubListItem {
  slug?: string
  name?: string
  displayName?: string
  summary?: string
  summary_zh?: string
  description?: string
  description_zh?: string
  category?: string
  subCategories?: Array<{ key?: string; name?: string }>
  downloads?: number
  installs?: number
  stars?: number
  iconUrl?: string
  ownerName?: string
  labels?: Record<string, string>
  source?: string
  upstream_url?: string
  verified?: boolean
  version?: string
  updated_at?: number
}

/** The `{code, data, message}` envelope every SkillHub list endpoint uses. */
interface SkillhubEnvelope<T> {
  code?: number
  data?: T
  message?: string
}

interface SkillhubSecurityReports {
  [vendor: string]: { status?: string; statusText?: string; reportUrl?: string } | undefined
}

interface SkillhubDetail {
  skill?: SkillhubListItem & { stats?: { downloads?: number; installs?: number; stars?: number } }
  owner?: { handle?: string; displayName?: string; image?: string }
  latestVersion?: { version?: string; changelog?: string; createdAt?: number }
  securityReports?: SkillhubSecurityReports
}

/** Scanners whose verdicts do not object to a version. */
const BENIGN_STATUSES = new Set(['benign', 'safe', 'clean'])

/** Options for {@link createSkillhubProvider}. */
export interface SkillhubProviderOptions {
  /** Registry base, e.g. `https://api.skillhub.cn`; from plugin config. */
  readonly baseUrl: string
  readonly fetcher: ProviderFetcher
}

/**
 * Create the SkillHub provider.
 *
 * @param options - registry base and the shared fetch helper.
 * @returns the provider.
 */
export function createSkillhubProvider(options: SkillhubProviderOptions): MarketProvider {
  const base = options.baseUrl.replace(/\/+$/, '')
  const url = (path: string): URL => new URL(path, `${base}/`)

  const fetchPage = async (params: {
    keyword?: string | undefined
    page: number
    pageSize: number
    signal?: AbortSignal | undefined
  }): Promise<ProviderListPage> => {
    const target = url('/api/skills')
    target.searchParams.set('page', String(params.page))
    target.searchParams.set('pageSize', String(params.pageSize))
    if (params.keyword !== undefined && params.keyword !== '') target.searchParams.set('keyword', params.keyword)

    const envelope = await options.fetcher.json<SkillhubEnvelope<{ skills?: SkillhubListItem[]; total?: number }>>(
      'skillhub',
      target.toString(),
      params.signal,
    )
    if (envelope.code !== 0 || !Array.isArray(envelope.data?.skills)) {
      throw new MarketUpstreamError(
        'skillhub',
        MARKET_ERROR_CODES.upstreamBadResponse,
        `skillhub responded code=${String(envelope.code)}: ${envelope.message ?? 'unusable payload'}`,
      )
    }
    const items = envelope.data.skills.filter(hasSlug).map(normalizeListItem)
    const total = envelope.data.total ?? 0
    const hasMore = params.page * params.pageSize < total
    return {
      items,
      ...(hasMore ? { nextCursor: String(params.page + 1) } : {}),
      total,
    }
  }

  const provider: MarketProvider = {
    source: 'skillhub',

    async list({ cursor, limit, signal }): Promise<ProviderListPage> {
      return fetchPage({ page: parsePage(cursor), pageSize: limit, signal })
    },

    async search({ q, cursor, limit, signal }): Promise<ProviderListPage> {
      return fetchPage({ keyword: q, page: parsePage(cursor), pageSize: limit, signal })
    },

    async detail(slug, signal): Promise<MarketSkillDetail> {
      const data = await options.fetcher.json<SkillhubDetail>(
        'skillhub',
        url(`/api/v1/skills/${encodeURIComponent(slug)}`).toString(),
        signal,
      )
      const skill = data.skill
      if (skill === undefined || typeof skill.slug !== 'string' || skill.slug === '') {
        throw new MarketUpstreamError('skillhub', MARKET_ERROR_CODES.upstreamBadResponse, 'skillhub detail is missing the skill')
      }

      const item = normalizeListItem(skill)
      const stats = skill.stats
      const installs = stats?.installs ?? item.stats.installs
      const stars = stats?.stars ?? item.stats.stars
      const merged: MarketSkill = stats === undefined ? item : {
        ...item,
        stats: {
          downloads: stats.downloads ?? item.stats.downloads,
          ...(installs === undefined ? {} : { installs }),
          ...(stars === undefined ? {} : { stars }),
        },
      }
      const security = mapSecurity(data.securityReports, skill.verified)
      const version = data.latestVersion?.version ?? merged.version
      const changelog = meaningfulChangelog(data.latestVersion?.changelog)
      const publishedAt = data.latestVersion?.createdAt

      let files: readonly ProviderFileEntry[] = []
      try {
        files = await provider.listFiles(slug, version, signal)
      } catch {
        // The file list is best-effort at detail time; install re-fetches it.
      }

      // SkillHub's detail carries no SKILL.md body, so fetch it for the overview.
      let description = merged.summary
      if (files.some((file) => file.path === 'SKILL.md')) {
        try {
          description = (await provider.fetchFile(slug, 'SKILL.md', signal)).content
        } catch {
          description = merged.summary
        }
      }

      return {
        ...merged,
        ...(version === undefined ? {} : { version }),
        ...(changelog === undefined
          ? {}
          : { changelog: { version, text: changelog, ...(typeof publishedAt === 'number' ? { publishedAt } : {}) } }),
        author: {
          handle: data.owner?.handle ?? merged.author.handle,
          ...(data.owner?.displayName === undefined ? {} : { displayName: data.owner.displayName }),
          ...(data.owner?.image === undefined ? {} : { avatarUrl: data.owner.image }),
        },
        securityStatus: security.status,
        ...(security.reports.length === 0 ? {} : { securityReports: security.reports }),
        description,
        files: files.map((file) => ({
          path: file.path,
          size: file.size,
          ...(file.sha256 === undefined ? {} : { sha256: file.sha256 }),
          ...(file.contentType === undefined ? {} : { contentType: file.contentType }),
          language: detectMarketLanguage(file.path),
          tooBig: file.size > MARKET_LIMITS.maxFileSize,
        })),
        totalSize: files.reduce((sum, file) => sum + file.size, 0),
      }
    },

    async listFiles(slug, _version, signal): Promise<readonly ProviderFileEntry[]> {
      const target = url(`/api/v1/skills/${encodeURIComponent(slug)}/files`)
      const data = await options.fetcher.json<{ count?: number; files?: Array<{ path?: string; sha256?: string; size?: number }> }>(
        'skillhub',
        target.toString(),
        signal,
      )
      if (!Array.isArray(data.files)) {
        throw new MarketUpstreamError('skillhub', MARKET_ERROR_CODES.upstreamBadResponse, 'skillhub files are missing the list')
      }
      const result: ProviderFileEntry[] = []
      for (const file of data.files) {
        if (typeof file?.path !== 'string' || file.path === '') continue
        result.push({
          path: file.path,
          size: typeof file.size === 'number' && file.size >= 0 ? file.size : 0,
          ...(typeof file.sha256 === 'string' && file.sha256 !== '' ? { sha256: file.sha256 } : {}),
        })
      }
      return result
    },

    async fetchFile(slug, filePath, signal): Promise<{ content: string; size: number }> {
      const target = url(`/api/v1/skills/${encodeURIComponent(slug)}/file`)
      target.searchParams.set('path', filePath)
      // The registry answers 302 into object storage; the fetch helper follows.
      const response = await options.fetcher.request('skillhub', target.toString(), signal)
      if (!response.ok) throw statusError('skillhub', response.status, target.toString())
      return options.fetcher.text('skillhub', response, maxRegistryFileBytes(), `file ${filePath}`)
    },
  }

  return provider
}

function hasSlug(item: SkillhubListItem): boolean {
  return typeof item.slug === 'string' && item.slug !== ''
}

/** Cursor values are 1-based page numbers as strings. */
function parsePage(cursor: string | undefined): number {
  if (cursor === undefined || cursor === '') return 1
  const parsed = Number.parseInt(cursor, 10)
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
}

/**
 * The ClawHub original a mirrored SkillHub entry points at, when it names one.
 * `upstream_url` looks like `https://clawhub.ai/{owner}/{slug}`.
 */
function parseUpstream(item: SkillhubListItem): MarketSkill['upstream'] {
  if (item.source !== 'clawhub') return undefined
  const raw = item.upstream_url
  if (typeof raw !== 'string' || raw === '') return undefined
  try {
    const segments = new URL(raw).pathname.split('/').filter((segment) => segment !== '')
    const slug = segments[segments.length - 1]
    if (slug !== undefined && slug !== '') return { source: 'clawhub' as MarketSource, slug }
  } catch {
    // A malformed upstream URL makes this a native entry, not a mirror.
  }
  return undefined
}

/** A SkillHub entry, normalized to the shared skill shape. */
function normalizeListItem(item: SkillhubListItem): MarketSkill {
  const slug = item.slug ?? ''
  const tags: string[] = []
  for (const sub of item.subCategories ?? []) {
    if (typeof sub?.name === 'string' && sub.name !== '') tags.push(sub.name)
  }
  const upstream = parseUpstream(item)
  const iconUrl = typeof item.iconUrl === 'string' && item.iconUrl !== '' ? item.iconUrl : undefined
  return {
    id: skillId('skillhub', slug),
    source: 'skillhub',
    slug,
    name: item.name ?? item.displayName ?? slug,
    summary: item.description_zh ?? item.description ?? item.summary_zh ?? item.summary ?? '',
    author: { handle: item.ownerName ?? '' },
    stats: {
      downloads: item.downloads ?? 0,
      ...(item.installs === undefined ? {} : { installs: item.installs }),
      ...(item.stars === undefined ? {} : { stars: item.stars }),
    },
    tags,
    ...(item.category === undefined ? {} : { category: item.category }),
    ...(item.version === undefined ? {} : { version: item.version }),
    ...(item.updated_at === undefined ? {} : { updatedAt: item.updated_at }),
    ...(iconUrl === undefined ? {} : { iconUrl }),
    // List payloads carry no security reports; `verified` is the only signal.
    // The detail endpoint refines this to benign/flagged.
    securityStatus: item.verified === true ? 'verified' : 'unknown',
    ...(item.labels?.requires_api_key === 'true' ? { requiresApiKey: true } : {}),
    ...(item.verified === undefined ? {} : { verified: item.verified }),
    ...(upstream === undefined ? {} : { upstream }),
    installState: 'installable',
  }
}

/**
 * SkillHub's scan reports: every scanner's verdict decides the badge, and a
 * publisher-vouched version with no objection becomes `verified`.
 */
export function mapSecurity(
  reports: SkillhubSecurityReports | undefined,
  verified: boolean | undefined,
): { status: SecurityStatus; reports: SecurityReport[] } {
  const normalized: SecurityReport[] = []
  for (const [vendor, report] of Object.entries(reports ?? {})) {
    if (report?.status === undefined || report.status === '') continue
    normalized.push({
      vendor,
      status: report.status,
      statusText: report.statusText ?? report.status,
      ...(report.reportUrl === undefined ? {} : { reportUrl: report.reportUrl }),
    })
  }
  if (normalized.length === 0) return { status: 'unknown', reports: normalized }
  const flagged = normalized.some((report) => !BENIGN_STATUSES.has(report.status.toLowerCase()))
  if (flagged) return { status: 'flagged', reports: normalized }
  return { status: verified === true ? 'verified' : 'benign', reports: normalized }
}

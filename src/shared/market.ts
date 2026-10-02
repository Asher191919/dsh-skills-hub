/**
 * Skills Hub — the wire contract shared by the host half and the browser half.
 *
 * This module must stay **type-only for the client bundle**: the client imports
 * it with `import type`, so nothing here may carry runtime values that the
 * browser half needs (the client bundle purity gate forbids cross-plugin value
 * imports, and a local value module would be inlined twice). Pure helpers that
 * both halves genuinely need live here as `const`/`function` exports and are
 * small enough to duplicate safely — they are marked CLIENT-SAFE.
 *
 * Upstream registries:
 *  - ClawHub  (https://clawhub.ai)      — cursor pagination, no security audits
 *  - SkillHub (https://api.skillhub.cn) — page/pageSize pagination, security reports
 *
 * @module dsh-skills-hub/shared/market
 */

// ─── Sources ────────────────────────────────────────────────────────────────

export type MarketSource = 'clawhub' | 'skillhub'

/** Every registry this plugin aggregates, in display order. CLIENT-SAFE. */
export const MARKET_SOURCES: readonly MarketSource[] = ['clawhub', 'skillhub']

/**
 * Scan verdict of one skill version.
 *  - `verified` — registry vouches for the publisher and every scanner is benign
 *  - `benign`   — scanned, nothing flagged
 *  - `unknown`  — never scanned (ClawHub lists carry no verdict at all)
 *  - `flagged`  — at least one scanner objected
 */
export type SecurityStatus = 'verified' | 'benign' | 'unknown' | 'flagged'

/** Every security status, in the filter bar's order. CLIENT-SAFE. */
export const SECURITY_STATUSES: readonly SecurityStatus[] = ['verified', 'benign', 'unknown', 'flagged']

/**
 * Whether the skill can be written to disk right now.
 *  - `installed`        — present on disk and managed (or adopted) by this hub
 *  - `installable`      — fetchable and not yet installed
 *  - `not-installable`  — upstream shape forbids a safe install; see `notInstallableReason`
 */
export type InstallState = 'installed' | 'installable' | 'not-installable'

/** Why a card shows 「不可安装」. Mirrored by the client's badge copy. */
export type NotInstallableReason =
  | 'empty-file-list'
  | 'file-too-large'
  | 'too-many-files'
  | 'invalid-name'
  | 'name-conflict'
  | 'source-unavailable'

/** Reachability of one upstream registry for the current view. */
export type SourceHealthStatus = 'ok' | 'degraded' | 'failed' | 'cached'

/** One scanner's verdict, as the registry reported it. */
export interface SecurityReport {
  /** Scanner identity, e.g. `VirusTotal`, `skillspider`, `clawhub-scan`. */
  readonly vendor: string
  /** Raw upstream status token. */
  readonly status: string
  /** Human-readable rendering of `status`. */
  readonly statusText: string
  /** The scanner's own explanation, when it gives one. */
  readonly summary?: string
  /** Deep link to the full report. */
  readonly reportUrl?: string
}

/** Popularity counters. Absent counters stay `undefined` so the UI can omit them. */
export interface MarketStats {
  readonly downloads: number
  readonly installs?: number
  readonly stars?: number
}

/** Publisher identity. */
export interface MarketAuthor {
  readonly handle: string
  readonly displayName?: string
  readonly avatarUrl?: string
}

/** What this hub recorded about a skill it installed. */
export interface InstalledInfo {
  /** Version written at install time. */
  readonly version?: string
  /** ISO-8601 instant the install completed. */
  readonly installedAt: string
  /** Directory name under the skills root. */
  readonly dirName: string
  /** Whether this file was written by the hub (`true`) or adopted from disk (`false`). */
  readonly managed: boolean
}

/** One entry in the marketplace grid. */
export interface MarketSkill {
  /** `${source}:${slug}` — globally unique. */
  readonly id: string
  readonly source: MarketSource
  readonly slug: string
  readonly name: string
  /** Short summary; `summaryEn` carries the original when `summary` is localized. */
  readonly summary: string
  readonly summaryEn?: string
  readonly author: MarketAuthor
  readonly stats: MarketStats
  readonly tags: readonly string[]
  readonly category?: string
  readonly version?: string
  /** Epoch millis of the last upstream update. */
  readonly updatedAt?: number
  readonly iconUrl?: string
  readonly securityStatus: SecurityStatus
  readonly securityReports?: readonly SecurityReport[]
  readonly requiresApiKey?: boolean
  readonly verified?: boolean
  /** Set on SkillHub entries that mirror a ClawHub skill. */
  readonly upstream?: { readonly source: MarketSource; readonly slug: string }
  readonly installState: InstallState
  readonly notInstallableReason?: NotInstallableReason
  readonly installedInfo?: InstalledInfo
}

/** Per-file metadata in a skill detail. */
export interface MarketFileMeta {
  readonly path: string
  readonly size: number
  readonly sha256?: string
  readonly contentType?: string
  readonly language: string
  /** The file exceeds the preview/install size limit. */
  readonly tooBig: boolean
}

/** A skill plus everything only the detail view needs. */
export interface MarketSkillDetail extends MarketSkill {
  /** Full `SKILL.md` body, frontmatter stripped. */
  readonly description: string
  /** Raw frontmatter parsed out of `SKILL.md`, when the registry exposes it. */
  readonly descriptionFrontmatter?: Readonly<Record<string, unknown>>
  readonly license?: string
  readonly files: readonly MarketFileMeta[]
  readonly totalSize: number
  /** Latest release note, when upstream has a meaningful one. */
  readonly changelog?: { readonly version?: string; readonly text: string; readonly publishedAt?: number }
  /** The skill's page on its registry website. */
  readonly pageUrl?: string
}

/** One file body, for the preview pane. */
export interface MarketFileContent {
  readonly path: string
  readonly content: string
  readonly language: string
  readonly size: number
  readonly truncated: boolean
}

/** Health of one registry for the response that carried it. */
export interface SourceStatusInfo {
  readonly status: SourceHealthStatus
  /** Epoch millis the payload behind this view was fetched. */
  readonly fetchedAt?: number
  readonly fromCache?: boolean
  /** Populated when `status` is `failed` or `degraded`. */
  readonly error?: string
}

/** A category chip value; counts are catalog-wide, not filtered. */
export interface MarketCategory {
  readonly key: string
  readonly name: string
  readonly nameEn: string
  readonly count: number
}

/** `GET /plugins/dsh-skills-hub/catalog` response body. */
export interface MarketListResponse {
  readonly items: readonly MarketSkill[]
  /** Opaque cursor for the next page; `null` means exhausted. */
  readonly nextCursor: string | null
  readonly sources: Readonly<Record<MarketSource, SourceStatusInfo>>
  /** Total matches across all pages, when the registry can count them. */
  readonly total?: number
  /** Epoch millis this payload was assembled. */
  readonly generatedAt: number
}

/** `GET /plugins/dsh-skills-hub/installed` response body. */
export interface MarketInstalledResponse {
  readonly items: readonly MarketSkill[]
  /** Absolute directories this hub reads for installed skills. */
  readonly roots: readonly string[]
  /** How many entries on disk are not attributable to a registry. */
  readonly localOnly: number
}

/** `POST /plugins/dsh-skills-hub/install` response body. */
export interface MarketInstallResponse {
  readonly ok: true
  readonly id: string
  readonly dirName: string
  readonly path: string
  readonly version?: string
  readonly fileCount: number
  readonly totalSize: number
}

/** Every error body this plugin's routes return. */
export interface MarketErrorBody {
  readonly error: string
  readonly code: string
  readonly source?: MarketSource
}

/** Stable error codes, so the client can branch without matching prose. */
export const MARKET_ERROR_CODES = {
  upstreamError: 'MARKET_UPSTREAM_ERROR',
  upstreamTimeout: 'MARKET_UPSTREAM_TIMEOUT',
  upstreamBadResponse: 'MARKET_UPSTREAM_BAD_RESPONSE',
  installInProgress: 'MARKET_INSTALL_IN_PROGRESS',
  alreadyInstalled: 'MARKET_ALREADY_INSTALLED',
  notInstallable: 'MARKET_NOT_INSTALLABLE',
  checksumMismatch: 'MARKET_CHECKSUM_MISMATCH',
  diskError: 'MARKET_DISK_ERROR',
  notInstalled: 'MARKET_NOT_INSTALLED',
  notManaged: 'MARKET_NOT_MANAGED',
  badRequest: 'MARKET_BAD_REQUEST',
  sourceUnavailable: 'MARKET_SOURCE_UNAVAILABLE',
  /**
   * An unrecognized failure, i.e. a bug. It exists so the canned 500 does not
   * have to borrow `diskError` and claim a disk problem that did not happen.
   */
  internal: 'MARKET_INTERNAL_ERROR',
} as const

export type MarketErrorCode = (typeof MARKET_ERROR_CODES)[keyof typeof MARKET_ERROR_CODES]

// ─── Filter vocabulary (client-side, but shared so the API can validate) ─────

export type MarketSourceFilter = 'all' | MarketSource
export type MarketSecurityFilter = 'all' | SecurityStatus
export type MarketInstallFilter = 'all' | 'installed' | 'installable'

export interface MarketQuery {
  readonly q?: string
  readonly source?: MarketSourceFilter
  readonly security?: MarketSecurityFilter
  readonly install?: MarketInstallFilter
  readonly cursor?: string
  readonly limit?: number
  /** Bypass the cache and re-read upstream. */
  readonly refresh?: boolean
}

// ─── Limits ─────────────────────────────────────────────────────────────────

/** Hard bounds, mirrored from the reference implementation. */
export const MARKET_LIMITS = {
  /** Max bytes for a single skill file (install + preview). */
  maxFileSize: 5 * 1024 * 1024,
  /** Max total bytes for an installable skill. */
  maxTotalSize: 20 * 1024 * 1024,
  /** Max file count for an installable skill. */
  maxFileCount: 200,
  /** File preview content is truncated beyond this many bytes. */
  previewTruncateBytes: 300 * 1024,
  /** ClawHub search has no pagination — cap merged search results. */
  searchResultCap: 50,
  /** Grid page size. */
  pageSize: 24,
} as const

/** Shape of a registry owner handle accepted from the client. */
export const MARKET_OWNER_PATTERN = /^[A-Za-z0-9_.-]{1,64}$/

// ─── CLIENT-SAFE helpers (no node built-ins, no runtime imports) ─────────────

/** Compose the globally unique id for a registry entry. */
export function skillId(source: MarketSource, slug: string): string {
  return `${source}:${slug}`
}

/** Inverse of {@link skillId}; `null` when the id is malformed. */
export function parseSkillId(id: string): { source: MarketSource; slug: string } | null {
  const idx = id.indexOf(':')
  if (idx <= 0) return null
  const source = id.slice(0, idx)
  const slug = id.slice(idx + 1)
  if (!MARKET_SOURCES.includes(source as MarketSource) || slug === '') return null
  return { source: source as MarketSource, slug }
}

/**
 * Directory-name whitelist: lowercase alnum, dash, underscore, dot, no leading
 * dot, no `..`. Returns `null` for a name that must not be written to disk.
 */
export function sanitizeDirName(slug: string): string | null {
  const name = slug.toLowerCase()
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name)) return null
  if (name.includes('..')) return null
  return name
}

const LANG_MAP: Readonly<Record<string, string>> = {
  md: 'markdown', ts: 'typescript', tsx: 'typescript',
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  json: 'json', yaml: 'yaml', yml: 'yaml', sh: 'bash', bash: 'bash', zsh: 'bash',
  py: 'python', toml: 'toml', css: 'css', html: 'html',
  txt: 'text', xml: 'xml', sql: 'sql', rs: 'rust', go: 'go', rb: 'ruby',
}

/** Best-effort language tag for a file path, for the preview pane. */
export function detectMarketLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return LANG_MAP[ext] ?? 'text'
}

/** A release note worth showing: registries stamp placeholders on synced versions. */
export function meaningfulChangelog(text: unknown): string | undefined {
  const value = typeof text === 'string' ? text.trim() : ''
  if (value === '') return undefined
  if (/^synced by .*pipeline$/i.test(value)) return undefined
  return value
}

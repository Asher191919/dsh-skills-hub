/**
 * HTTP client for the skills-hub host half.
 *
 * Every route lives behind the browser auth fence, so requests carry
 * `credentials: 'same-origin'`; every request takes an `AbortSignal` so the
 * panel can supersede or unmount without leaking a socket. Responses are
 * validated field by field before they reach React: a malformed payload raises
 * {@link MarketApiError} with a stable code instead of crashing the panel on a
 * missing property three renders later.
 *
 * @module dsh-skills-hub/client/market-api
 */

import {
  MARKET_ERROR_CODES, MARKET_LIMITS, MARKET_SOURCES, SECURITY_STATUSES,
} from '../shared/market.ts'
import type {
  InstalledInfo, MarketAuthor, MarketFileContent, MarketFileMeta, MarketInstallResponse,
  MarketQuery, MarketSecurityFilter, MarketSkill, MarketSkillDetail, MarketSource, MarketSourceFilter,
  MarketStats, NotInstallableReason, SecurityReport, SecurityStatus, SourceStatusInfo,
} from '../shared/market.ts'

/** Mount point of the plugin's host routes. */
export const MARKET_BASE_PATH = '/plugins/dsh-skills-hub'

/** Stable codes the client adds on top of the shared {@link MARKET_ERROR_CODES}. */
export const CLIENT_ERROR_CODES = {
  /** The route answered 2xx with a body that does not match the wire contract. */
  badResponse: 'MARKET_CLIENT_BAD_RESPONSE',
  /** The route answered 2xx with a non-JSON body where JSON was required. */
  malformedBody: 'MARKET_CLIENT_MALFORMED_BODY',
  /** The route failed without a readable `{ error, code }` envelope. */
  httpError: 'MARKET_CLIENT_HTTP_ERROR',
} as const

/** Transport failure carrying the host's stable error code. */
export class MarketApiError extends Error {
  /** `MARKET_*` code from the error body, or one of {@link CLIENT_ERROR_CODES}. */
  readonly code: string
  /** HTTP status; 0 when the request never produced a response. */
  readonly status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'MarketApiError'
    this.code = code
    this.status = status
  }
}

/**
 * Validated catalog payload. `sources` stays partial on purpose: a registry the
 * host omitted renders no health row rather than a fabricated verdict.
 */
export interface MarketSnapshot {
  readonly items: readonly MarketSkill[]
  readonly nextCursor: string | null
  readonly sources: Partial<Record<MarketSource, SourceStatusInfo>>
  readonly total: number | undefined
  readonly generatedAt: number
}

/** One catalog page request. */
export type CatalogRequest = Pick<MarketQuery, 'q' | 'source' | 'security' | 'install' | 'cursor' | 'limit' | 'refresh'>

// ─── Layer 0: untrusted-value readers ───────────────────────────────────────

type JsonObject = Record<string, unknown>

function asObject(value: unknown): JsonObject | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonObject) : undefined
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function asArray(value: unknown): readonly unknown[] | undefined {
  return Array.isArray(value) ? (value as readonly unknown[]) : undefined
}

function isStringMember<T extends string>(domain: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (domain as readonly string[]).includes(value)
}

// ─── Layer 1: wire-contract readers ─────────────────────────────────────────

const NOT_INSTALLABLE_REASONS: readonly NotInstallableReason[] = [
  'empty-file-list', 'file-too-large', 'too-many-files', 'invalid-name', 'name-conflict', 'source-unavailable',
]

const SOURCE_HEALTH: readonly SourceStatusInfo['status'][] = ['ok', 'degraded', 'failed', 'cached']

function readSource(value: unknown): MarketSource | undefined {
  return isStringMember(MARKET_SOURCES, value) ? value : undefined
}

function readSecurityStatus(value: unknown): SecurityStatus | undefined {
  return isStringMember(SECURITY_STATUSES, value) ? value : undefined
}

function readAuthor(value: unknown): MarketAuthor {
  const raw = asObject(value)
  const handle = asString(raw?.['handle']) ?? ''
  const displayName = asString(raw?.['displayName'])
  const avatarUrl = asString(raw?.['avatarUrl'])
  return {
    handle,
    ...(displayName === undefined ? {} : { displayName }),
    ...(avatarUrl === undefined ? {} : { avatarUrl }),
  }
}

function readStats(value: unknown): MarketStats {
  const raw = asObject(value)
  const downloads = asFiniteNumber(raw?.['downloads']) ?? 0
  const installs = asFiniteNumber(raw?.['installs'])
  const stars = asFiniteNumber(raw?.['stars'])
  return {
    downloads,
    ...(installs === undefined ? {} : { installs }),
    ...(stars === undefined ? {} : { stars }),
  }
}

function readReports(value: unknown): readonly SecurityReport[] | undefined {
  const raw = asArray(value)
  if (raw === undefined) return undefined
  const reports: SecurityReport[] = []
  for (const entry of raw) {
    const item = asObject(entry)
    if (item === undefined) continue
    const vendor = asString(item['vendor'])
    const status = asString(item['status'])
    if (vendor === undefined || status === undefined) continue
    const summary = asString(item['summary'])
    const reportUrl = asString(item['reportUrl'])
    reports.push({
      vendor,
      status,
      statusText: asString(item['statusText']) ?? status,
      ...(summary === undefined ? {} : { summary }),
      ...(reportUrl === undefined ? {} : { reportUrl }),
    })
  }
  return reports
}

function readInstalledInfo(value: unknown): InstalledInfo | undefined {
  const raw = asObject(value)
  if (raw === undefined) return undefined
  const installedAt = asString(raw['installedAt'])
  const dirName = asString(raw['dirName'])
  if (installedAt === undefined || dirName === undefined) return undefined
  const version = asString(raw['version'])
  return {
    installedAt,
    dirName,
    managed: asBoolean(raw['managed']) ?? false,
    ...(version === undefined ? {} : { version }),
  }
}

function readUpstream(value: unknown): MarketSkill['upstream'] {
  const raw = asObject(value)
  if (raw === undefined) return undefined
  const source = readSource(raw['source'])
  const slug = asString(raw['slug'])
  if (source === undefined || slug === undefined) return undefined
  return { source, slug }
}

/** Read one grid entry; `undefined` when a field the UI depends on is missing. */
export function readSkill(value: unknown): MarketSkill | undefined {
  const raw = asObject(value)
  if (raw === undefined) return undefined
  const id = asString(raw['id'])
  const source = readSource(raw['source'])
  const slug = asString(raw['slug'])
  const name = asString(raw['name'])
  const securityStatus = readSecurityStatus(raw['securityStatus'])
  const installStateValue = asString(raw['installState'])
  const installState = installStateValue === 'installed' || installStateValue === 'installable' || installStateValue === 'not-installable'
    ? installStateValue
    : undefined
  if (id === undefined || source === undefined || slug === undefined || name === undefined) return undefined
  if (securityStatus === undefined || installState === undefined) return undefined

  const summaryEn = asString(raw['summaryEn'])
  const category = asString(raw['category'])
  const version = asString(raw['version'])
  const updatedAt = asFiniteNumber(raw['updatedAt'])
  const iconUrl = asString(raw['iconUrl'])
  const reports = readReports(raw['securityReports'])
  const requiresApiKey = asBoolean(raw['requiresApiKey'])
  const verified = asBoolean(raw['verified'])
  const upstream = readUpstream(raw['upstream'])
  const installedInfo = readInstalledInfo(raw['installedInfo'])
  const reason = isStringMember(NOT_INSTALLABLE_REASONS, raw['notInstallableReason']) ? raw['notInstallableReason'] : undefined

  const tags: string[] = []
  for (const tag of asArray(raw['tags']) ?? []) {
    if (typeof tag === 'string') tags.push(tag)
  }

  return {
    id,
    source,
    slug,
    name,
    summary: asString(raw['summary']) ?? '',
    ...(summaryEn === undefined ? {} : { summaryEn }),
    author: readAuthor(raw['author']),
    stats: readStats(raw['stats']),
    tags,
    ...(category === undefined ? {} : { category }),
    ...(version === undefined ? {} : { version }),
    ...(updatedAt === undefined ? {} : { updatedAt }),
    ...(iconUrl === undefined ? {} : { iconUrl }),
    securityStatus,
    ...(reports === undefined ? {} : { securityReports: reports }),
    ...(requiresApiKey === undefined ? {} : { requiresApiKey }),
    ...(verified === undefined ? {} : { verified }),
    ...(upstream === undefined ? {} : { upstream }),
    installState,
    ...(reason === undefined ? {} : { notInstallableReason: reason }),
    ...(installedInfo === undefined ? {} : { installedInfo }),
  }
}

function readSourceStatus(value: unknown): SourceStatusInfo | undefined {
  const raw = asObject(value)
  if (raw === undefined) return undefined
  const status = isStringMember(SOURCE_HEALTH, raw['status']) ? raw['status'] : undefined
  if (status === undefined) return undefined
  const fetchedAt = asFiniteNumber(raw['fetchedAt'])
  const error = asString(raw['error'])
  const fromCache = asBoolean(raw['fromCache'])
  return {
    status,
    ...(fetchedAt === undefined ? {} : { fetchedAt }),
    ...(fromCache === undefined ? {} : { fromCache }),
    ...(error === undefined ? {} : { error }),
  }
}

function readSources(value: unknown): Partial<Record<MarketSource, SourceStatusInfo>> {
  const raw = asObject(value)
  const sources: Partial<Record<MarketSource, SourceStatusInfo>> = {}
  if (raw === undefined) return sources
  for (const source of MARKET_SOURCES) {
    const info = readSourceStatus(raw[source])
    if (info !== undefined) sources[source] = info
  }
  return sources
}

function readFileMeta(value: unknown): MarketFileMeta | undefined {
  const raw = asObject(value)
  if (raw === undefined) return undefined
  const path = asString(raw['path'])
  if (path === undefined) return undefined
  const sha256 = asString(raw['sha256'])
  const contentType = asString(raw['contentType'])
  return {
    path,
    size: asFiniteNumber(raw['size']) ?? 0,
    language: asString(raw['language']) ?? 'text',
    tooBig: asBoolean(raw['tooBig']) ?? false,
    ...(sha256 === undefined ? {} : { sha256 }),
    ...(contentType === undefined ? {} : { contentType }),
  }
}

/** Validate a `GET /catalog` body. @returns the snapshot, or `undefined` when malformed. */
export function readCatalog(value: unknown): MarketSnapshot | undefined {
  const raw = asObject(value)
  if (raw === undefined) return undefined
  const listed = asArray(raw['items'])
  const generatedAt = asFiniteNumber(raw['generatedAt'])
  if (listed === undefined || generatedAt === undefined) return undefined
  // An absent cursor is treated as an exhausted page rather than a failure.
  const cursorValue = raw['nextCursor']
  const nextCursor = cursorValue === null || cursorValue === undefined ? null : asString(cursorValue)
  if (cursorValue !== null && cursorValue !== undefined && nextCursor === undefined) return undefined

  const items: MarketSkill[] = []
  for (const entry of listed) {
    const skill = readSkill(entry)
    if (skill !== undefined) items.push(skill)
  }
  // A non-empty page that yields no readable entry is a contract break, not an
  // empty catalog: surfacing it beats showing a confidently empty grid.
  if (listed.length > 0 && items.length === 0) return undefined

  const total = asFiniteNumber(raw['total'])
  return {
    items,
    nextCursor: nextCursor ?? null,
    sources: readSources(raw['sources']),
    total,
    generatedAt,
  }
}

/** Validate a `GET /skill` body. @returns the detail, or `undefined` when malformed. */
export function readSkillDetail(value: unknown): MarketSkillDetail | undefined {
  const base = readSkill(value)
  const raw = asObject(value)
  if (base === undefined || raw === undefined) return undefined
  const listed = asArray(raw['files'])
  if (listed === undefined) return undefined
  const files: MarketFileMeta[] = []
  for (const entry of listed) {
    const meta = readFileMeta(entry)
    if (meta !== undefined) files.push(meta)
  }
  const descriptionFrontmatter = asObject(raw['descriptionFrontmatter'])
  const license = asString(raw['license'])
  const pageUrl = asString(raw['pageUrl'])
  const changelog = readChangelog(raw['changelog'])
  return {
    ...base,
    description: asString(raw['description']) ?? '',
    ...(descriptionFrontmatter === undefined ? {} : { descriptionFrontmatter }),
    ...(license === undefined ? {} : { license }),
    files,
    totalSize: asFiniteNumber(raw['totalSize']) ?? files.reduce((sum, file) => sum + file.size, 0),
    ...(changelog === undefined ? {} : { changelog }),
    ...(pageUrl === undefined ? {} : { pageUrl }),
  }
}

function readChangelog(value: unknown): MarketSkillDetail['changelog'] {
  const raw = asObject(value)
  if (raw === undefined) return undefined
  const text = asString(raw['text'])
  if (text === undefined || text.trim() === '') return undefined
  const version = asString(raw['version'])
  const publishedAt = asFiniteNumber(raw['publishedAt'])
  return {
    text,
    ...(version === undefined ? {} : { version }),
    ...(publishedAt === undefined ? {} : { publishedAt }),
  }
}

/** Validate a `GET /file` body. */
export function readFileContent(value: unknown): MarketFileContent | undefined {
  const raw = asObject(value)
  if (raw === undefined) return undefined
  const path = asString(raw['path'])
  const content = asString(raw['content'])
  if (path === undefined || content === undefined) return undefined
  return {
    path,
    content,
    language: asString(raw['language']) ?? 'text',
    size: asFiniteNumber(raw['size']) ?? content.length,
    truncated: asBoolean(raw['truncated']) ?? false,
  }
}

/** Validate a `POST /install` body. */
export function readInstallResponse(value: unknown): MarketInstallResponse | undefined {
  const raw = asObject(value)
  if (raw === undefined || raw['ok'] !== true) return undefined
  const id = asString(raw['id'])
  const dirName = asString(raw['dirName'])
  const path = asString(raw['path'])
  if (id === undefined || dirName === undefined || path === undefined) return undefined
  const version = asString(raw['version'])
  return {
    ok: true,
    id,
    dirName,
    path,
    ...(version === undefined ? {} : { version }),
    fileCount: asFiniteNumber(raw['fileCount']) ?? 0,
    totalSize: asFiniteNumber(raw['totalSize']) ?? 0,
  }
}

/** Read the `{ error, code }` envelope the host returns on failure. */
export function readErrorBody(value: unknown): { error: string; code: string } | undefined {
  const raw = asObject(value)
  if (raw === undefined) return undefined
  const error = asString(raw['error'])
  const code = asString(raw['code'])
  if (error === undefined || code === undefined) return undefined
  return { error, code }
}

// ─── Layer 2: transport ─────────────────────────────────────────────────────

/** True when a rejection is the abort this panel itself requested. */
export function isAbortError(cause: unknown): boolean {
  return typeof cause === 'object' && cause !== null && (cause as { name?: unknown }).name === 'AbortError'
}

/** Human-readable text of any thrown value. */
export function errorMessage(cause: unknown): string {
  if (cause instanceof MarketApiError) return cause.message
  if (cause instanceof Error) return cause.message
  return String(cause)
}

function buildUrl(path: string, params: Readonly<Record<string, string | undefined>>): string {
  const search = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(name, value)
  }
  const query = search.toString()
  return `${MARKET_BASE_PATH}${path}${query === '' ? '' : `?${query}`}`
}

/** One raw HTTP outcome: the status plus whatever body could be decoded. */
interface RawResponse {
  readonly ok: boolean
  readonly status: number
  readonly body: unknown
}

async function requestRaw(
  url: string,
  signal: AbortSignal,
  init?: { method: 'POST'; body: unknown },
): Promise<RawResponse> {
  const response = await fetch(url, {
    method: init?.method ?? 'GET',
    credentials: 'same-origin',
    headers: init === undefined
      ? { accept: 'application/json' }
      : { accept: 'application/json', 'content-type': 'application/json' },
    signal,
    ...(init === undefined ? {} : { body: JSON.stringify(init.body) }),
  })

  let body: unknown
  try {
    body = await response.json()
  } catch (cause) {
    // An abort must stay an abort; an unreadable body is simply absent (a 204,
    // or a proxy answering with HTML).
    if (isAbortError(cause)) throw cause
    body = undefined
  }
  return { ok: response.ok, status: response.status, body }
}

function toApiError(raw: RawResponse): MarketApiError {
  const failure = readErrorBody(raw.body)
  return new MarketApiError(
    failure?.error ?? `HTTP ${raw.status}`,
    failure?.code ?? CLIENT_ERROR_CODES.httpError,
    raw.status,
  )
}

/** A request whose 2xx body must be JSON. */
async function requestJson(
  url: string,
  signal: AbortSignal,
  init?: { method: 'POST'; body: unknown },
): Promise<unknown> {
  const raw = await requestRaw(url, signal, init)
  if (!raw.ok) throw toApiError(raw)
  if (raw.body === undefined) {
    throw new MarketApiError('response body is not JSON', CLIENT_ERROR_CODES.malformedBody, raw.status)
  }
  return raw.body
}

/** A request that only needs to succeed — `204 No Content` is a valid answer. */
async function requestOk(
  url: string,
  signal: AbortSignal,
  init?: { method: 'POST'; body: unknown },
): Promise<void> {
  const raw = await requestRaw(url, signal, init)
  if (!raw.ok) throw toApiError(raw)
}

function badResponse(url: string): MarketApiError {
  return new MarketApiError(`unexpected response shape from ${url}`, CLIENT_ERROR_CODES.badResponse, 200)
}

function optionalFilter<T extends string>(value: T | undefined): string | undefined {
  return value === undefined || value === 'all' ? undefined : value
}

/** `GET /catalog` — one page of merged registry results. */
export async function fetchCatalog(request: CatalogRequest, signal: AbortSignal): Promise<MarketSnapshot> {
  const url = buildUrl('/catalog', {
    q: request.q?.trim() === '' ? undefined : request.q?.trim(),
    source: optionalFilter<MarketSourceFilter>(request.source),
    security: optionalFilter<MarketSecurityFilter>(request.security),
    install: optionalFilter(request.install),
    cursor: request.cursor,
    limit: String(request.limit ?? MARKET_LIMITS.pageSize),
    refresh: request.refresh === true ? 'true' : undefined,
  })
  const snapshot = readCatalog(await requestJson(url, signal))
  if (snapshot === undefined) throw badResponse(url)
  return snapshot
}

/** `GET /skill` — one skill with its file list and rendered description. */
export async function fetchSkillDetail(id: string, signal: AbortSignal): Promise<MarketSkillDetail> {
  const url = buildUrl('/skill', { id })
  const detail = readSkillDetail(await requestJson(url, signal))
  if (detail === undefined) throw badResponse(url)
  return detail
}

/** `GET /file` — one file body for the preview pane. */
export async function fetchFile(id: string, path: string, signal: AbortSignal): Promise<MarketFileContent> {
  const url = buildUrl('/file', { id, path })
  const content = readFileContent(await requestJson(url, signal))
  if (content === undefined) throw badResponse(url)
  return content
}

/** `POST /install` — write one skill into the skills root. */
export async function installSkill(id: string, version: string | undefined, signal: AbortSignal): Promise<MarketInstallResponse> {
  const url = buildUrl('/install', {})
  const body = version === undefined ? { id } : { id, version }
  const result = readInstallResponse(await requestJson(url, signal, { method: 'POST', body }))
  if (result === undefined) throw badResponse(url)
  return result
}

/** `POST /uninstall` — remove one hub-managed skill. */
export async function uninstallSkill(id: string, signal: AbortSignal): Promise<void> {
  const url = buildUrl('/uninstall', {})
  await requestOk(url, signal, { method: 'POST', body: { id } })
}

/** `POST /refresh` — drop the host cache and re-read every upstream. */
export async function refreshMarket(signal: AbortSignal): Promise<void> {
  const url = buildUrl('/refresh', {})
  await requestOk(url, signal, { method: 'POST', body: {} })
}

/** Re-export so components branch on codes without reaching into the shared layer. */
export { MARKET_ERROR_CODES }

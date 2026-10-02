/**
 * Skills Hub — install and uninstall. This is the security-critical module.
 *
 * The threat model is a hostile registry payload:
 *  - **Path traversal.** Every registry-supplied `path` is normalized by
 *    {@link normalizeRegistryRelPath} and then re-verified against the staging
 *    root *before every single write*, so a path that escapes is rejected even
 *    if the normalizer were to miss a case. One bad path refuses the whole
 *    install — a partially trusted skill is not a safer skill.
 *  - **Resource exhaustion.** An empty list, a file over the per-file cap, or a
 *    total over the total cap refuses the install before anything is written.
 *  - **Clobbering.** Nothing is ever written over an existing directory: a
 *    directory the hub did not create is refused with `MARKET_NOT_MANAGED`,
 *    which is also what makes adoption (`managed: false`) safe to report.
 *  - **Torn installs.** Files are written into a private staging directory
 *    *beside* the target and published with a single `rename`, so a failure
 *    leaves either no skill or the complete skill, never half of one. The
 *    staging directory is created by `mkdtemp`, so no pre-existing symlink can
 *    be traversed on the way in.
 *
 * @module dsh-skills-hub/host/install-service
 */

import { createHash } from 'node:crypto'
import { lstat, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import {
  MARKET_ERROR_CODES,
  MARKET_LIMITS,
  parseSkillId,
  sanitizeDirName,
  type MarketInstallResponse,
  type MarketSkillDetail,
  type MarketSource,
  type NotInstallableReason,
} from '../shared/market.ts'
import {
  MarketRequestError,
  MarketUpstreamError,
  badRequest,
  describeCause,
  diskError,
  notInstallable,
  notInstalled,
  notManaged,
  type HostLogger,
} from './errors.ts'
import type { InstallRecord, InstallRegistry, SkillRootResolver } from './install-state.ts'
import { isInsideRoot, normalizeRegistryRelPath } from './paths.ts'
import type { MarketProvider, ProviderFileEntry } from './provider.ts'

/** Prefix of the staging directory created beside the target. */
const STAGING_PREFIX = '.skills-hub-staging-'

/** One file that passed every check and will be written. */
export interface PlannedFile {
  readonly path: string
  readonly size: number
  readonly sha256?: string
}

/** The outcome of the pre-flight file checks. */
export type InstallFileCheck =
  | { readonly ok: true; readonly files: readonly PlannedFile[] }
  | { readonly ok: false; readonly reason: NotInstallableReason; readonly detail: string }

/**
 * Pre-flight every file the registry listed.
 *
 * Order matters and is part of the contract: path safety is checked **first**,
 * so a payload carrying `../evil.md` is reported as an unsafe path rather than
 * as a missing `SKILL.md`. Duplicate paths collapse (last write wins would be
 * indistinguishable from first, so the first is kept and logged nowhere).
 *
 * @param files - the registry's file list.
 * @returns the accepted plan, or the matching {@link NotInstallableReason}.
 */
export function validateInstallFiles(files: readonly ProviderFileEntry[]): InstallFileCheck {
  const planned: PlannedFile[] = []
  const seen = new Set<string>()

  for (const file of files) {
    const safe = normalizeRegistryRelPath(file.path)
    if (safe === null) {
      return { ok: false, reason: 'invalid-name', detail: `unsafe file path: ${echo(file.path)}` }
    }
    if (seen.has(safe)) continue
    seen.add(safe)
    const size = typeof file.size === 'number' && Number.isFinite(file.size) && file.size > 0 ? file.size : 0
    planned.push({
      path: safe,
      size,
      ...(typeof file.sha256 === 'string' && file.sha256 !== '' ? { sha256: file.sha256 } : {}),
    })
  }

  if (planned.length === 0 || !planned.some((file) => file.path === 'SKILL.md')) {
    return { ok: false, reason: 'empty-file-list', detail: 'the skill has no SKILL.md' }
  }
  if (planned.length > MARKET_LIMITS.maxFileCount) {
    return {
      ok: false,
      reason: 'too-many-files',
      detail: `${String(planned.length)} files exceeds the ${String(MARKET_LIMITS.maxFileCount)} file limit`,
    }
  }
  const oversized = planned.find((file) => file.size > MARKET_LIMITS.maxFileSize)
  if (oversized !== undefined) {
    return {
      ok: false,
      reason: 'file-too-large',
      detail: `${echo(oversized.path)} exceeds the ${String(MARKET_LIMITS.maxFileSize)} byte file limit`,
    }
  }
  const total = planned.reduce((sum, file) => sum + file.size, 0)
  if (total > MARKET_LIMITS.maxTotalSize) {
    return {
      ok: false,
      reason: 'file-too-large',
      detail: `the skill exceeds the ${String(MARKET_LIMITS.maxTotalSize)} byte total limit`,
    }
  }
  return { ok: true, files: planned }
}

/** Registry file paths are remote data: echo them short, sanitized, and bounded. */
function echo(value: unknown): string {
  if (typeof value !== 'string') return '(non-string)'
  // Control characters must not reach a log line or a response body.
  const printable = value.replace(/[\u0000-\u001f\u007f]/g, '?')
  return printable.length > 120 ? `${printable.slice(0, 117)}...` : printable
}

/** Construction options for {@link createInstallService}. */
export interface InstallServiceOptions {
  readonly providers: Readonly<Record<MarketSource, MarketProvider>>
  /** The catalog facade, used to resolve a detail (file list, version) before writing. */
  readonly market: { detail(id: string, signal?: AbortSignal): Promise<MarketSkillDetail> }
  readonly registry: InstallRegistry
  readonly roots: SkillRootResolver
  readonly logger: HostLogger
  /** Called after a successful install or uninstall so the skill catalog refreshes. */
  readonly onChanged?: (() => void) | undefined
}

/** One install's options. */
export interface InstallRunOptions {
  /** Workspace a project-scoped install targets. */
  readonly cwd?: string | undefined
  /** Pin a version instead of the registry's latest. */
  readonly version?: string | undefined
  /** Cancellation forwarded from the caller (a cancelled tool call). */
  readonly signal?: AbortSignal | undefined
}

/** The install facade the routes and tools call. */
export interface InstallService {
  install(id: string, options?: InstallRunOptions): Promise<MarketInstallResponse>
  uninstall(id: string, options?: { cwd?: string | undefined }): Promise<{ ok: true; id: string; removedPath: string }>
}

/**
 * Create the install service.
 *
 * @param options - providers, catalog, registry, roots, logger, change hook.
 * @returns the service.
 */
export function createInstallService(options: InstallServiceOptions): InstallService {
  /** Ids with an install in flight; a second request is refused, not queued. */
  const inFlight = new Set<string>()

  /** Rethrow a typed failure unchanged; convert anything else to a canned 500. */
  const translate = (error: unknown, id: string): MarketRequestError => {
    if (error instanceof MarketRequestError) return error
    if (error instanceof MarketUpstreamError) {
      return new MarketRequestError(502, error.code, error.message, error.source)
    }
    options.logger.warn(`skills-hub: install operation for ${id} failed: ${describeCause(error)}`)
    return diskError('the skill could not be written to disk')
  }

  /** `lstat` that reports absence instead of throwing. */
  const statOrUndefined = async (target: string): Promise<Awaited<ReturnType<typeof lstat>> | undefined> => {
    try {
      return await lstat(target)
    } catch {
      return undefined
    }
  }

  const performInstall = async (
    id: string,
    source: MarketSource,
    slug: string,
    dirName: string,
    version: string | undefined,
    cwd: string | undefined,
    signal: AbortSignal | undefined,
  ): Promise<MarketInstallResponse> => {
    // The persisted record decides whether an existing directory is this
    // hub's own install; it must be loaded before the disk is consulted, or a
    // restart would misreport a managed install as unmanaged.
    await options.registry.load()

    const { root } = await options.roots.resolve(cwd)
    const target = join(root, dirName)

    const existing = await statOrUndefined(target)
    if (existing !== undefined) {
      const record = options.registry.get(dirName)
      if (record !== undefined && record.id === id) {
        throw new MarketRequestError(409, MARKET_ERROR_CODES.alreadyInstalled, 'the skill is already installed')
      }
      throw notManaged('a skill directory this hub did not install already exists')
    }

    const detail = await options.market.detail(id, signal)
    if (detail.installState === 'installed') {
      throw new MarketRequestError(409, MARKET_ERROR_CODES.alreadyInstalled, 'the skill is already installed')
    }
    if (detail.installState === 'not-installable') {
      throw notInstallable(`the skill is not installable (${detail.notInstallableReason ?? 'unknown'})`)
    }

    const provider = options.providers[source]
    const resolvedVersion = version ?? detail.version
    // Re-read the file list at install time: the detail may be cached, and the
    // list is what decides whether anything is written at all.
    const listed = await provider.listFiles(slug, resolvedVersion, signal)
    const check = validateInstallFiles(listed)
    if (!check.ok) throw notInstallable(`${check.reason}: ${check.detail}`)

    await mkdir(root, { recursive: true })
    const staging = await mkdtemp(join(root, STAGING_PREFIX))
    try {
      let written = 0
      const writtenPaths: string[] = []
      for (const file of check.files) {
        // A cancellation surfaces from the fetch helper on the next download;
        // the staging directory is removed by the `finally` below either way.
        const segments = file.path.split('/')
        const destination = join(staging, ...segments)
        // Re-verified per write, not once per install: the normalizer is the
        // first line, this is the one that must never be wrong.
        if (!isInsideRoot(staging, destination)) {
          throw notInstallable(`unsafe file path: ${echo(file.path)}`)
        }
        const fetched = await provider.fetchFile(slug, file.path, signal)
        if (fetched.size > MARKET_LIMITS.maxFileSize) {
          throw notInstallable(`file-too-large: ${echo(file.path)} exceeds the per-file limit`)
        }
        written += fetched.size
        if (written > MARKET_LIMITS.maxTotalSize) {
          throw notInstallable('file-too-large: the skill exceeds the total size limit')
        }
        if (file.sha256 !== undefined && sha256Hex(fetched.content) !== file.sha256.toLowerCase()) {
          throw new MarketRequestError(
            502,
            MARKET_ERROR_CODES.checksumMismatch,
            `checksum mismatch for ${echo(file.path)}; the install was aborted`,
          )
        }
        const parent = dirname(destination)
        await mkdir(parent, { recursive: true })
        if (!isInsideRoot(staging, destination) || !isInsideRoot(staging, parent)) {
          throw notInstallable(`unsafe file path: ${echo(file.path)}`)
        }
        await writeFile(destination, fetched.content, 'utf-8')
        writtenPaths.push(file.path)
      }

      // Last-moment conflict check: a manual write may have landed meanwhile.
      const raced = await statOrUndefined(target)
      if (raced !== undefined) {
        throw new MarketRequestError(409, MARKET_ERROR_CODES.alreadyInstalled, 'the skill directory already exists')
      }

      // Record before publishing, so a published skill is never left without
      // its record (which would make it adoptable but not removable). A record
      // for a directory that never appeared is harmless: every reader checks
      // the disk first, and the publish failure below rolls it back.
      const record: InstallRecord = {
        id,
        source,
        slug,
        dirName,
        ...(resolvedVersion === undefined ? {} : { version: resolvedVersion }),
        installedAt: new Date().toISOString(),
        files: writtenPaths,
        managed: true,
      }
      await options.registry.put(record)
      try {
        await rename(staging, target)
      } catch (error) {
        await options.registry.remove(dirName).catch(() => undefined)
        throw error
      }
      options.onChanged?.()

      return {
        ok: true,
        id,
        dirName,
        path: target,
        ...(resolvedVersion === undefined ? {} : { version: resolvedVersion }),
        fileCount: writtenPaths.length,
        totalSize: written,
      }
    } finally {
      // Covers both paths: after a publish the staging path is gone, and after
      // a failure this is the only cleanup that matters.
      await rm(staging, { recursive: true, force: true }).catch(() => undefined)
    }
  }

  return {
    async install(id, runOptions): Promise<MarketInstallResponse> {
      const parsed = parseSkillId(id)
      if (parsed === null) throw badRequest(`invalid skill id: ${id === '' ? '(missing)' : echo(id)}`)
      const dirName = sanitizeDirName(parsed.slug)
      if (dirName === null) throw notInstallable('invalid-name: the skill name cannot be used as a directory name')
      if (inFlight.has(id)) {
        throw new MarketRequestError(
          409,
          MARKET_ERROR_CODES.installInProgress,
          'an install of this skill is already running',
        )
      }
      inFlight.add(id)
      try {
        return await performInstall(
          id,
          parsed.source,
          parsed.slug,
          dirName,
          runOptions?.version,
          runOptions?.cwd,
          runOptions?.signal,
        )
      } catch (error) {
        throw translate(error, id)
      } finally {
        inFlight.delete(id)
      }
    },

    async uninstall(id, runOptions) {
      const parsed = parseSkillId(id)
      if (parsed === null) throw badRequest(`invalid skill id: ${id === '' ? '(missing)' : echo(id)}`)
      const dirName = sanitizeDirName(parsed.slug)
      if (dirName === null) throw badRequest('invalid skill name')

      try {
        // Loaded before the disk probe, for the same reason as in install.
        await options.registry.load()
        const { root } = await options.roots.resolve(runOptions?.cwd)
        const target = join(root, dirName)
        const info = await statOrUndefined(target)
        if (info === undefined) throw notInstalled('the skill is not installed')
        if (!info.isDirectory() || info.isSymbolicLink()) {
          throw notManaged('the path is not a plain skill directory')
        }
        const record = options.registry.get(dirName)
        // Only a hub-written install may be removed. An adopted directory is
        // reported as installed, but the hub did not create it.
        if (record === undefined || record.id !== id || !record.managed) {
          throw notManaged('the skill directory was not installed by this hub')
        }
        await rm(target, { recursive: true, force: true })
        await options.registry.remove(dirName)
        options.onChanged?.()
        return { ok: true, id, removedPath: target }
      } catch (error) {
        throw translate(error, id)
      }
    },
  }
}

/** Hex SHA-256 of a file body, for the registry-supplied checksum. */
export function sha256Hex(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex')
}

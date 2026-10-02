/**
 * Skills Hub — install truth: the hub-owned record of what it installed, the
 * skill roots it reads, and the install-state annotation every catalog entry
 * carries.
 *
 * The record lives **outside** the skill directories (`<dsh home>/skills-hub/installs.json`)
 * for two reasons: a skill directory must stay a plain DSH skill (no private
 * marker file a reader has to skip), and deleting a skill directory must not
 * be able to corrupt the hub's own bookkeeping.
 *
 * A directory on disk with no record is **adopted**: it is reported as
 * `installed` with `managed: false`, which is what makes the panel show
 * 「已安装」 instead of offering an install that would fail.
 *
 * @module dsh-skills-hub/host/install-state
 */

import { lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import {
  MARKET_ERROR_CODES,
  MARKET_SOURCES,
  sanitizeDirName,
  skillId,
  type InstalledInfo,
  type MarketInstalledResponse,
  type MarketSkill,
  type MarketSource,
} from '../shared/market.ts'
import { MarketRequestError, type HostLogger } from './errors.ts'
import { frontmatterString, parseFrontmatter } from './frontmatter.ts'
import { projectSkillsRoot, userSkillsRoot } from './paths.ts'

/** What this hub recorded about one install. */
export interface InstallRecord {
  /** `${source}:${slug}`. */
  readonly id: string
  readonly source: MarketSource
  readonly slug: string
  /** Directory name under the skills root (the sanitized slug). */
  readonly dirName: string
  readonly version?: string
  /** ISO-8601 instant the install completed. */
  readonly installedAt: string
  /** Relative paths written, in the order they were written. */
  readonly files: readonly string[]
  /** `true` for a hub-written install; `false` for an adopted directory. */
  readonly managed: boolean
}

/** Persisted document shape; the version field is the migration seam. */
interface RegistryDocument {
  readonly version: 1
  readonly installs: readonly InstallRecord[]
}

/** Durable, atomically rewritten record of every install. */
export interface InstallRegistry {
  /** Read the document once; later calls are no-ops. */
  load(): Promise<void>
  all(): readonly InstallRecord[]
  get(dirName: string): InstallRecord | undefined
  put(record: InstallRecord): Promise<void>
  remove(dirName: string): Promise<void>
}

/**
 * Create the install registry.
 *
 * Reads are tolerant: an unreadable or malformed document degrades to "no
 * installs" and is logged, because a corrupt side file must never make the
 * whole panel unusable. Writes are serialized and atomic (temp file + rename
 * in the same directory), so a crash leaves either the old or the new
 * document, never a half-written one.
 *
 * @param options - document path and logger.
 * @returns the registry handle.
 */
export function createInstallRegistry(options: { file: string; logger: HostLogger }): InstallRegistry {
  let records = new Map<string, InstallRecord>()
  let loaded: Promise<void> | undefined
  let writes: Promise<void> = Promise.resolve()

  const readDocument = async (): Promise<void> => {
    let raw: string
    try {
      raw = await readFile(options.file, 'utf-8')
    } catch {
      // Absent is the normal first-run state, not an error.
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      options.logger.warn('skills-hub: ignoring an unreadable install record')
      return
    }
    if (typeof parsed !== 'object' || parsed === null) return
    const installs = (parsed as { installs?: unknown }).installs
    if (!Array.isArray(installs)) return
    const next = new Map<string, InstallRecord>()
    for (const entry of installs) {
      const record = parseInstallRecord(entry)
      if (record !== undefined) next.set(record.dirName, record)
    }
    records = next
  }

  const flush = async (): Promise<void> => {
    const document: RegistryDocument = { version: 1, installs: [...records.values()] }
    const body = `${JSON.stringify(document, null, 2)}\n`
    await mkdir(dirname(options.file), { recursive: true })
    const temp = `${options.file}.tmp-${process.pid.toString(36)}-${Date.now().toString(36)}`
    try {
      await writeFile(temp, body, 'utf-8')
      await rename(temp, options.file)
    } catch (error) {
      await rm(temp, { force: true }).catch(() => undefined)
      throw error
    }
  }

  const mutate = (change: () => void): Promise<void> => {
    const operation = writes.then(async () => {
      change()
      await flush()
    })
    // Keep the chain alive after a failure; the caller still sees the rejection.
    writes = operation.catch(() => undefined)
    return operation
  }

  return {
    async load(): Promise<void> {
      loaded ??= readDocument()
      await loaded
    },

    all(): readonly InstallRecord[] {
      return [...records.values()]
    },

    get(dirName: string): InstallRecord | undefined {
      return records.get(dirName)
    },

    async put(record: InstallRecord): Promise<void> {
      await mutate(() => {
        records.set(record.dirName, record)
      })
    },

    async remove(dirName: string): Promise<void> {
      await mutate(() => {
        records.delete(dirName)
      })
    },
  }
}

/** Validate one persisted record; anything malformed is dropped, not trusted. */
export function parseInstallRecord(value: unknown): InstallRecord | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const candidate = value as Record<string, unknown>
  const source = candidate['source']
  const slug = candidate['slug']
  const dirName = candidate['dirName']
  const installedAt = candidate['installedAt']
  const files = candidate['files']
  const managed = candidate['managed']
  const version = candidate['version']

  if (typeof source !== 'string' || !MARKET_SOURCES.includes(source as MarketSource)) return undefined
  if (typeof slug !== 'string' || slug === '') return undefined
  if (typeof dirName !== 'string' || sanitizeDirName(slug) !== dirName) return undefined
  if (typeof installedAt !== 'string' || installedAt === '') return undefined
  if (typeof managed !== 'boolean') return undefined
  if (version !== undefined && typeof version !== 'string') return undefined
  const paths = Array.isArray(files) ? files.filter((entry): entry is string => typeof entry === 'string') : []
  return {
    id: skillId(source as MarketSource, slug),
    source: source as MarketSource,
    slug,
    dirName,
    ...(version === undefined ? {} : { version }),
    installedAt,
    files: paths,
    managed,
  }
}

// ─── Roots ──────────────────────────────────────────────────────────────────

/** A skills root plus the DSH discovery source it belongs to. */
export interface ResolvedSkillRoot {
  readonly root: string
  /** `user-dsh` → `<dsh home>/skills`; `project-dsh` → `<workspace>/.dsh/skills`. */
  readonly source: 'user-dsh' | 'project-dsh'
}

/** Resolves where an install lands, without ever consulting `process.cwd()`. */
export interface SkillRootResolver {
  resolve(cwd?: string | undefined): Promise<ResolvedSkillRoot>
}

/** Construction options for {@link createSkillRootResolver}. */
export interface SkillRootResolverOptions {
  readonly installScope: 'user' | 'project'
  readonly dshHome: string
  /**
   * The workspace a project-scoped install targets. Reads the workspace
   * registry service; returns `undefined` when no workspace is registered.
   */
  readonly workspace: (cwd?: string | undefined) => string | undefined
}

/**
 * Create the root resolver for the configured install scope.
 *
 * @param options - scope, DSH home, and the workspace lookup.
 * @returns the resolver.
 */
export function createSkillRootResolver(options: SkillRootResolverOptions): SkillRootResolver {
  return {
    async resolve(cwd?: string | undefined): Promise<ResolvedSkillRoot> {
      if (options.installScope === 'user') {
        return { root: userSkillsRoot(options.dshHome), source: 'user-dsh' }
      }
      const workspace = options.workspace(cwd)
      if (workspace === undefined || workspace === '') {
        throw new MarketRequestError(
          503,
          MARKET_ERROR_CODES.diskError,
          'no workspace is registered for a project-scoped install',
        )
      }
      return { root: projectSkillsRoot(workspace), source: 'project-dsh' }
    },
  }
}

// ─── Install-state annotation ───────────────────────────────────────────────

/** The install-state view over one skills root. */
export interface InstallStateService {
  /** Annotate one catalog entry against the disk. */
  annotate<T extends MarketSkill>(skill: T): Promise<T>
  /** Annotate a whole page with a single directory read. */
  annotateAll<T extends MarketSkill>(items: readonly T[]): Promise<T[]>
  /** Everything this hub knows is installed, plus the local-only count. */
  installed(): Promise<MarketInstalledResponse>
}

/** Construction options for {@link createInstallState}. */
export interface InstallStateOptions {
  readonly registry: InstallRegistry
  readonly roots: SkillRootResolver
}

/**
 * Create the install-state service.
 *
 * @param options - registry and root resolver.
 * @returns the service.
 */
export function createInstallState(options: InstallStateOptions): InstallStateService {
  /** Directory names present under a root, with their mtime for adopted entries. */
  const listRoot = async (root: string): Promise<Map<string, string>> => {
    const found = new Map<string, string>()
    let names: string[]
    try {
      names = await readdir(root)
    } catch {
      return found
    }
    await Promise.all(names.map(async (name) => {
      if (sanitizeDirName(name) !== name) return
      try {
        const info = await lstat(join(root, name))
        if (!info.isDirectory() || info.isSymbolicLink()) return
        found.set(name, info.mtime.toISOString())
      } catch {
        // A vanished entry is simply not present.
      }
    }))
    return found
  }

  const annotateWith = <T extends MarketSkill>(skill: T, present: Map<string, string>): T => {
    const dirName = sanitizeDirName(skill.slug)
    if (dirName === null) {
      return { ...skill, installState: 'not-installable', notInstallableReason: 'invalid-name' }
    }
    const seenAt = present.get(dirName)
    if (seenAt === undefined) {
      return { ...skill, installState: 'installable', notInstallableReason: undefined, installedInfo: undefined }
    }
    const record = options.registry.get(dirName)
    if (record !== undefined) {
      if (record.id !== skill.id) {
        // The directory exists and belongs to a different registry entry.
        return { ...skill, installState: 'not-installable', notInstallableReason: 'name-conflict' }
      }
      const info: InstalledInfo = {
        ...(record.version === undefined ? {} : { version: record.version }),
        installedAt: record.installedAt,
        dirName,
        managed: record.managed,
      }
      return { ...skill, installState: 'installed', notInstallableReason: undefined, installedInfo: info }
    }
    // Adopted: present on disk, unknown to this hub. Reported as installed so
    // the panel never offers an install that would refuse to run.
    const info: InstalledInfo = { installedAt: seenAt, dirName, managed: false }
    return { ...skill, installState: 'installed', notInstallableReason: undefined, installedInfo: info }
  }

  return {
    async annotate<T extends MarketSkill>(skill: T): Promise<T> {
      await options.registry.load()
      const { root } = await options.roots.resolve()
      return annotateWith(skill, await listRoot(root))
    },

    async annotateAll<T extends MarketSkill>(items: readonly T[]): Promise<T[]> {
      await options.registry.load()
      const { root } = await options.roots.resolve()
      const present = await listRoot(root)
      return items.map((item) => annotateWith(item, present))
    },

    async installed(): Promise<MarketInstalledResponse> {
      await options.registry.load()
      const { root } = await options.roots.resolve()
      const present = await listRoot(root)
      const items: MarketSkill[] = []
      for (const record of options.registry.all()) {
        if (!present.has(record.dirName)) continue
        items.push(await describeInstalled(record, join(root, record.dirName)))
      }
      const managedDirs = new Set(options.registry.all().map((record) => record.dirName))
      let localOnly = 0
      for (const name of present.keys()) {
        if (!managedDirs.has(name)) localOnly += 1
      }
      return { items, roots: [root], localOnly }
    },
  }
}

/** Build the wire entry for one installed skill, reading its `SKILL.md` head. */
async function describeInstalled(record: InstallRecord, directory: string): Promise<MarketSkill> {
  let name = record.slug
  let summary = ''
  try {
    const document = parseFrontmatter(await readFile(join(directory, 'SKILL.md'), 'utf-8'))
    name = frontmatterString(document.frontmatter, 'name') ?? record.slug
    summary = frontmatterString(document.frontmatter, 'description') ?? ''
  } catch {
    // A missing or unreadable SKILL.md still yields a usable row.
  }
  return {
    id: record.id,
    source: record.source,
    slug: record.slug,
    name,
    summary,
    author: { handle: '' },
    stats: { downloads: 0 },
    tags: [],
    ...(record.version === undefined ? {} : { version: record.version }),
    securityStatus: 'unknown',
    installState: 'installed',
    installedInfo: {
      ...(record.version === undefined ? {} : { version: record.version }),
      installedAt: record.installedAt,
      dirName: record.dirName,
      managed: record.managed,
    },
  }
}

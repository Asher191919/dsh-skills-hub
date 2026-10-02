/**
 * Skills Hub — the bridge from the hub's install root into the DSH skill
 * catalog.
 *
 * The contract with `ctx.skills` is declared **structurally** rather than by
 * importing `@deepseek-ai/dsh-skill`: the plugin must load and work when the
 * skill registry is not mounted (a headless composition, a minimal profile),
 * and an import of a package that may not exist would make that a load error
 * instead of an absent feature.
 *
 * The provider is deliberately the **weakest** source of skills. Every local
 * root ranks ahead of it (`project-dsh` 100 … `user-agents` 500, bundled 600),
 * so when `dsh-skill-filesystem` is mounted it wins every duplicate and this
 * bridge only ever contributes skills nothing else discovered.
 *
 * @module dsh-skills-hub/host/skills-bridge
 */

import { lstat, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { sanitizeDirName } from '../shared/market.ts'
import type { HostLogger } from './errors.ts'
import { frontmatterString, parseFrontmatter } from './frontmatter.ts'
import type { SkillRootResolver } from './install-state.ts'

/** Provider name registered in `ctx.skills`. */
export const SKILLS_PROVIDER_NAME = 'skills-hub'

/**
 * Precedence rank. Lower wins; every local root is lower, so a hub-installed
 * skill that the filesystem provider already found is not duplicated by this
 * bridge.
 */
export const SKILLS_PROVIDER_RANK = 700

/** `SkillSource` value reported for skills this provider contributes. */
export const SKILLS_PROVIDER_SOURCE = 'custom'

/** Kebab-case skill name grammar, mirrored from the registry's own check. */
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Registration-scoped lifecycle handed to a provider factory. */
export interface SkillsControlLike {
  readonly signal: AbortSignal
  invalidate(): void
}

/** Minimal `SkillInvocationPolicy` shape. */
export interface SkillInvocationLike {
  readonly modelInvocable: boolean
  readonly userInvocable: boolean
}

/** Minimal `SkillCandidate` shape. */
export interface SkillCandidateLike {
  readonly name: string
  readonly description: string
  readonly whenToUse?: string
  readonly invocation: SkillInvocationLike
  readonly source: string
  readonly provider: string
  readonly rank: number
  readonly locator: unknown
  readonly path?: string
}

/** Minimal `SkillDefinition` shape. */
export interface SkillDefinitionLike extends SkillCandidateLike {
  readonly resourceBase?: { readonly kind: 'directory'; readonly path: string }
  readonly content: string
}

/** Minimal `SkillLookupOptions` shape. */
export interface SkillLookupLike {
  readonly cwd?: string | undefined
  readonly signal?: AbortSignal | undefined
}

/** Minimal `SkillProviderObservation` shape, for incomplete discovery. */
export interface SkillObservationLike {
  readonly candidates: readonly SkillCandidateLike[]
  readonly complete: boolean
}

/** Minimal `SkillProvider` shape. */
export interface SkillProviderLike {
  readonly name: string
  list(options: SkillLookupLike): Promise<readonly SkillCandidateLike[] | SkillObservationLike>
  get(candidate: SkillCandidateLike, options: SkillLookupLike): Promise<SkillDefinitionLike | undefined>
}

/** Minimal `SkillRegistry` shape: only the one method this plugin uses. */
export interface SkillsServiceLike {
  registerProvider(create: (control: SkillsControlLike) => SkillProviderLike): () => void
}

/** The bridge handle owned by the plugin fiber. */
export interface SkillsBridge {
  /** Factory handed to `skills.registerProvider`. */
  create(control: SkillsControlLike): SkillProviderLike
  /** Invalidate the registry's catalog; a no-op before registration. */
  invalidate(): void
}

/** Construction options for {@link createSkillsBridge}. */
export interface SkillsBridgeOptions {
  readonly roots: SkillRootResolver
  readonly logger: HostLogger
}

/**
 * Create the bridge. Registration is the caller's job (`ctx.inject` +
 * `ctx.effect`), so this module never holds a cordis context.
 *
 * @param options - root resolver and logger.
 * @returns the bridge handle.
 */
export function createSkillsBridge(options: SkillsBridgeOptions): SkillsBridge {
  let control: SkillsControlLike | undefined

  return {
    invalidate(): void {
      control?.invalidate()
    },

    create(registration: SkillsControlLike): SkillProviderLike {
      control = registration
      const signal = registration.signal

      return {
        name: SKILLS_PROVIDER_NAME,

        async list(lookup: SkillLookupLike): Promise<readonly SkillCandidateLike[] | SkillObservationLike> {
          const { root } = await options.roots.resolve(signal.aborted ? undefined : lookup.cwd)
          let names: string[]
          try {
            names = await readdir(root)
          } catch (error) {
            const code = (error as NodeJS.ErrnoException).code
            if (code === 'ENOENT') return []
            // Discovery did not complete: say so rather than claiming "none".
            options.logger.warn(`skills-hub: cannot read the skill root (${String(code ?? 'unknown')})`)
            return { candidates: [], complete: false }
          }

          const candidates: SkillCandidateLike[] = []
          for (const directory of names) {
            if (signal.aborted) break
            if (sanitizeDirName(directory) !== directory) continue
            const candidate = await readCandidate(join(root, directory), directory)
            if (candidate !== undefined) candidates.push(candidate)
          }
          return candidates
        },

        async get(candidate: SkillCandidateLike): Promise<SkillDefinitionLike | undefined> {
          const locator = readLocator(candidate.locator)
          if (locator === undefined) return undefined
          let raw: string
          try {
            raw = await readFile(locator.file, 'utf-8')
          } catch {
            return undefined
          }
          const document = parseFrontmatter(raw)
          const name = frontmatterString(document.frontmatter, 'name') ?? candidate.name
          if (!SKILL_NAME.test(name)) return undefined
          const description = frontmatterString(document.frontmatter, 'description')
            ?? candidate.description
          const whenToUse = frontmatterString(document.frontmatter, 'when_to_use')
            ?? frontmatterString(document.frontmatter, 'whenToUse')
          return {
            name,
            description,
            ...(whenToUse === undefined ? {} : { whenToUse }),
            invocation: candidate.invocation,
            source: SKILLS_PROVIDER_SOURCE,
            provider: SKILLS_PROVIDER_NAME,
            rank: SKILLS_PROVIDER_RANK,
            locator: candidate.locator,
            path: locator.file,
            resourceBase: { kind: 'directory', path: locator.dir },
            content: document.content,
          }
        },
      }
    },
  }
}

/** Read one skill directory's `SKILL.md` head into a candidate. */
async function readCandidate(directory: string, fallbackName: string): Promise<SkillCandidateLike | undefined> {
  try {
    const info = await lstat(directory)
    if (!info.isDirectory() || info.isSymbolicLink()) return undefined
  } catch {
    return undefined
  }
  const file = join(directory, 'SKILL.md')
  let raw: string
  try {
    raw = await readFile(file, 'utf-8')
  } catch {
    // A directory without a readable SKILL.md is not a skill.
    return undefined
  }
  const document = parseFrontmatter(raw)
  const name = frontmatterString(document.frontmatter, 'name') ?? fallbackName
  if (!SKILL_NAME.test(name)) return undefined
  const description = frontmatterString(document.frontmatter, 'description')
    ?? firstProse(document.content)
    ?? name
  const whenToUse = frontmatterString(document.frontmatter, 'when_to_use')
    ?? frontmatterString(document.frontmatter, 'whenToUse')
  return {
    name,
    description,
    ...(whenToUse === undefined ? {} : { whenToUse }),
    invocation: { modelInvocable: true, userInvocable: true },
    source: SKILLS_PROVIDER_SOURCE,
    provider: SKILLS_PROVIDER_NAME,
    rank: SKILLS_PROVIDER_RANK,
    locator: { dir: directory, file },
    path: file,
  }
}

/** The first real prose line of a body, for skills with no frontmatter description. */
function firstProse(body: string): string | undefined {
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('```')) continue
    return trimmed.length > 300 ? `${trimmed.slice(0, 297)}...` : trimmed
  }
  return undefined
}

/** Narrow the opaque provider locator without trusting its shape. */
function readLocator(value: unknown): { dir: string; file: string } | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const record = value as { dir?: unknown; file?: unknown }
  if (typeof record.dir !== 'string' || record.dir === '') return undefined
  if (typeof record.file !== 'string' || record.file === '') return undefined
  return { dir: record.dir, file: record.file }
}

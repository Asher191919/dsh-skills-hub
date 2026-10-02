/**
 * Skills Hub — path vocabulary and the traversal defense.
 *
 * Two distinct path spaces meet here:
 *  - **Registry-supplied file paths** are untrusted strings from a remote
 *    catalog. They are always POSIX-relative, and {@link normalizeRegistryRelPath}
 *    is the only accepted way to turn one into something writable.
 *  - **Local roots** are resolved from the environment and the workspace
 *    registry, never from `process.cwd()`.
 *
 * The traversal rules are deliberately stricter than "does it escape": a path
 * is rejected if it *could* mean something different on another platform
 * (backslashes, drive prefixes, trailing dots or spaces, reserved device
 * names), because the same catalog is served to every host.
 *
 * @module dsh-skills-hub/host/paths
 */

import { homedir } from 'node:os'
import { isAbsolute, join, normalize, relative, resolve, sep } from 'node:path'

/** Longest registry-supplied path accepted; mirror of the reference limit. */
const MAX_REGISTRY_PATH_LENGTH = 512

/** Windows device names, with or without an extension, in any case. */
const RESERVED_DEVICE_NAME = /^(?:con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\..*)?$/i

/** Control characters, including NUL, are never valid in a path segment. */
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/

/**
 * Normalize one registry-supplied file path, or reject it.
 *
 * Accepted: `SKILL.md`, `references/guide.md`, `a_b/c-d.e`.
 * Rejected: anything absolute, drive-relative (`C:x`), UNC, backslash-bearing,
 * NUL-bearing, `~`-rooted, containing `.`/`..`/empty segments, ending a
 * segment in a dot or space, or naming a Windows device.
 *
 * @param raw - the untrusted path from the registry payload.
 * @returns the normalized POSIX-relative path, or `null` when it must be rejected.
 */
export function normalizeRegistryRelPath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  if (raw === '' || raw.length > MAX_REGISTRY_PATH_LENGTH) return null
  if (CONTROL_CHARACTER.test(raw)) return null
  // A registry path is POSIX; a backslash is a separator trick on Windows.
  if (raw.includes('\\')) return null
  if (raw.startsWith('/') || raw.startsWith('~')) return null
  // `C:foo` is drive-relative on Windows and resolves against that drive's cwd.
  if (/^[a-zA-Z]:/.test(raw)) return null
  if (isAbsolute(raw)) return null

  const segments = raw.split('/')
  for (const segment of segments) {
    if (segment === '' || segment === '.' || segment === '..') return null
    // Windows silently strips a trailing dot or space, so `evil.` aliases `evil`.
    if (segment.endsWith('.') || segment.endsWith(' ')) return null
    if (RESERVED_DEVICE_NAME.test(segment)) return null
  }

  // Belt and braces: the platform normalization of the accepted value must
  // still be a plain relative path that climbs no further than its own root.
  const platform = normalize(segments.join('/'))
  if (platform === '' || platform === '.') return null
  if (isAbsolute(platform)) return null
  if (platform.split(sep).includes('..')) return null
  return segments.join('/')
}

/**
 * Whether `candidate` resolves to `root` itself or to something below it.
 *
 * Callers pass already-joined absolute paths; this is the last check before a
 * write, and it is repeated for every file rather than once per install.
 *
 * @param root - the directory a write must stay inside.
 * @param candidate - the absolute path about to be written.
 * @returns whether the candidate is inside the root.
 */
export function isInsideRoot(root: string, candidate: string): boolean {
  const rel = relative(resolve(root), resolve(candidate))
  if (rel === '') return true
  if (isAbsolute(rel)) return false
  return !rel.split(sep).includes('..')
}

/**
 * The DeepSeek Harness home: `$DSH_HOME`, else `~/.dsh`.
 *
 * This is user data, so it is never derived from the process working
 * directory.
 *
 * @returns the absolute DSH home.
 */
export function resolveDshHome(): string {
  const configured = process.env.DSH_HOME
  if (typeof configured === 'string' && configured.trim() !== '') return resolve(configured.trim())
  return join(homedir(), '.dsh')
}

/** Hub-owned state directory under the DSH home (never inside a skill). */
export function hubStateDir(dshHome: string): string {
  return join(dshHome, 'skills-hub')
}

/** File recording every install this hub performed. */
export function installRegistryFile(dshHome: string): string {
  return join(hubStateDir(dshHome), 'installs.json')
}

/** The `user-dsh` skill discovery root: `<dshHome>/skills`. */
export function userSkillsRoot(dshHome: string): string {
  return join(dshHome, 'skills')
}

/** The `project-dsh` skill discovery root: `<workspace>/.dsh/skills`. */
export function projectSkillsRoot(workspace: string): string {
  return join(workspace, '.dsh', 'skills')
}

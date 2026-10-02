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
export declare function normalizeRegistryRelPath(raw: unknown): string | null;
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
export declare function isInsideRoot(root: string, candidate: string): boolean;
/**
 * The DeepSeek Harness home: `$DSH_HOME`, else `~/.dsh`.
 *
 * This is user data, so it is never derived from the process working
 * directory.
 *
 * @returns the absolute DSH home.
 */
export declare function resolveDshHome(): string;
/** Hub-owned state directory under the DSH home (never inside a skill). */
export declare function hubStateDir(dshHome: string): string;
/** File recording every install this hub performed. */
export declare function installRegistryFile(dshHome: string): string;
/** The `user-dsh` skill discovery root: `<dshHome>/skills`. */
export declare function userSkillsRoot(dshHome: string): string;
/** The `project-dsh` skill discovery root: `<workspace>/.dsh/skills`. */
export declare function projectSkillsRoot(workspace: string): string;

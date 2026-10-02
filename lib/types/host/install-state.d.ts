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
import { type MarketInstalledResponse, type MarketSkill, type MarketSource } from '../shared/market.ts';
import { type HostLogger } from './errors.ts';
/** What this hub recorded about one install. */
export interface InstallRecord {
    /** `${source}:${slug}`. */
    readonly id: string;
    readonly source: MarketSource;
    readonly slug: string;
    /** Directory name under the skills root (the sanitized slug). */
    readonly dirName: string;
    readonly version?: string;
    /** ISO-8601 instant the install completed. */
    readonly installedAt: string;
    /** Relative paths written, in the order they were written. */
    readonly files: readonly string[];
    /** `true` for a hub-written install; `false` for an adopted directory. */
    readonly managed: boolean;
}
/** Durable, atomically rewritten record of every install. */
export interface InstallRegistry {
    /** Read the document once; later calls are no-ops. */
    load(): Promise<void>;
    all(): readonly InstallRecord[];
    get(dirName: string): InstallRecord | undefined;
    put(record: InstallRecord): Promise<void>;
    remove(dirName: string): Promise<void>;
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
export declare function createInstallRegistry(options: {
    file: string;
    logger: HostLogger;
}): InstallRegistry;
/** Validate one persisted record; anything malformed is dropped, not trusted. */
export declare function parseInstallRecord(value: unknown): InstallRecord | undefined;
/** A skills root plus the DSH discovery source it belongs to. */
export interface ResolvedSkillRoot {
    readonly root: string;
    /** `user-dsh` → `<dsh home>/skills`; `project-dsh` → `<workspace>/.dsh/skills`. */
    readonly source: 'user-dsh' | 'project-dsh';
}
/** Resolves where an install lands, without ever consulting `process.cwd()`. */
export interface SkillRootResolver {
    resolve(cwd?: string | undefined): Promise<ResolvedSkillRoot>;
}
/** Construction options for {@link createSkillRootResolver}. */
export interface SkillRootResolverOptions {
    readonly installScope: 'user' | 'project';
    readonly dshHome: string;
    /**
     * The workspace a project-scoped install targets. Reads the workspace
     * registry service; returns `undefined` when no workspace is registered.
     */
    readonly workspace: (cwd?: string | undefined) => string | undefined;
}
/**
 * Create the root resolver for the configured install scope.
 *
 * @param options - scope, DSH home, and the workspace lookup.
 * @returns the resolver.
 */
export declare function createSkillRootResolver(options: SkillRootResolverOptions): SkillRootResolver;
/** The install-state view over one skills root. */
export interface InstallStateService {
    /** Annotate one catalog entry against the disk. */
    annotate<T extends MarketSkill>(skill: T): Promise<T>;
    /** Annotate a whole page with a single directory read. */
    annotateAll<T extends MarketSkill>(items: readonly T[]): Promise<T[]>;
    /** Everything this hub knows is installed, plus the local-only count. */
    installed(): Promise<MarketInstalledResponse>;
}
/** Construction options for {@link createInstallState}. */
export interface InstallStateOptions {
    readonly registry: InstallRegistry;
    readonly roots: SkillRootResolver;
}
/**
 * Create the install-state service.
 *
 * @param options - registry and root resolver.
 * @returns the service.
 */
export declare function createInstallState(options: InstallStateOptions): InstallStateService;

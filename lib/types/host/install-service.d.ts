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
import { type MarketInstallResponse, type MarketSkillDetail, type MarketSource, type NotInstallableReason } from '../shared/market.ts';
import { type HostLogger } from './errors.ts';
import type { InstallRegistry, SkillRootResolver } from './install-state.ts';
import type { MarketProvider, ProviderFileEntry } from './provider.ts';
/** One file that passed every check and will be written. */
export interface PlannedFile {
    readonly path: string;
    readonly size: number;
    readonly sha256?: string;
}
/** The outcome of the pre-flight file checks. */
export type InstallFileCheck = {
    readonly ok: true;
    readonly files: readonly PlannedFile[];
} | {
    readonly ok: false;
    readonly reason: NotInstallableReason;
    readonly detail: string;
};
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
export declare function validateInstallFiles(files: readonly ProviderFileEntry[]): InstallFileCheck;
/** Construction options for {@link createInstallService}. */
export interface InstallServiceOptions {
    readonly providers: Readonly<Record<MarketSource, MarketProvider>>;
    /** The catalog facade, used to resolve a detail (file list, version) before writing. */
    readonly market: {
        detail(id: string, signal?: AbortSignal): Promise<MarketSkillDetail>;
    };
    readonly registry: InstallRegistry;
    readonly roots: SkillRootResolver;
    readonly logger: HostLogger;
    /** Called after a successful install or uninstall so the skill catalog refreshes. */
    readonly onChanged?: (() => void) | undefined;
}
/** One install's options. */
export interface InstallRunOptions {
    /** Workspace a project-scoped install targets. */
    readonly cwd?: string | undefined;
    /** Pin a version instead of the registry's latest. */
    readonly version?: string | undefined;
    /** Cancellation forwarded from the caller (a cancelled tool call). */
    readonly signal?: AbortSignal | undefined;
}
/** The install facade the routes and tools call. */
export interface InstallService {
    install(id: string, options?: InstallRunOptions): Promise<MarketInstallResponse>;
    uninstall(id: string, options?: {
        cwd?: string | undefined;
    }): Promise<{
        ok: true;
        id: string;
        removedPath: string;
    }>;
}
/**
 * Create the install service.
 *
 * @param options - providers, catalog, registry, roots, logger, change hook.
 * @returns the service.
 */
export declare function createInstallService(options: InstallServiceOptions): InstallService;
/** Hex SHA-256 of a file body, for the registry-supplied checksum. */
export declare function sha256Hex(content: string): string;

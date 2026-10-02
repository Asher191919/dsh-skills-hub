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
import type { HostLogger } from './errors.ts';
import type { SkillRootResolver } from './install-state.ts';
/** Provider name registered in `ctx.skills`. */
export declare const SKILLS_PROVIDER_NAME = "skills-hub";
/**
 * Precedence rank. Lower wins; every local root is lower, so a hub-installed
 * skill that the filesystem provider already found is not duplicated by this
 * bridge.
 */
export declare const SKILLS_PROVIDER_RANK = 700;
/** `SkillSource` value reported for skills this provider contributes. */
export declare const SKILLS_PROVIDER_SOURCE = "custom";
/** Registration-scoped lifecycle handed to a provider factory. */
export interface SkillsControlLike {
    readonly signal: AbortSignal;
    invalidate(): void;
}
/** Minimal `SkillInvocationPolicy` shape. */
export interface SkillInvocationLike {
    readonly modelInvocable: boolean;
    readonly userInvocable: boolean;
}
/** Minimal `SkillCandidate` shape. */
export interface SkillCandidateLike {
    readonly name: string;
    readonly description: string;
    readonly whenToUse?: string;
    readonly invocation: SkillInvocationLike;
    readonly source: string;
    readonly provider: string;
    readonly rank: number;
    readonly locator: unknown;
    readonly path?: string;
}
/** Minimal `SkillDefinition` shape. */
export interface SkillDefinitionLike extends SkillCandidateLike {
    readonly resourceBase?: {
        readonly kind: 'directory';
        readonly path: string;
    };
    readonly content: string;
}
/** Minimal `SkillLookupOptions` shape. */
export interface SkillLookupLike {
    readonly cwd?: string | undefined;
    readonly signal?: AbortSignal | undefined;
}
/** Minimal `SkillProviderObservation` shape, for incomplete discovery. */
export interface SkillObservationLike {
    readonly candidates: readonly SkillCandidateLike[];
    readonly complete: boolean;
}
/** Minimal `SkillProvider` shape. */
export interface SkillProviderLike {
    readonly name: string;
    list(options: SkillLookupLike): Promise<readonly SkillCandidateLike[] | SkillObservationLike>;
    get(candidate: SkillCandidateLike, options: SkillLookupLike): Promise<SkillDefinitionLike | undefined>;
}
/** Minimal `SkillRegistry` shape: only the one method this plugin uses. */
export interface SkillsServiceLike {
    registerProvider(create: (control: SkillsControlLike) => SkillProviderLike): () => void;
}
/** The bridge handle owned by the plugin fiber. */
export interface SkillsBridge {
    /** Factory handed to `skills.registerProvider`. */
    create(control: SkillsControlLike): SkillProviderLike;
    /** Invalidate the registry's catalog; a no-op before registration. */
    invalidate(): void;
}
/** Construction options for {@link createSkillsBridge}. */
export interface SkillsBridgeOptions {
    readonly roots: SkillRootResolver;
    readonly logger: HostLogger;
}
/**
 * Create the bridge. Registration is the caller's job (`ctx.inject` +
 * `ctx.effect`), so this module never holds a cordis context.
 *
 * @param options - root resolver and logger.
 * @returns the bridge handle.
 */
export declare function createSkillsBridge(options: SkillsBridgeOptions): SkillsBridge;

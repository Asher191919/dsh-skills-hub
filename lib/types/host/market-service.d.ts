/**
 * Skills Hub — catalog aggregation.
 *
 * One page of the marketplace is: a per-registry read (cached, independently
 * degraded), a cross-registry merge, the install-state annotation from disk,
 * the requested filters, a deterministic sort, and a page slice — in that
 * order. Filters run **after** the merge so a filtered page never has to be
 * re-fetched from both registries.
 *
 * Nothing here fails because one registry did: a failed read is reported in
 * `sources[].status` and the other registry still answers.
 *
 * @module dsh-skills-hub/host/market-service
 */
import { type MarketFileContent, type MarketInstallFilter, type MarketListResponse, type MarketQuery, type MarketSecurityFilter, type MarketSkill, type MarketSkillDetail, type MarketSource, type MarketSourceFilter, type SourceStatusInfo } from '../shared/market.ts';
import type { MarketCache, SourceHealth } from './cache.ts';
import { type HostLogger } from './errors.ts';
import type { InstallStateService } from './install-state.ts';
import type { MarketProvider } from './provider.ts';
/** Everything the catalog layer needs from the outside. */
export interface MarketServiceOptions {
    readonly providers: Readonly<Record<MarketSource, MarketProvider>>;
    readonly cache: MarketCache;
    readonly health: SourceHealth;
    /** Catalog cache lifetime in milliseconds, from plugin config. */
    readonly cacheTtlMs: number;
    readonly installState: InstallStateService;
    readonly logger: HostLogger;
}
/** The catalog facade the routes and tools call. */
export interface MarketService {
    list(query: MarketQuery, signal?: AbortSignal): Promise<MarketListResponse>;
    detail(id: string, signal?: AbortSignal): Promise<MarketSkillDetail>;
    file(id: string, filePath: string, signal?: AbortSignal): Promise<MarketFileContent>;
    /** Drop every cached read; the next request re-reads upstream. */
    refresh(): void;
    /** Current per-registry health. */
    sources(): Record<MarketSource, SourceStatusInfo>;
}
/** One registry's native cursor, merged into the single cursor the UI passes back. */
type MergedCursor = Partial<Record<MarketSource, string>>;
/** Encode a merged cursor; `null` when every registry is exhausted. */
export declare function encodeCursor(cursor: MergedCursor): string | null;
/** Decode a merged cursor; `undefined` for anything malformed. */
export declare function decodeCursor(raw: string | null | undefined): MergedCursor | undefined;
/**
 * Fold a SkillHub mirror into its ClawHub original.
 *
 * ClawHub is authoritative for everything it owns (the mirror is a copy of it),
 * so the SkillHub row disappears and only the data ClawHub does not have —
 * icon, scan verdict, tags — is folded onto the original. The mirror reference
 * is deliberately not surfaced: the client would have nothing to do with it.
 *
 * @param items - the merged page, in registry order.
 * @returns the deduped page, in the original order of the surviving entries.
 */
export declare function dedupeSkills(items: readonly MarketSkill[]): MarketSkill[];
/** The three post-merge filters, all `'all'`-tolerant. */
export interface ListFilters {
    readonly source?: MarketSourceFilter | undefined;
    readonly security?: MarketSecurityFilter | undefined;
    readonly install?: MarketInstallFilter | undefined;
}
/**
 * Apply the source, security and install filters to a merged page.
 *
 * @param items - deduped entries with install state already resolved.
 * @param filters - the client's filter bar.
 * @returns the surviving entries, order preserved.
 */
export declare function applyListFilters(items: readonly MarketSkill[], filters: ListFilters): MarketSkill[];
/**
 * Order a page by popularity. The id tiebreak keeps paging stable when two
 * entries share a download count.
 */
export declare function sortSkills(items: readonly MarketSkill[]): MarketSkill[];
/** Clamp a client-supplied page size into the supported range. */
export declare function clampLimit(limit: number | undefined): number;
/**
 * Apply the file-level installability rules to a detail view. Only an entry
 * that is still `installable` can become `not-installable`: an already
 * installed skill stays installed, and an entry the disk rejected keeps the
 * stronger local verdict.
 *
 * @param detail - the detail with install state resolved.
 * @returns the detail with per-file sizes and installability resolved.
 */
export declare function applyFileLimits(detail: MarketSkillDetail): MarketSkillDetail;
/** Whether a client-supplied preview path may be sent to a registry. */
export declare function isValidPreviewPath(filePath: unknown): boolean;
/** Construction options for {@link createMarketService}. */
export declare function createMarketService(options: MarketServiceOptions): MarketService;
export {};

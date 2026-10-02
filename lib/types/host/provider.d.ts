/**
 * Skills Hub — the provider seam.
 *
 * A provider adapts one upstream registry to one shape the aggregation layer
 * understands. Providers never see HTTP status codes, cache policy, or install
 * state: they return normalized skills or throw a
 * {@link MarketUpstreamError}, and one provider failing never affects another.
 *
 * @module dsh-skills-hub/host/provider
 */
import type { MarketFileMeta, MarketSkill, MarketSkillDetail, MarketSource } from '../shared/market.ts';
/** One file as the registry describes it, before it is fetched. */
export interface ProviderFileEntry {
    readonly path: string;
    readonly size: number;
    readonly sha256?: string;
    readonly contentType?: string;
}
/** One page of a provider's list or search feed. */
export interface ProviderListPage {
    readonly items: readonly MarketSkill[];
    /** Provider-native cursor for the next page; absent means exhausted. */
    readonly nextCursor?: string;
    /** Total matches, when the registry counts them. */
    readonly total?: number;
}
/** One upstream registry. */
export interface MarketProvider {
    readonly source: MarketSource;
    list(params: {
        cursor?: string | undefined;
        limit: number;
        signal?: AbortSignal | undefined;
    }): Promise<ProviderListPage>;
    search(params: {
        q: string;
        cursor?: string | undefined;
        limit: number;
        signal?: AbortSignal | undefined;
    }): Promise<ProviderListPage>;
    detail(slug: string, signal?: AbortSignal): Promise<MarketSkillDetail>;
    listFiles(slug: string, version?: string, signal?: AbortSignal): Promise<readonly ProviderFileEntry[]>;
    fetchFile(slug: string, filePath: string, signal?: AbortSignal): Promise<{
        content: string;
        size: number;
    }>;
}
/** Re-exported for providers, which build file metadata for a detail view. */
export type { MarketFileMeta };

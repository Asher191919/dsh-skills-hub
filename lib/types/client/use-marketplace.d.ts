/**
 * One stateful hook behind the whole panel: catalog paging, filters, the
 * debounced search box, the detail surface, file previews, and the
 * install/uninstall actions.
 *
 * Every request is issued inside the effect (or the imperative action) that owns
 * it and is aborted by that owner's cleanup, so unmounting the panel — or
 * superseding a request with a newer one — never leaves a socket open. There is
 * no polling: the catalog is read on mount, on a filter/search change, on an
 * explicit refresh, and when the reader asks for the next page.
 *
 * @module dsh-skills-hub/client/use-marketplace
 */
import type { MarketInstallFilter, MarketSecurityFilter, MarketSkill, MarketSkillDetail, MarketSource, MarketSourceFilter, SourceStatusInfo } from '../shared/market.ts';
import type { MarketFileContent } from '../shared/market.ts';
import type { SkillsHubTranslate } from './locales.ts';
/** Debounce before a keystroke becomes a catalog request. */
export declare const SEARCH_DEBOUNCE_MS = 350;
/** Detail sections. */
export type DetailTab = 'overview' | 'files' | 'security';
/** One transient line above the results (install outcome, host refusal). */
export interface MarketNotice {
    readonly tone: 'success' | 'error';
    readonly text: string;
}
/** Detail-surface load state for the open skill. */
export interface DetailState {
    readonly id: string;
    readonly status: 'loading' | 'ready' | 'error';
    readonly skill: MarketSkillDetail | undefined;
    readonly error: string | undefined;
}
/** File-preview load state. */
export interface DetailFileState {
    readonly path: string;
    readonly status: 'loading' | 'ready' | 'error';
    readonly content: MarketFileContent | undefined;
    readonly error: string | undefined;
}
/** The three filter selects, `all` meaning "no constraint". */
export interface MarketFilters {
    readonly source: MarketSourceFilter;
    readonly security: MarketSecurityFilter;
    readonly install: MarketInstallFilter;
}
/** Everything the panel renders from. */
export interface Marketplace {
    readonly items: readonly MarketSkill[];
    readonly sources: Partial<Record<MarketSource, SourceStatusInfo>>;
    readonly total: number | undefined;
    readonly generatedAt: number | undefined;
    readonly nextCursor: string | null;
    readonly loading: boolean;
    readonly loadingMore: boolean;
    readonly error: string | undefined;
    readonly unreachable: boolean;
    readonly notice: MarketNotice | undefined;
    readonly installing: ReadonlySet<string>;
    readonly uninstalling: ReadonlySet<string>;
    readonly draft: string;
    readonly setDraft: (value: string) => void;
    readonly commitDraft: (value?: string) => void;
    /** Suspend the search debounce while an IME composition is in progress. */
    readonly setComposing: (value: boolean) => void;
    readonly filters: MarketFilters;
    readonly hasActiveFilters: boolean;
    readonly setSource: (value: MarketSourceFilter) => void;
    readonly setSecurity: (value: MarketSecurityFilter) => void;
    readonly setInstall: (value: MarketInstallFilter) => void;
    readonly clearFilters: () => void;
    readonly refresh: () => void;
    readonly retry: () => void;
    readonly loadMore: () => void;
    readonly dismissNotice: () => void;
    readonly detailId: string | null;
    readonly detail: DetailState | undefined;
    readonly detailTab: DetailTab;
    readonly setDetailTab: (tab: DetailTab) => void;
    readonly file: DetailFileState | undefined;
    readonly openDetail: (id: string) => void;
    readonly closeDetail: () => void;
    /** Re-read the open skill after a failed detail load. */
    readonly retryDetail: () => void;
    readonly openFile: (path: string) => void;
    readonly closeFile: () => void;
    readonly install: (id: string, version: string | undefined) => void;
    readonly uninstall: (id: string, name: string) => void;
}
/**
 * @param t - namespace-bound translate, for the transient install notices.
 * @returns the panel's complete read/write surface.
 */
export declare function useMarketplace(t: SkillsHubTranslate): Marketplace;

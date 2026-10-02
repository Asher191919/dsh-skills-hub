/**
 * Skills Hub — the two upstream providers behind one seam.
 *
 * @module dsh-skills-hub/host/providers
 */
import { type MarketSource } from '../../shared/market.ts';
import type { ProviderFetcher } from '../provider-fetch.ts';
import type { MarketProvider } from '../provider.ts';
export { createClawhubProvider, mapSecurity as mapClawhubSecurity } from './clawhub.ts';
export { createSkillhubProvider, mapSecurity as mapSkillhubSecurity } from './skillhub.ts';
/** Registry bases, both configurable so a mirror or a fixture can be used. */
export interface ProviderSetOptions {
    readonly clawhubBase: string;
    readonly skillhubBase: string;
    readonly fetcher: ProviderFetcher;
}
/**
 * Create both providers. They share the fetch helper (and therefore timeouts
 * and health bookkeeping) but nothing else: neither can observe or fail the
 * other's requests.
 *
 * @param options - registry bases and the fetch helper.
 * @returns providers keyed by registry.
 */
export declare function createProviderSet(options: ProviderSetOptions): Record<MarketSource, MarketProvider>;

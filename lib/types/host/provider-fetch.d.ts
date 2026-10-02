/**
 * Skills Hub — the one HTTP path to every upstream registry.
 *
 * Every request carries a hard timeout, one retry for transient failures, a
 * byte cap enforced while streaming, and health bookkeeping. Failures surface
 * as {@link MarketUpstreamError} with a `MARKET_ERROR_CODES` code, so a
 * degraded registry can be reported in `sources[]` instead of failing a
 * response.
 *
 * @module dsh-skills-hub/host/provider-fetch
 */
import { type MarketSource } from '../shared/market.ts';
import type { SourceHealth } from './cache.ts';
import { MarketUpstreamError } from './errors.ts';
/** Registry reads this plugin performs. */
export interface ProviderFetcher {
    /** Perform one request, retrying once on 429/5xx and mapping failures. */
    request(source: MarketSource, url: string, signal?: AbortSignal): Promise<Response>;
    /** Perform one request and parse the JSON body. */
    json<T>(source: MarketSource, url: string, signal?: AbortSignal): Promise<T>;
    /** Read a response body as text, refusing to exceed `maxBytes`. */
    text(source: MarketSource, response: Response, maxBytes: number, label: string): Promise<{
        content: string;
        size: number;
    }>;
    /** Read a response body as JSON, refusing to exceed the JSON cap. */
    readJson<T>(source: MarketSource, response: Response, label: string): Promise<T>;
} /** Construction options for {@link createProviderFetch}. */
export interface ProviderFetchOptions {
    /** Per-attempt timeout in milliseconds, from plugin config. */
    readonly timeoutMs: number;
    /** Health recorder fed by every outcome. */
    readonly sourceHealth: SourceHealth;
    /** Transport override, for tests. Defaults to the global `fetch`. */
    readonly fetchImpl?: typeof fetch;
    /** Extra abort signal composed with the timeout (fiber disposal, request abort). */
    readonly signal?: AbortSignal | undefined;
}
/**
 * Create the fetch helper for one plugin fiber.
 *
 * @param options - timeout, health recorder, and optional transport.
 * @returns the fetcher.
 */
export declare function createProviderFetch(options: ProviderFetchOptions): ProviderFetcher;
/** Map a non-ok response to a typed upstream error. */
export declare function statusError(source: MarketSource, status: number, url: string): MarketUpstreamError;
/** The size cap for one registry file body. */
export declare function maxRegistryFileBytes(): number;

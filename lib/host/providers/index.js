/**
 * Skills Hub — the two upstream providers behind one seam.
 *
 * @module dsh-skills-hub/host/providers
 */
import { MARKET_SOURCES } from "../../shared/market.js";
import { createClawhubProvider } from "./clawhub.js";
import { createSkillhubProvider } from "./skillhub.js";
export { createClawhubProvider, mapSecurity as mapClawhubSecurity } from "./clawhub.js";
export { createSkillhubProvider, mapSecurity as mapSkillhubSecurity } from "./skillhub.js";
/**
 * Create both providers. They share the fetch helper (and therefore timeouts
 * and health bookkeeping) but nothing else: neither can observe or fail the
 * other's requests.
 *
 * @param options - registry bases and the fetch helper.
 * @returns providers keyed by registry.
 */
export function createProviderSet(options) {
    const providers = {
        clawhub: createClawhubProvider({ baseUrl: options.clawhubBase, fetcher: options.fetcher }),
        skillhub: createSkillhubProvider({ baseUrl: options.skillhubBase, fetcher: options.fetcher }),
    };
    // Fail loudly at assembly time if the shared source list outgrows this map,
    // rather than returning `undefined` from a lookup at request time.
    for (const source of MARKET_SOURCES) {
        if (providers[source] === undefined) {
            throw new Error(`skills-hub: no provider is registered for source "${source}"`);
        }
    }
    return providers;
}

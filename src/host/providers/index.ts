/**
 * Skills Hub — the two upstream providers behind one seam.
 *
 * @module dsh-skills-hub/host/providers
 */

import { MARKET_SOURCES, type MarketSource } from '../../shared/market.ts'
import type { ProviderFetcher } from '../provider-fetch.ts'
import type { MarketProvider } from '../provider.ts'
import { createClawhubProvider } from './clawhub.ts'
import { createSkillhubProvider } from './skillhub.ts'

export { createClawhubProvider, mapSecurity as mapClawhubSecurity } from './clawhub.ts'
export { createSkillhubProvider, mapSecurity as mapSkillhubSecurity } from './skillhub.ts'

/** Registry bases, both configurable so a mirror or a fixture can be used. */
export interface ProviderSetOptions {
  readonly clawhubBase: string
  readonly skillhubBase: string
  readonly fetcher: ProviderFetcher
}

/**
 * Create both providers. They share the fetch helper (and therefore timeouts
 * and health bookkeeping) but nothing else: neither can observe or fail the
 * other's requests.
 *
 * @param options - registry bases and the fetch helper.
 * @returns providers keyed by registry.
 */
export function createProviderSet(options: ProviderSetOptions): Record<MarketSource, MarketProvider> {
  const providers: Record<MarketSource, MarketProvider> = {
    clawhub: createClawhubProvider({ baseUrl: options.clawhubBase, fetcher: options.fetcher }),
    skillhub: createSkillhubProvider({ baseUrl: options.skillhubBase, fetcher: options.fetcher }),
  }
  // Fail loudly at assembly time if the shared source list outgrows this map,
  // rather than returning `undefined` from a lookup at request time.
  for (const source of MARKET_SOURCES) {
    if (providers[source] === undefined) {
      throw new Error(`skills-hub: no provider is registered for source "${source}"`)
    }
  }
  return providers
}

/**
 * Skills Hub — ClawHub provider (https://clawhub.ai).
 *
 * Endpoints (verified against the live API by the reference implementation):
 *  - `GET /api/v1/skills?limit=&cursor=&sort=downloads` → `{items, nextCursor}`
 *  - `GET /api/v1/search?q=`                            → `{results}`, no pagination
 *  - `GET /api/v1/skills/{slug}`                        → `{skill, latestVersion, owner, ...}`
 *  - `GET /api/v1/skills/{slug}/versions/{v}`           → `{version:{license, files[], security}}`
 *  - `GET /api/v1/skills/{slug}/file?path=`             → raw file text
 *
 * Two upstream quirks drive the shape of this file:
 *  - Slugs are **not unique across owners**. Every per-skill endpoint accepts
 *    `?owner=`; without it a shared slug answers `409 AMBIGUOUS_SKILL_SLUG`
 *    with the candidate owners in `matches[]`. {@link createClawhubProvider}
 *    resolves that once per slug and remembers the owner for later reads.
 *  - `search` has no pagination and aggregates other registries, so the
 *    results are filtered to native ClawHub entries before they are capped.
 *
 * ClawHub carries no security verdict at list time; the version endpoint does,
 * and only then is the badge refined.
 *
 * There is no "sync" call to make: ClawHub publishes a version on write, so a
 * read never has to trigger one (the placeholder changelog a mirror stamps —
 * `synced by … pipeline` — is dropped by the shared `meaningfulChangelog`).
 *
 * @module dsh-skills-hub/host/providers/clawhub
 */
import { type SecurityReport, type SecurityStatus } from '../../shared/market.ts';
import type { ProviderFetcher } from '../provider-fetch.ts';
import type { MarketProvider } from '../provider.ts';
interface ClawhubScanner {
    status?: string;
    normalizedStatus?: string;
    recommendation?: string;
    summary?: string;
}
interface ClawhubSecurity {
    status?: string;
    hasWarnings?: boolean;
    virustotalUrl?: string;
    scanners?: {
        vt?: ClawhubScanner;
        skillspector?: ClawhubScanner;
        llm?: ClawhubScanner;
    };
}
/** Options for {@link createClawhubProvider}. */
export interface ClawhubProviderOptions {
    /** Registry base, e.g. `https://clawhub.ai`; from plugin config, never a constant. */
    readonly baseUrl: string;
    readonly fetcher: ProviderFetcher;
}
/**
 * Create the ClawHub provider. The owner resolution cache is per instance, so
 * disposing the plugin (an HMR reload) drops every remembered owner with it.
 *
 * @param options - registry base and the shared fetch helper.
 * @returns the provider.
 */
export declare function createClawhubProvider(options: ClawhubProviderOptions): MarketProvider;
/**
 * ClawHub's scan of one version: an overall status plus per-scanner verdicts
 * (VirusTotal, skillspector, an LLM review). The overall status decides the
 * badge; each scanner becomes its own report so a reader sees which one
 * objected and why.
 */
export declare function mapSecurity(security?: ClawhubSecurity): {
    status: SecurityStatus;
    reports: SecurityReport[];
};
export {};

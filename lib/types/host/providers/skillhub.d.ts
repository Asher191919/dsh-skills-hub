/**
 * Skills Hub — SkillHub provider (https://api.skillhub.cn).
 *
 * Endpoints (verified against the live API by the reference implementation):
 *  - `GET /api/skills?page=&pageSize=&keyword=` → `{code, data:{skills[], total}, message}`
 *      The pagination parameter **must** be `pageSize` and the search parameter
 *      **must** be `keyword`; `limit` and `q` are silently ignored upstream.
 *  - `GET /api/v1/skills/{slug}`                → `{skill, owner, latestVersion, securityReports}`
 *  - `GET /api/v1/skills/{slug}/files`          → `{count, files:[{path, sha256, size}]}`
 *  - `GET /api/v1/skills/{slug}/file?path=`     → 302 to object storage (followed)
 *
 * SkillHub mirrors ClawHub skills: a mirrored entry carries `source: 'clawhub'`
 * plus `upstream_url`. That marker is preserved as `upstream` so the
 * aggregation layer can fold the mirror into the ClawHub original.
 *
 * @module dsh-skills-hub/host/providers/skillhub
 */
import { type SecurityReport, type SecurityStatus } from '../../shared/market.ts';
import type { ProviderFetcher } from '../provider-fetch.ts';
import type { MarketProvider } from '../provider.ts';
interface SkillhubSecurityReports {
    [vendor: string]: {
        status?: string;
        statusText?: string;
        reportUrl?: string;
    } | undefined;
}
/** Options for {@link createSkillhubProvider}. */
export interface SkillhubProviderOptions {
    /** Registry base, e.g. `https://api.skillhub.cn`; from plugin config. */
    readonly baseUrl: string;
    readonly fetcher: ProviderFetcher;
}
/**
 * Create the SkillHub provider.
 *
 * @param options - registry base and the shared fetch helper.
 * @returns the provider.
 */
export declare function createSkillhubProvider(options: SkillhubProviderOptions): MarketProvider;
/**
 * SkillHub's scan reports: every scanner's verdict decides the badge, and a
 * publisher-vouched version with no objection becomes `verified`.
 */
export declare function mapSecurity(reports: SkillhubSecurityReports | undefined, verified: boolean | undefined): {
    status: SecurityStatus;
    reports: SecurityReport[];
};
export {};

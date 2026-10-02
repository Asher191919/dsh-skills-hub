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
import { MARKET_ERROR_CODES, MARKET_LIMITS, detectMarketLanguage, meaningfulChangelog, skillId, } from "../../shared/market.js";
import { MarketUpstreamError } from "../errors.js";
import { parseFrontmatter } from "../frontmatter.js";
import { maxRegistryFileBytes, statusError } from "../provider-fetch.js";
/**
 * Create the ClawHub provider. The owner resolution cache is per instance, so
 * disposing the plugin (an HMR reload) drops every remembered owner with it.
 *
 * @param options - registry base and the shared fetch helper.
 * @returns the provider.
 */
export function createClawhubProvider(options) {
    const base = options.baseUrl.replace(/\/+$/, '');
    /** slug → the owner one ambiguous read resolved to. */
    const ownerBySlug = new Map();
    const url = (path) => new URL(path, `${base}/`);
    /**
     * Perform one per-skill request, pinning the remembered owner when there is
     * one and resolving `AMBIGUOUS_SKILL_SLUG` when the registry answers 409.
     */
    const skillFetch = async (target, slug, signal) => {
        const knownOwner = ownerBySlug.get(slug);
        if (knownOwner !== undefined && !target.searchParams.has('owner')) {
            target.searchParams.set('owner', knownOwner);
        }
        const response = await options.fetcher.request('clawhub', target.toString(), signal);
        if (response.status !== 409)
            return response;
        const body = await response.json().catch(() => null);
        const resolvedOwner = body?.code === 'AMBIGUOUS_SKILL_SLUG' ? body.matches?.[0]?.ownerHandle : undefined;
        if (typeof resolvedOwner !== 'string' || resolvedOwner === '') {
            throw new MarketUpstreamError('clawhub', MARKET_ERROR_CODES.upstreamError, `clawhub responded 409 for ${target.pathname}`);
        }
        ownerBySlug.set(slug, resolvedOwner);
        target.searchParams.set('owner', resolvedOwner);
        return options.fetcher.request('clawhub', target.toString(), signal);
    };
    const skillJson = async (target, slug, signal) => {
        const response = await skillFetch(target, slug, signal);
        if (!response.ok)
            throw statusError('clawhub', response.status, target.toString());
        return options.fetcher.readJson('clawhub', response, target.pathname);
    };
    return {
        source: 'clawhub',
        async list({ cursor, limit, signal }) {
            const target = url('/api/v1/skills');
            target.searchParams.set('limit', String(limit));
            target.searchParams.set('sort', 'downloads');
            if (cursor !== undefined && cursor !== '')
                target.searchParams.set('cursor', cursor);
            const data = await options.fetcher.json('clawhub', target.toString(), signal);
            if (!Array.isArray(data.items)) {
                throw new MarketUpstreamError('clawhub', MARKET_ERROR_CODES.upstreamBadResponse, 'clawhub list is missing items');
            }
            return {
                items: data.items.filter(hasSlug).map(normalizeListItem),
                ...(typeof data.nextCursor === 'string' && data.nextCursor !== '' ? { nextCursor: data.nextCursor } : {}),
            };
        },
        async search({ q, limit, signal }) {
            const target = url('/api/v1/search');
            target.searchParams.set('q', q);
            const data = await options.fetcher.json('clawhub', target.toString(), signal);
            if (!Array.isArray(data.results)) {
                throw new MarketUpstreamError('clawhub', MARKET_ERROR_CODES.upstreamBadResponse, 'clawhub search is missing results');
            }
            // Search also aggregates external registries, whose hits cannot use
            // ClawHub's detail/file endpoints. Filter before capping so foreign hits
            // do not consume native slots.
            const native = data.results.filter((result) => typeof result.slug === 'string'
                && result.slug !== ''
                && (result.source === undefined || result.source === 'clawhub')
                && (result.install?.kind === undefined || result.install.kind === 'clawhub'));
            return { items: native.slice(0, limit).map(normalizeSearchResult) };
        },
        async detail(slug, signal) {
            const data = await skillJson(url(`/api/v1/skills/${encodeURIComponent(slug)}`), slug, signal);
            const skill = data.skill;
            if (skill === undefined || typeof skill.slug !== 'string' || skill.slug === '') {
                throw new MarketUpstreamError('clawhub', MARKET_ERROR_CODES.upstreamBadResponse, 'clawhub detail is missing the skill');
            }
            const version = data.latestVersion?.version ?? skill.latestVersion?.version;
            let files = [];
            let license = data.latestVersion?.license;
            let security = { status: 'unknown', reports: [] };
            if (typeof version === 'string' && version !== '') {
                try {
                    const versionDetail = await skillJson(url(`/api/v1/skills/${encodeURIComponent(slug)}/versions/${encodeURIComponent(version)}`), slug, signal);
                    files = normalizeFiles(versionDetail.version?.files);
                    license = versionDetail.version?.license ?? license;
                    security = mapSecurity(versionDetail.version?.security);
                }
                catch {
                    // The version detail is best-effort: the skill page is still useful
                    // without its file list, and install re-reads the list anyway.
                }
            }
            // ClawHub's description IS the SKILL.md source (frontmatter + body).
            const rawDescription = typeof skill.description === 'string' ? skill.description : '';
            const parsed = parseFrontmatter(rawDescription);
            const item = normalizeListItem(skill);
            const resolvedVersion = typeof version === 'string' && version !== '' ? version : item.version;
            const owner = data.owner?.handle;
            const changelog = meaningfulChangelog(data.latestVersion?.changelog);
            const publishedAt = data.latestVersion?.createdAt;
            return {
                ...item,
                ...(resolvedVersion === undefined ? {} : { version: resolvedVersion }),
                ...(changelog === undefined
                    ? {}
                    : { changelog: { version: resolvedVersion, text: changelog, ...(typeof publishedAt === 'number' ? { publishedAt } : {}) } }),
                ...(typeof owner === 'string' && owner !== ''
                    ? { pageUrl: `${base}/${encodeURIComponent(owner)}/${encodeURIComponent(item.slug)}` }
                    : {}),
                author: {
                    handle: owner ?? '',
                    ...(data.owner?.displayName === undefined ? {} : { displayName: data.owner.displayName }),
                    ...(data.owner?.image === undefined ? {} : { avatarUrl: data.owner.image }),
                },
                securityStatus: security.status,
                ...(security.reports.length === 0 ? {} : { securityReports: security.reports }),
                description: parsed.content,
                ...(parsed.frontmatter === undefined ? {} : { descriptionFrontmatter: parsed.frontmatter }),
                ...(license === undefined ? {} : { license }),
                files: files.map((file) => ({
                    path: file.path,
                    size: file.size,
                    ...(file.sha256 === undefined ? {} : { sha256: file.sha256 }),
                    ...(file.contentType === undefined ? {} : { contentType: file.contentType }),
                    language: detectMarketLanguage(file.path),
                    tooBig: file.size > MARKET_LIMITS.maxFileSize,
                })),
                totalSize: files.reduce((sum, file) => sum + file.size, 0),
            };
        },
        async listFiles(slug, version, signal) {
            let resolved = version;
            if (resolved === undefined || resolved === '') {
                const detail = await skillJson(url(`/api/v1/skills/${encodeURIComponent(slug)}`), slug, signal);
                resolved = detail.latestVersion?.version ?? detail.skill?.latestVersion?.version;
            }
            if (resolved === undefined || resolved === '')
                return [];
            const versionDetail = await skillJson(url(`/api/v1/skills/${encodeURIComponent(slug)}/versions/${encodeURIComponent(resolved)}`), slug, signal);
            return normalizeFiles(versionDetail.version?.files);
        },
        async fetchFile(slug, filePath, signal) {
            const target = url(`/api/v1/skills/${encodeURIComponent(slug)}/file`);
            target.searchParams.set('path', filePath);
            const response = await skillFetch(target, slug, signal);
            if (!response.ok)
                throw statusError('clawhub', response.status, target.toString());
            return options.fetcher.text('clawhub', response, maxRegistryFileBytes(), `file ${filePath}`);
        },
    };
}
function hasSlug(item) {
    return typeof item.slug === 'string' && item.slug !== '';
}
/** A ClawHub list/search entry, normalized to the shared skill shape. */
function normalizeListItem(item) {
    const slug = item.slug ?? '';
    const topics = Array.isArray(item.topics)
        ? item.topics.filter((topic) => typeof topic === 'string')
        : [];
    return {
        id: skillId('clawhub', slug),
        source: 'clawhub',
        slug,
        name: item.displayName ?? slug,
        summary: item.summary ?? '',
        author: { handle: '' },
        stats: {
            downloads: item.stats?.downloads ?? 0,
            ...(item.stats?.installs === undefined ? {} : { installs: item.stats.installs }),
            ...(item.stats?.stars === undefined ? {} : { stars: item.stats.stars }),
        },
        tags: topics,
        ...(item.latestVersion?.version === undefined ? {} : { version: item.latestVersion.version }),
        ...(item.updatedAt === undefined ? {} : { updatedAt: item.updatedAt }),
        // The list payload carries no scan verdict at all.
        securityStatus: 'unknown',
        installState: 'installable',
    };
}
/** A ClawHub search hit, which can name its owner. */
function normalizeSearchResult(result) {
    const slug = result.slug ?? '';
    const handle = result.owner?.handle ?? result.ownerHandle ?? '';
    return {
        id: skillId('clawhub', slug),
        source: 'clawhub',
        slug,
        name: result.displayName ?? slug,
        summary: result.summary ?? '',
        author: {
            handle,
            ...(result.owner?.displayName === undefined ? {} : { displayName: result.owner.displayName }),
            ...(result.owner?.image === undefined ? {} : { avatarUrl: result.owner.image }),
        },
        stats: { downloads: result.downloads ?? 0 },
        tags: [],
        ...(result.updatedAt === undefined ? {} : { updatedAt: result.updatedAt }),
        securityStatus: 'unknown',
        installState: 'installable',
    };
}
/** Drop entries the registry cannot describe completely. */
function normalizeFiles(files) {
    if (!Array.isArray(files))
        return [];
    const result = [];
    for (const file of files) {
        if (typeof file?.path !== 'string' || file.path === '')
            continue;
        result.push({
            path: file.path,
            size: typeof file.size === 'number' && file.size >= 0 ? file.size : 0,
            ...(typeof file.sha256 === 'string' && file.sha256 !== '' ? { sha256: file.sha256 } : {}),
            ...(typeof file.contentType === 'string' && file.contentType !== '' ? { contentType: file.contentType } : {}),
        });
    }
    return result;
}
/**
 * ClawHub's scan of one version: an overall status plus per-scanner verdicts
 * (VirusTotal, skillspector, an LLM review). The overall status decides the
 * badge; each scanner becomes its own report so a reader sees which one
 * objected and why.
 */
export function mapSecurity(security) {
    if (security?.status === undefined || security.status === '')
        return { status: 'unknown', reports: [] };
    const clean = security.status === 'clean';
    const reports = [{
            vendor: 'clawhub-scan',
            status: security.status,
            statusText: clean
                ? (security.hasWarnings === true ? 'Clean (with warnings)' : 'Clean')
                : `Scan status: ${security.status}`,
            ...(security.virustotalUrl === undefined ? {} : { reportUrl: security.virustotalUrl }),
        }];
    const scanners = [
        ['VirusTotal', security.scanners?.vt],
        ['skillspector', security.scanners?.skillspector],
        ['LLM review', security.scanners?.llm],
    ];
    for (const [vendor, scanner] of scanners) {
        const status = scanner?.normalizedStatus ?? scanner?.status;
        if (status === undefined || status === '')
            continue;
        const recommendation = typeof scanner?.recommendation === 'string' ? scanner.recommendation : '';
        const summary = typeof scanner?.summary === 'string' && scanner.summary !== '' ? scanner.summary : undefined;
        reports.push({
            vendor,
            status,
            statusText: recommendation === '' ? status : `${status} · ${recommendation}`,
            ...(summary === undefined ? {} : { summary }),
            ...(vendor === 'VirusTotal' && security.virustotalUrl !== undefined ? { reportUrl: security.virustotalUrl } : {}),
        });
    }
    return { status: clean ? 'benign' : 'flagged', reports };
}

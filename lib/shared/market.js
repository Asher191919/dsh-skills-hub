/**
 * Skills Hub — the wire contract shared by the host half and the browser half.
 *
 * This module must stay **type-only for the client bundle**: the client imports
 * it with `import type`, so nothing here may carry runtime values that the
 * browser half needs (the client bundle purity gate forbids cross-plugin value
 * imports, and a local value module would be inlined twice). Pure helpers that
 * both halves genuinely need live here as `const`/`function` exports and are
 * small enough to duplicate safely — they are marked CLIENT-SAFE.
 *
 * Upstream registries:
 *  - ClawHub  (https://clawhub.ai)      — cursor pagination, no security audits
 *  - SkillHub (https://api.skillhub.cn) — page/pageSize pagination, security reports
 *
 * @module dsh-skills-hub/shared/market
 */
/** Every registry this plugin aggregates, in display order. CLIENT-SAFE. */
export const MARKET_SOURCES = ['clawhub', 'skillhub'];
/** Every security status, in the filter bar's order. CLIENT-SAFE. */
export const SECURITY_STATUSES = ['verified', 'benign', 'unknown', 'flagged'];
/** Stable error codes, so the client can branch without matching prose. */
export const MARKET_ERROR_CODES = {
    upstreamError: 'MARKET_UPSTREAM_ERROR',
    upstreamTimeout: 'MARKET_UPSTREAM_TIMEOUT',
    upstreamBadResponse: 'MARKET_UPSTREAM_BAD_RESPONSE',
    installInProgress: 'MARKET_INSTALL_IN_PROGRESS',
    alreadyInstalled: 'MARKET_ALREADY_INSTALLED',
    notInstallable: 'MARKET_NOT_INSTALLABLE',
    checksumMismatch: 'MARKET_CHECKSUM_MISMATCH',
    diskError: 'MARKET_DISK_ERROR',
    notInstalled: 'MARKET_NOT_INSTALLED',
    notManaged: 'MARKET_NOT_MANAGED',
    badRequest: 'MARKET_BAD_REQUEST',
    sourceUnavailable: 'MARKET_SOURCE_UNAVAILABLE',
    /**
     * An unrecognized failure, i.e. a bug. It exists so the canned 500 does not
     * have to borrow `diskError` and claim a disk problem that did not happen.
     */
    internal: 'MARKET_INTERNAL_ERROR',
};
// ─── Limits ─────────────────────────────────────────────────────────────────
/** Hard bounds, mirrored from the reference implementation. */
export const MARKET_LIMITS = {
    /** Max bytes for a single skill file (install + preview). */
    maxFileSize: 5 * 1024 * 1024,
    /** Max total bytes for an installable skill. */
    maxTotalSize: 20 * 1024 * 1024,
    /** Max file count for an installable skill. */
    maxFileCount: 200,
    /** File preview content is truncated beyond this many bytes. */
    previewTruncateBytes: 300 * 1024,
    /** ClawHub search has no pagination — cap merged search results. */
    searchResultCap: 50,
    /** Grid page size. */
    pageSize: 24,
};
/** Shape of a registry owner handle accepted from the client. */
export const MARKET_OWNER_PATTERN = /^[A-Za-z0-9_.-]{1,64}$/;
// ─── CLIENT-SAFE helpers (no node built-ins, no runtime imports) ─────────────
/** Compose the globally unique id for a registry entry. */
export function skillId(source, slug) {
    return `${source}:${slug}`;
}
/** Inverse of {@link skillId}; `null` when the id is malformed. */
export function parseSkillId(id) {
    const idx = id.indexOf(':');
    if (idx <= 0)
        return null;
    const source = id.slice(0, idx);
    const slug = id.slice(idx + 1);
    if (!MARKET_SOURCES.includes(source) || slug === '')
        return null;
    return { source: source, slug };
}
/**
 * Directory-name whitelist: lowercase alnum, dash, underscore, dot, no leading
 * dot, no `..`. Returns `null` for a name that must not be written to disk.
 */
export function sanitizeDirName(slug) {
    const name = slug.toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]*$/.test(name))
        return null;
    if (name.includes('..'))
        return null;
    return name;
}
const LANG_MAP = {
    md: 'markdown', ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
    json: 'json', yaml: 'yaml', yml: 'yaml', sh: 'bash', bash: 'bash', zsh: 'bash',
    py: 'python', toml: 'toml', css: 'css', html: 'html',
    txt: 'text', xml: 'xml', sql: 'sql', rs: 'rust', go: 'go', rb: 'ruby',
};
/** Best-effort language tag for a file path, for the preview pane. */
export function detectMarketLanguage(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    return LANG_MAP[ext] ?? 'text';
}
/** A release note worth showing: registries stamp placeholders on synced versions. */
export function meaningfulChangelog(text) {
    const value = typeof text === 'string' ? text.trim() : '';
    if (value === '')
        return undefined;
    if (/^synced by .*pipeline$/i.test(value))
        return undefined;
    return value;
}

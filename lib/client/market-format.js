/**
 * Language-neutral display helpers for the marketplace panel.
 *
 * Ported from the reference marketplace (`marketFormat.ts`) and extended with
 * the byte/clock/avatar helpers the DSH panel needs. Nothing here formats
 * prose: every user-visible sentence comes from the locale dictionaries.
 *
 * @module dsh-skills-hub/client/market-format
 */
/** Compact counts: 482069 → 482.1k. Numeric and language-neutral. */
export function formatCount(value) {
    if (!Number.isFinite(value) || value < 0)
        return '0';
    if (value >= 1_000_000)
        return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000)
        return `${(value / 1_000).toFixed(1)}k`;
    return String(Math.round(value));
}
/** Human-readable byte size. Binary units, one decimal above a kibibyte. */
export function formatBytes(value) {
    if (!Number.isFinite(value) || value <= 0)
        return '0 B';
    const units = ['B', 'KiB', 'MiB', 'GiB'];
    let size = value;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit += 1;
    }
    const digits = unit === 0 ? 0 : 1;
    return `${size.toFixed(digits)} ${units[unit] ?? 'B'}`;
}
/**
 * Upstream timestamps are epoch millis; rendered as an ISO date so the same
 * skill reads the same in every locale.
 */
export function formatIsoDate(timestamp) {
    if (timestamp === undefined)
        return '';
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}
/** Wall-clock time of a cache fill, for the source-health line. */
export function formatClock(timestamp) {
    if (timestamp === undefined)
        return '';
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString();
}
/** Only absolute http(s) links from upstream may become an `href`. */
export function safeUrl(url) {
    return url !== undefined && /^https?:\/\//i.test(url) ? url : undefined;
}
/** Number of distinct avatar tints the stylesheet defines. */
export const AVATAR_TONES = 6;
/**
 * Deterministic palette index for a skill id, so one skill keeps a stable,
 * restrained identity colour across the grid and the detail header.
 */
export function avatarTone(id) {
    let hash = 0;
    for (let index = 0; index < id.length; index += 1) {
        hash = (hash * 31 + id.charCodeAt(index)) | 0;
    }
    return Math.abs(hash) % AVATAR_TONES;
}
/** First visible character of a name, uppercased (handles CJK and surrogates). */
export function initialOf(name) {
    const first = Array.from(name.trim())[0];
    return first === undefined ? '?' : first.toUpperCase();
}
/** `source · author` line, tolerant of a registry that omits the author. */
export function authorLabel(displayName, handle) {
    const name = displayName?.trim();
    return name !== undefined && name !== '' ? name : handle;
}

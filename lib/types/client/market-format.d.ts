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
export declare function formatCount(value: number): string;
/** Human-readable byte size. Binary units, one decimal above a kibibyte. */
export declare function formatBytes(value: number): string;
/**
 * Upstream timestamps are epoch millis; rendered as an ISO date so the same
 * skill reads the same in every locale.
 */
export declare function formatIsoDate(timestamp: number | undefined): string;
/** Wall-clock time of a cache fill, for the source-health line. */
export declare function formatClock(timestamp: number | undefined): string;
/** Only absolute http(s) links from upstream may become an `href`. */
export declare function safeUrl(url: string | undefined): string | undefined;
/** Number of distinct avatar tints the stylesheet defines. */
export declare const AVATAR_TONES = 6;
/**
 * Deterministic palette index for a skill id, so one skill keeps a stable,
 * restrained identity colour across the grid and the detail header.
 */
export declare function avatarTone(id: string): number;
/** First visible character of a name, uppercased (handles CJK and surrogates). */
export declare function initialOf(name: string): string;
/** `source · author` line, tolerant of a registry that omits the author. */
export declare function authorLabel(displayName: string | undefined, handle: string): string;

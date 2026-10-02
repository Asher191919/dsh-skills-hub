/**
 * Skills Hub — the host half's error vocabulary.
 *
 * Two error families, mirroring the reference implementation:
 *  - {@link MarketUpstreamError} — a registry read failed (transport, timeout,
 *    unusable payload). It carries the registry that failed and a
 *    `MARKET_ERROR_CODES` code.
 *  - {@link MarketRequestError} — an operation cannot be honoured (bad input,
 *    conflict, not installable, disk failure). It carries the HTTP status the
 *    route must answer with.
 *
 * {@link errorResponseFor} is the single translation point from any thrown
 * value to a wire body. It never emits a stack trace, a filesystem path, or a
 * raw driver message: an unrecognized failure becomes a canned 500.
 *
 * @module dsh-skills-hub/host/errors
 */
import { type MarketErrorBody, type MarketSource } from '../shared/market.ts';
/**
 * The slice of `ctx.logger` the host services use. Declared structurally so a
 * service can be constructed outside a cordis context (tests, tooling).
 */
export interface HostLogger {
    warn(message: string): void;
}
/** A registry request failed; `code` is always a `MARKET_ERROR_CODES` member. */
export declare class MarketUpstreamError extends Error {
    readonly source: MarketSource;
    readonly code: string;
    constructor(source: MarketSource, code: string, message: string);
}
/** An operation cannot be honoured; `status` is the HTTP answer. */
export declare class MarketRequestError extends Error {
    readonly status: number;
    readonly code: string;
    readonly source: MarketSource | undefined;
    constructor(status: number, code: string, message: string, source?: MarketSource);
}
/** 400 with `MARKET_BAD_REQUEST`. */
export declare function badRequest(message: string): MarketRequestError;
/** 404 with `MARKET_NOT_INSTALLED`. */
export declare function notInstalled(message: string): MarketRequestError;
/** 409 with `MARKET_NOT_MANAGED`: the directory exists but this hub does not own it. */
export declare function notManaged(message: string): MarketRequestError;
/** 422 with `MARKET_NOT_INSTALLABLE`. */
export declare function notInstallable(message: string): MarketRequestError;
/** 500 with `MARKET_DISK_ERROR`; `message` must be caller-authored and path-free. */
export declare function diskError(message: string): MarketRequestError;
/**
 * Short, leak-free description of a lower-level cause. Driver messages can
 * embed absolute paths, so only the machine-readable `code` (or the error's
 * constructor name) is propagated to a caller-visible message.
 */
export declare function describeCause(error: unknown): string;
/**
 * Map any thrown value to the wire status and {@link MarketErrorBody} the
 * client branches on.
 *
 * @param error - whatever a handler caught.
 * @returns the HTTP status and the sanitized error body.
 */
export declare function errorResponseFor(error: unknown): {
    status: number;
    body: MarketErrorBody;
};
/** HTTP status for an upstream failure: 404 for a missing skill, 504 on timeout, else 502. */
export declare function upstreamStatus(error: MarketUpstreamError): number;

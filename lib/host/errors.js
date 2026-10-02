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
import { MARKET_ERROR_CODES } from "../shared/market.js";
/** A registry request failed; `code` is always a `MARKET_ERROR_CODES` member. */
export class MarketUpstreamError extends Error {
    source;
    code;
    constructor(source, code, message) {
        super(message);
        this.name = 'MarketUpstreamError';
        this.source = source;
        this.code = code;
    }
}
/** An operation cannot be honoured; `status` is the HTTP answer. */
export class MarketRequestError extends Error {
    status;
    code;
    source;
    constructor(status, code, message, source) {
        super(message);
        this.name = 'MarketRequestError';
        this.status = status;
        this.code = code;
        this.source = source;
    }
}
/** 400 with `MARKET_BAD_REQUEST`. */
export function badRequest(message) {
    return new MarketRequestError(400, MARKET_ERROR_CODES.badRequest, message);
}
/** 404 with `MARKET_NOT_INSTALLED`. */
export function notInstalled(message) {
    return new MarketRequestError(404, MARKET_ERROR_CODES.notInstalled, message);
}
/** 409 with `MARKET_NOT_MANAGED`: the directory exists but this hub does not own it. */
export function notManaged(message) {
    return new MarketRequestError(409, MARKET_ERROR_CODES.notManaged, message);
}
/** 422 with `MARKET_NOT_INSTALLABLE`. */
export function notInstallable(message) {
    return new MarketRequestError(422, MARKET_ERROR_CODES.notInstallable, message);
}
/** 500 with `MARKET_DISK_ERROR`; `message` must be caller-authored and path-free. */
export function diskError(message) {
    return new MarketRequestError(500, MARKET_ERROR_CODES.diskError, message);
}
/**
 * Short, leak-free description of a lower-level cause. Driver messages can
 * embed absolute paths, so only the machine-readable `code` (or the error's
 * constructor name) is propagated to a caller-visible message.
 */
export function describeCause(error) {
    if (error instanceof Error) {
        const code = error.code;
        if (typeof code === 'string' && code !== '')
            return `${error.name} (${code})`;
        return error.name;
    }
    return typeof error;
}
/**
 * Map any thrown value to the wire status and {@link MarketErrorBody} the
 * client branches on.
 *
 * @param error - whatever a handler caught.
 * @returns the HTTP status and the sanitized error body.
 */
export function errorResponseFor(error) {
    if (error instanceof MarketRequestError) {
        return {
            status: error.status,
            body: {
                error: error.message,
                code: error.code,
                ...(error.source === undefined ? {} : { source: error.source }),
            },
        };
    }
    if (error instanceof MarketUpstreamError) {
        return {
            status: upstreamStatus(error),
            body: { error: error.message, code: error.code, source: error.source },
        };
    }
    // Unrecognized failure: a canned body, never the driver's message. It reports
    // `internal`, not `diskError` — a bug in the merge or a bad branch is not a
    // disk problem, and saying so would send a reader down the wrong path.
    return { status: 500, body: { error: 'internal error', code: MARKET_ERROR_CODES.internal } };
}
/** HTTP status for an upstream failure: 404 for a missing skill, 504 on timeout, else 502. */
export function upstreamStatus(error) {
    if (error.code === MARKET_ERROR_CODES.upstreamBadResponse)
        return 404;
    if (error.code === MARKET_ERROR_CODES.upstreamTimeout)
        return 504;
    return 502;
}

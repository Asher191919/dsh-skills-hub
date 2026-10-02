/**
 * Skills Hub — the one HTTP path to every upstream registry.
 *
 * Every request carries a hard timeout, one retry for transient failures, a
 * byte cap enforced while streaming, and health bookkeeping. Failures surface
 * as {@link MarketUpstreamError} with a `MARKET_ERROR_CODES` code, so a
 * degraded registry can be reported in `sources[]` instead of failing a
 * response.
 *
 * @module dsh-skills-hub/host/provider-fetch
 */
import { MARKET_ERROR_CODES, MARKET_LIMITS, } from "../shared/market.js";
import { MarketUpstreamError } from "./errors.js";
/** Cap for a JSON payload from a registry (list/detail responses). */
const MAX_JSON_BYTES = 8 * 1024 * 1024;
/**
 * Create the fetch helper for one plugin fiber.
 *
 * @param options - timeout, health recorder, and optional transport.
 * @returns the fetcher.
 */
export function createProviderFetch(options) {
    const transport = options.fetchImpl ?? fetch;
    const cancelled = (callSignal) => callSignal?.aborted === true || options.signal?.aborted === true;
    const timeoutSignal = (callSignal) => {
        const signals = [AbortSignal.timeout(Math.max(1, options.timeoutMs))];
        if (options.signal !== undefined)
            signals.push(options.signal);
        if (callSignal !== undefined)
            signals.push(callSignal);
        return signals.length === 1 ? signals[0] : AbortSignal.any(signals);
    };
    const fetchOnce = async (source, url, callSignal) => {
        try {
            return await transport(url, {
                headers: { accept: 'application/json, text/plain, */*' },
                redirect: 'follow',
                signal: timeoutSignal(callSignal),
            });
        }
        catch (error) {
            const name = error instanceof Error ? error.name : '';
            const aborted = name === 'AbortError' || name === 'TimeoutError';
            // A caller-supplied cancellation is not an upstream timeout.
            const stopped = aborted && cancelled(callSignal);
            const timedOut = aborted && !stopped;
            throw new MarketUpstreamError(source, timedOut ? MARKET_ERROR_CODES.upstreamTimeout : MARKET_ERROR_CODES.upstreamError, timedOut
                ? `${source} request timed out`
                : stopped
                    ? `${source} request was cancelled`
                    : `${source} request failed (${describe(error)})`);
        }
    };
    const request = async (source, url, callSignal) => {
        let lastError;
        for (let attempt = 0; attempt < 2; attempt += 1) {
            // A cancelled call never retries.
            if (cancelled(callSignal))
                break;
            try {
                const response = await fetchOnce(source, url, callSignal);
                if (response.status === 429 || response.status >= 500) {
                    lastError = new MarketUpstreamError(source, MARKET_ERROR_CODES.upstreamError, `${source} responded ${response.status}`);
                    continue;
                }
                options.sourceHealth.recordSuccess(source);
                return response;
            }
            catch (error) {
                lastError = error instanceof MarketUpstreamError
                    ? new MarketUpstreamError(source, error.code, error.message)
                    : new MarketUpstreamError(source, MARKET_ERROR_CODES.upstreamError, `${source} request failed (${describe(error)})`);
                if (cancelled(callSignal))
                    break;
            }
        }
        const failure = lastError
            ?? new MarketUpstreamError(source, MARKET_ERROR_CODES.upstreamError, `${source} request was cancelled`);
        options.sourceHealth.recordFailure(source, failure.message);
        throw failure;
    };
    const text = async (source, response, maxBytes, label) => {
        const declared = Number(response.headers.get('content-length'));
        if (Number.isFinite(declared) && declared > maxBytes) {
            throw tooLarge(source, label, maxBytes);
        }
        if (response.body === null)
            return { content: '', size: 0 };
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const chunks = [];
        let total = 0;
        try {
            for (;;) {
                const step = await reader.read();
                if (step.done)
                    break;
                total += step.value.byteLength;
                if (total > maxBytes) {
                    await reader.cancel().catch(() => undefined);
                    throw tooLarge(source, label, maxBytes);
                }
                chunks.push(decoder.decode(step.value, { stream: true }));
            }
            chunks.push(decoder.decode());
            return { content: chunks.join(''), size: total };
        }
        finally {
            reader.releaseLock();
        }
    };
    const readJson = async (source, response, label) => {
        const body = await text(source, response, MAX_JSON_BYTES, label);
        try {
            return JSON.parse(body.content);
        }
        catch {
            throw new MarketUpstreamError(source, MARKET_ERROR_CODES.upstreamBadResponse, `${source} returned invalid JSON for ${label}`);
        }
    };
    const json = async (source, url, signal) => {
        const response = await request(source, url, signal);
        if (!response.ok)
            throw statusError(source, response.status, url);
        try {
            return await readJson(source, response, 'response');
        }
        catch (error) {
            if (error instanceof MarketUpstreamError)
                options.sourceHealth.recordFailure(source, error.message);
            throw error;
        }
    };
    return { request, json, text, readJson };
}
/** Map a non-ok response to a typed upstream error. */
export function statusError(source, status, url) {
    let label = url;
    try {
        label = new URL(url).pathname;
    }
    catch {
        // Keep the raw string when it is not a parseable URL.
    }
    return new MarketUpstreamError(source, status === 404 ? MARKET_ERROR_CODES.upstreamBadResponse : MARKET_ERROR_CODES.upstreamError, `${source} responded ${status} for ${label}`);
}
/** The size cap for one registry file body. */
export function maxRegistryFileBytes() {
    return MARKET_LIMITS.maxFileSize;
}
function tooLarge(source, label, maxBytes) {
    return new MarketUpstreamError(source, MARKET_ERROR_CODES.upstreamBadResponse, `${source} ${label} exceeds the size limit (${maxBytes} bytes)`);
}
/** Leak-free cause description: a machine code or the error's name, never a message. */
function describe(error) {
    if (error instanceof Error) {
        const code = error.code;
        if (typeof code === 'string' && code !== '')
            return code;
        return error.name;
    }
    return typeof error;
}

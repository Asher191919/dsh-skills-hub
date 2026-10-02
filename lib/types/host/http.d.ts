/**
 * Skills Hub — the HTTP carrier.
 *
 * Declared structurally, following the reference host plugin: the plugin asks
 * for whatever object provides `register`, and never imports a Web server
 * package that a minimal composition may not mount.
 *
 * Two invariants live here rather than in every handler:
 *  - every response carries an explicit `cache-control` (this API only serves
 *    live registry data and live local install state, so it is always
 *    `no-store`);
 *  - a handler can never produce an unhandled rejection or leak a stack trace,
 *    because {@link createHandler} owns the whole response lifecycle.
 *
 * @module dsh-skills-hub/host/http
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { type MarketErrorBody } from '../shared/market.ts';
import { type HostLogger } from './errors.ts';
/** The Web server route surface this plugin uses. */
export interface WebRouteHost {
    register(route: {
        kind: 'exact' | 'prefix';
        path: string;
        handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
    }): () => void;
}
/** The authentication fence `ctx.connection` exposes to raw Web routes. */
export interface BrowserRequestGate {
    requestRejection(request: {
        headers: IncomingMessage['headers'];
    }): 401 | 403 | undefined;
}
/** Every response this plugin produces is uncacheable. */
export declare const NO_STORE = "no-store";
/** A rejected request body, carrying the status the route should answer with. */
export declare class RequestBodyError extends Error {
    readonly status: 400 | 413;
    constructor(message: string, status: 400 | 413);
}
/**
 * Wrap a raw Web server so every route it registers passes Connection's
 * authentication fence first.
 *
 * A missing or disposing Connection is an assembly failure, never an
 * invitation to expose local install state: it answers 503.
 *
 * @param server - the raw Web server service.
 * @param connection - late-bound accessor for the Connection service.
 * @returns a server-shaped object whose `register` fences every handler.
 */
export declare function authenticatedRoutes(server: WebRouteHost, connection: () => BrowserRequestGate | undefined): WebRouteHost;
/** Result of a method guard. */
export declare function requireMethod(req: IncomingMessage, res: ServerResponse, method: 'GET' | 'POST'): boolean;
/**
 * Wrap a route body so no outcome can escape it.
 *
 * @param label - diagnostics label, e.g. `catalog`.
 * @param logger - the plugin logger; unexpected failures are reported there.
 * @param handler - the route body; it may throw anything.
 * @returns the handler the Web server will call.
 */
export declare function createHandler(label: string, logger: HostLogger, handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
/**
 * Send a JSON body with an explicit cache policy.
 *
 * @param res - the response to own.
 * @param status - HTTP status.
 * @param body - JSON-serializable body.
 */
export declare function sendJson(res: ServerResponse, status: number, body: unknown): void;
/**
 * Send an error body, or end the response when the headers already went out.
 *
 * @param res - the response to own.
 * @param status - HTTP status.
 * @param body - the `MarketErrorBody` shape.
 */
export declare function sendError(res: ServerResponse, status: number, body: MarketErrorBody): void;
/**
 * Read and parse a JSON request body with a hard byte cap.
 *
 * The cap is enforced while draining, so an oversized body can be answered
 * with 413 without ever being buffered.
 *
 * @param req - the incoming request.
 * @param maxBytes - largest body accepted.
 * @returns the parsed object body.
 */
export declare function readJsonRequest(req: IncomingMessage, maxBytes?: number): Promise<Record<string, unknown>>;
/**
 * Read a JSON body, answering the request directly when it cannot be read.
 *
 * @param req - the incoming request.
 * @returns the parsed body, or `undefined` when a response was already sent.
 */
export declare function readJsonBodyOrReply(req: IncomingMessage, res: ServerResponse): Promise<Record<string, unknown> | undefined>;

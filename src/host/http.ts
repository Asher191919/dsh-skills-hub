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

import type { IncomingMessage, ServerResponse } from 'node:http'
import { MARKET_ERROR_CODES, type MarketErrorBody } from '../shared/market.ts'
import { errorResponseFor, type HostLogger } from './errors.ts'

/** The Web server route surface this plugin uses. */
export interface WebRouteHost {
  register(route: {
    kind: 'exact' | 'prefix'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

/** The authentication fence `ctx.connection` exposes to raw Web routes. */
export interface BrowserRequestGate {
  requestRejection(request: { headers: IncomingMessage['headers'] }): 401 | 403 | undefined
}

/** Every response this plugin produces is uncacheable. */
export const NO_STORE = 'no-store'

/** A rejected request body, carrying the status the route should answer with. */
export class RequestBodyError extends Error {
  readonly status: 400 | 413

  constructor(message: string, status: 400 | 413) {
    super(message)
    this.name = 'RequestBodyError'
    this.status = status
  }
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
export function authenticatedRoutes(
  server: WebRouteHost,
  connection: () => BrowserRequestGate | undefined,
): WebRouteHost {
  return {
    register(route) {
      return server.register({
        ...route,
        async handler(req, res) {
          const gate = connection()
          const rejection = gate === undefined ? 503 : gate.requestRejection(req)
          if (rejection !== undefined) {
            sendJson(res, rejection, {
              error: rejection === 503 ? 'authentication unavailable' : rejection === 401 ? 'unauthorized' : 'forbidden',
              code: MARKET_ERROR_CODES.badRequest,
            } satisfies MarketErrorBody)
            return
          }
          await route.handler(req, res)
        },
      })
    },
  }
}

/** Result of a method guard. */
export function requireMethod(
  req: IncomingMessage,
  res: ServerResponse,
  method: 'GET' | 'POST',
): boolean {
  if (req.method === method) return true
  res.writeHead(405, {
    allow: method,
    'content-type': 'application/json; charset=utf-8',
    'cache-control': NO_STORE,
  })
  res.end(JSON.stringify({ error: `method ${req.method ?? ''} is not allowed here`, code: MARKET_ERROR_CODES.badRequest }))
  return false
}

/**
 * Wrap a route body so no outcome can escape it.
 *
 * @param label - diagnostics label, e.g. `catalog`.
 * @param logger - the plugin logger; unexpected failures are reported there.
 * @param handler - the route body; it may throw anything.
 * @returns the handler the Web server will call.
 */
export function createHandler(
  label: string,
  logger: HostLogger,
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (error) {
      const { status, body } = errorResponseFor(error)
      if (status >= 500) {
        logger.warn(`skills-hub: ${label} route failed: ${error instanceof Error ? error.name : typeof error}`)
      }
      sendError(res, status, body)
    }
  }
}

/**
 * Send a JSON body with an explicit cache policy.
 *
 * @param res - the response to own.
 * @param status - HTTP status.
 * @param body - JSON-serializable body.
 */
export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  if (res.writableEnded) return
  const text = JSON.stringify(body)
  if (res.headersSent) {
    res.end(text)
    return
  }
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': NO_STORE,
  })
  res.end(text)
}

/**
 * Send an error body, or end the response when the headers already went out.
 *
 * @param res - the response to own.
 * @param status - HTTP status.
 * @param body - the `MarketErrorBody` shape.
 */
export function sendError(res: ServerResponse, status: number, body: MarketErrorBody): void {
  if (res.writableEnded) return
  sendJson(res, status, body)
}

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
export async function readJsonRequest(
  req: IncomingMessage,
  maxBytes = 64 * 1024,
): Promise<Record<string, unknown>> {
  const raw = await new Promise<string>((resolve, reject) => {
    let size = 0
    let settled = false
    const chunks: Buffer[] = []
    const finish = (error?: Error): void => {
      if (settled) return
      settled = true
      req.off('data', onData)
      req.off('end', onEnd)
      req.off('aborted', onAborted)
      req.off('error', onError)
      if (error !== undefined) {
        chunks.length = 0
        // The request may still be receiving data; discard it without buffering.
        req.once('error', () => undefined)
        req.resume()
        reject(error)
        return
      }
      resolve(Buffer.concat(chunks).toString('utf8'))
    }
    const onData = (chunk: Buffer | string): void => {
      const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      size += part.length
      if (size > maxBytes) finish(new RequestBodyError('the request body is too large', 413))
      else chunks.push(part)
    }
    const onEnd = (): void => finish()
    const onAborted = (): void => finish(new RequestBodyError('the request body was aborted', 400))
    const onError = (): void => finish(new RequestBodyError('the request body is invalid', 400))
    req.on('data', onData)
    req.once('end', onEnd)
    req.once('aborted', onAborted)
    req.once('error', onError)
  })

  let value: unknown
  try {
    value = raw.trim() === '' ? {} : JSON.parse(raw)
  } catch {
    throw new RequestBodyError('the request body is not valid JSON', 400)
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new RequestBodyError('the request body must be a JSON object', 400)
  }
  return value as Record<string, unknown>
}

/**
 * Read a JSON body, answering the request directly when it cannot be read.
 *
 * @param req - the incoming request.
 * @returns the parsed body, or `undefined` when a response was already sent.
 */
export async function readJsonBodyOrReply(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<Record<string, unknown> | undefined> {
  try {
    return await readJsonRequest(req)
  } catch (error) {
    sendError(res, error instanceof RequestBodyError ? error.status : 400, {
      error: error instanceof Error ? error.message : 'the request body is invalid',
      code: MARKET_ERROR_CODES.badRequest,
    })
    return undefined
  }
}

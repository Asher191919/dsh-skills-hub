/**
 * HTTP client for the skills-hub host half.
 *
 * Every route lives behind the browser auth fence, so requests carry
 * `credentials: 'same-origin'`; every request takes an `AbortSignal` so the
 * panel can supersede or unmount without leaking a socket. Responses are
 * validated field by field before they reach React: a malformed payload raises
 * {@link MarketApiError} with a stable code instead of crashing the panel on a
 * missing property three renders later.
 *
 * @module dsh-skills-hub/client/market-api
 */
import { MARKET_ERROR_CODES } from '../shared/market.ts';
import type { MarketFileContent, MarketInstallResponse, MarketQuery, MarketSkill, MarketSkillDetail, MarketSource, SourceStatusInfo } from '../shared/market.ts';
/** Mount point of the plugin's host routes. */
export declare const MARKET_BASE_PATH = "/plugins/dsh-skills-hub";
/** Stable codes the client adds on top of the shared {@link MARKET_ERROR_CODES}. */
export declare const CLIENT_ERROR_CODES: {
    /** The route answered 2xx with a body that does not match the wire contract. */
    readonly badResponse: "MARKET_CLIENT_BAD_RESPONSE";
    /** The route answered 2xx with a non-JSON body where JSON was required. */
    readonly malformedBody: "MARKET_CLIENT_MALFORMED_BODY";
    /** The route failed without a readable `{ error, code }` envelope. */
    readonly httpError: "MARKET_CLIENT_HTTP_ERROR";
};
/** Transport failure carrying the host's stable error code. */
export declare class MarketApiError extends Error {
    /** `MARKET_*` code from the error body, or one of {@link CLIENT_ERROR_CODES}. */
    readonly code: string;
    /** HTTP status; 0 when the request never produced a response. */
    readonly status: number;
    constructor(message: string, code: string, status: number);
}
/**
 * Validated catalog payload. `sources` stays partial on purpose: a registry the
 * host omitted renders no health row rather than a fabricated verdict.
 */
export interface MarketSnapshot {
    readonly items: readonly MarketSkill[];
    readonly nextCursor: string | null;
    readonly sources: Partial<Record<MarketSource, SourceStatusInfo>>;
    readonly total: number | undefined;
    readonly generatedAt: number;
}
/** One catalog page request. */
export type CatalogRequest = Pick<MarketQuery, 'q' | 'source' | 'security' | 'install' | 'cursor' | 'limit' | 'refresh'>;
/** Read one grid entry; `undefined` when a field the UI depends on is missing. */
export declare function readSkill(value: unknown): MarketSkill | undefined;
/** Validate a `GET /catalog` body. @returns the snapshot, or `undefined` when malformed. */
export declare function readCatalog(value: unknown): MarketSnapshot | undefined;
/** Validate a `GET /skill` body. @returns the detail, or `undefined` when malformed. */
export declare function readSkillDetail(value: unknown): MarketSkillDetail | undefined;
/** Validate a `GET /file` body. */
export declare function readFileContent(value: unknown): MarketFileContent | undefined;
/** Validate a `POST /install` body. */
export declare function readInstallResponse(value: unknown): MarketInstallResponse | undefined;
/** Read the `{ error, code }` envelope the host returns on failure. */
export declare function readErrorBody(value: unknown): {
    error: string;
    code: string;
} | undefined;
/** True when a rejection is the abort this panel itself requested. */
export declare function isAbortError(cause: unknown): boolean;
/** Human-readable text of any thrown value. */
export declare function errorMessage(cause: unknown): string;
/** `GET /catalog` — one page of merged registry results. */
export declare function fetchCatalog(request: CatalogRequest, signal: AbortSignal): Promise<MarketSnapshot>;
/** `GET /skill` — one skill with its file list and rendered description. */
export declare function fetchSkillDetail(id: string, signal: AbortSignal): Promise<MarketSkillDetail>;
/** `GET /file` — one file body for the preview pane. */
export declare function fetchFile(id: string, path: string, signal: AbortSignal): Promise<MarketFileContent>;
/** `POST /install` — write one skill into the skills root. */
export declare function installSkill(id: string, version: string | undefined, signal: AbortSignal): Promise<MarketInstallResponse>;
/** `POST /uninstall` — remove one hub-managed skill. */
export declare function uninstallSkill(id: string, signal: AbortSignal): Promise<void>;
/** `POST /refresh` — drop the host cache and re-read every upstream. */
export declare function refreshMarket(signal: AbortSignal): Promise<void>;
/** Re-export so components branch on codes without reaching into the shared layer. */
export { MARKET_ERROR_CODES };

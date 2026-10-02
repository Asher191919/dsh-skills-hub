/**
 * Skills Hub for DeepSeek Harness — host half.
 *
 * A function plugin that aggregates the ClawHub and SkillHub skill registries
 * behind one catalog API on the host's Web server, installs skills into the
 * DSH skill-discovery roots, and exposes the marketplace to the model through
 * two tools.
 *
 * Composition notes:
 *  - `inject` is empty. Every dependency (`tools`, `skills`, `webServer`,
 *    `workspaceRegistry`, `connection`) is optional and late-bound, so the
 *    plugin is fully functional in a headless profile: no Web server means
 *    tools only, no tools registry means an HTTP-only plugin.
 *  - Every route, tool registration and skill-provider registration is an
 *    effect owned by this fiber, so an HMR reload leaves nothing behind.
 *  - User data never resolves from `process.cwd()`: the DSH home comes from
 *    `$DSH_HOME` (else `~/.dsh`) and the workspace comes from the workspace
 *    registry service.
 *
 * Installation (bundle): `dsh plugin --profile <name> add @nanmicoder/dsh-skills-hub`.
 *
 * @module @nanmicoder/dsh-skills-hub
 */
import z from '@deepseek-ai/schemastery';
import { SECURITY_STATUSES, } from "./shared/market.js";
import { createMarketCache, createSourceHealth } from "./host/cache.js";
import { badRequest } from "./host/errors.js";
import { authenticatedRoutes, createHandler, readJsonBodyOrReply, requireMethod, sendJson, } from "./host/http.js";
import { createInstallRegistry, createInstallState, createSkillRootResolver, } from "./host/install-state.js";
import { createInstallService } from "./host/install-service.js";
import { clampLimit, createMarketService } from "./host/market-service.js";
import { installRegistryFile, resolveDshHome } from "./host/paths.js";
import { createProviderFetch } from "./host/provider-fetch.js";
import { createProviderSet } from "./host/providers/index.js";
import { createSkillsBridge } from "./host/skills-bridge.js";
import { createSkillMarketTools } from "./host/tools.js";
export const name = 'skills-hub';
/**
 * No required dependency: every service this plugin talks to is optional and
 * resolved lazily, so a minimal composition never blocks the plugin's fiber.
 */
export const inject = [];
/** Web-server service key candidates, newest first. */
const WEB_SERVER_KEYS = ['webServer', 'httpServer'];
/** Workspace registry service key candidates, newest first. */
const WORKSPACE_KEYS = ['workspaceRegistry', 'workspace'];
/** Route prefix; the client half calls exactly these paths. */
const ROUTE_BASE = '/plugins/dsh-skills-hub';
/** Longest accepted free-text query. */
const MAX_QUERY_LENGTH = 200;
/** Longest accepted opaque cursor. */
const MAX_CURSOR_LENGTH = 4096;
export const Config = z.object({
    installScope: z.union([z.const('user'), z.const('project')]).default('user'),
    clawhubBase: z.string().default('https://clawhub.ai'),
    skillhubBase: z.string().default('https://api.skillhub.cn'),
    cacheTtlMs: z.natural().default(300_000),
    timeoutMs: z.natural().default(15_000),
});
/**
 * Install the plugin.
 *
 * @param ctx - the plugin's context; owns every effect registered here.
 * @param config - the validated plugin configuration.
 */
export function apply(ctx, config) {
    const logger = { warn: (message) => ctx.logger.warn(message) };
    const dshHome = resolveDshHome();
    const cache = createMarketCache();
    const health = createSourceHealth();
    const fetcher = createProviderFetch({ timeoutMs: config.timeoutMs, sourceHealth: health });
    const providers = createProviderSet({
        clawhubBase: config.clawhubBase,
        skillhubBase: config.skillhubBase,
        fetcher,
    });
    const registry = createInstallRegistry({ file: installRegistryFile(dshHome), logger });
    const roots = createSkillRootResolver({
        installScope: config.installScope,
        dshHome,
        workspace: (cwd) => resolveWorkspace(ctx, cwd),
    });
    const installState = createInstallState({ registry, roots });
    const bridge = createSkillsBridge({ roots, logger });
    const market = createMarketService({
        providers,
        cache,
        health,
        cacheTtlMs: config.cacheTtlMs,
        installState,
        logger,
    });
    const installs = createInstallService({
        providers,
        market,
        registry,
        roots,
        logger,
        // A hub install changes what the skill catalog should advertise.
        onChanged: () => bridge.invalidate(),
    });
    // ── Tools (optional service) ──────────────────────────────────────────────
    // `ctx.inject` mounts a child fiber that activates when the registry binds,
    // which is what makes this work under the Loader's concurrent activation
    // without polling and without a hard dependency on `tools`.
    ctx.inject(['tools'], (toolCtx) => {
        const tools = toolCtx.get('tools');
        if (tools === undefined)
            return;
        for (const definition of createSkillMarketTools({ market, installs })) {
            toolCtx.effect(() => tools.register(definition), `skills-hub: ${definition.name} tool`);
        }
    });
    // ── Skill catalog bridge (optional service) ───────────────────────────────
    // Hub-installed skills then appear in the DSH skill catalog even in a
    // composition that does not mount the filesystem skill provider.
    ctx.inject(['skills'], (skillCtx) => {
        const skills = skillCtx.get('skills');
        if (skills === undefined)
            return;
        skillCtx.effect(() => skills.registerProvider(bridge.create), 'skills-hub: catalog provider');
    });
    // ── Web routes (optional service, lazily bound) ───────────────────────────
    // The Web server may bind after this plugin under concurrent activation, so
    // the surface is registered on the first `internal/service` event that names
    // it. The guard keeps the registration idempotent.
    let webRegistered = false;
    const registerWebSurface = () => {
        if (webRegistered)
            return;
        const rawServer = (ctx.get(WEB_SERVER_KEYS[0]) ?? ctx.get(WEB_SERVER_KEYS[1]));
        if (rawServer === undefined)
            return;
        webRegistered = true;
        // Raw Web routes do not inherit Connection's authentication fence.
        const server = authenticatedRoutes(rawServer, () => ctx.get('connection'));
        ctx.effect(() => server.register({
            kind: 'exact',
            path: `${ROUTE_BASE}/catalog`,
            handler: createHandler('catalog', logger, async (req, res) => {
                if (!requireMethod(req, res, 'GET'))
                    return;
                const params = new URL(req.url ?? '/', 'http://localhost').searchParams;
                const question = params.get('q')?.trim() ?? '';
                if (question.length > MAX_QUERY_LENGTH) {
                    throw badRequest(`the query is longer than ${String(MAX_QUERY_LENGTH)} characters`);
                }
                const cursor = params.get('cursor') ?? '';
                if (cursor.length > MAX_CURSOR_LENGTH)
                    throw badRequest('the cursor is not a valid page cursor');
                const refresh = params.get('refresh');
                sendJson(res, 200, await market.list({
                    ...(question === '' ? {} : { q: question }),
                    source: parseSourceFilter(params.get('source')),
                    security: parseSecurityFilter(params.get('security')),
                    install: parseInstallFilter(params.get('install')),
                    ...(cursor === '' ? {} : { cursor }),
                    limit: clampLimit(parseLimit(params.get('limit'))),
                    refresh: refresh === 'true' || refresh === '1',
                }));
            }),
        }), 'skills-hub: catalog route');
        ctx.effect(() => server.register({
            kind: 'exact',
            path: `${ROUTE_BASE}/skill`,
            handler: createHandler('skill', logger, async (req, res) => {
                if (!requireMethod(req, res, 'GET'))
                    return;
                const id = new URL(req.url ?? '/', 'http://localhost').searchParams.get('id') ?? '';
                sendJson(res, 200, await market.detail(id));
            }),
        }), 'skills-hub: skill route');
        ctx.effect(() => server.register({
            kind: 'exact',
            path: `${ROUTE_BASE}/file`,
            handler: createHandler('file', logger, async (req, res) => {
                if (!requireMethod(req, res, 'GET'))
                    return;
                const params = new URL(req.url ?? '/', 'http://localhost').searchParams;
                sendJson(res, 200, await market.file(params.get('id') ?? '', params.get('path') ?? ''));
            }),
        }), 'skills-hub: file route');
        ctx.effect(() => server.register({
            kind: 'exact',
            path: `${ROUTE_BASE}/installed`,
            handler: createHandler('installed', logger, async (req, res) => {
                if (!requireMethod(req, res, 'GET'))
                    return;
                sendJson(res, 200, await installState.installed());
            }),
        }), 'skills-hub: installed route');
        ctx.effect(() => server.register({
            kind: 'exact',
            path: `${ROUTE_BASE}/install`,
            handler: createHandler('install', logger, async (req, res) => {
                if (!requireMethod(req, res, 'POST'))
                    return;
                const body = await readJsonBodyOrReply(req, res);
                if (body === undefined)
                    return;
                const id = typeof body['id'] === 'string' ? body['id'] : '';
                const version = typeof body['version'] === 'string' && body['version'] !== '' ? body['version'] : undefined;
                sendJson(res, 200, await installs.install(id, version === undefined ? {} : { version }));
            }),
        }), 'skills-hub: install route');
        ctx.effect(() => server.register({
            kind: 'exact',
            path: `${ROUTE_BASE}/uninstall`,
            handler: createHandler('uninstall', logger, async (req, res) => {
                if (!requireMethod(req, res, 'POST'))
                    return;
                const body = await readJsonBodyOrReply(req, res);
                if (body === undefined)
                    return;
                const id = typeof body['id'] === 'string' ? body['id'] : '';
                sendJson(res, 200, await installs.uninstall(id));
            }),
        }), 'skills-hub: uninstall route');
        ctx.effect(() => server.register({
            kind: 'exact',
            path: `${ROUTE_BASE}/refresh`,
            handler: createHandler('refresh', logger, async (req, res) => {
                if (!requireMethod(req, res, 'POST'))
                    return;
                market.refresh();
                sendJson(res, 200, {
                    ok: true,
                    refreshedAt: Date.now(),
                    sources: market.sources(),
                });
            }),
        }), 'skills-hub: refresh route');
    };
    registerWebSurface();
    ctx.on('internal/service', (serviceName) => {
        if (WEB_SERVER_KEYS.includes(serviceName))
            registerWebSurface();
    });
}
/** Resolve the workspace a project-scoped install targets. */
function resolveWorkspace(ctx, cwd) {
    if (typeof cwd === 'string' && cwd !== '')
        return cwd;
    const registry = (ctx.get(WORKSPACE_KEYS[0]) ?? ctx.get(WORKSPACE_KEYS[1]));
    if (registry === undefined)
        return undefined;
    try {
        const first = registry.list()[0];
        const path = first?.path;
        return typeof path === 'string' && path !== '' ? path : undefined;
    }
    catch {
        return undefined;
    }
}
/** Parse the `source` filter, refusing anything the contract does not define. */
function parseSourceFilter(raw) {
    if (raw === null || raw === '' || raw === 'all')
        return 'all';
    if (raw === 'clawhub' || raw === 'skillhub')
        return raw;
    throw badRequest(`invalid source filter: ${raw}`);
}
/** Parse the `security` filter. */
function parseSecurityFilter(raw) {
    if (raw === null || raw === '' || raw === 'all')
        return 'all';
    if (SECURITY_STATUSES.includes(raw))
        return raw;
    throw badRequest(`invalid security filter: ${raw}`);
}
/** Parse the `install` filter. */
function parseInstallFilter(raw) {
    if (raw === null || raw === '' || raw === 'all')
        return 'all';
    if (raw === 'installed' || raw === 'installable')
        return raw;
    throw badRequest(`invalid install filter: ${raw}`);
}
/** Parse the `limit` parameter; a non-numeric value is refused, not defaulted. */
function parseLimit(raw) {
    if (raw === null || raw === '')
        return undefined;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 1)
        throw badRequest(`invalid limit: ${raw}`);
    return parsed;
}

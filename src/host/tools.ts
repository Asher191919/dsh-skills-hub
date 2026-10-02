/**
 * Skills Hub — the two agent-facing tools.
 *
 * They are thin: every rule (validation, traversal defense, limits, atomic
 * publish) lives in the services, so a model cannot reach a code path a route
 * cannot. The tools exist to make the marketplace reachable without the GUI.
 *
 * @module dsh-skills-hub/host/tools
 */

import { defineTool, type ToolDefinition } from '@deepseek-ai/dsh-tools'
import type { MarketSourceFilter } from '../shared/market.ts'
import type { InstallService } from './install-service.ts'
import type { MarketService } from './market-service.ts'

/** Tool names, exported so the plugin can report them without duplicating strings. */
export const SKILL_MARKET_SEARCH = 'skill_market_search'
export const SKILL_MARKET_INSTALL = 'skill_market_install'

/** Default number of search results handed to the model. */
const DEFAULT_SEARCH_LIMIT = 10

/** Services the tools drive. */
export interface SkillMarketToolServices {
  readonly market: MarketService
  readonly installs: InstallService
}

/**
 * Build both tool definitions.
 *
 * @param services - the catalog and install facades, owned by the plugin fiber.
 * @returns the definitions, ready for `ctx.tools.register`.
 */
export function createSkillMarketTools(services: SkillMarketToolServices): ToolDefinition[] {
  const search = defineTool({
    name: SKILL_MARKET_SEARCH,
    description: [
      'Search the public agent-skill registries (ClawHub and SkillHub) for a skill to install.',
      'Call this when the user asks to find, browse or discover a skill that is not already available locally, before claiming no such skill exists.',
      'Prerequisites: none; this reads public registries over the network and never writes to disk.',
      'Failure semantics: a registry that is unreachable does not fail the call — it is reported per registry in `sources` (ok, cached, degraded or failed), and results from the reachable registry are still returned. An empty `items` list means nothing matched, not that the request failed.',
      'Side effects: none. The page is cached in the host for the configured catalog TTL.',
      'Use the returned `id` (of the form `source:slug`) with skill_market_install; never construct an id from a name.',
    ].join(' '),
    parameters: {
      query: {
        type: 'string',
        required: true,
        description: 'What to look for, e.g. "pdf form filling" or "excel". Matched against skill names and summaries upstream.',
      },
      source: {
        type: 'string',
        enum: ['all', 'clawhub', 'skillhub'],
        description: 'Restrict the search to one registry. Defaults to "all".',
      },
      limit: {
        type: 'integer',
        description: `Maximum results returned, 1-100. Defaults to ${String(DEFAULT_SEARCH_LIMIT)}.`,
        default: DEFAULT_SEARCH_LIMIT,
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          query: { type: 'string', required: true },
          count: { type: 'integer', required: true },
          items: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: { type: 'string', required: true },
                source: { type: 'string', required: true },
                slug: { type: 'string', required: true },
                name: { type: 'string', required: true },
                summary: { type: 'string', required: true },
                downloads: { type: 'integer', required: true },
                security: { type: 'string', required: true },
                installState: { type: 'string', required: true },
              },
            },
          },
          sources: {
            type: 'object',
            required: true,
            additionalProperties: false,
            properties: {
              clawhub: { type: 'string', required: true },
              skillhub: { type: 'string', required: true },
            },
          },
          notes: { type: 'string' },
        },
      },
      render(_args, value) {
        const lines = [
          `${String(value.count)} result(s) for ${JSON.stringify(value.query)}`
          + ` — clawhub: ${value.sources.clawhub}, skillhub: ${value.sources.skillhub}`,
        ]
        for (const item of value.items) {
          lines.push(
            `- ${item.id} — ${item.name} [${item.installState}, ${item.security}, ${String(item.downloads)} downloads]`
            + (item.summary === '' ? '' : `: ${item.summary}`),
          )
        }
        if (value.count === 0) lines.push('No skill matched. Try a broader query or source="all".')
        if (value.notes !== undefined) lines.push(value.notes)
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(args, exec) {
      const limit = Math.min(100, Math.max(1, args.limit ?? DEFAULT_SEARCH_LIMIT))
      const source: MarketSourceFilter = args.source ?? 'all'
      const page = await services.market.list({ q: args.query, source, limit }, exec.signal)
      const failed = (['clawhub', 'skillhub'] as const)
        .filter((key) => page.sources[key].status === 'failed' || page.sources[key].status === 'degraded')
      return {
        query: args.query,
        count: page.items.length,
        items: page.items.map((item) => ({
          id: item.id,
          source: item.source,
          slug: item.slug,
          name: item.name,
          summary: item.summary,
          downloads: item.stats.downloads,
          security: item.securityStatus,
          installState: item.installState,
        })),
        sources: {
          clawhub: page.sources.clawhub.status,
          skillhub: page.sources.skillhub.status,
        },
        ...(failed.length === 0
          ? {}
          : { notes: `Degraded registries this call: ${failed.join(', ')}. Results may be incomplete.` }),
      }
    },
  })

  const install = defineTool({
    name: SKILL_MARKET_INSTALL,
    description: [
      'Install one skill from ClawHub or SkillHub into the local DSH skill directories.',
      'Call this only with an `id` returned by skill_market_search, and only when the user asked for that skill to be installed.',
      'Prerequisites: the id must be exactly `source:slug` (for example "clawhub:pdf-tools"); the skill must not already be installed.',
      'Failure semantics: this throws instead of returning a partial result. It fails when the id is malformed, when the skill is not installable (no SKILL.md, too many files, a file or the whole skill over the size limit), when a file path from the registry is unsafe, when a checksum does not match, when the skill is already installed, when an install of the same skill is already running, and when the target directory exists but was not created by this hub (the hub never overwrites a skill it does not own).',
      'Side effects: downloads every file, writes them atomically into the DSH skill root, records the install for the installed view, and refreshes the skill catalog so the new skill is immediately available.',
    ].join(' '),
    parameters: {
      id: {
        type: 'string',
        required: true,
        description: 'The skill id from skill_market_search, of the form "source:slug".',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          id: { type: 'string', required: true },
          dirName: { type: 'string', required: true },
          path: { type: 'string', required: true },
          version: { type: 'string' },
          fileCount: { type: 'integer', required: true },
          totalSize: { type: 'integer', required: true },
          message: { type: 'string', required: true },
        },
      },
      render(_args, value) {
        const version = value.version === undefined ? '' : ` (version ${value.version})`
        return [{
          type: 'text',
          text: `installed ${value.id}${version} as "${value.dirName}"`
            + ` — ${String(value.fileCount)} file(s), ${String(value.totalSize)} bytes, at ${value.path}`,
        }]
      },
    },
    async execute(args, exec) {
      const cwd = agentCwd(exec)
      const result = await services.installs.install(args.id, {
        ...(cwd === undefined ? {} : { cwd }),
        // Forward the caller's cancellation: a cancelled call stops downloading
        // and leaves no half-written skill behind.
        signal: exec.signal,
      })
      return {
        ok: true,
        id: result.id,
        dirName: result.dirName,
        path: result.path,
        ...(result.version === undefined ? {} : { version: result.version }),
        fileCount: result.fileCount,
        totalSize: result.totalSize,
        message: `installed into ${result.path}`,
      }
    },
  })

  return [search, install]
}

/**
 * The calling session's workspace, read structurally from the tool execution
 * context. Returns `undefined` when the agent is absent, in which case the
 * install service falls back to the workspace registry.
 */
function agentCwd(exec: { readonly agent?: unknown }): string | undefined {
  const agent = exec.agent as { session?: { header?: { cwd?: unknown } } } | undefined
  const cwd = agent?.session?.header?.cwd
  return typeof cwd === 'string' && cwd !== '' ? cwd : undefined
}

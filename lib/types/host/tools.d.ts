/**
 * Skills Hub — the two agent-facing tools.
 *
 * They are thin: every rule (validation, traversal defense, limits, atomic
 * publish) lives in the services, so a model cannot reach a code path a route
 * cannot. The tools exist to make the marketplace reachable without the GUI.
 *
 * @module dsh-skills-hub/host/tools
 */
import { type ToolDefinition } from '@deepseek-ai/dsh-tools';
import type { InstallService } from './install-service.ts';
import type { MarketService } from './market-service.ts';
/** Tool names, exported so the plugin can report them without duplicating strings. */
export declare const SKILL_MARKET_SEARCH = "skill_market_search";
export declare const SKILL_MARKET_INSTALL = "skill_market_install";
/** Services the tools drive. */
export interface SkillMarketToolServices {
    readonly market: MarketService;
    readonly installs: InstallService;
}
/**
 * Build both tool definitions.
 *
 * @param services - the catalog and install facades, owned by the plugin fiber.
 * @returns the definitions, ready for `ctx.tools.register`.
 */
export declare function createSkillMarketTools(services: SkillMarketToolServices): ToolDefinition[];

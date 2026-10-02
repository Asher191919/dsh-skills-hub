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
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
export declare const name = "skills-hub";
/**
 * No required dependency: every service this plugin talks to is optional and
 * resolved lazily, so a minimal composition never blocks the plugin's fiber.
 */
export declare const inject: string[];
/** Plugin configuration; every key has a schema default. */
export interface Config {
    /** Where an install lands: the user's DSH home, or this workspace. */
    installScope: 'user' | 'project';
    /** ClawHub registry base; point it at a mirror or a fixture to test. */
    clawhubBase: string;
    /** SkillHub registry base; point it at a mirror or a fixture to test. */
    skillhubBase: string;
    /** Catalog cache lifetime in milliseconds. */
    cacheTtlMs: number;
    /** Upstream request timeout in milliseconds. */
    timeoutMs: number;
}
export declare const Config: z<Config>;
/**
 * Install the plugin.
 *
 * @param ctx - the plugin's context; owns every effect registered here.
 * @param config - the validated plugin configuration.
 */
export declare function apply(ctx: Context, config: Config): void;

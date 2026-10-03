/**
 * Browser half of `@asher191919/dsh-skills-hub`.
 *
 * Two contributions, both through `ctx.slots.inject` (which waits for the owning
 * plugin's slot declaration and re-runs on every re-declaration, so HMR and load
 * order are handled by the framework rather than by a probe loop):
 *
 *  - `sidebar.panellist` — the rail glyph. The list `id` addresses the matching
 *    main panel key; the sidebar owns the button, its label and `selectPanel`.
 *  - `main` — the 「技能市场」 page under the same key.
 *
 * Every contribution — both dictionaries and both slot registrations — is
 * disposed with this fiber, so unloading the plugin (or hot-reloading it) leaves
 * no orphaned row, no orphaned panel and no stale copy behind.
 *
 * @module dsh-skills-hub/client
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
/** Services this plugin needs before `apply` runs. */
export declare const inject: string[];
/**
 * Identity shared by the sidebar row and the main panel it selects. The
 * sidebar's `selectPanel(id)` and the `main` keyed slot are addressed by this
 * one string; changing it here moves both together.
 */
export declare const PANEL_ID = "skills-hub";
/**
 * Register the marketplace panel.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;

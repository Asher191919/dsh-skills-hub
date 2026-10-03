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
import { LOCALE_NAMESPACE, en, zh } from "./locales.js";
import { MarketPanel } from "./MarketPanel.js";
import { SkillsHubRailIcon } from "./RailIcon.js";
/** Services this plugin needs before `apply` runs. */
export const inject = ['slots', 'locale', 'layout'];
/**
 * Identity shared by the sidebar row and the main panel it selects. The
 * sidebar's `selectPanel(id)` and the `main` keyed slot are addressed by this
 * one string; changing it here moves both together.
 */
export const PANEL_ID = 'skills-hub';
/** Sort position of the rail row among the other global panels. */
const PANEL_ORDER = 60;
/**
 * Register the marketplace panel.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    const t = ctx.locale.bind(LOCALE_NAMESPACE);
    ctx.effect(() => ctx.locale.register(LOCALE_NAMESPACE, { zh, en }), 'skills-hub: dictionaries');
    ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: PANEL_ORDER,
        // A thunk, so the row's title and accessible name follow a locale switch
        // without re-registering the row.
        label: () => t('panel.title'),
        locale: LOCALE_NAMESPACE,
    }, SkillsHubRailIcon)), 'skills-hub: sidebar entry');
    ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: PANEL_ID,
        locale: LOCALE_NAMESPACE,
    }, MarketPanel)), 'skills-hub: main panel');
}

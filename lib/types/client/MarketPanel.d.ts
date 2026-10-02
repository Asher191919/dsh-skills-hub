/**
 * 「技能市场」 — the main-slot page.
 *
 * Structure, top to bottom: a header row, the dismissible third-party advisory,
 * the search + filter toolbar, the per-registry health line, the count line, and
 * the results region (card grid, or the detail surface when a card is open). The
 * band above the results is fixed; the results scroll under it, so a long file
 * list never pushes the filters off screen.
 *
 * @module dsh-skills-hub/client/MarketPanel
 */
import type { SkillsHubTranslate } from './locales.ts';
/**
 * Render the marketplace page.
 * @param props - the framework-injected translate seat.
 * @returns the panel.
 */
export declare function MarketPanel({ t }: {
    readonly t: SkillsHubTranslate;
}): import("react").JSX.Element;

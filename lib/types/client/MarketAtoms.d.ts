/**
 * Small presentational atoms shared by the grid, the detail surface and the
 * states: the deterministic skill avatar, the two status chips, the
 * per-registry health line, and the loading skeleton card.
 *
 * @module dsh-skills-hub/client/MarketAtoms
 */
import type { InstallState, MarketSkill, MarketSource, NotInstallableReason, SecurityStatus, SourceStatusInfo } from '../shared/market.ts';
import type { SkillsHubTranslate } from './locales.ts';
/**
 * Skill icon with a deterministic letter-avatar fallback.
 *
 * The fallback's colour is a stable function of the skill id, so one skill keeps
 * the same identity tile across the grid, the detail header and a re-render.
 * An upstream icon that fails to load degrades to that same fallback instead of
 * leaving a broken image in the grid.
 */
export declare function SkillAvatar({ skill, size }: {
    readonly skill: Pick<MarketSkill, 'id' | 'name' | 'iconUrl'>;
    readonly size?: number;
}): import("react").JSX.Element;
/**
 * Scan verdict of one skill version.
 * @param short - the card chip: a short label so the tag row stays on one line;
 *   the tooltip carries the full explanation either way.
 */
export declare function SecurityBadge({ t, status, short }: {
    readonly t: SkillsHubTranslate;
    readonly status: SecurityStatus;
    readonly short?: boolean;
}): import("react").JSX.Element;
/**
 * Whether the skill can be written to disk right now.
 * @param reason - the host's refusal code, rendered as the chip's tooltip.
 */
export declare function InstallStateBadge({ t, state, reason }: {
    readonly t: SkillsHubTranslate;
    readonly state: InstallState;
    readonly reason?: NotInstallableReason | undefined;
}): import("react").JSX.Element;
/**
 * Per-registry reachability for the current view.
 *
 * A half-broken upstream has to be legible: without this line a failing registry
 * is indistinguishable from a registry that simply has no matching skills, and
 * the grid would look confidently empty.
 */
export declare function SourceHealthLine({ t, sources }: {
    readonly t: SkillsHubTranslate;
    readonly sources: Partial<Record<MarketSource, SourceStatusInfo>>;
}): import("react").JSX.Element | null;
/**
 * One card-shaped placeholder; the panel's own grid positions it. Purely
 * decorative — the loading announcement belongs to the region that owns the
 * request, so this stays out of the accessibility tree.
 */
export declare function SkeletonCard({ index }: {
    readonly index: number;
}): import("react").JSX.Element;

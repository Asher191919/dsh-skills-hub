/**
 * One catalog card, ported from the reference marketplace's `SkillCard`.
 *
 * The anatomy is fixed top to bottom — identity, summary, chip row, footer — and
 * the footer is pinned with `margin-top: auto`, so a grid row lines up even when
 * one card has no tags; the chip row is clipped to a single line for the same
 * reason. The open affordance is one stretched `<button>` (never a clickable
 * div), and the install button sits above it so installing does not also open.
 *
 * @module dsh-skills-hub/client/SkillCard
 */
import type { MarketSkill } from '../shared/market.ts';
import type { SkillsHubTranslate } from './locales.ts';
/** Properties of one grid card. */
export interface SkillCardProps {
    readonly t: SkillsHubTranslate;
    readonly skill: MarketSkill;
    /** An install for this id is in flight. */
    readonly installing: boolean;
    readonly onOpen: (id: string) => void;
    readonly onInstall: (id: string, version: string | undefined) => void;
}
/**
 * Render one skill as a grid card.
 * @param props - card inputs.
 * @returns the card element.
 */
export declare function SkillCard({ t, skill, installing, onOpen, onInstall }: SkillCardProps): import("react").JSX.Element;

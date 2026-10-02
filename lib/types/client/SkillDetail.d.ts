/**
 * Detail surface of one skill: it replaces the grid inside the panel's scroll
 * region and carries everything the card cannot — the rendered `SKILL.md` body,
 * the file list with a preview pane, the security reports, and the changelog.
 *
 * The description is deliberately rendered as preformatted plain text: the
 * client bundle may not add a markdown dependency, and `dangerouslySetInnerHTML`
 * on third-party content is not an option.
 *
 * @module dsh-skills-hub/client/SkillDetail
 */
import type { DetailFileState, DetailState, DetailTab } from './use-marketplace.ts';
import type { SkillsHubTranslate } from './locales.ts';
/** Properties of the detail surface. */
export interface SkillDetailProps {
    readonly t: SkillsHubTranslate;
    readonly detail: DetailState | undefined;
    readonly tab: DetailTab;
    readonly onTab: (tab: DetailTab) => void;
    readonly file: DetailFileState | undefined;
    readonly filePath: string | null;
    readonly onOpenFile: (path: string) => void;
    readonly onCloseFile: () => void;
    readonly installing: boolean;
    readonly uninstalling: boolean;
    readonly onInstall: (id: string, version: string | undefined) => void;
    readonly onUninstall: (id: string, name: string) => void;
    readonly onBack: () => void;
    /** Re-read the open skill after a failed detail load. */
    readonly onRetry: () => void;
}
/**
 * Render the open skill.
 * @param props - the detail state plus the panel's actions.
 * @returns the detail surface.
 */
export declare function SkillDetail(props: SkillDetailProps): import("react").JSX.Element;

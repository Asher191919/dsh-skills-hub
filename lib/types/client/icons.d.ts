/**
 * Inline stroke icons for the marketplace panel.
 *
 * Hand-drawn on a 24×24 grid instead of pulled from an icon dependency: the
 * client bundle may only answer the platform module table, and every icon here
 * inherits `currentColor` so it follows the theme tokens of its container.
 * All of them are decorative — the control that carries them owns the
 * accessible name.
 *
 * @module dsh-skills-hub/client/icons
 */
/** Shared shape of every icon in this module. */
export interface IconProps {
    /** Square edge in px; the SVG scales as a whole. */
    readonly size?: number;
    /** Stroke weight on the 24×24 grid. */
    readonly strokeWidth?: number;
    readonly className?: string;
}
/** Storefront — the panel's identity mark. */
export declare function StoreIcon(props: IconProps): import("react").JSX.Element;
/** Magnifier — the search field's leading glyph. */
export declare function SearchIcon(props: IconProps): import("react").JSX.Element;
/** Circular arrow — refresh. */
export declare function RefreshIcon(props: IconProps): import("react").JSX.Element;
/** Cross — dismiss. */
export declare function CloseIcon(props: IconProps): import("react").JSX.Element;
/** Left arrow — the detail surface's back control. */
export declare function ArrowLeftIcon(props: IconProps): import("react").JSX.Element;
/** Down arrow into a tray — install and download counts. */
export declare function DownloadIcon(props: IconProps): import("react").JSX.Element;
/** Star — star counts. */
export declare function StarIcon(props: IconProps): import("react").JSX.Element;
/** Shield with an exclamation — a flagged scan. */
export declare function ShieldAlertIcon(props: IconProps): import("react").JSX.Element;
/** Shield with a check — a scanned, clean skill. */
export declare function ShieldCheckIcon(props: IconProps): import("react").JSX.Element;
/** Shield with a question mark — never scanned. */
export declare function ShieldQuestionIcon(props: IconProps): import("react").JSX.Element;
/** Rosette with a check — a registry-verified publisher. */
export declare function BadgeCheckIcon(props: IconProps): import("react").JSX.Element;
/** Circle with a check — installed. */
export declare function CheckCircleIcon(props: IconProps): import("react").JSX.Element;
/** Struck-through circle — not installable. */
export declare function CircleSlashIcon(props: IconProps): import("react").JSX.Element;
/** Document — the file list and the overview tab. */
export declare function FileTextIcon(props: IconProps): import("react").JSX.Element;
/** Triangle with an exclamation — a region-level failure. */
export declare function AlertTriangleIcon(props: IconProps): import("react").JSX.Element;
/** Box — the "nothing here" mark. */
export declare function PackageIcon(props: IconProps): import("react").JSX.Element;
/** Chevron — the select controls' trailing affordance. */
export declare function ChevronDownIcon(props: IconProps): import("react").JSX.Element;
/** External link — an upstream report or page. */
export declare function ExternalLinkIcon(props: IconProps): import("react").JSX.Element;

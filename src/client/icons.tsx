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

import type { ReactNode } from 'react'

/** Shared shape of every icon in this module. */
export interface IconProps {
  /** Square edge in px; the SVG scales as a whole. */
  readonly size?: number
  /** Stroke weight on the 24×24 grid. */
  readonly strokeWidth?: number
  readonly className?: string
}

function Svg({ size = 16, strokeWidth = 1.6, className, children }: IconProps & { readonly children: ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

/** Storefront — the panel's identity mark. */
export function StoreIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 9.5 5.5 4h13l2 5.5" />
      <path d="M4.5 9.5h15V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19Z" />
      <path d="M9.5 13.5h5" />
    </Svg>
  )
}

/** Magnifier — the search field's leading glyph. */
export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m15.8 15.8 4.2 4.2" />
    </Svg>
  )
}

/** Circular arrow — refresh. */
export function RefreshIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
      <path d="M20.5 4v5h-5" />
    </Svg>
  )
}

/** Cross — dismiss. */
export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6.5 6.5 11 11" />
      <path d="m17.5 6.5-11 11" />
    </Svg>
  )
}

/** Left arrow — the detail surface's back control. */
export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19.5 12h-15" />
      <path d="m10.5 18-6-6 6-6" />
    </Svg>
  )
}

/** Down arrow into a tray — install and download counts. */
export function DownloadIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4v10.5" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M5 19.5h14" />
    </Svg>
  )
}

/** Star — star counts. */
export function StarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m12 4.2 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.9l5.4-.8Z" />
    </Svg>
  )
}

const SHIELD = 'M12 3.4 5.2 6.1v5.3c0 4.3 2.8 7.7 6.8 9.2 4-1.5 6.8-4.9 6.8-9.2V6.1Z'

/** Shield with an exclamation — a flagged scan. */
export function ShieldAlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d={SHIELD} />
      <path d="M12 9v4.2" />
      <path d="M12 16.4h.01" />
    </Svg>
  )
}

/** Shield with a check — a scanned, clean skill. */
export function ShieldCheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d={SHIELD} />
      <path d="m9.2 12.1 2.1 2.1 4-4.4" />
    </Svg>
  )
}

/** Shield with a question mark — never scanned. */
export function ShieldQuestionIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d={SHIELD} />
      <path d="M10.1 10.3a1.9 1.9 0 1 1 2.5 1.8c-.6.2-.9.7-.9 1.3v.3" />
      <path d="M11.7 16.4h.01" />
    </Svg>
  )
}

/** Rosette with a check — a registry-verified publisher. */
export function BadgeCheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.2 9.9 5.1 7.2 4.9 6.4 7.5 4.2 9.2l1 2.6-1 2.6 2.2 1.7.8 2.6 2.7-.2 2.1 1.9 2.1-1.9 2.7.2.8-2.6 2.2-1.7-1-2.6 1-2.6-2.2-1.7-.8-2.6-2.7.2Z" />
      <path d="m9.2 12.1 2.1 2.1 4-4.4" />
    </Svg>
  )
}

/** Circle with a check — installed. */
export function CheckCircleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.2 12.3 2.5 2.5 5.1-5.6" />
    </Svg>
  )
}

/** Struck-through circle — not installable. */
export function CircleSlashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m6.4 6.4 11.2 11.2" />
    </Svg>
  )
}

/** Document — the file list and the overview tab. */
export function FileTextIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.6 3.5H7.2A1.7 1.7 0 0 0 5.5 5.2v13.6a1.7 1.7 0 0 0 1.7 1.7h9.6a1.7 1.7 0 0 0 1.7-1.7V8.4Z" />
      <path d="M13.6 3.5v4.9h4.9" />
      <path d="M9 13h6" />
      <path d="M9 16.4h4" />
    </Svg>
  )
}

/** Triangle with an exclamation — a region-level failure. */
export function AlertTriangleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4.5 20.8 19.5H3.2Z" />
      <path d="M12 10v4" />
      <path d="M12 16.8h.01" />
    </Svg>
  )
}

/** Box — the "nothing here" mark. */
export function PackageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m12 3.5 8 4.2v8.6l-8 4.2-8-4.2V7.7Z" />
      <path d="m4 7.7 8 4.3 8-4.3" />
      <path d="M12 12v8.5" />
    </Svg>
  )
}

/** Chevron — the select controls' trailing affordance. */
export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />
    </Svg>
  )
}

/** External link — an upstream report or page. */
export function ExternalLinkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 4.5h5.5V10" />
      <path d="m19.5 4.5-8 8" />
      <path d="M18 14.5V18a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V7.5A1.5 1.5 0 0 1 6 6h3.5" />
    </Svg>
  )
}

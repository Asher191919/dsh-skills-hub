/**
 * The sidebar rail glyph of 「技能市场」.
 *
 * Ownership note: `ui-sidebar` renders this inside its own
 * `<button aria-label={label} aria-current>` and wraps the contribution in
 * `<span aria-hidden="true" class="panelGlyph">` — the click, the keyboard
 * activation and the accessible name of the row are the sidebar's, and the
 * registration's `label: () => t('panel.title')` thunk is what supplies that
 * name. The glyph is therefore deliberately NOT a tab stop: a focusable element
 * inside an `aria-hidden` wrapper is unreachable for assistive technology while
 * still stealing a Tab stop from the button that owns the row. It carries a
 * `role="img"` name of its own and an SVG `<title>` so it stays self-describing
 * on hover and would remain labelled if the host ever dropped the wrapper.
 *
 * @module dsh-skills-hub/client/RailIcon
 */

import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { cls } from './cx.ts'
import styles from './RailIcon.module.css'

/**
 * Render the rail glyph.
 * @param props - `size` and `active` from the sidebar's list row, plus the
 *   namespace-bound translate seat declared by the registration.
 * @returns the storefront glyph at the requested size.
 */
export function SkillsHubRailIcon({ t, size, active }: PropsRuntime<'sidebar.panellist'> & PropsLocale<'skillsHub'>) {
  return (
    <svg
      className={cls(styles, 'glyph')}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 1.9 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={t('panel.title')}
      focusable="false"
    >
      <title>{t('panel.title')}</title>
      <path d="M3.5 9.5 5.5 4h13l2 5.5" />
      <path d="M4.5 9.5h15V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19Z" />
      <path d="M9.5 13.5h5" />
    </svg>
  )
}

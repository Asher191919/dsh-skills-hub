import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cls } from "./cx.js";
import styles from './RailIcon.module.css';
/**
 * Render the rail glyph.
 * @param props - `size` and `active` from the sidebar's list row, plus the
 *   namespace-bound translate seat declared by the registration.
 * @returns the storefront glyph at the requested size.
 */
export function SkillsHubRailIcon({ t, size, active }) {
    return (_jsxs("svg", { className: cls(styles, 'glyph'), width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: active ? 1.9 : 1.6, strokeLinecap: "round", strokeLinejoin: "round", role: "img", "aria-label": t('panel.title'), focusable: "false", children: [_jsx("title", { children: t('panel.title') }), _jsx("path", { d: "M3.5 9.5 5.5 4h13l2 5.5" }), _jsx("path", { d: "M4.5 9.5h15V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19Z" }), _jsx("path", { d: "M9.5 13.5h5" })] }));
}

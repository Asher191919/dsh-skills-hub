import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Small presentational atoms shared by the grid, the detail surface and the
 * states: the deterministic skill avatar, the two status chips, the
 * per-registry health line, and the loading skeleton card.
 *
 * @module dsh-skills-hub/client/MarketAtoms
 */
import { useState } from 'react';
import { MARKET_SOURCES } from "../shared/market.js";
import { cls, cx } from "./cx.js";
import { BadgeCheckIcon, CheckCircleIcon, CircleSlashIcon, DownloadIcon, ShieldAlertIcon, ShieldCheckIcon, ShieldQuestionIcon, } from "./icons.js";
import { avatarTone, formatClock, initialOf } from "./market-format.js";
import styles from './MarketAtoms.module.css';
const AVATAR_CLASSES = [
    cls(styles, 'tone0'), cls(styles, 'tone1'), cls(styles, 'tone2'),
    cls(styles, 'tone3'), cls(styles, 'tone4'), cls(styles, 'tone5'),
];
/** Avatar corner radius follows the tile size, as in the reference handoff. */
function radiusFor(size) {
    return Math.round(size * 0.24);
}
/**
 * Skill icon with a deterministic letter-avatar fallback.
 *
 * The fallback's colour is a stable function of the skill id, so one skill keeps
 * the same identity tile across the grid, the detail header and a re-render.
 * An upstream icon that fails to load degrades to that same fallback instead of
 * leaving a broken image in the grid.
 */
export function SkillAvatar({ skill, size = 44 }) {
    const [failed, setFailed] = useState(false);
    const radius = radiusFor(size);
    const iconUrl = skill.iconUrl;
    if (iconUrl !== undefined && iconUrl !== '' && !failed) {
        return (_jsx("img", { className: cx(cls(styles, 'avatar'), cls(styles, 'avatarImage')), src: iconUrl, alt: "", width: size, height: size, loading: "lazy", decoding: "async", referrerPolicy: "no-referrer", style: { width: size, height: size, borderRadius: radius }, onError: () => { setFailed(true); } }));
    }
    return (_jsx("span", { className: cx(cls(styles, 'avatar'), AVATAR_CLASSES[avatarTone(skill.id)] ?? ''), "aria-hidden": "true", style: { width: size, height: size, borderRadius: radius, fontSize: Math.round(size * 0.38) }, children: initialOf(skill.name) }));
}
const CHIP_CLASSES = {
    success: 'chipSuccess',
    danger: 'chipDanger',
    warn: 'chipWarn',
    neutral: 'chipNeutral',
    brand: 'chipBrand',
};
function Chip({ tone, title, icon, children }) {
    return (_jsxs("span", { className: cx(cls(styles, 'chip'), cls(styles, CHIP_CLASSES[tone])), title: title, children: [_jsx("span", { className: cls(styles, 'chipIcon'), children: icon }), children] }));
}
const SECURITY_TONE = {
    verified: 'success',
    benign: 'success',
    unknown: 'neutral',
    flagged: 'danger',
};
function SecurityIcon({ status, size }) {
    if (status === 'verified')
        return _jsx(BadgeCheckIcon, { size: size, strokeWidth: 2 });
    if (status === 'benign')
        return _jsx(ShieldCheckIcon, { size: size, strokeWidth: 2 });
    if (status === 'flagged')
        return _jsx(ShieldAlertIcon, { size: size, strokeWidth: 2 });
    return _jsx(ShieldQuestionIcon, { size: size, strokeWidth: 2 });
}
/**
 * Scan verdict of one skill version.
 * @param short - the card chip: a short label so the tag row stays on one line;
 *   the tooltip carries the full explanation either way.
 */
export function SecurityBadge({ t, status, short = false }) {
    const label = short ? t(`securityShort.${status}`) : t(`security.${status}`);
    return (_jsx(Chip, { tone: SECURITY_TONE[status], title: t(`securityHint.${status}`), icon: _jsx(SecurityIcon, { status: status, size: short ? 11 : 12 }), children: label }));
}
const INSTALL_TONE = {
    installed: 'success',
    installable: 'brand',
    'not-installable': 'danger',
};
const INSTALL_KEY = {
    installed: 'install.state.installed',
    installable: 'install.state.installable',
    'not-installable': 'install.state.notInstallable',
};
/**
 * Whether the skill can be written to disk right now.
 * @param reason - the host's refusal code, rendered as the chip's tooltip.
 */
export function InstallStateBadge({ t, state, reason }) {
    const label = t(INSTALL_KEY[state]);
    const title = state === 'not-installable' && reason !== undefined
        ? `${label} — ${t(`reason.${reason}`)}`
        : label;
    const icon = state === 'installed'
        ? _jsx(CheckCircleIcon, { size: 12, strokeWidth: 2 })
        : state === 'installable'
            ? _jsx(DownloadIcon, { size: 12, strokeWidth: 2 })
            : _jsx(CircleSlashIcon, { size: 12, strokeWidth: 2 });
    return _jsx(Chip, { tone: INSTALL_TONE[state], title: title, icon: icon, children: label });
}
const DOT_CLASSES = {
    ok: 'dotOk',
    cached: 'dotCached',
    degraded: 'dotDegraded',
    failed: 'dotFailed',
};
/**
 * Per-registry reachability for the current view.
 *
 * A half-broken upstream has to be legible: without this line a failing registry
 * is indistinguishable from a registry that simply has no matching skills, and
 * the grid would look confidently empty.
 */
export function SourceHealthLine({ t, sources }) {
    const entries = [];
    for (const source of MARKET_SOURCES) {
        const info = sources[source];
        if (info !== undefined)
            entries.push({ source, info });
    }
    if (entries.length === 0)
        return null;
    return (_jsxs("div", { className: cls(styles, 'health'), "aria-label": t('sourceStatus.label'), children: [_jsx("span", { className: cls(styles, 'healthLabel'), children: t('sourceStatus.label') }), entries.map(({ source, info }) => {
                const time = formatClock(info.fetchedAt);
                const status = info.status === 'cached' && time !== ''
                    ? t('sourceStatus.cachedAt', { time })
                    : t(`sourceStatus.${info.status}`);
                return (_jsxs("span", { className: cls(styles, 'healthItem'), title: info.error ?? undefined, children: [_jsx("span", { className: cx(cls(styles, 'dot'), cls(styles, DOT_CLASSES[info.status])), "aria-hidden": "true" }), _jsx("span", { className: cls(styles, 'healthSource'), children: t(`source.${source}`) }), _jsx("span", { className: cls(styles, 'healthStatus'), children: status }), info.error !== undefined && info.error !== '' && (_jsxs("span", { className: cls(styles, 'healthStatus'), children: ["\u00B7 ", info.error] }))] }, source));
            })] }));
}
const SKELETON_WIDTHS = ['72%', '54%', '88%', '62%'];
/**
 * One card-shaped placeholder; the panel's own grid positions it. Purely
 * decorative — the loading announcement belongs to the region that owns the
 * request, so this stays out of the accessibility tree.
 */
export function SkeletonCard({ index }) {
    const widths = [SKELETON_WIDTHS[index % SKELETON_WIDTHS.length] ?? '70%', SKELETON_WIDTHS[(index + 1) % SKELETON_WIDTHS.length] ?? '50%'];
    return (_jsxs("div", { className: cls(styles, 'skeletonCard'), "aria-hidden": "true", children: [_jsxs("div", { className: cls(styles, 'skeletonHead'), children: [_jsx("div", { className: cx(cls(styles, 'skeletonBlock'), cls(styles, 'skeletonAvatar'), cls(styles, 'shimmer')) }), _jsxs("div", { className: cls(styles, 'skeletonLines'), children: [_jsx("div", { className: cx(cls(styles, 'skeletonBlock'), cls(styles, 'shimmer')), style: { height: 12, width: widths[1] } }), _jsx("div", { className: cx(cls(styles, 'skeletonBlock'), cls(styles, 'shimmer')), style: { height: 10, width: '38%' } })] })] }), _jsx("div", { className: cx(cls(styles, 'skeletonBlock'), cls(styles, 'shimmer')), style: { height: 10, width: widths[0] } }), _jsx("div", { className: cx(cls(styles, 'skeletonBlock'), cls(styles, 'shimmer')), style: { height: 10, width: '64%' } }), _jsx("div", { className: cx(cls(styles, 'skeletonBlock'), cls(styles, 'shimmer')), style: { height: 20, width: '46%', marginTop: 'auto' } })] }));
}

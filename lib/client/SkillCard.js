import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { cls } from "./cx.js";
import { DownloadIcon, StarIcon } from "./icons.js";
import { InstallStateBadge, SecurityBadge, SkillAvatar } from "./MarketAtoms.js";
import { authorLabel, formatCount } from "./market-format.js";
import styles from './SkillCard.module.css';
/** Chip row budget: the scan verdict, then at most this many tags. */
const MAX_VISIBLE_TAGS = 3;
/**
 * Render one skill as a grid card.
 * @param props - card inputs.
 * @returns the card element.
 */
export function SkillCard({ t, skill, installing, onOpen, onInstall }) {
    const tags = skill.tags;
    const visible = tags.slice(0, MAX_VISIBLE_TAGS);
    const extra = Math.max(0, tags.length - MAX_VISIBLE_TAGS);
    const author = authorLabel(skill.author.displayName, skill.author.handle);
    const summary = skill.summary.trim();
    const canInstall = skill.installState === 'installable';
    const stars = skill.stats.stars;
    return (_jsxs("article", { className: cls(styles, 'card'), children: [_jsx("button", { type: "button", className: cls(styles, 'open'), "aria-label": t('card.open', { name: skill.name }), onClick: () => { onOpen(skill.id); } }), _jsxs("div", { className: cls(styles, 'body'), children: [_jsxs("div", { className: cls(styles, 'identity'), children: [_jsx(SkillAvatar, { skill: skill, size: 44 }), _jsxs("div", { className: cls(styles, 'titleBlock'), children: [_jsxs("div", { className: cls(styles, 'nameRow'), children: [_jsx("h3", { className: cls(styles, 'name'), title: skill.name, children: skill.name }), skill.version !== undefined && skill.version !== '' && (_jsxs("span", { className: cls(styles, 'version'), children: ["v", skill.version] }))] }), _jsxs("p", { className: cls(styles, 'meta'), children: [_jsx("span", { className: cls(styles, 'metaSource'), children: t(`source.${skill.source}`) }), author !== '' && (_jsxs(_Fragment, { children: [_jsx("span", { "aria-hidden": "true", children: "\u00B7" }), _jsx("span", { className: cls(styles, 'metaAuthor'), children: author })] }))] })] })] }), _jsx("p", { className: cls(styles, 'summary'), children: summary === '' ? t('card.noSummary') : summary }), _jsxs("div", { className: cls(styles, 'chips'), children: [_jsx(SecurityBadge, { t: t, status: skill.securityStatus, short: true }), visible.map(tag => _jsx("span", { className: cls(styles, 'tag'), children: tag }, tag)), extra > 0 && _jsx("span", { className: cls(styles, 'tag'), children: t('card.moreTags', { count: extra }) })] }), _jsxs("footer", { className: cls(styles, 'footer'), children: [_jsxs("div", { className: cls(styles, 'stats'), children: [_jsxs("span", { className: cls(styles, 'stat'), title: t('card.downloads'), children: [_jsx(DownloadIcon, { size: 12, strokeWidth: 1.8 }), formatCount(skill.stats.downloads)] }), stars !== undefined && stars > 0 && (_jsxs("span", { className: cls(styles, 'stat'), title: t('card.stars'), children: [_jsx(StarIcon, { size: 12, strokeWidth: 1.8 }), formatCount(stars)] }))] }), canInstall
                                ? (_jsxs("button", { type: "button", className: cls(styles, 'install'), disabled: installing, onClick: () => { onInstall(skill.id, skill.version); }, children: [_jsx(DownloadIcon, { size: 13, strokeWidth: 1.9 }), installing ? t('install.installing') : t('install.action')] }))
                                : _jsx(InstallStateBadge, { t: t, state: skill.installState, reason: skill.notInstallableReason })] })] })] }));
}

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { useEffect, useId, useRef } from 'react';
import { cls, cx } from "./cx.js";
import { AlertTriangleIcon, ArrowLeftIcon, CloseIcon, DownloadIcon, ExternalLinkIcon, FileTextIcon, ShieldCheckIcon, } from "./icons.js";
import { InstallStateBadge, SecurityBadge, SkillAvatar } from "./MarketAtoms.js";
import { authorLabel, formatBytes, formatCount, formatIsoDate, safeUrl } from "./market-format.js";
import styles from './SkillDetail.module.css';
const TABS = ['overview', 'files', 'security'];
const TAB_KEY = {
    overview: 'detail.overview',
    files: 'detail.files',
    security: 'detail.security',
};
function Stat({ label, value }) {
    if (value === '')
        return null;
    return (_jsxs("div", { className: cls(styles, 'stat'), children: [_jsx("dt", { className: cls(styles, 'statLabel'), children: label }), _jsx("dd", { className: cls(styles, 'statValue'), title: value, children: value })] }));
}
function FileRow({ t, file, active, onOpen }) {
    const title = file.tooBig ? t('detail.files.tooBig') : t('detail.files.preview', { path: file.path });
    return (_jsx("li", { className: cls(styles, 'fileRow'), children: _jsxs("button", { type: "button", className: cx(cls(styles, 'file'), active ? cls(styles, 'fileActive') : ''), disabled: file.tooBig, title: title, "aria-current": active ? 'true' : undefined, onClick: () => { onOpen(file.path); }, children: [_jsx("span", { className: cls(styles, 'filePath'), children: file.path }), _jsx("span", { className: cls(styles, 'fileSize'), children: formatBytes(file.size) })] }) }));
}
function Preview({ t, state, onClose }) {
    return (_jsxs("div", { className: cls(styles, 'preview'), children: [_jsxs("div", { className: cls(styles, 'previewHead'), children: [_jsx("span", { className: cls(styles, 'previewPath'), title: state.path, children: state.path }), _jsx("button", { type: "button", className: cls(styles, 'closePreview'), "aria-label": t('detail.preview.close'), title: t('detail.preview.close'), onClick: onClose, children: _jsx(CloseIcon, { size: 14 }) })] }), state.status === 'loading' && _jsx("p", { className: cls(styles, 'placeholder'), role: "status", children: t('detail.preview.loading') }), state.status === 'error' && (_jsxs("p", { className: cls(styles, 'placeholder'), role: "alert", children: [t('detail.preview.error'), state.error !== undefined && state.error !== '' ? ` — ${state.error}` : ''] })), state.status === 'ready' && state.content !== undefined && (_jsxs(_Fragment, { children: [_jsx("pre", { className: cls(styles, 'previewBody'), children: state.content.content }), state.content.truncated && _jsx("p", { className: cls(styles, 'previewNote'), children: t('detail.preview.truncated') })] }))] }));
}
function OverviewPanel({ t, skill, id, labelledBy }) {
    const description = skill.description.trim();
    return (_jsx("section", { className: cls(styles, 'panel'), role: "tabpanel", id: id, "aria-labelledby": labelledBy, tabIndex: 0, children: description === ''
            ? _jsx("p", { className: cls(styles, 'placeholder'), children: t('detail.noDescription') })
            : _jsx("pre", { className: cls(styles, 'document'), children: description }) }));
}
function SecurityPanel({ t, skill, id, labelledBy }) {
    const reports = skill.securityReports ?? [];
    return (_jsx("section", { className: cls(styles, 'panel'), role: "tabpanel", id: id, "aria-labelledby": labelledBy, tabIndex: 0, children: reports.length === 0
            ? _jsx("p", { className: cls(styles, 'placeholder'), children: t('detail.security.empty') })
            : (_jsx("ul", { className: cls(styles, 'reports'), children: reports.map((report, index) => {
                    const href = safeUrl(report.reportUrl);
                    return (_jsxs("li", { className: cls(styles, 'report'), children: [_jsxs("div", { className: cls(styles, 'reportHead'), children: [_jsx(ShieldCheckIcon, { size: 14 }), _jsx("span", { className: cls(styles, 'reportVendor'), children: report.vendor }), _jsx("span", { className: cls(styles, 'reportStatus'), children: report.statusText }), href !== undefined && (_jsxs("a", { className: cls(styles, 'link'), href: href, target: "_blank", rel: "noreferrer noopener", children: [t('detail.security.viewReport'), " ", _jsx(ExternalLinkIcon, { size: 11 })] }))] }), report.summary !== undefined && report.summary !== '' && (_jsx("p", { className: cls(styles, 'reportSummary'), children: report.summary }))] }, `${report.vendor}-${index}`));
                }) })) }));
}
/**
 * Render the open skill.
 * @param props - the detail state plus the panel's actions.
 * @returns the detail surface.
 */
export function SkillDetail(props) {
    const { t, detail, tab, onTab, file, filePath, onOpenFile, onCloseFile } = props;
    const headingRef = useRef(null);
    const tabRefs = useRef([]);
    const instance = useId();
    const skill = detail?.skill;
    // Move focus into the surface once the skill is known, so a keyboard reader
    // lands on the new content instead of the grid that just unmounted.
    useEffect(() => {
        if (detail?.status === 'ready')
            headingRef.current?.focus();
    }, [detail?.status, detail?.id]);
    const onTabKeyDown = (event) => {
        const index = TABS.indexOf(tab);
        let next = -1;
        if (event.key === 'ArrowRight')
            next = (index + 1) % TABS.length;
        else if (event.key === 'ArrowLeft')
            next = (index - 1 + TABS.length) % TABS.length;
        else if (event.key === 'Home')
            next = 0;
        else if (event.key === 'End')
            next = TABS.length - 1;
        if (next < 0)
            return;
        const target = TABS[next];
        if (target === undefined)
            return;
        event.preventDefault();
        onTab(target);
        tabRefs.current[next]?.focus();
    };
    const tabId = (entry) => `${instance}-tab-${entry}`;
    const panelId = (entry) => `${instance}-panel-${entry}`;
    const backButton = (_jsxs("button", { type: "button", className: cls(styles, 'back'), onClick: props.onBack, children: [_jsx(ArrowLeftIcon, { size: 14 }), t('detail.back')] }));
    if (detail === undefined || detail.status === 'loading') {
        return (_jsxs("div", { className: cls(styles, 'detail'), children: [backButton, _jsx("p", { className: cls(styles, 'placeholder'), role: "status", children: t('state.loading') })] }));
    }
    if (detail.status === 'error' || skill === undefined) {
        return (_jsxs("div", { className: cls(styles, 'detail'), children: [backButton, _jsxs("div", { className: cls(styles, 'errorBanner'), role: "alert", children: [_jsx(AlertTriangleIcon, { size: 15 }), _jsxs("span", { children: [t('state.error'), detail.error !== undefined && detail.error !== '' ? ` — ${detail.error}` : ''] })] }), _jsx("button", { type: "button", className: cls(styles, 'primaryAction'), onClick: props.onRetry, children: t('state.retry') })] }));
    }
    const author = authorLabel(skill.author.displayName, skill.author.handle);
    const updated = formatIsoDate(skill.updatedAt);
    const installedRaw = skill.installedInfo?.installedAt;
    const installedAt = installedRaw === undefined ? '' : formatIsoDate(Date.parse(installedRaw));
    const pageUrl = safeUrl(skill.pageUrl);
    const installs = skill.stats.installs;
    const files = skill.files;
    const summaryLine = t('detail.files.title', { count: files.length, size: formatBytes(skill.totalSize) });
    const list = (_jsx("ul", { className: cls(styles, 'fileList'), children: files.map(entry => (_jsx(FileRow, { t: t, file: entry, active: filePath === entry.path, onOpen: onOpenFile }, entry.path))) }));
    return (_jsxs("div", { className: cls(styles, 'detail'), children: [backButton, _jsxs("div", { className: cls(styles, 'hero'), children: [_jsx(SkillAvatar, { skill: skill, size: 72 }), _jsxs("div", { className: cls(styles, 'heroBody'), children: [_jsx("h2", { className: cls(styles, 'name'), ref: headingRef, tabIndex: -1, children: skill.name }), _jsxs("p", { className: cls(styles, 'meta'), children: [_jsx("span", { children: t(`source.${skill.source}`) }), _jsx("span", { "aria-hidden": "true", children: "\u00B7" }), _jsx("span", { children: author })] }), _jsxs("div", { className: cls(styles, 'chips'), children: [skill.version !== undefined && skill.version !== '' && (_jsxs("span", { className: cls(styles, 'versionPill'), children: ["v", skill.version] })), _jsx(SecurityBadge, { t: t, status: skill.securityStatus }), skill.installState !== 'installable' && (_jsx(InstallStateBadge, { t: t, state: skill.installState, reason: skill.notInstallableReason })), skill.requiresApiKey === true && _jsx("span", { className: cls(styles, 'versionPill'), children: t('detail.apiKey') })] }), _jsxs("dl", { className: cls(styles, 'stats'), children: [_jsx(Stat, { label: t('detail.stats.downloads'), value: formatCount(skill.stats.downloads) }), _jsx(Stat, { label: t('detail.stats.installs'), value: installs === undefined ? '' : formatCount(installs) }), _jsx(Stat, { label: t('detail.stats.stars'), value: skill.stats.stars === undefined ? '' : formatCount(skill.stats.stars) }), _jsx(Stat, { label: t('count.updated'), value: updated }), _jsx(Stat, { label: t('detail.license'), value: skill.license ?? '' }), _jsx(Stat, { label: t('detail.dir'), value: skill.installedInfo?.dirName ?? '' }), _jsx(Stat, { label: t('detail.stats.installedAt'), value: installedAt })] }), skill.upstream !== undefined && (_jsx("p", { className: cls(styles, 'note'), children: t('detail.upstream', { source: t(`source.${skill.upstream.source}`) }) })), pageUrl !== undefined && (_jsx("p", { className: cls(styles, 'note'), children: _jsxs("a", { className: cls(styles, 'link'), href: pageUrl, target: "_blank", rel: "noreferrer noopener", children: [t('detail.page'), " ", _jsx(ExternalLinkIcon, { size: 11 })] }) }))] }), _jsxs("div", { className: cls(styles, 'action'), children: [skill.installState === 'installable' && (_jsxs("button", { type: "button", className: cls(styles, 'primaryAction'), disabled: props.installing, onClick: () => { props.onInstall(skill.id, skill.version); }, children: [_jsx(DownloadIcon, { size: 14, strokeWidth: 1.9 }), props.installing ? t('install.installing') : t('install.action')] })), skill.installState === 'installed' && (_jsx("button", { type: "button", className: cls(styles, 'ghostAction'), disabled: props.uninstalling, onClick: () => { props.onUninstall(skill.id, skill.name); }, children: props.uninstalling ? t('install.uninstalling') : t('install.uninstall') }))] })] }), _jsx("div", { className: cls(styles, 'tabStrip'), role: "tablist", "aria-label": t('detail.tabs', { name: skill.name }), children: TABS.map((entry, index) => (_jsxs("button", { type: "button", role: "tab", id: tabId(entry), "aria-selected": tab === entry, "aria-controls": panelId(entry), tabIndex: tab === entry ? 0 : -1, ref: (node) => { tabRefs.current[index] = node; }, className: cx(cls(styles, 'tab'), tab === entry ? cls(styles, 'tabActive') : ''), onClick: () => { onTab(entry); }, onKeyDown: onTabKeyDown, children: [_jsx(FileTextIcon, { size: 14 }), t(TAB_KEY[entry])] }, entry))) }), tab === 'overview' && (_jsx(OverviewPanel, { t: t, skill: skill, id: panelId('overview'), labelledBy: tabId('overview') })), tab === 'files' && (_jsx("section", { className: cls(styles, 'panel'), role: "tabpanel", id: panelId('files'), "aria-labelledby": tabId('files'), tabIndex: 0, children: files.length === 0
                    ? _jsx("p", { className: cls(styles, 'placeholder'), children: t('detail.files.empty') })
                    : filePath === null || file === undefined
                        ? (_jsxs(_Fragment, { children: [_jsx("p", { className: cls(styles, 'note'), children: summaryLine }), list] }))
                        : (_jsxs("div", { className: cls(styles, 'filesLayout'), children: [_jsxs("div", { children: [_jsx("p", { className: cls(styles, 'note'), children: summaryLine }), list] }), _jsx(Preview, { t: t, state: file, onClose: onCloseFile })] })) })), tab === 'security' && (_jsx(SecurityPanel, { t: t, skill: skill, id: panelId('security'), labelledBy: tabId('security') })), skill.changelog !== undefined && (_jsxs("section", { className: cls(styles, 'changelog'), children: [_jsxs("h3", { className: cls(styles, 'changelogTitle'), children: [t('detail.changelog'), skill.changelog.version !== undefined && _jsxs("span", { className: cls(styles, 'versionPill'), children: ["v", skill.changelog.version] }), skill.changelog.publishedAt !== undefined && (_jsx("span", { className: cls(styles, 'changelogDate'), children: formatIsoDate(skill.changelog.publishedAt) }))] }), _jsx("p", { className: cls(styles, 'changelogText'), children: skill.changelog.text })] }))] }));
}

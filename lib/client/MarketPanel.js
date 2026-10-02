import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * 「技能市场」 — the main-slot page.
 *
 * Structure, top to bottom: a header row, the dismissible third-party advisory,
 * the search + filter toolbar, the per-registry health line, the count line, and
 * the results region (card grid, or the detail surface when a card is open). The
 * band above the results is fixed; the results scroll under it, so a long file
 * list never pushes the filters off screen.
 *
 * @module dsh-skills-hub/client/MarketPanel
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { MARKET_SOURCES, SECURITY_STATUSES } from "../shared/market.js";
import { cls, cx } from "./cx.js";
import { AlertTriangleIcon, ChevronDownIcon, CloseIcon, PackageIcon, RefreshIcon, SearchIcon, ShieldAlertIcon, StoreIcon } from "./icons.js";
import { SourceHealthLine, SkeletonCard } from "./MarketAtoms.js";
import { formatIsoDate } from "./market-format.js";
import { SkillCard } from "./SkillCard.js";
import { SkillDetail } from "./SkillDetail.js";
import shared from './shared.module.css';
import styles from './MarketPanel.module.css';
import { useMarketplace } from "./use-marketplace.js";
/** `localStorage` key remembering that the advisory was acknowledged. */
const DISCLAIMER_KEY = 'dsh-skills-hub:disclaimer-dismissed';
/** How many placeholder cards the loading grid draws. */
const SKELETON_COUNT = 6;
function readDismissed() {
    try {
        return typeof localStorage !== 'undefined' && localStorage.getItem(DISCLAIMER_KEY) === '1';
    }
    catch {
        // Storage can be unavailable (private mode, blocked cookies); the advisory
        // then simply reappears next session.
        return false;
    }
}
function persistDismissed() {
    try {
        localStorage.setItem(DISCLAIMER_KEY, '1');
    }
    catch {
        // Best effort: the banner stays dismissed for this mount either way.
    }
}
function FilterSelect({ id, label, value, options, onChange }) {
    return (_jsxs("span", { className: cls(styles, 'select'), children: [_jsx("label", { className: cls(shared, 'srOnly'), htmlFor: id, children: label }), _jsx("select", { id: id, className: cls(styles, 'selectControl'), value: value, title: label, onChange: (event) => { onChange(event.target.value); }, children: options.map(option => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), _jsx(ChevronDownIcon, { size: 13, className: cls(styles, 'selectChevron') })] }));
}
/**
 * Render the marketplace page.
 * @param props - the framework-injected translate seat.
 * @returns the panel.
 */
export function MarketPanel({ t }) {
    const market = useMarketplace(t);
    const [dismissed, setDismissed] = useState(readDismissed);
    const openerRef = useRef(null);
    const fieldId = useId();
    const composingRef = useRef(false);
    const { detailId, closeDetail, openDetail: openMarketDetail } = market;
    // The card that opened the detail is the element focus must return to.
    const openDetail = useCallback((id) => {
        const active = document.activeElement;
        openerRef.current = active instanceof HTMLElement ? active : null;
        openMarketDetail(id);
    }, [openMarketDetail]);
    useEffect(() => {
        if (detailId !== null)
            return;
        const opener = openerRef.current;
        if (opener === null)
            return;
        openerRef.current = null;
        if (opener.isConnected)
            opener.focus();
    }, [detailId]);
    // Escape closes the detail. The listener exists only while it is open.
    useEffect(() => {
        if (detailId === null)
            return;
        const onWindowKeyDown = (event) => {
            if (event.key !== 'Escape')
                return;
            event.stopPropagation();
            closeDetail();
        };
        window.addEventListener('keydown', onWindowKeyDown);
        return () => { window.removeEventListener('keydown', onWindowKeyDown); };
    }, [detailId, closeDetail]);
    const onSearchKeyDown = (event) => {
        if (event.key !== 'Enter')
            return;
        // Enter that confirms an IME candidate is not a submit: Safari reports the
        // confirming keydown as keyCode 229 after `isComposing` has already cleared.
        if (composingRef.current || event.nativeEvent.isComposing || event.keyCode === 229)
            return;
        event.preventDefault();
        market.commitDraft();
    };
    const sourceOptions = [
        { value: 'all', label: t('source.all') },
        ...MARKET_SOURCES.map(source => ({ value: source, label: t(`source.${source}`) })),
    ];
    const securityOptions = [
        { value: 'all', label: t('security.all') },
        ...SECURITY_STATUSES.map(status => ({ value: status, label: t(`security.${status}`) })),
    ];
    const installOptions = [
        { value: 'all', label: t('installFilter.all') },
        { value: 'installed', label: t('installFilter.installed') },
        { value: 'installable', label: t('installFilter.installable') },
    ];
    const filterParts = [];
    if (market.filters.source !== 'all')
        filterParts.push(`${t('filter.source')} ${t(`source.${market.filters.source}`)}`);
    if (market.filters.security !== 'all')
        filterParts.push(`${t('filter.security')} ${t(`security.${market.filters.security}`)}`);
    if (market.filters.install !== 'all')
        filterParts.push(`${t('filter.install')} ${t(`installFilter.${market.filters.install}`)}`);
    const searching = market.draft.trim() !== '';
    const narrowed = searching || market.hasActiveFilters;
    const detailOpen = detailId !== null;
    let emptyTitle = t('state.empty');
    let emptyHint = t('state.emptyHint');
    if (narrowed) {
        emptyTitle = t('state.emptySearch');
        emptyHint = t('state.emptySearchHint');
    }
    else if (market.unreachable) {
        emptyTitle = t('state.emptyUnreachable');
        emptyHint = t('state.emptyUnreachableHint');
    }
    return (_jsxs("div", { className: cls(styles, 'panel'), children: [_jsxs("div", { className: cls(styles, 'band'), children: [_jsxs("header", { className: cls(styles, 'header'), children: [_jsx("span", { className: cls(styles, 'mark'), "aria-hidden": "true", children: _jsx(StoreIcon, { size: 22, strokeWidth: 1.5 }) }), _jsxs("div", { className: cls(styles, 'headText'), children: [_jsx("h1", { className: cls(styles, 'title'), children: t('panel.title') }), _jsx("p", { className: cls(styles, 'subtitle'), children: t('panel.subtitle') })] }), _jsxs("button", { type: "button", className: cls(styles, 'refresh'), disabled: market.loading, title: t('panel.refresh'), onClick: market.refresh, children: [_jsx(RefreshIcon, { size: 15, className: market.loading ? cls(styles, 'spin') : undefined }), _jsx("span", { className: cls(styles, 'refreshLabel'), children: market.loading ? t('panel.refreshing') : t('panel.refresh') })] })] }), !dismissed && (_jsxs("div", { className: cls(styles, 'warn'), role: "note", children: [_jsx(ShieldAlertIcon, { size: 16, className: cls(styles, 'warnIcon') }), _jsxs("p", { className: cls(styles, 'warnText'), children: [_jsx("strong", { className: cls(styles, 'warnTitle'), children: t('disclaimer.title') }), " ", t('disclaimer.body')] }), _jsx("button", { type: "button", className: cls(styles, 'warnClose'), "aria-label": t('disclaimer.dismiss'), title: t('disclaimer.dismiss'), onClick: () => { setDismissed(true); persistDismissed(); }, children: _jsx(CloseIcon, { size: 14 }) })] })), !detailOpen && (_jsxs(_Fragment, { children: [_jsxs("div", { className: cls(styles, 'toolbar'), children: [_jsxs("div", { className: cls(styles, 'search'), children: [_jsx(SearchIcon, { size: 15, className: cls(styles, 'searchIcon') }), _jsx("label", { className: cls(shared, 'srOnly'), htmlFor: `${fieldId}-search`, children: t('search.label') }), _jsx("input", { id: `${fieldId}-search`, className: cls(styles, 'searchInput'), type: "search", value: market.draft, placeholder: t('search.placeholder'), enterKeyHint: "search", onChange: (event) => { market.setDraft(event.target.value); }, onCompositionStart: () => { composingRef.current = true; market.setComposing(true); }, onCompositionEnd: (event) => {
                                                    composingRef.current = false;
                                                    market.setDraft(event.currentTarget.value);
                                                    market.setComposing(false);
                                                }, onKeyDown: onSearchKeyDown }), market.draft !== '' && (_jsx("button", { type: "button", className: cls(styles, 'searchClear'), "aria-label": t('search.clear'), title: t('search.clear'), onClick: () => { market.setDraft(''); market.commitDraft(''); }, children: _jsx(CloseIcon, { size: 13 }) }))] }), _jsx(FilterSelect, { id: `${fieldId}-source`, label: t('filter.source'), value: market.filters.source, options: sourceOptions, onChange: market.setSource }), _jsx(FilterSelect, { id: `${fieldId}-security`, label: t('filter.security'), value: market.filters.security, options: securityOptions, onChange: market.setSecurity }), _jsx(FilterSelect, { id: `${fieldId}-install`, label: t('filter.install'), value: market.filters.install, options: installOptions, onChange: market.setInstall })] }), _jsx(SourceHealthLine, { t: t, sources: market.sources }), _jsxs("div", { className: cls(styles, 'countRow'), children: [_jsxs("p", { className: cls(styles, 'count'), "aria-live": "polite", children: [!market.loading && market.error === undefined && (_jsx("span", { children: t('count.skills', { count: market.total ?? market.items.length }) })), market.generatedAt !== undefined && (_jsx("span", { className: cls(styles, 'countMeta'), children: t('count.updated', { date: formatIsoDate(market.generatedAt) }) }))] }), filterParts.length > 0 && (_jsxs("p", { className: cls(styles, 'filterSummary'), children: [_jsx("span", { children: t('filter.active', { summary: filterParts.join(' · ') }) }), _jsx("button", { type: "button", className: cls(styles, 'linkButton'), onClick: market.clearFilters, children: t('filter.clear') })] }))] })] })), market.notice !== undefined && (_jsxs("div", { className: cx(cls(styles, 'notice'), market.notice.tone === 'error' ? cls(styles, 'noticeError') : cls(styles, 'noticeSuccess')), role: market.notice.tone === 'error' ? 'alert' : 'status', children: [_jsx("span", { className: cls(styles, 'noticeText'), children: market.notice.text }), _jsx("button", { type: "button", className: cls(styles, 'noticeClose'), "aria-label": t('notice.dismiss'), title: t('notice.dismiss'), onClick: market.dismissNotice, children: _jsx(CloseIcon, { size: 13 }) })] }))] }), _jsx("div", { className: cls(styles, 'results'), children: detailOpen ? (_jsx(SkillDetail, { t: t, detail: market.detail, tab: market.detailTab, onTab: market.setDetailTab, file: market.file, filePath: market.file?.path ?? null, onOpenFile: market.openFile, onCloseFile: market.closeFile, installing: market.detail !== undefined && market.detail.skill !== undefined && market.installing.has(market.detail.skill.id), uninstalling: market.detail !== undefined && market.detail.skill !== undefined && market.uninstalling.has(market.detail.skill.id), onInstall: market.install, onUninstall: market.uninstall, onBack: market.closeDetail, onRetry: market.retryDetail })) : market.loading ? (_jsxs(_Fragment, { children: [_jsx("p", { className: cls(shared, 'srOnly'), role: "status", children: t('state.loading') }), _jsx("ul", { className: cls(styles, 'grid'), children: Array.from({ length: SKELETON_COUNT }, (_unused, index) => (_jsx("li", { className: cls(styles, 'gridItem'), children: _jsx(SkeletonCard, { index: index }) }, index))) })] })) : market.error !== undefined && market.items.length === 0 ? (_jsxs("div", { className: cls(styles, 'state'), role: "alert", children: [_jsx(AlertTriangleIcon, { size: 26, className: cx(cls(styles, 'stateIcon'), cls(styles, 'stateIconError')) }), _jsx("p", { className: cls(styles, 'stateTitle'), children: t('state.error') }), _jsx("p", { className: cls(styles, 'stateText'), children: market.error }), _jsxs("button", { type: "button", className: cls(styles, 'stateAction'), onClick: market.retry, children: [_jsx(RefreshIcon, { size: 14 }), t('state.retry')] })] })) : market.items.length === 0 ? (_jsxs("div", { className: cls(styles, 'state'), children: [_jsx(PackageIcon, { size: 26, className: cls(styles, 'stateIcon') }), _jsx("p", { className: cls(styles, 'stateTitle'), children: emptyTitle }), _jsx("p", { className: cls(styles, 'stateText'), children: emptyHint }), narrowed && (_jsx("button", { type: "button", className: cls(styles, 'stateAction'), onClick: () => { market.setDraft(''); market.commitDraft(''); market.clearFilters(); }, children: t('filter.clear') }))] })) : (_jsxs(_Fragment, { children: [market.error !== undefined && (_jsxs("div", { className: cx(cls(styles, 'notice'), cls(styles, 'noticeError')), role: "alert", children: [_jsx("span", { className: cls(styles, 'noticeText'), children: market.error }), _jsx("button", { type: "button", className: cls(styles, 'noticeClose'), "aria-label": t('state.retry'), title: t('state.retry'), onClick: market.retry, children: _jsx(RefreshIcon, { size: 13 }) })] })), _jsx("ul", { className: cls(styles, 'grid'), children: market.items.map(skill => (_jsx("li", { className: cls(styles, 'gridItem'), children: _jsx(SkillCard, { t: t, skill: skill, installing: market.installing.has(skill.id), onOpen: openDetail, onInstall: market.install }) }, skill.id))) }), market.nextCursor !== null && (_jsx("div", { className: cls(styles, 'moreRow'), children: _jsx("button", { type: "button", className: cls(styles, 'more'), disabled: market.loadingMore, onClick: market.loadMore, children: market.loadingMore ? t('state.loadingMore') : t('state.loadMore') }) }))] })) })] }));
}

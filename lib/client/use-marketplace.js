/**
 * One stateful hook behind the whole panel: catalog paging, filters, the
 * debounced search box, the detail surface, file previews, and the
 * install/uninstall actions.
 *
 * Every request is issued inside the effect (or the imperative action) that owns
 * it and is aborted by that owner's cleanup, so unmounting the panel — or
 * superseding a request with a newer one — never leaves a socket open. There is
 * no polling: the catalog is read on mount, on a filter/search change, on an
 * explicit refresh, and when the reader asks for the next page.
 *
 * @module dsh-skills-hub/client/use-marketplace
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MARKET_LIMITS, MARKET_SOURCES } from "../shared/market.js";
import { MARKET_ERROR_CODES, MarketApiError, errorMessage, fetchCatalog, fetchFile, fetchSkillDetail, installSkill, isAbortError, refreshMarket, uninstallSkill, } from "./market-api.js";
/** Debounce before a keystroke becomes a catalog request. */
export const SEARCH_DEBOUNCE_MS = 350;
const NO_FILTERS = { source: 'all', security: 'all', install: 'all' };
function withAdded(set, value) {
    const next = new Set(set);
    next.add(value);
    return next;
}
function withRemoved(set, value) {
    if (!set.has(value))
        return set;
    const next = new Set(set);
    next.delete(value);
    return next;
}
function markInstalled(skill, dirName, version) {
    return {
        ...skill,
        installState: 'installed',
        installedInfo: {
            installedAt: new Date().toISOString(),
            dirName,
            managed: true,
            ...(version === undefined ? {} : { version }),
        },
    };
}
function markInstallable(skill) {
    return { ...skill, installState: 'installable', installedInfo: undefined };
}
/**
 * @param t - namespace-bound translate, for the transient install notices.
 * @returns the panel's complete read/write surface.
 */
export function useMarketplace(t) {
    const [items, setItems] = useState([]);
    const [sources, setSources] = useState({});
    const [total, setTotal] = useState(undefined);
    const [generatedAt, setGeneratedAt] = useState(undefined);
    const [nextCursor, setNextCursor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(undefined);
    const [notice, setNotice] = useState(undefined);
    const [installing, setInstalling] = useState(() => new Set());
    const [uninstalling, setUninstalling] = useState(() => new Set());
    const [draft, setDraftState] = useState('');
    const [composing, setComposingState] = useState(false);
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState(NO_FILTERS);
    const [nonce, setNonce] = useState(0);
    const [detailId, setDetailId] = useState(null);
    const [detailNonce, setDetailNonce] = useState(0);
    const [detail, setDetail] = useState(undefined);
    const [detailTab, setDetailTabState] = useState('overview');
    const [filePath, setFilePath] = useState(null);
    const [file, setFile] = useState(undefined);
    const pendingRefresh = useRef(false);
    const controllers = useRef(new Set());
    const begin = useCallback(() => {
        const controller = new AbortController();
        controllers.current.add(controller);
        return controller;
    }, []);
    const end = useCallback((controller) => {
        controllers.current.delete(controller);
    }, []);
    const abortAll = useCallback(() => {
        for (const controller of controllers.current)
            controller.abort();
        controllers.current.clear();
    }, []);
    // Any request still in flight when the panel unmounts is cancelled here.
    useEffect(() => abortAll, [abortAll]);
    // ── The catalog page: one effect owns one request ─────────────────────────
    useEffect(() => {
        const controller = begin();
        const force = pendingRefresh.current;
        pendingRefresh.current = false;
        let active = true;
        setLoading(true);
        setNotice(undefined);
        if (!force) {
            // A filter or query change must not keep showing rows that no longer
            // match it; an explicit refresh keeps the current page on screen.
            setItems([]);
            setNextCursor(null);
        }
        setError(undefined);
        void (async () => {
            try {
                const snapshot = await fetchCatalog({
                    q: query,
                    source: filters.source,
                    security: filters.security,
                    install: filters.install,
                    limit: MARKET_LIMITS.pageSize,
                    refresh: force,
                }, controller.signal);
                if (!active)
                    return;
                setItems(snapshot.items);
                setSources(snapshot.sources);
                setTotal(snapshot.total);
                setGeneratedAt(snapshot.generatedAt);
                setNextCursor(snapshot.nextCursor);
                setLoading(false);
            }
            catch (cause) {
                if (!active || isAbortError(cause))
                    return;
                setError(errorMessage(cause));
                setLoading(false);
            }
            finally {
                end(controller);
            }
        })();
        return () => {
            active = false;
            controller.abort();
            end(controller);
        };
    }, [query, filters, nonce, begin, end]);
    // ── Debounced search box ──────────────────────────────────────────────────
    // The box is a local draft so an IME composition can show its in-progress text
    // without becoming a query: pinyin like "wendang" would otherwise search the
    // catalog on every Latin keystroke on the way to 文档. While the reader is
    // composing, the timer is not scheduled at all; the composed text commits once,
    // on composition end.
    useEffect(() => {
        if (composing)
            return;
        const timer = window.setTimeout(() => { setQuery(draft.trim()); }, SEARCH_DEBOUNCE_MS);
        return () => { window.clearTimeout(timer); };
    }, [draft, composing]);
    const setDraft = useCallback((value) => { setDraftState(value); }, []);
    /**
     * Commit the box immediately (Enter, or the clear control).
     * @param value - the text to commit; defaults to the current draft. Passing it
     *   explicitly matters for the clear control, where the caller's draft state
     *   has not re-rendered yet and the closure still holds the old text.
     */
    const commitDraft = useCallback((value) => { setQuery((value ?? draft).trim()); }, [draft]);
    const setComposing = useCallback((value) => { setComposingState(value); }, []);
    // ── Detail ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (detailId === null) {
            setDetail(undefined);
            return;
        }
        const controller = begin();
        let active = true;
        setDetail({ id: detailId, status: 'loading', skill: undefined, error: undefined });
        setDetailTabState('overview');
        setFilePath(null);
        setFile(undefined);
        void (async () => {
            try {
                const skill = await fetchSkillDetail(detailId, controller.signal);
                if (!active)
                    return;
                setDetail({ id: detailId, status: 'ready', skill, error: undefined });
                // Keep the grid row in step with the detail (install state, counters).
                setItems(previous => previous.map((item) => (item.id === skill.id ? { ...item, ...skill } : item)));
            }
            catch (cause) {
                if (!active || isAbortError(cause))
                    return;
                setDetail({ id: detailId, status: 'error', skill: undefined, error: errorMessage(cause) });
            }
            finally {
                end(controller);
            }
        })();
        return () => {
            active = false;
            controller.abort();
            end(controller);
        };
    }, [detailId, detailNonce, begin, end]);
    // ── File preview ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (detailId === null || filePath === null) {
            setFile(undefined);
            return;
        }
        const controller = begin();
        let active = true;
        setFile({ path: filePath, status: 'loading', content: undefined, error: undefined });
        void (async () => {
            try {
                const content = await fetchFile(detailId, filePath, controller.signal);
                if (!active)
                    return;
                setFile({ path: filePath, status: 'ready', content, error: undefined });
            }
            catch (cause) {
                if (!active || isAbortError(cause))
                    return;
                setFile({ path: filePath, status: 'error', content: undefined, error: errorMessage(cause) });
            }
            finally {
                end(controller);
            }
        })();
        return () => {
            active = false;
            controller.abort();
            end(controller);
        };
    }, [detailId, filePath, begin, end]);
    // ── Actions ───────────────────────────────────────────────────────────────
    const refresh = useCallback(() => {
        const controller = begin();
        // The dedicated route invalidates the host's shared cache; the catalog read
        // that follows bypasses it too, so one click always reaches upstream. A
        // refresh route the host has not wired yet must not block the reload.
        void refreshMarket(controller.signal)
            .catch(() => undefined)
            .finally(() => {
            end(controller);
            pendingRefresh.current = true;
            setNonce(value => value + 1);
        });
    }, [begin, end]);
    const retry = useCallback(() => { setNonce(value => value + 1); }, []);
    const loadMore = useCallback(() => {
        if (nextCursor === null || nextCursor === '' || loadingMore || loading)
            return;
        const controller = begin();
        setLoadingMore(true);
        void (async () => {
            try {
                const snapshot = await fetchCatalog({
                    q: query,
                    source: filters.source,
                    security: filters.security,
                    install: filters.install,
                    cursor: nextCursor,
                    limit: MARKET_LIMITS.pageSize,
                }, controller.signal);
                setItems((previous) => {
                    const seen = new Set(previous.map(item => item.id));
                    const appended = snapshot.items.filter(item => !seen.has(item.id));
                    return appended.length === 0 ? previous : [...previous, ...appended];
                });
                setSources(snapshot.sources);
                if (snapshot.total !== undefined)
                    setTotal(snapshot.total);
                setNextCursor(snapshot.nextCursor);
            }
            catch (cause) {
                if (!isAbortError(cause))
                    setError(errorMessage(cause));
            }
            finally {
                setLoadingMore(false);
                end(controller);
            }
        })();
    }, [nextCursor, loadingMore, loading, query, filters, begin, end]);
    const install = useCallback((id, version) => {
        const controller = begin();
        setInstalling(previous => withAdded(previous, id));
        setNotice(undefined);
        void (async () => {
            try {
                const result = await installSkill(id, version, controller.signal);
                setItems(previous => previous.map((item) => (item.id === id ? markInstalled(item, result.dirName, result.version) : item)));
                setDetail(previous => previous !== undefined && previous.skill !== undefined && previous.skill.id === id
                    ? { ...previous, skill: markInstalled(previous.skill, result.dirName, result.version) }
                    : previous);
                setNotice({ tone: 'success', text: t('install.success', { dir: result.dirName }) });
            }
            catch (cause) {
                if (isAbortError(cause))
                    return;
                const code = cause instanceof MarketApiError ? cause.code : '';
                if (code === MARKET_ERROR_CODES.alreadyInstalled) {
                    setItems(previous => previous.map((item) => (item.id === id ? markInstalled(item, item.installedInfo?.dirName ?? item.slug, item.version) : item)));
                    setNotice({ tone: 'success', text: t('install.already') });
                    return;
                }
                setNotice({ tone: 'error', text: `${t('install.failed')}: ${errorMessage(cause)}` });
            }
            finally {
                setInstalling(previous => withRemoved(previous, id));
                end(controller);
            }
        })();
    }, [begin, end, t]);
    const uninstall = useCallback((id, name) => {
        const controller = begin();
        setUninstalling(previous => withAdded(previous, id));
        setNotice(undefined);
        void (async () => {
            try {
                await uninstallSkill(id, controller.signal);
                setItems(previous => previous.map((item) => (item.id === id ? markInstallable(item) : item)));
                setDetail(previous => previous !== undefined && previous.skill !== undefined && previous.skill.id === id
                    ? { ...previous, skill: markInstallable(previous.skill) }
                    : previous);
                setNotice({ tone: 'success', text: t('install.removed', { name }) });
            }
            catch (cause) {
                if (isAbortError(cause))
                    return;
                setNotice({ tone: 'error', text: `${t('install.uninstallFailed')}: ${errorMessage(cause)}` });
            }
            finally {
                setUninstalling(previous => withRemoved(previous, id));
                end(controller);
            }
        })();
    }, [begin, end, t]);
    const dismissNotice = useCallback(() => { setNotice(undefined); }, []);
    const openDetail = useCallback((id) => { setDetailId(id); }, []);
    const closeDetail = useCallback(() => { setDetailId(null); }, []);
    const retryDetail = useCallback(() => { setDetailNonce(value => value + 1); }, []);
    const openFile = useCallback((path) => { setFilePath(path); }, []);
    const closeFile = useCallback(() => { setFilePath(null); }, []);
    const setDetailTab = useCallback((tab) => { setDetailTabState(tab); }, []);
    const setSource = useCallback((value) => {
        setFilters(previous => (previous.source === value ? previous : { ...previous, source: value }));
    }, []);
    const setSecurity = useCallback((value) => {
        setFilters(previous => (previous.security === value ? previous : { ...previous, security: value }));
    }, []);
    const setInstall = useCallback((value) => {
        setFilters(previous => (previous.install === value ? previous : { ...previous, install: value }));
    }, []);
    const clearFilters = useCallback(() => {
        setFilters(previous => (previous.source === 'all' && previous.security === 'all' && previous.install === 'all' ? previous : NO_FILTERS));
    }, []);
    const hasActiveFilters = filters.source !== 'all' || filters.security !== 'all' || filters.install !== 'all';
    const unreachable = useMemo(() => MARKET_SOURCES.every(source => sources[source]?.status === 'failed'), [sources]);
    return {
        items, sources, total, generatedAt, nextCursor, loading, loadingMore, error, unreachable,
        notice, installing, uninstalling,
        draft, setDraft, commitDraft, setComposing,
        filters, hasActiveFilters, setSource, setSecurity, setInstall, clearFilters,
        refresh, retry, loadMore, dismissNotice,
        detailId, detail, detailTab, setDetailTab, file,
        openDetail, closeDetail, openFile, closeFile, retryDetail,
        install, uninstall,
    };
}

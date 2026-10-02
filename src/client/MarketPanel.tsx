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

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { MARKET_SOURCES, SECURITY_STATUSES } from '../shared/market.ts'
import type { MarketInstallFilter, MarketSecurityFilter, MarketSourceFilter } from '../shared/market.ts'
import { cls, cx } from './cx.ts'
import { AlertTriangleIcon, ChevronDownIcon, CloseIcon, PackageIcon, RefreshIcon, SearchIcon, ShieldAlertIcon, StoreIcon } from './icons.tsx'
import type { SkillsHubTranslate } from './locales.ts'
import { SourceHealthLine, SkeletonCard } from './MarketAtoms.tsx'
import { formatIsoDate } from './market-format.ts'
import { SkillCard } from './SkillCard.tsx'
import { SkillDetail } from './SkillDetail.tsx'
import shared from './shared.module.css'
import styles from './MarketPanel.module.css'
import { useMarketplace } from './use-marketplace.ts'

/** `localStorage` key remembering that the advisory was acknowledged. */
const DISCLAIMER_KEY = 'dsh-skills-hub:disclaimer-dismissed'

/** How many placeholder cards the loading grid draws. */
const SKELETON_COUNT = 6

function readDismissed(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(DISCLAIMER_KEY) === '1'
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); the advisory
    // then simply reappears next session.
    return false
  }
}

function persistDismissed(): void {
  try {
    localStorage.setItem(DISCLAIMER_KEY, '1')
  } catch {
    // Best effort: the banner stays dismissed for this mount either way.
  }
}

function FilterSelect<T extends string>({ id, label, value, options, onChange }: {
  readonly id: string
  readonly label: string
  readonly value: T
  readonly options: ReadonlyArray<{ readonly value: T; readonly label: string }>
  readonly onChange: (value: T) => void
}) {
  return (
    <span className={cls(styles, 'select')}>
      <label className={cls(shared, 'srOnly')} htmlFor={id}>{label}</label>
      <select
        id={id}
        className={cls(styles, 'selectControl')}
        value={value}
        title={label}
        onChange={(event) => { onChange(event.target.value as T) }}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <ChevronDownIcon size={13} className={cls(styles, 'selectChevron')} />
    </span>
  )
}

/**
 * Render the marketplace page.
 * @param props - the framework-injected translate seat.
 * @returns the panel.
 */
export function MarketPanel({ t }: { readonly t: SkillsHubTranslate }) {
  const market = useMarketplace(t)
  const [dismissed, setDismissed] = useState(readDismissed)
  const openerRef = useRef<HTMLElement | null>(null)
  const fieldId = useId()
  const composingRef = useRef(false)

  const { detailId, closeDetail, openDetail: openMarketDetail } = market

  // The card that opened the detail is the element focus must return to.
  const openDetail = useCallback((id: string): void => {
    const active = document.activeElement
    openerRef.current = active instanceof HTMLElement ? active : null
    openMarketDetail(id)
  }, [openMarketDetail])

  useEffect(() => {
    if (detailId !== null) return
    const opener = openerRef.current
    if (opener === null) return
    openerRef.current = null
    if (opener.isConnected) opener.focus()
  }, [detailId])

  // Escape closes the detail. The listener exists only while it is open.
  useEffect(() => {
    if (detailId === null) return
    const onWindowKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      closeDetail()
    }
    window.addEventListener('keydown', onWindowKeyDown)
    return () => { window.removeEventListener('keydown', onWindowKeyDown) }
  }, [detailId, closeDetail])

  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Enter') return
    // Enter that confirms an IME candidate is not a submit: Safari reports the
    // confirming keydown as keyCode 229 after `isComposing` has already cleared.
    if (composingRef.current || event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    market.commitDraft()
  }

  const sourceOptions: ReadonlyArray<{ value: MarketSourceFilter; label: string }> = [
    { value: 'all', label: t('source.all') },
    ...MARKET_SOURCES.map(source => ({ value: source as MarketSourceFilter, label: t(`source.${source}`) })),
  ]
  const securityOptions: ReadonlyArray<{ value: MarketSecurityFilter; label: string }> = [
    { value: 'all', label: t('security.all') },
    ...SECURITY_STATUSES.map(status => ({ value: status as MarketSecurityFilter, label: t(`security.${status}`) })),
  ]
  const installOptions: ReadonlyArray<{ value: MarketInstallFilter; label: string }> = [
    { value: 'all', label: t('installFilter.all') },
    { value: 'installed', label: t('installFilter.installed') },
    { value: 'installable', label: t('installFilter.installable') },
  ]

  const filterParts: string[] = []
  if (market.filters.source !== 'all') filterParts.push(`${t('filter.source')} ${t(`source.${market.filters.source}`)}`)
  if (market.filters.security !== 'all') filterParts.push(`${t('filter.security')} ${t(`security.${market.filters.security}`)}`)
  if (market.filters.install !== 'all') filterParts.push(`${t('filter.install')} ${t(`installFilter.${market.filters.install}`)}`)

  const searching = market.draft.trim() !== ''
  const narrowed = searching || market.hasActiveFilters
  const detailOpen = detailId !== null

  let emptyTitle = t('state.empty')
  let emptyHint = t('state.emptyHint')
  if (narrowed) {
    emptyTitle = t('state.emptySearch')
    emptyHint = t('state.emptySearchHint')
  } else if (market.unreachable) {
    emptyTitle = t('state.emptyUnreachable')
    emptyHint = t('state.emptyUnreachableHint')
  }

  return (
    <div className={cls(styles, 'panel')}>
      <div className={cls(styles, 'band')}>
        <header className={cls(styles, 'header')}>
          <span className={cls(styles, 'mark')} aria-hidden="true"><StoreIcon size={22} strokeWidth={1.5} /></span>
          <div className={cls(styles, 'headText')}>
            <h1 className={cls(styles, 'title')}>{t('panel.title')}</h1>
            <p className={cls(styles, 'subtitle')}>{t('panel.subtitle')}</p>
          </div>
          <button
            type="button"
            className={cls(styles, 'refresh')}
            disabled={market.loading}
            title={t('panel.refresh')}
            onClick={market.refresh}
          >
            <RefreshIcon size={15} className={market.loading ? cls(styles, 'spin') : undefined} />
            <span className={cls(styles, 'refreshLabel')}>
              {market.loading ? t('panel.refreshing') : t('panel.refresh')}
            </span>
          </button>
        </header>

        {!dismissed && (
          <div className={cls(styles, 'warn')} role="note">
            <ShieldAlertIcon size={16} className={cls(styles, 'warnIcon')} />
            <p className={cls(styles, 'warnText')}>
              <strong className={cls(styles, 'warnTitle')}>{t('disclaimer.title')}</strong> {t('disclaimer.body')}
            </p>
            <button
              type="button"
              className={cls(styles, 'warnClose')}
              aria-label={t('disclaimer.dismiss')}
              title={t('disclaimer.dismiss')}
              onClick={() => { setDismissed(true); persistDismissed() }}
            >
              <CloseIcon size={14} />
            </button>
          </div>
        )}

        {!detailOpen && (
          <>
            <div className={cls(styles, 'toolbar')}>
              <div className={cls(styles, 'search')}>
                <SearchIcon size={15} className={cls(styles, 'searchIcon')} />
                <label className={cls(shared, 'srOnly')} htmlFor={`${fieldId}-search`}>{t('search.label')}</label>
                <input
                  id={`${fieldId}-search`}
                  className={cls(styles, 'searchInput')}
                  type="search"
                  value={market.draft}
                  placeholder={t('search.placeholder')}
                  enterKeyHint="search"
                  onChange={(event) => { market.setDraft(event.target.value) }}
                  onCompositionStart={() => { composingRef.current = true; market.setComposing(true) }}
                  onCompositionEnd={(event) => {
                    composingRef.current = false
                    market.setDraft(event.currentTarget.value)
                    market.setComposing(false)
                  }}
                  onKeyDown={onSearchKeyDown}
                />
                {market.draft !== '' && (
                  <button
                    type="button"
                    className={cls(styles, 'searchClear')}
                    aria-label={t('search.clear')}
                    title={t('search.clear')}
                    onClick={() => { market.setDraft(''); market.commitDraft('') }}
                  >
                    <CloseIcon size={13} />
                  </button>
                )}
              </div>
              <FilterSelect id={`${fieldId}-source`} label={t('filter.source')} value={market.filters.source} options={sourceOptions} onChange={market.setSource} />
              <FilterSelect id={`${fieldId}-security`} label={t('filter.security')} value={market.filters.security} options={securityOptions} onChange={market.setSecurity} />
              <FilterSelect id={`${fieldId}-install`} label={t('filter.install')} value={market.filters.install} options={installOptions} onChange={market.setInstall} />
            </div>

            <SourceHealthLine t={t} sources={market.sources} />

            <div className={cls(styles, 'countRow')}>
              <p className={cls(styles, 'count')} aria-live="polite">
                {!market.loading && market.error === undefined && (
                  <span>{t('count.skills', { count: market.total ?? market.items.length })}</span>
                )}
                {market.generatedAt !== undefined && (
                  <span className={cls(styles, 'countMeta')}>{t('count.updated', { date: formatIsoDate(market.generatedAt) })}</span>
                )}
              </p>
              {filterParts.length > 0 && (
                <p className={cls(styles, 'filterSummary')}>
                  <span>{t('filter.active', { summary: filterParts.join(' · ') })}</span>
                  <button type="button" className={cls(styles, 'linkButton')} onClick={market.clearFilters}>
                    {t('filter.clear')}
                  </button>
                </p>
              )}
            </div>
          </>
        )}

        {market.notice !== undefined && (
          <div
            className={cx(cls(styles, 'notice'), market.notice.tone === 'error' ? cls(styles, 'noticeError') : cls(styles, 'noticeSuccess'))}
            role={market.notice.tone === 'error' ? 'alert' : 'status'}
          >
            <span className={cls(styles, 'noticeText')}>{market.notice.text}</span>
            <button
              type="button"
              className={cls(styles, 'noticeClose')}
              aria-label={t('notice.dismiss')}
              title={t('notice.dismiss')}
              onClick={market.dismissNotice}
            >
              <CloseIcon size={13} />
            </button>
          </div>
        )}
      </div>

      <div className={cls(styles, 'results')}>
        {detailOpen ? (
          <SkillDetail
            t={t}
            detail={market.detail}
            tab={market.detailTab}
            onTab={market.setDetailTab}
            file={market.file}
            filePath={market.file?.path ?? null}
            onOpenFile={market.openFile}
            onCloseFile={market.closeFile}
            installing={market.detail !== undefined && market.detail.skill !== undefined && market.installing.has(market.detail.skill.id)}
            uninstalling={market.detail !== undefined && market.detail.skill !== undefined && market.uninstalling.has(market.detail.skill.id)}
            onInstall={market.install}
            onUninstall={market.uninstall}
            onBack={market.closeDetail}
            onRetry={market.retryDetail}
          />
        ) : market.loading ? (
          <>
            <p className={cls(shared, 'srOnly')} role="status">{t('state.loading')}</p>
            <ul className={cls(styles, 'grid')}>
              {Array.from({ length: SKELETON_COUNT }, (_unused, index) => (
                <li key={index} className={cls(styles, 'gridItem')}><SkeletonCard index={index} /></li>
              ))}
            </ul>
          </>
        ) : market.error !== undefined && market.items.length === 0 ? (
          <div className={cls(styles, 'state')} role="alert">
            <AlertTriangleIcon size={26} className={cx(cls(styles, 'stateIcon'), cls(styles, 'stateIconError'))} />
            <p className={cls(styles, 'stateTitle')}>{t('state.error')}</p>
            <p className={cls(styles, 'stateText')}>{market.error}</p>
            <button type="button" className={cls(styles, 'stateAction')} onClick={market.retry}>
              <RefreshIcon size={14} />
              {t('state.retry')}
            </button>
          </div>
        ) : market.items.length === 0 ? (
          <div className={cls(styles, 'state')}>
            <PackageIcon size={26} className={cls(styles, 'stateIcon')} />
            <p className={cls(styles, 'stateTitle')}>{emptyTitle}</p>
            <p className={cls(styles, 'stateText')}>{emptyHint}</p>
            {narrowed && (
              <button
                type="button"
                className={cls(styles, 'stateAction')}
                onClick={() => { market.setDraft(''); market.commitDraft(''); market.clearFilters() }}
              >
                {t('filter.clear')}
              </button>
            )}
          </div>
        ) : (
          <>
            {market.error !== undefined && (
              <div className={cx(cls(styles, 'notice'), cls(styles, 'noticeError'))} role="alert">
                <span className={cls(styles, 'noticeText')}>{market.error}</span>
                <button type="button" className={cls(styles, 'noticeClose')} aria-label={t('state.retry')} title={t('state.retry')} onClick={market.retry}>
                  <RefreshIcon size={13} />
                </button>
              </div>
            )}
            <ul className={cls(styles, 'grid')}>
              {market.items.map(skill => (
                <li key={skill.id} className={cls(styles, 'gridItem')}>
                  <SkillCard
                    t={t}
                    skill={skill}
                    installing={market.installing.has(skill.id)}
                    onOpen={openDetail}
                    onInstall={market.install}
                  />
                </li>
              ))}
            </ul>
            {market.nextCursor !== null && (
              <div className={cls(styles, 'moreRow')}>
                <button type="button" className={cls(styles, 'more')} disabled={market.loadingMore} onClick={market.loadMore}>
                  {market.loadingMore ? t('state.loadingMore') : t('state.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

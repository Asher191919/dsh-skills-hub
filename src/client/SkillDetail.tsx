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

import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import type { MarketFileMeta, MarketSkillDetail } from '../shared/market.ts'
import { cls, cx } from './cx.ts'
import {
  AlertTriangleIcon, ArrowLeftIcon, CloseIcon, DownloadIcon, ExternalLinkIcon, FileTextIcon,
  ShieldCheckIcon,
} from './icons.tsx'
import { InstallStateBadge, SecurityBadge, SkillAvatar } from './MarketAtoms.tsx'
import type { DetailFileState, DetailState, DetailTab } from './use-marketplace.ts'
import type { SkillsHubTranslate } from './locales.ts'
import { authorLabel, formatBytes, formatCount, formatIsoDate, safeUrl } from './market-format.ts'
import styles from './SkillDetail.module.css'

/** Properties of the detail surface. */
export interface SkillDetailProps {
  readonly t: SkillsHubTranslate
  readonly detail: DetailState | undefined
  readonly tab: DetailTab
  readonly onTab: (tab: DetailTab) => void
  readonly file: DetailFileState | undefined
  readonly filePath: string | null
  readonly onOpenFile: (path: string) => void
  readonly onCloseFile: () => void
  readonly installing: boolean
  readonly uninstalling: boolean
  readonly onInstall: (id: string, version: string | undefined) => void
  readonly onUninstall: (id: string, name: string) => void
  readonly onBack: () => void
  /** Re-read the open skill after a failed detail load. */
  readonly onRetry: () => void
}

const TABS: readonly DetailTab[] = ['overview', 'files', 'security']

const TAB_KEY: Record<DetailTab, 'detail.overview' | 'detail.files' | 'detail.security'> = {
  overview: 'detail.overview',
  files: 'detail.files',
  security: 'detail.security',
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  if (value === '') return null
  return (
    <div className={cls(styles, 'stat')}>
      <dt className={cls(styles, 'statLabel')}>{label}</dt>
      <dd className={cls(styles, 'statValue')} title={value}>{value}</dd>
    </div>
  )
}

function FileRow({ t, file, active, onOpen }: {
  readonly t: SkillsHubTranslate
  readonly file: MarketFileMeta
  readonly active: boolean
  readonly onOpen: (path: string) => void
}) {
  const title = file.tooBig ? t('detail.files.tooBig') : t('detail.files.preview', { path: file.path })
  return (
    <li className={cls(styles, 'fileRow')}>
      <button
        type="button"
        className={cx(cls(styles, 'file'), active ? cls(styles, 'fileActive') : '')}
        disabled={file.tooBig}
        title={title}
        aria-current={active ? 'true' : undefined}
        onClick={() => { onOpen(file.path) }}
      >
        <span className={cls(styles, 'filePath')}>{file.path}</span>
        <span className={cls(styles, 'fileSize')}>{formatBytes(file.size)}</span>
      </button>
    </li>
  )
}

function Preview({ t, state, onClose }: {
  readonly t: SkillsHubTranslate
  readonly state: DetailFileState
  readonly onClose: () => void
}) {
  return (
    <div className={cls(styles, 'preview')}>
      <div className={cls(styles, 'previewHead')}>
        <span className={cls(styles, 'previewPath')} title={state.path}>{state.path}</span>
        <button
          type="button"
          className={cls(styles, 'closePreview')}
          aria-label={t('detail.preview.close')}
          title={t('detail.preview.close')}
          onClick={onClose}
        >
          <CloseIcon size={14} />
        </button>
      </div>
      {state.status === 'loading' && <p className={cls(styles, 'placeholder')} role="status">{t('detail.preview.loading')}</p>}
      {state.status === 'error' && (
        <p className={cls(styles, 'placeholder')} role="alert">
          {t('detail.preview.error')}{state.error !== undefined && state.error !== '' ? ` — ${state.error}` : ''}
        </p>
      )}
      {state.status === 'ready' && state.content !== undefined && (
        <>
          <pre className={cls(styles, 'previewBody')}>{state.content.content}</pre>
          {state.content.truncated && <p className={cls(styles, 'previewNote')}>{t('detail.preview.truncated')}</p>}
        </>
      )}
    </div>
  )
}

function OverviewPanel({ t, skill, id, labelledBy }: {
  readonly t: SkillsHubTranslate
  readonly skill: MarketSkillDetail
  readonly id: string
  readonly labelledBy: string
}) {
  const description = skill.description.trim()
  return (
    <section className={cls(styles, 'panel')} role="tabpanel" id={id} aria-labelledby={labelledBy} tabIndex={0}>
      {description === ''
        ? <p className={cls(styles, 'placeholder')}>{t('detail.noDescription')}</p>
        : <pre className={cls(styles, 'document')}>{description}</pre>}
    </section>
  )
}

function SecurityPanel({ t, skill, id, labelledBy }: {
  readonly t: SkillsHubTranslate
  readonly skill: MarketSkillDetail
  readonly id: string
  readonly labelledBy: string
}) {
  const reports = skill.securityReports ?? []
  return (
    <section className={cls(styles, 'panel')} role="tabpanel" id={id} aria-labelledby={labelledBy} tabIndex={0}>
      {reports.length === 0
        ? <p className={cls(styles, 'placeholder')}>{t('detail.security.empty')}</p>
        : (
          <ul className={cls(styles, 'reports')}>
            {reports.map((report, index) => {
              const href = safeUrl(report.reportUrl)
              return (
                <li key={`${report.vendor}-${index}`} className={cls(styles, 'report')}>
                  <div className={cls(styles, 'reportHead')}>
                    <ShieldCheckIcon size={14} />
                    <span className={cls(styles, 'reportVendor')}>{report.vendor}</span>
                    <span className={cls(styles, 'reportStatus')}>{report.statusText}</span>
                    {href !== undefined && (
                      <a className={cls(styles, 'link')} href={href} target="_blank" rel="noreferrer noopener">
                        {t('detail.security.viewReport')} <ExternalLinkIcon size={11} />
                      </a>
                    )}
                  </div>
                  {report.summary !== undefined && report.summary !== '' && (
                    <p className={cls(styles, 'reportSummary')}>{report.summary}</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
    </section>
  )
}

/**
 * Render the open skill.
 * @param props - the detail state plus the panel's actions.
 * @returns the detail surface.
 */
export function SkillDetail(props: SkillDetailProps) {
  const { t, detail, tab, onTab, file, filePath, onOpenFile, onCloseFile } = props
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const instance = useId()
  const skill = detail?.skill

  // Move focus into the surface once the skill is known, so a keyboard reader
  // lands on the new content instead of the grid that just unmounted.
  useEffect(() => {
    if (detail?.status === 'ready') headingRef.current?.focus()
  }, [detail?.status, detail?.id])

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    const index = TABS.indexOf(tab)
    let next = -1
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = TABS.length - 1
    if (next < 0) return
    const target = TABS[next]
    if (target === undefined) return
    event.preventDefault()
    onTab(target)
    tabRefs.current[next]?.focus()
  }

  const tabId = (entry: DetailTab): string => `${instance}-tab-${entry}`
  const panelId = (entry: DetailTab): string => `${instance}-panel-${entry}`

  const backButton = (
    <button type="button" className={cls(styles, 'back')} onClick={props.onBack}>
      <ArrowLeftIcon size={14} />
      {t('detail.back')}
    </button>
  )

  if (detail === undefined || detail.status === 'loading') {
    return (
      <div className={cls(styles, 'detail')}>
        {backButton}
        <p className={cls(styles, 'placeholder')} role="status">{t('state.loading')}</p>
      </div>
    )
  }

  if (detail.status === 'error' || skill === undefined) {
    return (
      <div className={cls(styles, 'detail')}>
        {backButton}
        <div className={cls(styles, 'errorBanner')} role="alert">
          <AlertTriangleIcon size={15} />
          <span>{t('state.error')}{detail.error !== undefined && detail.error !== '' ? ` — ${detail.error}` : ''}</span>
        </div>
        <button type="button" className={cls(styles, 'primaryAction')} onClick={props.onRetry}>
          {t('state.retry')}
        </button>
      </div>
    )
  }

  const author = authorLabel(skill.author.displayName, skill.author.handle)
  const updated = formatIsoDate(skill.updatedAt)
  const installedRaw = skill.installedInfo?.installedAt
  const installedAt = installedRaw === undefined ? '' : formatIsoDate(Date.parse(installedRaw))
  const pageUrl = safeUrl(skill.pageUrl)
  const installs = skill.stats.installs
  const files = skill.files
  const summaryLine = t('detail.files.title', { count: files.length, size: formatBytes(skill.totalSize) })
  const list = (
    <ul className={cls(styles, 'fileList')}>
      {files.map(entry => (
        <FileRow key={entry.path} t={t} file={entry} active={filePath === entry.path} onOpen={onOpenFile} />
      ))}
    </ul>
  )

  return (
    <div className={cls(styles, 'detail')}>
      {backButton}

      <div className={cls(styles, 'hero')}>
        <SkillAvatar skill={skill} size={72} />
        <div className={cls(styles, 'heroBody')}>
          <h2 className={cls(styles, 'name')} ref={headingRef} tabIndex={-1}>{skill.name}</h2>
          <p className={cls(styles, 'meta')}>
            <span>{t(`source.${skill.source}`)}</span>
            <span aria-hidden="true">·</span>
            <span>{author}</span>
          </p>
          <div className={cls(styles, 'chips')}>
            {skill.version !== undefined && skill.version !== '' && (
              <span className={cls(styles, 'versionPill')}>v{skill.version}</span>
            )}
            <SecurityBadge t={t} status={skill.securityStatus} />
            {skill.installState !== 'installable' && (
              <InstallStateBadge t={t} state={skill.installState} reason={skill.notInstallableReason} />
            )}
            {skill.requiresApiKey === true && <span className={cls(styles, 'versionPill')}>{t('detail.apiKey')}</span>}
          </div>

          <dl className={cls(styles, 'stats')}>
            <Stat label={t('detail.stats.downloads')} value={formatCount(skill.stats.downloads)} />
            <Stat label={t('detail.stats.installs')} value={installs === undefined ? '' : formatCount(installs)} />
            <Stat label={t('detail.stats.stars')} value={skill.stats.stars === undefined ? '' : formatCount(skill.stats.stars)} />
            <Stat label={t('count.updated')} value={updated} />
            <Stat label={t('detail.license')} value={skill.license ?? ''} />
            <Stat label={t('detail.dir')} value={skill.installedInfo?.dirName ?? ''} />
            <Stat label={t('detail.stats.installedAt')} value={installedAt} />
          </dl>

          {skill.upstream !== undefined && (
            <p className={cls(styles, 'note')}>{t('detail.upstream', { source: t(`source.${skill.upstream.source}`) })}</p>
          )}
          {pageUrl !== undefined && (
            <p className={cls(styles, 'note')}>
              <a className={cls(styles, 'link')} href={pageUrl} target="_blank" rel="noreferrer noopener">
                {t('detail.page')} <ExternalLinkIcon size={11} />
              </a>
            </p>
          )}
        </div>

        <div className={cls(styles, 'action')}>
          {skill.installState === 'installable' && (
            <button
              type="button"
              className={cls(styles, 'primaryAction')}
              disabled={props.installing}
              onClick={() => { props.onInstall(skill.id, skill.version) }}
            >
              <DownloadIcon size={14} strokeWidth={1.9} />
              {props.installing ? t('install.installing') : t('install.action')}
            </button>
          )}
          {skill.installState === 'installed' && (
            <button
              type="button"
              className={cls(styles, 'ghostAction')}
              disabled={props.uninstalling}
              onClick={() => { props.onUninstall(skill.id, skill.name) }}
            >
              {props.uninstalling ? t('install.uninstalling') : t('install.uninstall')}
            </button>
          )}
        </div>
      </div>

      <div className={cls(styles, 'tabStrip')} role="tablist" aria-label={t('detail.tabs', { name: skill.name })}>
        {TABS.map((entry, index) => (
          <button
            key={entry}
            type="button"
            role="tab"
            id={tabId(entry)}
            aria-selected={tab === entry}
            aria-controls={panelId(entry)}
            tabIndex={tab === entry ? 0 : -1}
            ref={(node) => { tabRefs.current[index] = node }}
            className={cx(cls(styles, 'tab'), tab === entry ? cls(styles, 'tabActive') : '')}
            onClick={() => { onTab(entry) }}
            onKeyDown={onTabKeyDown}
          >
            <FileTextIcon size={14} />
            {t(TAB_KEY[entry])}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <OverviewPanel t={t} skill={skill} id={panelId('overview')} labelledBy={tabId('overview')} />
      )}

      {tab === 'files' && (
        <section className={cls(styles, 'panel')} role="tabpanel" id={panelId('files')} aria-labelledby={tabId('files')} tabIndex={0}>
          {files.length === 0
            ? <p className={cls(styles, 'placeholder')}>{t('detail.files.empty')}</p>
            : filePath === null || file === undefined
              ? (
                <>
                  <p className={cls(styles, 'note')}>{summaryLine}</p>
                  {list}
                </>
              )
              : (
                <div className={cls(styles, 'filesLayout')}>
                  <div>
                    <p className={cls(styles, 'note')}>{summaryLine}</p>
                    {list}
                  </div>
                  <Preview t={t} state={file} onClose={onCloseFile} />
                </div>
              )}
        </section>
      )}

      {tab === 'security' && (
        <SecurityPanel t={t} skill={skill} id={panelId('security')} labelledBy={tabId('security')} />
      )}

      {skill.changelog !== undefined && (
        <section className={cls(styles, 'changelog')}>
          <h3 className={cls(styles, 'changelogTitle')}>
            {t('detail.changelog')}
            {skill.changelog.version !== undefined && <span className={cls(styles, 'versionPill')}>v{skill.changelog.version}</span>}
            {skill.changelog.publishedAt !== undefined && (
              <span className={cls(styles, 'changelogDate')}>{formatIsoDate(skill.changelog.publishedAt)}</span>
            )}
          </h3>
          <p className={cls(styles, 'changelogText')}>{skill.changelog.text}</p>
        </section>
      )}
    </div>
  )
}

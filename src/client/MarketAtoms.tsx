/**
 * Small presentational atoms shared by the grid, the detail surface and the
 * states: the deterministic skill avatar, the two status chips, the
 * per-registry health line, and the loading skeleton card.
 *
 * @module dsh-skills-hub/client/MarketAtoms
 */

import { useState, type ReactNode } from 'react'
import { MARKET_SOURCES } from '../shared/market.ts'
import type {
  InstallState, MarketSkill, MarketSource, NotInstallableReason, SecurityStatus, SourceStatusInfo,
} from '../shared/market.ts'
import { cls, cx } from './cx.ts'
import {
  BadgeCheckIcon, CheckCircleIcon, CircleSlashIcon, DownloadIcon, ShieldAlertIcon, ShieldCheckIcon,
  ShieldQuestionIcon,
} from './icons.tsx'
import type { SkillsHubTranslate } from './locales.ts'
import { avatarTone, formatClock, initialOf } from './market-format.ts'
import styles from './MarketAtoms.module.css'

const AVATAR_CLASSES: readonly string[] = [
  cls(styles, 'tone0'), cls(styles, 'tone1'), cls(styles, 'tone2'),
  cls(styles, 'tone3'), cls(styles, 'tone4'), cls(styles, 'tone5'),
]

/** Avatar corner radius follows the tile size, as in the reference handoff. */
function radiusFor(size: number): number {
  return Math.round(size * 0.24)
}

/**
 * Skill icon with a deterministic letter-avatar fallback.
 *
 * The fallback's colour is a stable function of the skill id, so one skill keeps
 * the same identity tile across the grid, the detail header and a re-render.
 * An upstream icon that fails to load degrades to that same fallback instead of
 * leaving a broken image in the grid.
 */
export function SkillAvatar({ skill, size = 44 }: {
  readonly skill: Pick<MarketSkill, 'id' | 'name' | 'iconUrl'>
  readonly size?: number
}) {
  const [failed, setFailed] = useState(false)
  const radius = radiusFor(size)
  const iconUrl = skill.iconUrl

  if (iconUrl !== undefined && iconUrl !== '' && !failed) {
    return (
      <img
        className={cx(cls(styles, 'avatar'), cls(styles, 'avatarImage'))}
        src={iconUrl}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        style={{ width: size, height: size, borderRadius: radius }}
        onError={() => { setFailed(true) }}
      />
    )
  }

  return (
    <span
      className={cx(cls(styles, 'avatar'), AVATAR_CLASSES[avatarTone(skill.id)] ?? '')}
      aria-hidden="true"
      style={{ width: size, height: size, borderRadius: radius, fontSize: Math.round(size * 0.38) }}
    >
      {initialOf(skill.name)}
    </span>
  )
}

type ChipTone = 'success' | 'danger' | 'warn' | 'neutral' | 'brand'

const CHIP_CLASSES: Record<ChipTone, string> = {
  success: 'chipSuccess',
  danger: 'chipDanger',
  warn: 'chipWarn',
  neutral: 'chipNeutral',
  brand: 'chipBrand',
}

function Chip({ tone, title, icon, children }: {
  readonly tone: ChipTone
  readonly title: string
  readonly icon: ReactNode
  readonly children: ReactNode
}) {
  return (
    <span className={cx(cls(styles, 'chip'), cls(styles, CHIP_CLASSES[tone]))} title={title}>
      <span className={cls(styles, 'chipIcon')}>{icon}</span>
      {children}
    </span>
  )
}

const SECURITY_TONE: Record<SecurityStatus, ChipTone> = {
  verified: 'success',
  benign: 'success',
  unknown: 'neutral',
  flagged: 'danger',
}

function SecurityIcon({ status, size }: { readonly status: SecurityStatus; readonly size: number }) {
  if (status === 'verified') return <BadgeCheckIcon size={size} strokeWidth={2} />
  if (status === 'benign') return <ShieldCheckIcon size={size} strokeWidth={2} />
  if (status === 'flagged') return <ShieldAlertIcon size={size} strokeWidth={2} />
  return <ShieldQuestionIcon size={size} strokeWidth={2} />
}

/**
 * Scan verdict of one skill version.
 * @param short - the card chip: a short label so the tag row stays on one line;
 *   the tooltip carries the full explanation either way.
 */
export function SecurityBadge({ t, status, short = false }: {
  readonly t: SkillsHubTranslate
  readonly status: SecurityStatus
  readonly short?: boolean
}) {
  const label = short ? t(`securityShort.${status}`) : t(`security.${status}`)
  return (
    <Chip tone={SECURITY_TONE[status]} title={t(`securityHint.${status}`)} icon={<SecurityIcon status={status} size={short ? 11 : 12} />}>
      {label}
    </Chip>
  )
}

const INSTALL_TONE: Record<InstallState, ChipTone> = {
  installed: 'success',
  installable: 'brand',
  'not-installable': 'danger',
}

const INSTALL_KEY: Record<InstallState, 'install.state.installed' | 'install.state.installable' | 'install.state.notInstallable'> = {
  installed: 'install.state.installed',
  installable: 'install.state.installable',
  'not-installable': 'install.state.notInstallable',
}

/**
 * Whether the skill can be written to disk right now.
 * @param reason - the host's refusal code, rendered as the chip's tooltip.
 */
export function InstallStateBadge({ t, state, reason }: {
  readonly t: SkillsHubTranslate
  readonly state: InstallState
  readonly reason?: NotInstallableReason | undefined
}) {
  const label = t(INSTALL_KEY[state])
  const title = state === 'not-installable' && reason !== undefined
    ? `${label} — ${t(`reason.${reason}`)}`
    : label
  const icon = state === 'installed'
    ? <CheckCircleIcon size={12} strokeWidth={2} />
    : state === 'installable'
      ? <DownloadIcon size={12} strokeWidth={2} />
      : <CircleSlashIcon size={12} strokeWidth={2} />
  return <Chip tone={INSTALL_TONE[state]} title={title} icon={icon}>{label}</Chip>
}

const DOT_CLASSES: Record<SourceStatusInfo['status'], string> = {
  ok: 'dotOk',
  cached: 'dotCached',
  degraded: 'dotDegraded',
  failed: 'dotFailed',
}

/**
 * Per-registry reachability for the current view.
 *
 * A half-broken upstream has to be legible: without this line a failing registry
 * is indistinguishable from a registry that simply has no matching skills, and
 * the grid would look confidently empty.
 */
export function SourceHealthLine({ t, sources }: {
  readonly t: SkillsHubTranslate
  readonly sources: Partial<Record<MarketSource, SourceStatusInfo>>
}) {
  const entries: Array<{ source: MarketSource; info: SourceStatusInfo }> = []
  for (const source of MARKET_SOURCES) {
    const info = sources[source]
    if (info !== undefined) entries.push({ source, info })
  }
  if (entries.length === 0) return null

  return (
    <div className={cls(styles, 'health')} aria-label={t('sourceStatus.label')}>
      <span className={cls(styles, 'healthLabel')}>{t('sourceStatus.label')}</span>
      {entries.map(({ source, info }) => {
        const time = formatClock(info.fetchedAt)
        const status = info.status === 'cached' && time !== ''
          ? t('sourceStatus.cachedAt', { time })
          : t(`sourceStatus.${info.status}`)
        return (
          <span key={source} className={cls(styles, 'healthItem')} title={info.error ?? undefined}>
            <span className={cx(cls(styles, 'dot'), cls(styles, DOT_CLASSES[info.status]))} aria-hidden="true" />
            <span className={cls(styles, 'healthSource')}>{t(`source.${source}`)}</span>
            <span className={cls(styles, 'healthStatus')}>{status}</span>
            {info.error !== undefined && info.error !== '' && (
              <span className={cls(styles, 'healthStatus')}>· {info.error}</span>
            )}
          </span>
        )
      })}
    </div>
  )
}

const SKELETON_WIDTHS: readonly string[] = ['72%', '54%', '88%', '62%']

/**
 * One card-shaped placeholder; the panel's own grid positions it. Purely
 * decorative — the loading announcement belongs to the region that owns the
 * request, so this stays out of the accessibility tree.
 */
export function SkeletonCard({ index }: { readonly index: number }) {
  const widths = [SKELETON_WIDTHS[index % SKELETON_WIDTHS.length] ?? '70%', SKELETON_WIDTHS[(index + 1) % SKELETON_WIDTHS.length] ?? '50%']
  return (
    <div className={cls(styles, 'skeletonCard')} aria-hidden="true">
      <div className={cls(styles, 'skeletonHead')}>
        <div className={cx(cls(styles, 'skeletonBlock'), cls(styles, 'skeletonAvatar'), cls(styles, 'shimmer'))} />
        <div className={cls(styles, 'skeletonLines')}>
          <div className={cx(cls(styles, 'skeletonBlock'), cls(styles, 'shimmer'))} style={{ height: 12, width: widths[1] }} />
          <div className={cx(cls(styles, 'skeletonBlock'), cls(styles, 'shimmer'))} style={{ height: 10, width: '38%' }} />
        </div>
      </div>
      <div className={cx(cls(styles, 'skeletonBlock'), cls(styles, 'shimmer'))} style={{ height: 10, width: widths[0] }} />
      <div className={cx(cls(styles, 'skeletonBlock'), cls(styles, 'shimmer'))} style={{ height: 10, width: '64%' }} />
      <div className={cx(cls(styles, 'skeletonBlock'), cls(styles, 'shimmer'))} style={{ height: 20, width: '46%', marginTop: 'auto' }} />
    </div>
  )
}

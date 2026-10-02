/**
 * One catalog card, ported from the reference marketplace's `SkillCard`.
 *
 * The anatomy is fixed top to bottom — identity, summary, chip row, footer — and
 * the footer is pinned with `margin-top: auto`, so a grid row lines up even when
 * one card has no tags; the chip row is clipped to a single line for the same
 * reason. The open affordance is one stretched `<button>` (never a clickable
 * div), and the install button sits above it so installing does not also open.
 *
 * @module dsh-skills-hub/client/SkillCard
 */

import type { MarketSkill } from '../shared/market.ts'
import { cls } from './cx.ts'
import { DownloadIcon, StarIcon } from './icons.tsx'
import { InstallStateBadge, SecurityBadge, SkillAvatar } from './MarketAtoms.tsx'
import type { SkillsHubTranslate } from './locales.ts'
import { authorLabel, formatCount } from './market-format.ts'
import styles from './SkillCard.module.css'

/** Chip row budget: the scan verdict, then at most this many tags. */
const MAX_VISIBLE_TAGS = 3

/** Properties of one grid card. */
export interface SkillCardProps {
  readonly t: SkillsHubTranslate
  readonly skill: MarketSkill
  /** An install for this id is in flight. */
  readonly installing: boolean
  readonly onOpen: (id: string) => void
  readonly onInstall: (id: string, version: string | undefined) => void
}

/**
 * Render one skill as a grid card.
 * @param props - card inputs.
 * @returns the card element.
 */
export function SkillCard({ t, skill, installing, onOpen, onInstall }: SkillCardProps) {
  const tags = skill.tags
  const visible = tags.slice(0, MAX_VISIBLE_TAGS)
  const extra = Math.max(0, tags.length - MAX_VISIBLE_TAGS)
  const author = authorLabel(skill.author.displayName, skill.author.handle)
  const summary = skill.summary.trim()
  const canInstall = skill.installState === 'installable'
  const stars = skill.stats.stars

  return (
    <article className={cls(styles, 'card')}>
      <button
        type="button"
        className={cls(styles, 'open')}
        aria-label={t('card.open', { name: skill.name })}
        onClick={() => { onOpen(skill.id) }}
      />

      <div className={cls(styles, 'body')}>
        <div className={cls(styles, 'identity')}>
          <SkillAvatar skill={skill} size={44} />
          <div className={cls(styles, 'titleBlock')}>
            <div className={cls(styles, 'nameRow')}>
              <h3 className={cls(styles, 'name')} title={skill.name}>{skill.name}</h3>
              {skill.version !== undefined && skill.version !== '' && (
                <span className={cls(styles, 'version')}>v{skill.version}</span>
              )}
            </div>
            <p className={cls(styles, 'meta')}>
              <span className={cls(styles, 'metaSource')}>{t(`source.${skill.source}`)}</span>
              {author !== '' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className={cls(styles, 'metaAuthor')}>{author}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <p className={cls(styles, 'summary')}>{summary === '' ? t('card.noSummary') : summary}</p>

        <div className={cls(styles, 'chips')}>
          <SecurityBadge t={t} status={skill.securityStatus} short />
          {visible.map(tag => <span key={tag} className={cls(styles, 'tag')}>{tag}</span>)}
          {extra > 0 && <span className={cls(styles, 'tag')}>{t('card.moreTags', { count: extra })}</span>}
        </div>

        <footer className={cls(styles, 'footer')}>
          <div className={cls(styles, 'stats')}>
            <span className={cls(styles, 'stat')} title={t('card.downloads')}>
              <DownloadIcon size={12} strokeWidth={1.8} />
              {formatCount(skill.stats.downloads)}
            </span>
            {stars !== undefined && stars > 0 && (
              <span className={cls(styles, 'stat')} title={t('card.stars')}>
                <StarIcon size={12} strokeWidth={1.8} />
                {formatCount(stars)}
              </span>
            )}
          </div>
          {canInstall
            ? (
              <button
                type="button"
                className={cls(styles, 'install')}
                disabled={installing}
                onClick={() => { onInstall(skill.id, skill.version) }}
              >
                <DownloadIcon size={13} strokeWidth={1.9} />
                {installing ? t('install.installing') : t('install.action')}
              </button>
            )
            : <InstallStateBadge t={t} state={skill.installState} reason={skill.notInstallableReason} />}
        </footer>
      </div>
    </article>
  )
}

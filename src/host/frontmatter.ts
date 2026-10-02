/**
 * Skills Hub — minimal YAML frontmatter reader for `SKILL.md`.
 *
 * Only the flat `key: value` head of a skill document matters to this plugin
 * (`name`, `description`, `license`, and whatever the detail view echoes back),
 * so this is deliberately not a YAML parser: nested blocks and sequences are
 * ignored, indented continuation lines extend the previous scalar, and a
 * malformed document degrades to "no frontmatter" instead of throwing.
 *
 * @module dsh-skills-hub/host/frontmatter
 */

/** A skill document split into its optional frontmatter and its body. */
export interface ParsedSkillDocument {
  readonly frontmatter: Readonly<Record<string, unknown>> | undefined
  /** The document body, frontmatter stripped and trimmed. */
  readonly content: string
}

/**
 * Split `SKILL.md` into frontmatter and body.
 *
 * @param raw - the full document text.
 * @returns the parsed frontmatter (when present and non-empty) and the body.
 */
export function parseFrontmatter(raw: string): ParsedSkillDocument {
  const text = raw.replace(/^\uFEFF/, '')
  if (!text.startsWith('---')) return { frontmatter: undefined, content: text.trim() }

  const lines = text.split(/\r?\n/)
  // The opening `---` must be the whole first line.
  if (lines[0]?.trim() !== '---') return { frontmatter: undefined, content: text.trim() }

  let closing = -1
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line !== undefined && (line.trim() === '---' || line.trim() === '...')) {
      closing = index
      break
    }
  }
  if (closing === -1) return { frontmatter: undefined, content: text.trim() }

  const frontmatter = parseBlock(lines.slice(1, closing))
  const content = lines.slice(closing + 1).join('\n').trim()
  return { frontmatter, content }
}

/** Parse the `key: value` head, folding indented continuations into the previous key. */
function parseBlock(lines: readonly string[]): Record<string, unknown> | undefined {
  const result: Record<string, unknown> = {}
  let currentKey: string | undefined

  for (const line of lines) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue
    if (/^\s/.test(line)) {
      // A continuation (or a nested block we do not model) extends the scalar.
      if (currentKey === undefined) continue
      const previous = result[currentKey]
      const addition = line.trim()
      if (typeof previous === 'string') result[currentKey] = addition === '' ? previous : `${previous} ${addition}`
      continue
    }
    const separator = line.indexOf(':')
    if (separator <= 0) continue
    const key = line.slice(0, separator).trim()
    if (key === '') continue
    const rawValue = line.slice(separator + 1).trim()
    currentKey = key
    if (rawValue === '') {
      result[key] = ''
      continue
    }
    result[key] = unquote(rawValue)
  }

  return Object.keys(result).length === 0 ? undefined : result
}

/** Strip one layer of matching quotes; leave anything else untouched. */
function unquote(value: string): string {
  const first = value[0]
  const last = value[value.length - 1]
  if (value.length >= 2 && (first === '"' || first === "'") && last === first) {
    return value.slice(1, -1)
  }
  return value
}

/** Read a non-empty string field out of parsed frontmatter. */
export function frontmatterString(
  frontmatter: Readonly<Record<string, unknown>> | undefined,
  key: string,
): string | undefined {
  const value = frontmatter?.[key]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

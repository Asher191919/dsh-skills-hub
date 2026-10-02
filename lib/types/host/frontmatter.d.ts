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
    readonly frontmatter: Readonly<Record<string, unknown>> | undefined;
    /** The document body, frontmatter stripped and trimmed. */
    readonly content: string;
}
/**
 * Split `SKILL.md` into frontmatter and body.
 *
 * @param raw - the full document text.
 * @returns the parsed frontmatter (when present and non-empty) and the body.
 */
export declare function parseFrontmatter(raw: string): ParsedSkillDocument;
/** Read a non-empty string field out of parsed frontmatter. */
export declare function frontmatterString(frontmatter: Readonly<Record<string, unknown>> | undefined, key: string): string | undefined;

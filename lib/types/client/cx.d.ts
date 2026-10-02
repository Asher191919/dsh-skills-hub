/**
 * Class-name join for CSS-Module lookups.
 *
 * The `*.module.css` ambient declaration types every module as
 * `Record<string, string>`, and `noUncheckedIndexedAccess` makes each property
 * read `string | undefined`. This helper keeps that union out of every call
 * site and drops the falsy branches of a conditional class list.
 *
 * @module dsh-skills-hub/client/cx
 */
/** Join truthy class names with a space. */
export declare function cx(...parts: readonly (string | false | null | undefined)[]): string;
/** Read one CSS-Module class, tolerating an unknown local name. */
export declare function cls(module: Readonly<Record<string, string>>, name: string): string;

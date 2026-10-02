/**
 * Skills Hub — install truth: the hub-owned record of what it installed, the
 * skill roots it reads, and the install-state annotation every catalog entry
 * carries.
 *
 * The record lives **outside** the skill directories (`<dsh home>/skills-hub/installs.json`)
 * for two reasons: a skill directory must stay a plain DSH skill (no private
 * marker file a reader has to skip), and deleting a skill directory must not
 * be able to corrupt the hub's own bookkeeping.
 *
 * A directory on disk with no record is **adopted**: it is reported as
 * `installed` with `managed: false`, which is what makes the panel show
 * 「已安装」 instead of offering an install that would fail.
 *
 * @module dsh-skills-hub/host/install-state
 */
import { lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { MARKET_ERROR_CODES, MARKET_SOURCES, sanitizeDirName, skillId, } from "../shared/market.js";
import { MarketRequestError } from "./errors.js";
import { frontmatterString, parseFrontmatter } from "./frontmatter.js";
import { projectSkillsRoot, userSkillsRoot } from "./paths.js";
/**
 * Create the install registry.
 *
 * Reads are tolerant: an unreadable or malformed document degrades to "no
 * installs" and is logged, because a corrupt side file must never make the
 * whole panel unusable. Writes are serialized and atomic (temp file + rename
 * in the same directory), so a crash leaves either the old or the new
 * document, never a half-written one.
 *
 * @param options - document path and logger.
 * @returns the registry handle.
 */
export function createInstallRegistry(options) {
    let records = new Map();
    let loaded;
    let writes = Promise.resolve();
    const readDocument = async () => {
        let raw;
        try {
            raw = await readFile(options.file, 'utf-8');
        }
        catch {
            // Absent is the normal first-run state, not an error.
            return;
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            options.logger.warn('skills-hub: ignoring an unreadable install record');
            return;
        }
        if (typeof parsed !== 'object' || parsed === null)
            return;
        const installs = parsed.installs;
        if (!Array.isArray(installs))
            return;
        const next = new Map();
        for (const entry of installs) {
            const record = parseInstallRecord(entry);
            if (record !== undefined)
                next.set(record.dirName, record);
        }
        records = next;
    };
    const flush = async () => {
        const document = { version: 1, installs: [...records.values()] };
        const body = `${JSON.stringify(document, null, 2)}\n`;
        await mkdir(dirname(options.file), { recursive: true });
        const temp = `${options.file}.tmp-${process.pid.toString(36)}-${Date.now().toString(36)}`;
        try {
            await writeFile(temp, body, 'utf-8');
            await rename(temp, options.file);
        }
        catch (error) {
            await rm(temp, { force: true }).catch(() => undefined);
            throw error;
        }
    };
    const mutate = (change) => {
        const operation = writes.then(async () => {
            change();
            await flush();
        });
        // Keep the chain alive after a failure; the caller still sees the rejection.
        writes = operation.catch(() => undefined);
        return operation;
    };
    return {
        async load() {
            loaded ??= readDocument();
            await loaded;
        },
        all() {
            return [...records.values()];
        },
        get(dirName) {
            return records.get(dirName);
        },
        async put(record) {
            await mutate(() => {
                records.set(record.dirName, record);
            });
        },
        async remove(dirName) {
            await mutate(() => {
                records.delete(dirName);
            });
        },
    };
}
/** Validate one persisted record; anything malformed is dropped, not trusted. */
export function parseInstallRecord(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        return undefined;
    const candidate = value;
    const source = candidate['source'];
    const slug = candidate['slug'];
    const dirName = candidate['dirName'];
    const installedAt = candidate['installedAt'];
    const files = candidate['files'];
    const managed = candidate['managed'];
    const version = candidate['version'];
    if (typeof source !== 'string' || !MARKET_SOURCES.includes(source))
        return undefined;
    if (typeof slug !== 'string' || slug === '')
        return undefined;
    if (typeof dirName !== 'string' || sanitizeDirName(slug) !== dirName)
        return undefined;
    if (typeof installedAt !== 'string' || installedAt === '')
        return undefined;
    if (typeof managed !== 'boolean')
        return undefined;
    if (version !== undefined && typeof version !== 'string')
        return undefined;
    const paths = Array.isArray(files) ? files.filter((entry) => typeof entry === 'string') : [];
    return {
        id: skillId(source, slug),
        source: source,
        slug,
        dirName,
        ...(version === undefined ? {} : { version }),
        installedAt,
        files: paths,
        managed,
    };
}
/**
 * Create the root resolver for the configured install scope.
 *
 * @param options - scope, DSH home, and the workspace lookup.
 * @returns the resolver.
 */
export function createSkillRootResolver(options) {
    return {
        async resolve(cwd) {
            if (options.installScope === 'user') {
                return { root: userSkillsRoot(options.dshHome), source: 'user-dsh' };
            }
            const workspace = options.workspace(cwd);
            if (workspace === undefined || workspace === '') {
                throw new MarketRequestError(503, MARKET_ERROR_CODES.diskError, 'no workspace is registered for a project-scoped install');
            }
            return { root: projectSkillsRoot(workspace), source: 'project-dsh' };
        },
    };
}
/**
 * Create the install-state service.
 *
 * @param options - registry and root resolver.
 * @returns the service.
 */
export function createInstallState(options) {
    /** Directory names present under a root, with their mtime for adopted entries. */
    const listRoot = async (root) => {
        const found = new Map();
        let names;
        try {
            names = await readdir(root);
        }
        catch {
            return found;
        }
        await Promise.all(names.map(async (name) => {
            if (sanitizeDirName(name) !== name)
                return;
            try {
                const info = await lstat(join(root, name));
                if (!info.isDirectory() || info.isSymbolicLink())
                    return;
                found.set(name, info.mtime.toISOString());
            }
            catch {
                // A vanished entry is simply not present.
            }
        }));
        return found;
    };
    const annotateWith = (skill, present) => {
        const dirName = sanitizeDirName(skill.slug);
        if (dirName === null) {
            return { ...skill, installState: 'not-installable', notInstallableReason: 'invalid-name' };
        }
        const seenAt = present.get(dirName);
        if (seenAt === undefined) {
            return { ...skill, installState: 'installable', notInstallableReason: undefined, installedInfo: undefined };
        }
        const record = options.registry.get(dirName);
        if (record !== undefined) {
            if (record.id !== skill.id) {
                // The directory exists and belongs to a different registry entry.
                return { ...skill, installState: 'not-installable', notInstallableReason: 'name-conflict' };
            }
            const info = {
                ...(record.version === undefined ? {} : { version: record.version }),
                installedAt: record.installedAt,
                dirName,
                managed: record.managed,
            };
            return { ...skill, installState: 'installed', notInstallableReason: undefined, installedInfo: info };
        }
        // Adopted: present on disk, unknown to this hub. Reported as installed so
        // the panel never offers an install that would refuse to run.
        const info = { installedAt: seenAt, dirName, managed: false };
        return { ...skill, installState: 'installed', notInstallableReason: undefined, installedInfo: info };
    };
    return {
        async annotate(skill) {
            await options.registry.load();
            const { root } = await options.roots.resolve();
            return annotateWith(skill, await listRoot(root));
        },
        async annotateAll(items) {
            await options.registry.load();
            const { root } = await options.roots.resolve();
            const present = await listRoot(root);
            return items.map((item) => annotateWith(item, present));
        },
        async installed() {
            await options.registry.load();
            const { root } = await options.roots.resolve();
            const present = await listRoot(root);
            const items = [];
            for (const record of options.registry.all()) {
                if (!present.has(record.dirName))
                    continue;
                items.push(await describeInstalled(record, join(root, record.dirName)));
            }
            const managedDirs = new Set(options.registry.all().map((record) => record.dirName));
            let localOnly = 0;
            for (const name of present.keys()) {
                if (!managedDirs.has(name))
                    localOnly += 1;
            }
            return { items, roots: [root], localOnly };
        },
    };
}
/** Build the wire entry for one installed skill, reading its `SKILL.md` head. */
async function describeInstalled(record, directory) {
    let name = record.slug;
    let summary = '';
    try {
        const document = parseFrontmatter(await readFile(join(directory, 'SKILL.md'), 'utf-8'));
        name = frontmatterString(document.frontmatter, 'name') ?? record.slug;
        summary = frontmatterString(document.frontmatter, 'description') ?? '';
    }
    catch {
        // A missing or unreadable SKILL.md still yields a usable row.
    }
    return {
        id: record.id,
        source: record.source,
        slug: record.slug,
        name,
        summary,
        author: { handle: '' },
        stats: { downloads: 0 },
        tags: [],
        ...(record.version === undefined ? {} : { version: record.version }),
        securityStatus: 'unknown',
        installState: 'installed',
        installedInfo: {
            ...(record.version === undefined ? {} : { version: record.version }),
            installedAt: record.installedAt,
            dirName: record.dirName,
            managed: record.managed,
        },
    };
}

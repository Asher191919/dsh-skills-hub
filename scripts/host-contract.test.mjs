/**
 * Skills Hub — host contract test.
 *
 * Offline and deterministic: no registry is contacted, every filesystem write
 * happens under a temporary directory, and both providers are replaced by
 * fixtures. It covers the rules that would be dangerous to get wrong:
 *
 *  1. path traversal (the primary threat),
 *  2. the install size and count limits,
 *  3. cross-registry merge and dedupe,
 *  4. filter application after the merge,
 *  5. the atomic install's refusal to clobber a directory this hub did not
 *     create, plus the in-flight lock and the managed-install lifecycle,
 *  6. adoption: an on-disk skill with no hub record is reported as installed.
 *
 * The TypeScript sources are imported directly; Node strips the types, which is
 * also what keeps this test honest about the shipped source rather than a build
 * artifact.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import { Context } from '@deepseek-ai/cordis'

import { MARKET_ERROR_CODES, MARKET_LIMITS } from '../src/shared/market.ts'
import { createMarketCache, createSourceHealth } from '../src/host/cache.ts'
import { errorResponseFor } from '../src/host/errors.ts'
import {
  createInstallRegistry,
  createInstallState,
  createSkillRootResolver,
} from '../src/host/install-state.ts'
import { createInstallService, validateInstallFiles } from '../src/host/install-service.ts'
import {
  applyListFilters,
  createMarketService,
  dedupeSkills,
  sortSkills,
} from '../src/host/market-service.ts'
import { isInsideRoot, normalizeRegistryRelPath } from '../src/host/paths.ts'
import { createProviderFetch } from '../src/host/provider-fetch.ts'
import * as skillsHub from '../src/index.ts'

const SILENT_LOGGER = { warn() {} }

// "No network" is enforced, not merely intended: any real request fails loudly.
const REAL_FETCH = globalThis.fetch
globalThis.fetch = () => {
  throw new Error('the host contract test must not touch the network')
}
test.after(() => {
  globalThis.fetch = REAL_FETCH
})

// ─── Fixtures ───────────────────────────────────────────────────────────────

/** One normalized catalog entry, with only the fields a test cares about set. */
function skill(overrides) {
  return {
    id: 'clawhub:alpha',
    source: 'clawhub',
    slug: 'alpha',
    name: 'Alpha',
    summary: '',
    author: { handle: '' },
    stats: { downloads: 0 },
    tags: [],
    securityStatus: 'unknown',
    installState: 'installable',
    ...overrides,
  }
}

/** One registry file entry. */
function file(path, size) {
  return { path, size }
}

/** A detail view the install service accepts as already resolved. */
function detail(slug, overrides = {}) {
  return {
    ...skill({ slug, id: `clawhub:${slug}` }),
    description: '# fixture',
    files: [],
    totalSize: 0,
    ...overrides,
  }
}

/** Create a temporary directory that is removed when `body` settles. */
async function withTempDir(body) {
  const directory = await mkdtemp(join(tmpdir(), 'skills-hub-test-'))
  try {
    return await body(directory)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

/**
 * Build the install half of the plugin against fixture providers.
 *
 * `files`/`contents` describe what the registry lists and serves; `detailState`
 * is the catalog verdict the install service sees.
 */
async function makeInstallHarness(root, options) {
  const {
    files = [],
    contents = {},
    detailState = 'installable',
    fetchFile,
  } = options ?? {}

  const provider = {
    source: 'clawhub',
    async list() {
      return { items: [] }
    },
    async search() {
      return { items: [] }
    },
    async detail(slug) {
      return detail(slug, { installState: detailState })
    },
    async listFiles() {
      return files
    },
    async fetchFile(slug, filePath) {
      if (fetchFile !== undefined) return fetchFile(slug, filePath)
      const content = contents[filePath]
      if (content === undefined) throw new Error(`fixture has no content for ${filePath}`)
      return { content, size: Buffer.byteLength(content, 'utf8') }
    },
  }

  const dshHome = join(root, '.dsh')
  const skillsRoot = join(dshHome, 'skills')
  const registryFile = join(dshHome, 'skills-hub', 'installs.json')
  const registry = createInstallRegistry({ file: registryFile, logger: SILENT_LOGGER })
  const roots = createSkillRootResolver({ installScope: 'user', dshHome, workspace: () => undefined })
  const installState = createInstallState({ registry, roots })
  const service = createInstallService({
    providers: { clawhub: provider, skillhub: { ...provider, source: 'skillhub' } },
    market: { detail: async (id) => detail(id.slice(id.indexOf(':') + 1), { installState: detailState }) },
    registry,
    roots,
    logger: SILENT_LOGGER,
  })

  return { dshHome, skillsRoot, registryFile, registry, roots, installState, service }
}

// ─── 1. Path traversal ──────────────────────────────────────────────────────

test('registry file paths that could escape the skill directory are rejected', () => {
  const rejected = [
    '../evil.md',
    'a/../../b',
    '../../etc/passwd',
    '/etc/passwd',
    'C:\\Windows\\system32\\evil.md',
    'C:evil.md',
    '\\\\server\\share\\evil.md',
    '..\\evil.md',
    'a/..',
    'a/./b',
    'a//b',
    './SKILL.md',
    '~/.ssh/authorized_keys',
    'NUL',
    'con.md',
    'a\u0000b',
    '',
    'trailing.',
    'trailing ',
    'x'.repeat(513),
  ]
  for (const path of rejected) {
    assert.equal(normalizeRegistryRelPath(path), null, `expected ${JSON.stringify(path)} to be rejected`)
  }

  assert.equal(normalizeRegistryRelPath('SKILL.md'), 'SKILL.md')
  assert.equal(normalizeRegistryRelPath('references/guide.md'), 'references/guide.md')
  assert.equal(normalizeRegistryRelPath('a_b/c-d.e'), 'a_b/c-d.e')
})

test('isInsideRoot refuses a sibling and a parent', async () => {
  await withTempDir(async (root) => {
    assert.equal(isInsideRoot(root, join(root, 'a', 'b.md')), true)
    assert.equal(isInsideRoot(root, root), true)
    assert.equal(isInsideRoot(root, join(root, '..', 'evil.md')), false)
    assert.equal(isInsideRoot(join(root, 'a'), join(root, 'b')), false)
  })
})

// ─── 2. Size and count limits ───────────────────────────────────────────────

test('install file validation enforces the count, per-file and total limits', () => {
  const skilMd = file('SKILL.md', 10)

  assert.equal(validateInstallFiles([]).ok, false)
  assert.equal(validateInstallFiles([]).reason, 'empty-file-list')
  assert.equal(validateInstallFiles([file('README.md', 10)]).reason, 'empty-file-list')

  // Path safety is checked before the shape checks, so a hostile payload is
  // always reported as an unsafe path.
  const traversal = validateInstallFiles([skilMd, file('../evil.md', 1)])
  assert.equal(traversal.ok, false)
  assert.equal(traversal.reason, 'invalid-name')
  assert.match(traversal.detail, /\.\.\/evil\.md/)

  const tooMany = [
    skilMd,
    ...Array.from({ length: MARKET_LIMITS.maxFileCount }, (_, index) => file(`f${String(index)}.md`, 1)),
  ]
  assert.equal(tooMany.length, MARKET_LIMITS.maxFileCount + 1)
  assert.equal(validateInstallFiles(tooMany).reason, 'too-many-files')

  assert.equal(
    validateInstallFiles([file('SKILL.md', MARKET_LIMITS.maxFileSize + 1)]).reason,
    'file-too-large',
  )

  // Each file is exactly at the per-file cap, so only the total cap can fire.
  const huge = [
    skilMd,
    ...Array.from({ length: 5 }, (_, index) => file(`b${String(index)}.bin`, MARKET_LIMITS.maxFileSize)),
  ]
  const total = huge.reduce((sum, entry) => sum + entry.size, 0)
  assert.ok(total > MARKET_LIMITS.maxTotalSize)
  assert.equal(validateInstallFiles(huge).reason, 'file-too-large')

  const accepted = validateInstallFiles([skilMd, file('references/guide.md', 10)])
  assert.equal(accepted.ok, true)
  assert.deepEqual(accepted.files.map((entry) => entry.path), ['SKILL.md', 'references/guide.md'])
})

// ─── 3. Merge and dedupe ────────────────────────────────────────────────────

test('a SkillHub mirror folds into its ClawHub original and cannot be emitted twice', () => {
  const original = skill({ id: 'clawhub:pdf', slug: 'pdf' })
  const mirror = skill({
    id: 'skillhub:pdf-cn',
    source: 'skillhub',
    slug: 'pdf-cn',
    upstream: { source: 'clawhub', slug: 'pdf' },
    securityStatus: 'verified',
    tags: ['pdf'],
    iconUrl: 'https://example.test/i.png',
  })
  const native = skill({ id: 'skillhub:solo', source: 'skillhub', slug: 'solo' })

  // The mirror is deliberately first: the merge cannot depend on page order.
  const merged = dedupeSkills([mirror, original, native])

  assert.deepEqual(merged.map((entry) => entry.id), ['clawhub:pdf', 'skillhub:solo'])
  const winner = merged[0]
  assert.equal(winner.securityStatus, 'verified')
  assert.deepEqual(winner.tags, ['pdf'])
  assert.equal(winner.iconUrl, 'https://example.test/i.png')

  // A mirror whose original is not on this page stays a row of its own.
  const orphan = skill({
    id: 'skillhub:ghost',
    source: 'skillhub',
    slug: 'ghost',
    upstream: { source: 'clawhub', slug: 'not-on-this-page' },
  })
  assert.deepEqual(dedupeSkills([orphan]).map((entry) => entry.id), ['skillhub:ghost'])

  // A SkillHub entry that mirrors nothing is untouched.
  assert.deepEqual(dedupeSkills([native]).map((entry) => entry.id), ['skillhub:solo'])
})

test('the page is ordered by downloads with a stable id tiebreak', () => {
  const items = [
    skill({ id: 'clawhub:b', stats: { downloads: 5 } }),
    skill({ id: 'clawhub:c', stats: { downloads: 9 } }),
    skill({ id: 'clawhub:a', stats: { downloads: 5 } }),
  ]
  assert.deepEqual(sortSkills(items).map((entry) => entry.id), ['clawhub:c', 'clawhub:a', 'clawhub:b'])
})

// ─── 4. Filters after the merge ─────────────────────────────────────────────

test('the source, security and install filters apply to the merged page', () => {
  const items = [
    skill({ id: 'clawhub:a', slug: 'a', installState: 'installed' }),
    skill({ id: 'skillhub:b', slug: 'b', source: 'skillhub', securityStatus: 'flagged' }),
    skill({ id: 'clawhub:c', slug: 'c', securityStatus: 'verified', installState: 'not-installable' }),
  ]

  assert.deepEqual(applyListFilters(items, {}).map((entry) => entry.id), ['clawhub:a', 'skillhub:b', 'clawhub:c'])
  assert.deepEqual(applyListFilters(items, { source: 'all' }).length, 3)
  assert.deepEqual(applyListFilters(items, { source: 'skillhub' }).map((entry) => entry.id), ['skillhub:b'])
  assert.deepEqual(applyListFilters(items, { security: 'flagged' }).map((entry) => entry.id), ['skillhub:b'])
  assert.deepEqual(applyListFilters(items, { install: 'installed' }).map((entry) => entry.id), ['clawhub:a'])
  assert.deepEqual(
    applyListFilters(items, { install: 'installable' }).map((entry) => entry.id),
    ['skillhub:b', 'clawhub:c'],
  )
})

test('filters run after the merge, so a folded mirror survives a source filter', () => {
  const original = skill({ id: 'clawhub:pdf', slug: 'pdf' })
  const mirror = skill({
    id: 'skillhub:pdf-cn',
    source: 'skillhub',
    slug: 'pdf-cn',
    upstream: { source: 'clawhub', slug: 'pdf' },
    securityStatus: 'benign',
  })

  const page = applyListFilters(dedupeSkills([original, mirror]), { source: 'clawhub' })
  assert.deepEqual(page.map((entry) => entry.id), ['clawhub:pdf'])
  // The surviving row carries the mirror's scan verdict: proof it merged first.
  assert.equal(page[0].securityStatus, 'benign')
})

test('a narrowing filter suppresses the upstream total instead of a mismatched count', async () => {
  await withTempDir(async (root) => {
    // The live shape that produced this bug: SkillHub reports ~177k skills
    // while the page actually fetched holds none that match the filter, so the
    // panel announced "177122 个技能" above an empty grid.
    const makeProvider = (source, items, total) => ({
      source,
      async list() {
        return { items, total }
      },
      async search() {
        return { items, total }
      },
      async detail() {
        throw new Error('detail is not part of this contract')
      },
      async listFiles() {
        return []
      },
      async fetchFile() {
        throw new Error('fetchFile is not part of this contract')
      },
    })

    const clawhubPage = [
      skill({ id: 'clawhub:a', slug: 'a', securityStatus: 'unknown' }),
      skill({ id: 'clawhub:b', slug: 'b', securityStatus: 'flagged' }),
    ]
    const skillhubPage = [
      skill({ id: 'skillhub:c', slug: 'c', source: 'skillhub', securityStatus: 'unknown' }),
      skill({ id: 'skillhub:d', slug: 'd', source: 'skillhub', securityStatus: 'flagged' }),
    ]

    const dshHome = join(root, '.dsh')
    const registry = createInstallRegistry({
      file: join(dshHome, 'skills-hub', 'installs.json'),
      logger: SILENT_LOGGER,
    })
    const roots = createSkillRootResolver({ installScope: 'user', dshHome, workspace: () => undefined })
    const service = createMarketService({
      providers: {
        clawhub: makeProvider('clawhub', clawhubPage, 177_122),
        skillhub: makeProvider('skillhub', skillhubPage, 23),
      },
      cache: createMarketCache(),
      health: createSourceHealth(),
      cacheTtlMs: 60_000,
      installState: createInstallState({ registry, roots }),
      logger: SILENT_LOGGER,
    })

    // Unfiltered, the registries' totals describe exactly what is being paged.
    const plain = await service.list({})
    assert.equal(plain.total, 177_145)
    assert.equal(plain.items.length, 4)

    // A post-merge filter makes that number describe a different set, so it is
    // withheld and the client falls back to counting the page it can see.
    const flagged = await service.list({ security: 'flagged' })
    assert.equal(flagged.total, undefined)
    assert.deepEqual(flagged.items.map((entry) => entry.id), ['clawhub:b', 'skillhub:d'])

    const installable = await service.list({ install: 'installable' })
    assert.equal(installable.total, undefined)
    assert.equal(installable.items.length, 4)

    // A `source` filter is pushed upstream by querying one registry, so the
    // surviving registry's total still describes the returned set.
    const onlyClawhub = await service.list({ source: 'clawhub' })
    assert.equal(onlyClawhub.total, 177_122)
    assert.deepEqual(onlyClawhub.items.map((entry) => entry.id), ['clawhub:a', 'clawhub:b'])
  })
})

// ─── 5. Atomic install ──────────────────────────────────────────────────────
test('a traversal payload refuses the whole install and writes nothing', async () => {
  await withTempDir(async (root) => {
    const harness = await makeInstallHarness(root, {
      files: [file('SKILL.md', 12), file('../evil.md', 6)],
      contents: { 'SKILL.md': '# alpha\n', '../evil.md': 'pwned\n' },
    })

    await assert.rejects(
      () => harness.service.install('clawhub:alpha'),
      (error) => {
        assert.equal(error.code, MARKET_ERROR_CODES.notInstallable)
        // The error body names the offending registry path but no local path.
        const { status, body } = errorResponseFor(error)
        assert.equal(status, 422)
        assert.equal(body.code, MARKET_ERROR_CODES.notInstallable)
        assert.match(body.error, /unsafe file path/)
        assert.equal(body.error.includes(root), false)
        return true
      },
    )

    // Nothing published, nothing staged, nothing escaped. The rejection
    // happens before the skills root is even created.
    assert.deepEqual(await readdir(harness.skillsRoot).catch(() => []), [])
    await assert.rejects(() => stat(harness.skillsRoot))
    await assert.rejects(() => stat(join(harness.dshHome, 'evil.md')))
  })
})

test('an install refuses to clobber a skill directory this hub did not create', async () => {
  await withTempDir(async (root) => {
    const harness = await makeInstallHarness(root, {
      files: [file('SKILL.md', 12)],
      contents: { 'SKILL.md': '# alpha\n' },
    })
    await mkdir(join(harness.skillsRoot, 'alpha'), { recursive: true })
    await writeFile(join(harness.skillsRoot, 'alpha', 'SKILL.md'), '# hand written\n', 'utf-8')

    await assert.rejects(
      () => harness.service.install('clawhub:alpha'),
      (error) => {
        assert.equal(error.code, MARKET_ERROR_CODES.notManaged)
        assert.equal(error.status, 409)
        return true
      },
    )

    // The existing directory is untouched and no staging directory was left.
    assert.equal(
      await readFile(join(harness.skillsRoot, 'alpha', 'SKILL.md'), 'utf-8'),
      '# hand written\n',
    )
    assert.deepEqual(await readdir(harness.skillsRoot), ['alpha'])
    assert.deepEqual(await readdir(join(harness.skillsRoot, 'alpha')), ['SKILL.md'])
  })
})

test('an install stages beside the target, publishes atomically and records itself', async () => {
  await withTempDir(async (root) => {
    const harness = await makeInstallHarness(root, {
      files: [file('SKILL.md', 12), file('references/guide.md', 7)],
      contents: { 'SKILL.md': '# alpha\n', 'references/guide.md': '# guide' },
    })

    const result = await harness.service.install('clawhub:alpha')
    assert.equal(result.ok, true)
    assert.equal(result.id, 'clawhub:alpha')
    assert.equal(result.dirName, 'alpha')
    assert.equal(result.fileCount, 2)
    // Byte counts come from the fetched bodies, not from the registry's claim.
    assert.equal(result.totalSize, Buffer.byteLength('# alpha\n') + Buffer.byteLength('# guide'))
    assert.equal(result.path, join(harness.skillsRoot, 'alpha'))

    assert.equal(await readFile(join(harness.skillsRoot, 'alpha', 'SKILL.md'), 'utf-8'), '# alpha\n')
    assert.equal(
      await readFile(join(harness.skillsRoot, 'alpha', 'references', 'guide.md'), 'utf-8'),
      '# guide',
    )
    // The skill directory stays a plain DSH skill: no marker file inside it.
    assert.deepEqual(
      (await readdir(join(harness.skillsRoot, 'alpha'))).sort(),
      ['SKILL.md', 'references'],
    )

    // The record lives outside the skill directory and survives a reload.
    const document = JSON.parse(await readFile(harness.registryFile, 'utf-8'))
    assert.equal(document.version, 1)
    assert.equal(document.installs.length, 1)
    assert.equal(document.installs[0].id, 'clawhub:alpha')
    assert.equal(document.installs[0].managed, true)
    assert.deepEqual(document.installs[0].files, ['SKILL.md', 'references/guide.md'])

    const reloaded = createInstallRegistry({ file: harness.registryFile, logger: SILENT_LOGGER })
    await reloaded.load()
    assert.equal(reloaded.get('alpha')?.id, 'clawhub:alpha')

    await assert.rejects(
      () => harness.service.install('clawhub:alpha'),
      (error) => {
        assert.equal(error.code, MARKET_ERROR_CODES.alreadyInstalled)
        return true
      },
    )
  })
})

test('a second install of the same skill while one is running is refused', async () => {
  await withTempDir(async (root) => {
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    const harness = await makeInstallHarness(root, {
      files: [file('SKILL.md', 12)],
      fetchFile: async () => {
        await gate
        return { content: '# alpha\n', size: 8 }
      },
    })

    const first = harness.service.install('clawhub:alpha')
    const second = harness.service.install('clawhub:alpha')
    await assert.rejects(
      second,
      (error) => {
        assert.equal(error.code, MARKET_ERROR_CODES.installInProgress)
        assert.equal(error.status, 409)
        return true
      },
    )

    release()
    const result = await first
    assert.equal(result.ok, true)
    assert.equal(await readFile(join(harness.skillsRoot, 'alpha', 'SKILL.md'), 'utf-8'), '# alpha\n')
  })
})

test('uninstall removes a hub-managed install and refuses an adopted one', async () => {
  await withTempDir(async (root) => {
    const harness = await makeInstallHarness(root, {
      files: [file('SKILL.md', 8)],
      contents: { 'SKILL.md': '# alpha\n' },
    })
    await harness.service.install('clawhub:alpha')

    // A directory this hub never wrote, adopted from disk.
    await mkdir(join(harness.skillsRoot, 'beta'), { recursive: true })
    await writeFile(join(harness.skillsRoot, 'beta', 'SKILL.md'), '# beta\n', 'utf-8')

    await assert.rejects(
      () => harness.service.uninstall('clawhub:beta'),
      (error) => {
        assert.equal(error.code, MARKET_ERROR_CODES.notManaged)
        return true
      },
    )
    assert.equal(await readFile(join(harness.skillsRoot, 'beta', 'SKILL.md'), 'utf-8'), '# beta\n')

    const removed = await harness.service.uninstall('clawhub:alpha')
    assert.equal(removed.ok, true)
    assert.equal(removed.removedPath, join(harness.skillsRoot, 'alpha'))
    await assert.rejects(() => stat(join(harness.skillsRoot, 'alpha')))

    const document = JSON.parse(await readFile(harness.registryFile, 'utf-8'))
    assert.deepEqual(document.installs, [])

    await assert.rejects(
      () => harness.service.uninstall('clawhub:alpha'),
      (error) => {
        assert.equal(error.code, MARKET_ERROR_CODES.notInstalled)
        assert.equal(error.status, 404)
        return true
      },
    )
  })
})

test('an install refuses a skill the registry says is not installable', async () => {
  await withTempDir(async (root) => {
    const harness = await makeInstallHarness(root, {
      files: [file('SKILL.md', 8)],
      contents: { 'SKILL.md': '# alpha\n' },
      detailState: 'not-installable',
    })
    await assert.rejects(
      () => harness.service.install('clawhub:alpha'),
      (error) => {
        assert.equal(error.code, MARKET_ERROR_CODES.notInstallable)
        return true
      },
    )
    assert.deepEqual(await readdir(harness.skillsRoot).catch(() => []), [])
  })
})

test('a malformed skill id is a 400, not an install attempt', async () => {
  await withTempDir(async (root) => {
    const harness = await makeInstallHarness(root, {})
    for (const id of ['', 'alpha', 'unknown:alpha', ':alpha']) {
      await assert.rejects(
        () => harness.service.install(id),
        (error) => {
          assert.equal(error.code, MARKET_ERROR_CODES.badRequest)
          assert.equal(error.status, 400)
          return true
        },
      )
    }
  })
})

test('a recorded install survives a restart: it is still managed, removable, and not re-installable', async () => {
  await withTempDir(async (root) => {
    // First process: install normally.
    const first = await makeInstallHarness(root, {
      files: [file('SKILL.md', 8)],
      contents: { 'SKILL.md': '# alpha\n' },
    })
    await first.service.install('clawhub:alpha')

    // Second process: brand-new registry and service over the same directories.
    const second = await makeInstallHarness(root, {
      files: [file('SKILL.md', 8)],
      contents: { 'SKILL.md': '# replaced\n' },
    })
    assert.equal(second.registry.get('alpha'), undefined, 'the fresh registry starts empty')

    // The very first call on the cold registry is an install: the persisted
    // record must be loaded before the disk probe, or an existing managed
    // directory is mistaken for one this hub never created.
    await assert.rejects(
      () => second.service.install('clawhub:alpha'),
      (error) => {
        assert.equal(error.code, MARKET_ERROR_CODES.alreadyInstalled)
        return true
      },
    )
    assert.equal(await readFile(join(second.skillsRoot, 'alpha', 'SKILL.md'), 'utf-8'), '# alpha\n')

    const installed = await second.installState.installed()
    assert.deepEqual(installed.items.map((entry) => entry.id), ['clawhub:alpha'])
    assert.equal(installed.items[0].installedInfo.managed, true)
    assert.equal(installed.localOnly, 0)

    // Third process, whose very first call is an uninstall: the record is the
    // only thing that may authorise the removal, and it starts unloaded.
    const third = await makeInstallHarness(root, {})
    assert.equal(third.registry.get('alpha'), undefined, 'the fresh registry starts empty')
    const removed = await third.service.uninstall('clawhub:alpha')
    assert.equal(removed.ok, true)
    await assert.rejects(() => stat(join(third.skillsRoot, 'alpha')))
  })
})

// ─── 6. Adoption and the installed view ─────────────────────────────────────

test('a skill directory with no hub record is reported as installed (unmanaged)', async () => {
  await withTempDir(async (root) => {
    const harness = await makeInstallHarness(root, {
      files: [file('SKILL.md', 12)],
      contents: { 'SKILL.md': '# alpha\n' },
    })
    await mkdir(join(harness.skillsRoot, 'alpha'), { recursive: true })
    await writeFile(
      join(harness.skillsRoot, 'alpha', 'SKILL.md'),
      '---\nname: alpha\ndescription: An adopted skill.\n---\n\n# alpha\n',
      'utf-8',
    )
    // A directory the hub did not create and has no record for.
    await mkdir(join(harness.skillsRoot, 'beta'), { recursive: true })
    await writeFile(join(harness.skillsRoot, 'beta', 'SKILL.md'), '# beta\n', 'utf-8')

    const adopted = await harness.installState.annotate(skill({ id: 'clawhub:alpha', slug: 'alpha' }))
    assert.equal(adopted.installState, 'installed')
    assert.equal(adopted.installedInfo.managed, false)
    assert.equal(adopted.installedInfo.dirName, 'alpha')

    // Another registry's copy of the same slug stays blocked by the directory.
    const other = await harness.installState.annotate(
      skill({ id: 'skillhub:alpha', source: 'skillhub', slug: 'alpha' }),
    )
    assert.equal(other.installState, 'installed')
    assert.equal(other.installedInfo.managed, false)

    const page = await harness.installState.installed()
    assert.deepEqual(page.roots, [harness.skillsRoot])
    assert.equal(page.items.length, 0)
    assert.equal(page.localOnly, 2)

    // An adopted directory can never be replaced by an install…
    await assert.rejects(
      () => harness.service.install('clawhub:alpha'),
      (error) => {
        assert.equal(error.code, MARKET_ERROR_CODES.notManaged)
        return true
      },
    )

    // …while a hub-managed install joins the installed view.
    await harness.service.install('clawhub:gamma')
    const installed = await harness.installState.installed()
    assert.deepEqual(installed.items.map((entry) => entry.id), ['clawhub:gamma'])
    assert.equal(installed.items[0].installedInfo.managed, true)
    assert.equal(installed.localOnly, 2)

    // A different registry's entry for a hub-managed directory is a conflict.
    const conflicted = await harness.installState.annotate(
      skill({ id: 'skillhub:gamma', source: 'skillhub', slug: 'gamma' }),
    )
    assert.equal(conflicted.installState, 'not-installable')
    assert.equal(conflicted.notInstallableReason, 'name-conflict')
  })
})

// ─── 8. The fetch helper's timeout, cancellation and size cap ───────────────

/** A transport that never resolves on its own but honours the abort signal. */
function stallingTransport(onCall, errorName) {
  return (_url, init) => {
    onCall()
    return new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        const error = new Error('aborted')
        error.name = errorName
        reject(error)
      })
    })
  }
}

test('a registry request that exceeds the configured timeout is a typed timeout', async () => {
  const health = createSourceHealth()
  const fetcher = createProviderFetch({
    timeoutMs: 20,
    sourceHealth: health,
    fetchImpl: stallingTransport(() => {}, 'TimeoutError'),
  })
  await assert.rejects(
    () => fetcher.json('clawhub', 'https://registry.invalid/api/v1/skills'),
    (error) => {
      assert.equal(error.code, MARKET_ERROR_CODES.upstreamTimeout)
      assert.equal(error.source, 'clawhub')
      return true
    },
  )
  // A timeout is a real registry failure, so it is recorded as such.
  assert.equal(health.get('clawhub').status, 'failed')
})

test('a cancelled registry request stops immediately and is never retried', async () => {
  const health = createSourceHealth()
  let calls = 0
  const fetcher = createProviderFetch({
    timeoutMs: 30_000,
    sourceHealth: health,
    fetchImpl: stallingTransport(() => {
      calls += 1
    }, 'AbortError'),
  })

  const controller = new AbortController()
  const pending = fetcher.request('clawhub', 'https://registry.invalid/api/v1/skills', controller.signal)
  controller.abort()
  await assert.rejects(
    pending,
    (error) => {
      assert.equal(error.code, MARKET_ERROR_CODES.upstreamError)
      assert.match(error.message, /cancelled/)
      return true
    },
  )
  assert.equal(calls, 1, 'a cancelled request must not be retried')
})

test('a registry body over the size cap is refused while it is read', async () => {
  const fetcher = createProviderFetch({ timeoutMs: 1000, sourceHealth: createSourceHealth() })
  await assert.rejects(
    () => fetcher.text('skillhub', new Response('x'.repeat(64)), 16, 'file SKILL.md'),
    (error) => {
      assert.equal(error.code, MARKET_ERROR_CODES.upstreamBadResponse)
      assert.match(error.message, /size limit/)
      return true
    },
  )
  // A body inside the cap is returned whole, with its byte count.
  const ok = await fetcher.text('skillhub', new Response('smal'), 64, 'file SKILL.md')
  assert.deepEqual(ok, { content: 'smal', size: 4 })
})

// ─── 9. Real cordis composition ─────────────────────────────────────────────

/** A minimal `ServerResponse` stand-in that records what the route wrote. */
function captureResponse() {
  const captured = { status: 0, headers: undefined, body: '', headersSent: false, writableEnded: false }
  const res = {
    get headersSent() {
      return captured.headersSent
    },
    get writableEnded() {
      return captured.writableEnded
    },
    writeHead(status, headers) {
      captured.status = status
      captured.headers = headers
      captured.headersSent = true
      return res
    },
    end(body) {
      if (typeof body === 'string') captured.body = body
      else if (body !== undefined) captured.body = String(body)
      captured.writableEnded = true
      return res
    },
  }
  return { res, captured }
}

/** A request stand-in for a route that reads no body. */
function plainRequest(method, path) {
  return { method, url: path, headers: {} }
}

/** A request stand-in carrying a JSON body, backed by a real readable stream. */
function bodyRequest(method, path, body) {
  const stream = Readable.from([Buffer.from(JSON.stringify(body), 'utf8')])
  return Object.assign(stream, { method, url: path, headers: {} })
}

test('the plugin boots in a real cordis composition, binds late and disposes cleanly', async () => {
  await withTempDir(async (root) => {
    const previousHome = process.env.DSH_HOME
    process.env.DSH_HOME = join(root, '.dsh')
    try {
      const routes = []
      const toolDefinitions = []
      const providerFactories = []

      const fakeWebServer = {
        register(route) {
          routes.push(route)
          return () => {
            const index = routes.indexOf(route)
            if (index !== -1) routes.splice(index, 1)
          }
        },
      }
      const fakeTools = {
        register(definition) {
          toolDefinitions.push(definition)
          return () => {
            const index = toolDefinitions.indexOf(definition)
            if (index !== -1) toolDefinitions.splice(index, 1)
          }
        },
      }
      const fakeSkills = {
        registerProvider(create) {
          providerFactories.push(create)
          return () => {
            const index = providerFactories.indexOf(create)
            if (index !== -1) providerFactories.splice(index, 1)
          }
        },
      }

      const ctx = new Context()
      // Load the plugin first, with its config schema defaults: nothing it
      // needs is available yet, so it must load without blocking or throwing.
      const fiber = await ctx.plugin(skillsHub, {})

      assert.equal(skillsHub.name, 'skills-hub')
      assert.deepEqual(skillsHub.inject, [])
      assert.deepEqual(routes, [], 'no Web server is mounted yet')
      assert.deepEqual(toolDefinitions, [])
      assert.deepEqual(providerFactories, [])

      // Now mount the optional services the way a real profile would, after
      // the plugin: the lazy surfaces must bind from the service event.
      await ctx.plugin({
        name: 'skills-hub-test-fixtures',
        apply(fixtureCtx) {
          fixtureCtx.provide('connection', { requestRejection: () => undefined })
          fixtureCtx.provide('workspaceRegistry', { list: () => [{ path: root }] })
          fixtureCtx.provide('webServer', fakeWebServer)
          fixtureCtx.provide('tools', fakeTools)
          fixtureCtx.provide('skills', fakeSkills)
        },
      })

      assert.deepEqual(
        routes.map((route) => route.path).sort(),
        [
          '/plugins/dsh-skills-hub/catalog',
          '/plugins/dsh-skills-hub/file',
          '/plugins/dsh-skills-hub/install',
          '/plugins/dsh-skills-hub/installed',
          '/plugins/dsh-skills-hub/refresh',
          '/plugins/dsh-skills-hub/skill',
          '/plugins/dsh-skills-hub/uninstall',
        ],
      )
      for (const route of routes) assert.equal(route.kind, 'exact')

      // Both tools registered, and `defineTool` accepted both schemas: the
      // supported-JSON-subset assertion runs at definition time.
      assert.deepEqual(
        toolDefinitions.map((definition) => definition.name).sort(),
        ['skill_market_install', 'skill_market_search'],
      )

      // The skill provider is registered and behaves as a provider.
      assert.equal(providerFactories.length, 1)
      const provider = providerFactories[0]({
        signal: new AbortController().signal,
        invalidate() {},
      })
      assert.equal(provider.name, 'skills-hub')
      assert.deepEqual(await provider.list({}), [])

      // Drive a real route end to end: GET /installed against the temporary
      // DSH home, through the authentication fence and the error mapping.
      const installedRoute = routes.find((route) => route.path.endsWith('/installed'))
      const installed = captureResponse()
      await installedRoute.handler(plainRequest('GET', '/plugins/dsh-skills-hub/installed'), installed.res)
      assert.equal(installed.captured.status, 200)
      assert.equal(installed.captured.headers['cache-control'], 'no-store')
      assert.deepEqual(JSON.parse(installed.captured.body), {
        items: [],
        roots: [join(root, '.dsh', 'skills')],
        localOnly: 0,
      })

      // A wrong method is refused before the handler runs.
      const wrongMethod = captureResponse()
      await installedRoute.handler(plainRequest('POST', '/plugins/dsh-skills-hub/installed'), wrongMethod.res)
      assert.equal(wrongMethod.captured.status, 405)
      assert.equal(wrongMethod.captured.headers.allow, 'GET')

      // A POST body reaches the install service, whose rejection becomes a
      // MARKET_BAD_REQUEST error body rather than an unhandled rejection.
      const installRoute = routes.find((route) => route.path.endsWith('/install'))
      const badInstall = captureResponse()
      await installRoute.handler(
        bodyRequest('POST', '/plugins/dsh-skills-hub/install', { id: 'not-a-skill-id' }),
        badInstall.res,
      )
      assert.equal(badInstall.captured.status, 400)
      assert.equal(JSON.parse(badInstall.captured.body).code, MARKET_ERROR_CODES.badRequest)

      // Disposal (an HMR reload) must leave nothing behind.
      await fiber.dispose()
      assert.deepEqual(routes, [], 'routes survived disposal')
      assert.deepEqual(toolDefinitions, [], 'tools survived disposal')
      assert.deepEqual(providerFactories, [], 'the skill provider survived disposal')
    } finally {
      if (previousHome === undefined) delete process.env.DSH_HOME
      else process.env.DSH_HOME = previousHome
    }
  })
})

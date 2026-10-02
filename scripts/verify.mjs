#!/usr/bin/env node
/**
 * Artifact-level verification for dsh-skills-hub.
 *
 * This checks the *shipped shape* rather than behaviour: the manifest, the
 * bundle patch, the two entry points and the browser wrapper. Behavioural
 * checks live in `scripts/*.test.mjs`; the real-composition check (mounting the
 * bundle into a profile) is `dsh --profile <scratch> --dump-config`.
 *
 * Every assertion prints what it read, so a failure is diagnosable without a
 * debugger. Exit code 1 on the first structural problem.
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve, relative } from 'node:path'
import assert from 'node:assert/strict'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const failures = []
let checks = 0

/** Depth-first list of every regular file under `dir`. */
function walkFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkFiles(full))
    else if (entry.isFile()) out.push(full)
  }
  return out
}

function check(label, fn) {
  checks += 1
  try {
    fn()
    process.stdout.write(`  ok   ${label}\n`)
  } catch (error) {
    failures.push({ label, error })
    process.stdout.write(`  FAIL ${label}\n         ${error.message.split('\n')[0]}\n`)
  }
}

function readJson(relative) {
  return JSON.parse(readFileSync(join(root, relative), 'utf8'))
}

function readText(relative) {
  return readFileSync(join(root, relative), 'utf8')
}

process.stdout.write('dsh-skills-hub verify\n')

// ─── Manifest ───────────────────────────────────────────────────────────────

const pkg = readJson('package.json')

check('manifest declares a bundle patch', () => {
  assert.equal(pkg.dsh?.bundle?.patch, './cordis.patch.yml')
})

check('manifest declares a web client half', () => {
  assert.equal(pkg.dsh?.client?.platform, 'web')
  assert.ok(Array.isArray(pkg.dsh?.client?.inject), 'dsh.client.inject must be an array')
})

check('every export points at a real file', () => {
  const targets = [
    pkg.main,
    pkg.types,
    pkg.exports?.['.']?.default,
    pkg.exports?.['.']?.types,
    pkg.exports?.['./client']?.default,
    pkg.exports?.['./client']?.types,
    pkg.exports?.['./cordis.patch.yml'],
  ].filter((value) => typeof value === 'string')
  assert.ok(targets.length >= 6, `expected at least 6 export targets, saw ${targets.length}`)
  for (const target of targets) {
    assert.ok(existsSync(join(root, target)), `missing export target: ${target}`)
  }
})

check('every `files` entry exists', () => {
  for (const entry of pkg.files ?? []) {
    assert.ok(existsSync(join(root, entry)), `declared in files[] but absent: ${entry}`)
  }
})

check('package is ESM and installable', () => {
  assert.equal(pkg.type, 'module')
  assert.equal(pkg.private, undefined, 'package must be publishable')
  assert.match(pkg.name, /^@[a-z0-9-]+\/[a-z0-9-]+$/)
})

// ─── Bundle patch ───────────────────────────────────────────────────────────

check('bundle patch mounts this package by name', () => {
  const patch = readText('cordis.patch.yml')
  assert.match(patch, /^-\s*insert:/m, 'patch must be a top-level insert list')
  assert.ok(
    patch.includes(`'${pkg.name}'`),
    `patch does not reference the manifest name ${pkg.name}`,
  )
  assert.match(patch, /id:\s*skills-hub/)
})

check('bundle patch config keys are the ones the schema declares', () => {
  const patch = readText('cordis.patch.yml')
  const declared = [...patch.matchAll(/^\s{8}([A-Za-z][A-Za-z0-9]*):/gm)].map((m) => m[1])
  assert.ok(declared.length > 0, 'expected config keys in the patch')
  const source = readText('src/index.ts')
  for (const key of declared) {
    assert.ok(
      new RegExp(`\\b${key}\\b`).test(source),
      `patch passes "${key}" but src/index.ts never mentions it`,
    )
  }
})

// ─── Host half ──────────────────────────────────────────────────────────────

check('host entry exports a loadable plugin', async () => {
  const url = new URL(`file://${join(root, pkg.main).replaceAll('\\', '/')}`)
  const mod = await import(url.href)
  assert.equal(typeof mod.apply, 'function', 'apply must be exported')
  assert.ok(mod.name, 'name must be exported')
  assert.ok(mod.Config, 'Config schema must be exported')
  assert.ok(Array.isArray(mod.inject), 'inject must be an array')
})

check('host entry imports no client code', () => {
  const source = readText(pkg.main)
  assert.ok(!source.includes('react'), 'the host half must not touch React')
  assert.ok(!/from\s+['"].*\/client\//.test(source), 'the host half must not import src/client')
})

// ─── Browser half ───────────────────────────────────────────────────────────

check('browser bundle is wrapped for the module loader', () => {
  const bundle = readText(pkg.exports['./client'].default)
  const escaped = JSON.stringify(pkg.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  assert.match(
    bundle,
    new RegExp(`window\\.__ModuleLoader__\\.load\\(\\{\\s*id:\\s*${escaped}`),
    `bundle must open with the loader call for id ${pkg.name}`,
  )
  assert.match(bundle, /factory:\s*\(require\)\s*=>\s*\{/)
  assert.match(bundle, /return module\.exports;\s*\}\s*\}\);/, 'bundle must close the factory')
  assert.match(bundle, /sourceMappingURL=client\.js\.map/, 'bundle must reference its sourcemap')
})

check('browser bundle only requires platform modules', () => {
  const bundle = readText(pkg.exports['./client'].default)
  const platform = new Set([
    'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis',
    '@deepseek-ai/dsh-client-store', '@deepseek-ai/dsh-client-ui-slots',
    '@deepseek-ai/dsh-client-ui-primitives',
  ])
  const required = new Set([...bundle.matchAll(/require\((["'])([^"']+)\1\)/g)].map((m) => m[2]))
  for (const id of required) {
    assert.ok(platform.has(id), `bundle requires non-platform module "${id}" at runtime`)
  }
  process.stdout.write(`         requires: ${[...required].sort().join(', ')}\n`)
})

check('browser bundle inlines its stylesheet', () => {
  const bundle = readText(pkg.exports['./client'].default)
  assert.ok(bundle.includes('data-plugin-css'), 'CSS Modules text was not injected')
  assert.ok(
    bundle.includes(JSON.stringify(pkg.name)),
    'style tag must be tagged with the package name',
  )
})

check('browser bundle carries a sourcemap', () => {
  const bundle = pkg.exports['./client'].default
  assert.ok(existsSync(join(root, `${bundle}.map`)), `missing sourcemap for ${bundle}`)
})

check('browser bundle has no hard-coded theme colours', () => {
  const bundle = readText(pkg.exports['./client'].default)
  const hexes = [...bundle.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0])
  // Sourcemaps and minified identifiers can look hex-like; only fail on CSS-ish hits.
  const suspicious = hexes.filter((hex) => /^#(?:[0-9a-f]{2}){3}$/i.test(hex))
  assert.ok(
    suspicious.length === 0,
    `bundle embeds literal colours (${suspicious.slice(0, 5).join(', ')}); use --dsw-* tokens`,
  )
})

// ─── Source hygiene ─────────────────────────────────────────────────────────

check('client sources use type-only cross-plugin imports', () => {
  const clientDir = join(root, 'src/client')
  if (!existsSync(clientDir)) {
    throw new Error('src/client is missing')
  }
  // The build's purity gate is the authority on what may be *bundled*; this
  // check catches the same mistake earlier and with a better message: a value
  // import of a package the browser module table cannot answer.
  const platform = new Set([
    'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis',
    '@deepseek-ai/dsh-client-store', '@deepseek-ai/dsh-client-ui-slots',
    '@deepseek-ai/dsh-client-ui-primitives',
  ])
  const offenders = []
  for (const file of walkFiles(clientDir)) {
    if (!/\.(?:ts|tsx)$/.test(file)) continue
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/^\s*import\s+(?!type\b)([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/gm)) {
      const specifier = match[2]
      if (!specifier.startsWith('@deepseek-ai/')) continue
      if (platform.has(specifier)) continue
      offenders.push(`${relative(root, file)} imports "${specifier}" as a value`)
    }
  }
  assert.equal(offenders.length, 0, offenders.join('; '))
  assert.ok(
    readText('tsdown.config.ts').includes('dsh-client-bundle-purity'),
    'purity plugin missing from tsdown config',
  )
})

check('no source file writes to process.cwd() for user state', () => {
  const host = readText('src/index.ts')
  assert.ok(
    !/join\(\s*process\.cwd\(\)/.test(host),
    'user data must not be rooted at process.cwd()',
  )
})

// ─── Summary ────────────────────────────────────────────────────────────────

process.stdout.write(`\n${checks - failures.length}/${checks} checks passed\n`)
if (failures.length > 0) {
  process.stdout.write('\nfailures:\n')
  for (const { label, error } of failures) {
    process.stdout.write(`  - ${label}\n    ${error.message}\n`)
  }
  process.exit(1)
}
process.stdout.write('verify: ok\n')

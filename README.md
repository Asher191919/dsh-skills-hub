# Skills Hub for DeepSeek Harness

A skill marketplace panel inside the DSH web GUI. Browse, search, filter, preview
and install agent skills from [ClawHub](https://clawhub.ai) and
[SkillHub](https://api.skillhub.cn) without leaving the Harness.

The UI is a port of the skills-market screen from
[cc-haha](https://github.com/NanmiCoder/cc-haha), rebuilt on the DSH slot system
and theme tokens.

## What it does

- **One merged catalog.** ClawHub (cursor pagination, no scan verdicts) and
  SkillHub (page/pageSize pagination, security reports) are normalized into one
  shape, deduped — a SkillHub entry that mirrors a ClawHub skill collapses into
  the ClawHub entry — then filtered and sorted as a single list.
- **Honest health.** Each registry reports its own status. One upstream being
  down degrades the banner, not the grid; the last good snapshot stays readable.
- **Real installs.** A skill is fetched file by file, validated, staged and
  published atomically into a directory DSH already discovers — so it appears in
  the skill catalog immediately, with no restart.
- **Preview before install.** The detail view shows the `SKILL.md` body, the
  full file list, per-file previews, the scanner reports and the changelog.
- **Agent-accessible.** Two tools (`skill_market_search`, `skill_market_install`)
  let a session find and install a skill on its own.

## Install

```sh
dsh plugin --profile <name> add @nanmicoder/dsh-skills-hub
```

Or straight from Git:

```sh
dsh plugin --profile <name> add github:Asher191919/dsh-skills-hub
```

The repository commits its build output (`lib/`), so the Git path needs no
`prepare` script and no `allowBuilds` entry in the profile. Rebuild with
`pnpm build` before pushing a change.

Restart the profile afterwards. The plugin mounts as the `skills-hub` bundle row.

Open the panel from the marketplace icon in the sidebar rail.

## Configuration

The bundle patch ships working defaults; override them on the `skills-hub` row
in the profile's `cordis.yml`.

| Key | Default | Meaning |
| --- | --- | --- |
| `installScope` | `user` | `user` installs into `<dsh home>/skills` (every workspace); `project` installs into `<workspace>/.dsh/skills` (that workspace only). |
| `clawhubBase` | `https://clawhub.ai` | ClawHub API base. Point at a mirror or a fixture server. |
| `skillhubBase` | `https://api.skillhub.cn` | SkillHub API base. |
| `cacheTtlMs` | `300000` | Catalog cache lifetime. |
| `timeoutMs` | `15000` | Upstream request timeout. |

## Where skills land

The plugin writes only into roots DSH already scans:

- `user` scope → `<dsh home>/skills` — discovered as `user-dsh`
- `project` scope → `<workspace>/.dsh/skills` — discovered as `project-dsh`

`<dsh home>` is `$DSH_HOME`, else `~/.dsh`.

The DSH skill watcher picks the new directory up on its own, so an install is
visible in the skill catalog without a restart.

## Safety posture

Installing a skill downloads and executes nothing, but it does put third-party
instructions in front of your agent. The plugin is built accordingly:

- **Nothing is written until everything validates.** A skill is staged next to
  its target and published in one step; a failure leaves no partial directory.
- **Path traversal is rejected outright.** Every registry-supplied path is
  normalized and confined to the skill directory. A single escaping path aborts
  the whole install.
- **Size and shape limits** (`5 MiB` per file, `20 MiB` and `200` files per
  skill) fail the install with a stated reason instead of a partial write.
- **Existing directories are never clobbered.** A skill directory the hub did
  not install is adopted as read-only `installed` state; overwriting it and
  uninstalling it are both refused.
- **The banner tells the truth.** The panel says plainly that these are
  community sources with no security audit by this application, and suggests
  reviewing the files — or having the agent scan them — before use.

## Development

```sh
pnpm install
pnpm typecheck
pnpm build        # tsc (host) + tsc (client) + tsdown (browser bundle)
pnpm test
pnpm verify
```

`pnpm build` emits `lib/index.js` (host half) and `lib/client.js` (browser half,
wrapped for `window.__ModuleLoader__`).

## License

MIT

# 技能市场 (Skills Hub) for DeepSeek Harness

在 DSH Web GUI 里直接浏览、搜索、筛选、预览并安装来自
[ClawHub](https://clawhub.ai) 与 [SkillHub](https://api.skillhub.cn) 的 agent 技能。

界面移植自 [cc-haha](https://github.com/NanmiCoder/cc-haha) 的技能市场页，
基于 DSH 的 slot 体系与主题 token 重写。

## 功能

- **合并目录。** ClawHub（游标分页、无扫描结论）与 SkillHub（page/pageSize 分页、
  带安全报告）归一化成同一份数据模型，去重后合并 —— SkillHub 上镜像自 ClawHub 的
  条目会收拢进 ClawHub 条目 —— 再作为一个列表统一筛选和排序。
- **如实反馈来源健康度。** 每个上游各自汇报状态。某一个上游挂掉只会让提示条降级，
  不会让整个网格变空；最后一次成功的快照仍然可读。
- **真实安装。** 技能逐文件拉取、校验，暂存后原子发布到 DSH 已经会扫描的目录，
  因此装完立刻出现在技能目录里，无需重启。
- **装前可预览。** 详情页展示 `SKILL.md` 正文、完整文件列表、单文件预览、
  各扫描器的结论和更新日志。
- **Agent 也能用。** 提供 `skill_market_search` 与 `skill_market_install` 两个工具，
  会话可以自己搜索并安装技能。

## 安装

```sh
dsh plugin --profile <name> add @asher191919/dsh-skills-hub
```

或直接从 Git 安装：

```sh
dsh plugin --profile <name> add github:Asher191919/dsh-skills-hub
```

仓库把构建产物（`lib/`）一并提交，所以 Git 安装路径不需要 `prepare` 脚本，
也不需要 profile 里的 `allowBuilds` 配置。推送前先跑 `pnpm build`。

安装后重启该 profile。插件会作为 `skills-hub` 这一 bundle 行挂载。

在左侧边栏的全局面板图标里打开技能市场。

## 配置

bundle patch 自带可用默认值；在 profile 的 `cordis.yml` 中覆盖 `skills-hub` 行即可。

| 键 | 默认值 | 含义 |
| --- | --- | --- |
| `installScope` | `user` | `user` 装到 `<dsh home>/skills`（所有工作区可用）；`project` 装到 `<workspace>/.dsh/skills`（仅当前工作区）。 |
| `clawhubBase` | `https://clawhub.ai` | ClawHub API 基址，可指向镜像或本地 fixture。 |
| `skillhubBase` | `https://api.skillhub.cn` | SkillHub API 基址。 |
| `cacheTtlMs` | `300000` | 目录缓存有效期。 |
| `timeoutMs` | `15000` | 上游请求超时。 |

## 技能装到哪里

插件只写入 DSH 本来就会扫描的根目录：

- `user` 范围 → `<dsh home>/skills`，来源标记为 `user-dsh`
- `project` 范围 → `<workspace>/.dsh/skills`，来源标记为 `project-dsh`

其中 `<dsh home>` 取 `$DSH_HOME`，否则为 `~/.dsh`。

DSH 的技能 watcher 会自己发现新目录，所以安装结果无需重启即可出现在技能目录中。

## 安全取向

安装技能不会执行任何代码，但它会把第三方指令送到你的 agent 面前。插件据此设计：

- **全部校验通过才落盘。** 技能先在目标旁暂存，再一步发布；失败不会留下半个目录。
- **直接拒绝路径穿越。** 每个注册表给出的路径都会归一化并被限制在技能目录内，
  只要有一个路径逃逸就整体放弃安装。
- **体积与形态上限**（单文件 `5 MiB`、单技能 `20 MiB` 与 `200` 个文件）会带着明确
  原因让安装失败，而不是写一半。
- **绝不覆盖已有目录。** 非本插件安装的技能目录会被识别为只读的「已安装」状态；
  覆盖和卸载都会被拒绝。
- **提示条说实话。** 面板明确写出这些是社区第三方来源、本应用不做安全审计，
  并建议先查看技能文件，或先让 AI 扫描一遍再使用。

## 开发

```sh
pnpm install
pnpm typecheck
pnpm build        # tsc（host） + tsc（client） + tsdown（浏览器产物）
pnpm test
pnpm verify
```

`pnpm build` 产出 `lib/index.js`（host 半边）与 `lib/client.js`（浏览器半边，
已按 `window.__ModuleLoader__` 协议包装）。

## 许可证

MIT

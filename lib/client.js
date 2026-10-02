window.__ModuleLoader__.load({
	id: "@nanmicoder/dsh-skills-hub",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		//#region lib/client/locales.js
		/**
		* Locale dictionaries for the 「技能市场」 panel.
		*
		* Both shipped locales are registered in one `ctx.locale.register` call, and the
		* namespace is merged into the framework's `LocaleNamespaceMap` so the `t` seat
		* the slot machinery injects is key-typed: a typo in a key is a compile error,
		* and both dictionaries must carry the identical key set (the English one is
		* declared as `Record<SkillsHubKey, string>` for exactly that reason).
		*
		* @module dsh-skills-hub/client/locales
		*/
		/** Dictionary namespace owned by this plugin. */
		const LOCALE_NAMESPACE = "skillsHub";
		/** Simplified Chinese copy — the product's primary language. */
		const zh = {
			"panel.title": "技能市场",
			"panel.subtitle": "浏览、预览并安装来自 ClawHub 与 SkillHub 的技能。",
			"panel.refresh": "刷新",
			"panel.refreshing": "正在刷新…",
			"disclaimer.title": "第三方技能，谨慎使用。",
			"disclaimer.body": "技能来自社区第三方来源，本应用不对其内容做安全审计。安装前请先查看技能文件，建议先让 AI 扫描一遍，确认安全后再使用。",
			"disclaimer.dismiss": "关闭安全提示",
			"search.label": "搜索技能",
			"search.placeholder": "按名称、关键词搜索技能...",
			"search.clear": "清除搜索",
			"filter.source": "来源",
			"filter.security": "安全状态",
			"filter.install": "安装状态",
			"filter.active": "已筛选：{summary}",
			"filter.clear": "清除筛选",
			"source.all": "全部来源",
			"source.clawhub": "ClawHub",
			"source.skillhub": "SkillHub",
			"security.all": "全部安全状态",
			"security.verified": "已验证",
			"security.benign": "未发现问题",
			"security.unknown": "未扫描",
			"security.flagged": "有风险",
			"securityShort.verified": "已验证",
			"securityShort.benign": "安全",
			"securityShort.unknown": "未扫描",
			"securityShort.flagged": "风险",
			"securityHint.verified": "注册表已认证发布者，且所有扫描器均未发现问题。",
			"securityHint.benign": "已通过安全扫描，未发现问题。",
			"securityHint.unknown": "该来源不提供安全扫描结果，安装前请自行检查文件。",
			"securityHint.flagged": "至少一个扫描器标记了风险，请谨慎安装。",
			"installFilter.all": "全部安装状态",
			"installFilter.installed": "已安装",
			"installFilter.installable": "可安装",
			"sourceStatus.label": "来源状态",
			"sourceStatus.ok": "正常",
			"sourceStatus.cached": "缓存",
			"sourceStatus.cachedAt": "缓存 · {time}",
			"sourceStatus.degraded": "降级",
			"sourceStatus.failed": "失败",
			"count.skills": "{count} 个技能",
			"count.updated": "更新于 {date}",
			"notice.dismiss": "关闭提示",
			"state.loading": "正在加载技能…",
			"state.loadingMore": "正在加载更多…",
			"state.loadMore": "加载更多",
			"state.empty": "暂无技能",
			"state.emptyHint": "上游注册表没有返回任何技能，稍后再试或换个来源。",
			"state.emptySearch": "没有匹配的技能",
			"state.emptySearchHint": "试试其他关键词，或清除当前的筛选条件。",
			"state.emptyUnreachable": "注册表无法访问",
			"state.emptyUnreachableHint": "当前无法连接任何技能来源，请检查网络或稍后重试。",
			"state.error": "技能列表加载失败",
			"state.retry": "重试",
			"card.open": "查看技能 {name}",
			"card.noSummary": "上游未提供简介。",
			"card.moreTags": "+{count}",
			"card.downloads": "下载量",
			"card.stars": "星标",
			"install.action": "安装",
			"install.installing": "安装中…",
			"install.state.installed": "已安装",
			"install.state.installable": "可安装",
			"install.state.notInstallable": "不可安装",
			"install.uninstall": "卸载",
			"install.uninstalling": "卸载中…",
			"install.success": "已安装到 {dir}",
			"install.already": "该技能已安装。",
			"install.removed": "已卸载 {name}",
			"install.failed": "安装失败",
			"install.uninstallFailed": "卸载失败",
			"reason.empty-file-list": "上游没有提供文件列表。",
			"reason.file-too-large": "存在超过大小上限的文件。",
			"reason.too-many-files": "文件数量超过上限。",
			"reason.invalid-name": "技能名称无法用作目录名。",
			"reason.name-conflict": "与已安装的目录重名。",
			"reason.source-unavailable": "来源当前不可用。",
			"detail.back": "返回列表",
			"detail.overview": "概览",
			"detail.files": "文件",
			"detail.security": "安全",
			"detail.tabs": "{name} 的详情分区",
			"detail.noDescription": "该技能没有提供说明文档。",
			"detail.files.title": "共 {count} 个文件 · {size}",
			"detail.files.empty": "上游没有提供文件列表。",
			"detail.files.preview": "预览 {path}",
			"detail.files.tooBig": "文件过大，无法预览。",
			"detail.files.selected": "当前预览",
			"detail.preview.loading": "正在加载文件…",
			"detail.preview.error": "文件加载失败",
			"detail.preview.truncated": "内容过长，已截断显示。",
			"detail.preview.close": "关闭预览",
			"detail.security.empty": "上游没有提供安全扫描报告。",
			"detail.security.vendor": "扫描器",
			"detail.security.status": "结果",
			"detail.security.viewReport": "查看报告",
			"detail.changelog": "更新日志",
			"detail.license": "许可证",
			"detail.updated": "更新于 {date}",
			"detail.page": "在上游查看",
			"detail.apiKey": "需要 API Key",
			"detail.upstream": "镜像自 {source}",
			"detail.stats.downloads": "下载量",
			"detail.stats.installs": "安装量",
			"detail.stats.stars": "星标",
			"detail.stats.installedAt": "安装时间",
			"detail.installedAt": "安装于 {date}",
			"detail.dir": "安装目录"
		};
		/** English copy — a faithful translation of {@link zh}, key for key. */
		const en = {
			"panel.title": "Skills Market",
			"panel.subtitle": "Browse, preview and install skills from ClawHub and SkillHub.",
			"panel.refresh": "Refresh",
			"panel.refreshing": "Refreshing…",
			"disclaimer.title": "Third-party skills — use with caution.",
			"disclaimer.body": "Skills come from third-party community sources and this app does not audit their contents. Review the skill files before installing; ideally have an AI scan them first and only use them once you are satisfied they are safe.",
			"disclaimer.dismiss": "Dismiss the security notice",
			"search.label": "Search skills",
			"search.placeholder": "Search skills by name or keyword...",
			"search.clear": "Clear search",
			"filter.source": "Source",
			"filter.security": "Security",
			"filter.install": "Install state",
			"filter.active": "Filtered: {summary}",
			"filter.clear": "Clear filters",
			"source.all": "All sources",
			"source.clawhub": "ClawHub",
			"source.skillhub": "SkillHub",
			"security.all": "All security states",
			"security.verified": "Verified",
			"security.benign": "Benign",
			"security.unknown": "Not scanned",
			"security.flagged": "Flagged",
			"securityShort.verified": "Verified",
			"securityShort.benign": "Safe",
			"securityShort.unknown": "Unscanned",
			"securityShort.flagged": "At risk",
			"securityHint.verified": "The registry vouches for the publisher and no scanner flagged this version.",
			"securityHint.benign": "Scanned; nothing was flagged.",
			"securityHint.unknown": "This source ships no scan verdict — inspect the files yourself before installing.",
			"securityHint.flagged": "At least one scanner flagged this version. Install with caution.",
			"installFilter.all": "All install states",
			"installFilter.installed": "Installed",
			"installFilter.installable": "Installable",
			"sourceStatus.label": "Source status",
			"sourceStatus.ok": "ok",
			"sourceStatus.cached": "cached",
			"sourceStatus.cachedAt": "cached · {time}",
			"sourceStatus.degraded": "degraded",
			"sourceStatus.failed": "failed",
			"count.skills": "{count} skills",
			"count.updated": "updated {date}",
			"notice.dismiss": "Dismiss notice",
			"state.loading": "Loading skills…",
			"state.loadingMore": "Loading more…",
			"state.loadMore": "Load more",
			"state.empty": "No skills yet",
			"state.emptyHint": "The upstream registries returned nothing. Try again later or switch sources.",
			"state.emptySearch": "No matching skills",
			"state.emptySearchHint": "Try another keyword, or clear the active filters.",
			"state.emptyUnreachable": "Registries unreachable",
			"state.emptyUnreachableHint": "No skill source could be reached. Check your connection and try again.",
			"state.error": "Could not load the skill list",
			"state.retry": "Retry",
			"card.open": "View skill {name}",
			"card.noSummary": "Upstream provided no summary.",
			"card.moreTags": "+{count}",
			"card.downloads": "Downloads",
			"card.stars": "Stars",
			"install.action": "Install",
			"install.installing": "Installing…",
			"install.state.installed": "Installed",
			"install.state.installable": "Installable",
			"install.state.notInstallable": "Not installable",
			"install.uninstall": "Uninstall",
			"install.uninstalling": "Uninstalling…",
			"install.success": "Installed to {dir}",
			"install.already": "This skill is already installed.",
			"install.removed": "Uninstalled {name}",
			"install.failed": "Install failed",
			"install.uninstallFailed": "Uninstall failed",
			"reason.empty-file-list": "Upstream returned no file list.",
			"reason.file-too-large": "A file exceeds the size limit.",
			"reason.too-many-files": "Too many files.",
			"reason.invalid-name": "The skill name is not a usable directory name.",
			"reason.name-conflict": "A directory with this name already exists.",
			"reason.source-unavailable": "The source is currently unavailable.",
			"detail.back": "Back to list",
			"detail.overview": "Overview",
			"detail.files": "Files",
			"detail.security": "Security",
			"detail.tabs": "Detail sections of {name}",
			"detail.noDescription": "This skill provides no SKILL.md description.",
			"detail.files.title": "{count} files · {size}",
			"detail.files.empty": "Upstream returned no file list.",
			"detail.files.preview": "Preview {path}",
			"detail.files.tooBig": "File is too large to preview.",
			"detail.files.selected": "Currently previewing",
			"detail.preview.loading": "Loading file…",
			"detail.preview.error": "Could not load the file",
			"detail.preview.truncated": "Content truncated for display.",
			"detail.preview.close": "Close preview",
			"detail.security.empty": "Upstream provided no security reports.",
			"detail.security.vendor": "Scanner",
			"detail.security.status": "Result",
			"detail.security.viewReport": "View report",
			"detail.changelog": "Changelog",
			"detail.license": "License",
			"detail.updated": "Updated {date}",
			"detail.page": "View upstream",
			"detail.apiKey": "Requires an API key",
			"detail.upstream": "Mirrored from {source}",
			"detail.stats.downloads": "Downloads",
			"detail.stats.installs": "Installs",
			"detail.stats.stars": "Stars",
			"detail.stats.installedAt": "Installed at",
			"detail.installedAt": "Installed {date}",
			"detail.dir": "Install directory"
		};
		//#endregion
		//#region lib/shared/market.js
		/**
		* Skills Hub — the wire contract shared by the host half and the browser half.
		*
		* This module must stay **type-only for the client bundle**: the client imports
		* it with `import type`, so nothing here may carry runtime values that the
		* browser half needs (the client bundle purity gate forbids cross-plugin value
		* imports, and a local value module would be inlined twice). Pure helpers that
		* both halves genuinely need live here as `const`/`function` exports and are
		* small enough to duplicate safely — they are marked CLIENT-SAFE.
		*
		* Upstream registries:
		*  - ClawHub  (https://clawhub.ai)      — cursor pagination, no security audits
		*  - SkillHub (https://api.skillhub.cn) — page/pageSize pagination, security reports
		*
		* @module dsh-skills-hub/shared/market
		*/
		/** Every registry this plugin aggregates, in display order. CLIENT-SAFE. */
		const MARKET_SOURCES = ["clawhub", "skillhub"];
		/** Every security status, in the filter bar's order. CLIENT-SAFE. */
		const SECURITY_STATUSES = [
			"verified",
			"benign",
			"unknown",
			"flagged"
		];
		/** Stable error codes, so the client can branch without matching prose. */
		const MARKET_ERROR_CODES = {
			upstreamError: "MARKET_UPSTREAM_ERROR",
			upstreamTimeout: "MARKET_UPSTREAM_TIMEOUT",
			upstreamBadResponse: "MARKET_UPSTREAM_BAD_RESPONSE",
			installInProgress: "MARKET_INSTALL_IN_PROGRESS",
			alreadyInstalled: "MARKET_ALREADY_INSTALLED",
			notInstallable: "MARKET_NOT_INSTALLABLE",
			checksumMismatch: "MARKET_CHECKSUM_MISMATCH",
			diskError: "MARKET_DISK_ERROR",
			notInstalled: "MARKET_NOT_INSTALLED",
			notManaged: "MARKET_NOT_MANAGED",
			badRequest: "MARKET_BAD_REQUEST",
			sourceUnavailable: "MARKET_SOURCE_UNAVAILABLE",
			/**
			* An unrecognized failure, i.e. a bug. It exists so the canned 500 does not
			* have to borrow `diskError` and claim a disk problem that did not happen.
			*/
			internal: "MARKET_INTERNAL_ERROR"
		};
		/** Hard bounds, mirrored from the reference implementation. */
		const MARKET_LIMITS = {
			/** Max bytes for a single skill file (install + preview). */
			maxFileSize: 5 * 1024 * 1024,
			/** Max total bytes for an installable skill. */
			maxTotalSize: 20 * 1024 * 1024,
			/** Max file count for an installable skill. */
			maxFileCount: 200,
			/** File preview content is truncated beyond this many bytes. */
			previewTruncateBytes: 300 * 1024,
			/** ClawHub search has no pagination — cap merged search results. */
			searchResultCap: 50,
			/** Grid page size. */
			pageSize: 24
		};
		//#endregion
		//#region lib/client/cx.js
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
		function cx(...parts) {
			let out = "";
			for (const part of parts) {
				if (part === false || part === null || part === void 0 || part === "") continue;
				out = out === "" ? part : `${out} ${part}`;
			}
			return out;
		}
		/** Read one CSS-Module class, tolerating an unknown local name. */
		function cls(module, name) {
			return module[name] ?? "";
		}
		//#endregion
		//#region lib/client/icons.js
		function Svg({ size = 16, strokeWidth = 1.6, className, children }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				className,
				width: size,
				height: size,
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				focusable: "false",
				children
			});
		}
		/** Storefront — the panel's identity mark. */
		function StoreIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [
					(0, react_jsx_runtime.jsx)("path", { d: "M3.5 9.5 5.5 4h13l2 5.5" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M4.5 9.5h15V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19Z" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M9.5 13.5h5" })
				]
			});
		}
		/** Magnifier — the search field's leading glyph. */
		function SearchIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [(0, react_jsx_runtime.jsx)("circle", {
					cx: "11",
					cy: "11",
					r: "6.5"
				}), (0, react_jsx_runtime.jsx)("path", { d: "m15.8 15.8 4.2 4.2" })]
			});
		}
		/** Circular arrow — refresh. */
		function RefreshIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [(0, react_jsx_runtime.jsx)("path", { d: "M20.5 12a8.5 8.5 0 1 1-2.5-6" }), (0, react_jsx_runtime.jsx)("path", { d: "M20.5 4v5h-5" })]
			});
		}
		/** Cross — dismiss. */
		function CloseIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [(0, react_jsx_runtime.jsx)("path", { d: "m6.5 6.5 11 11" }), (0, react_jsx_runtime.jsx)("path", { d: "m17.5 6.5-11 11" })]
			});
		}
		/** Left arrow — the detail surface's back control. */
		function ArrowLeftIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [(0, react_jsx_runtime.jsx)("path", { d: "M19.5 12h-15" }), (0, react_jsx_runtime.jsx)("path", { d: "m10.5 18-6-6 6-6" })]
			});
		}
		/** Down arrow into a tray — install and download counts. */
		function DownloadIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [
					(0, react_jsx_runtime.jsx)("path", { d: "M12 4v10.5" }),
					(0, react_jsx_runtime.jsx)("path", { d: "m7.5 10.5 4.5 4.5 4.5-4.5" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M5 19.5h14" })
				]
			});
		}
		/** Star — star counts. */
		function StarIcon(props) {
			return (0, react_jsx_runtime.jsx)(Svg, {
				...props,
				children: (0, react_jsx_runtime.jsx)("path", { d: "m12 4.2 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.9l5.4-.8Z" })
			});
		}
		const SHIELD = "M12 3.4 5.2 6.1v5.3c0 4.3 2.8 7.7 6.8 9.2 4-1.5 6.8-4.9 6.8-9.2V6.1Z";
		/** Shield with an exclamation — a flagged scan. */
		function ShieldAlertIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [
					(0, react_jsx_runtime.jsx)("path", { d: SHIELD }),
					(0, react_jsx_runtime.jsx)("path", { d: "M12 9v4.2" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M12 16.4h.01" })
				]
			});
		}
		/** Shield with a check — a scanned, clean skill. */
		function ShieldCheckIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [(0, react_jsx_runtime.jsx)("path", { d: SHIELD }), (0, react_jsx_runtime.jsx)("path", { d: "m9.2 12.1 2.1 2.1 4-4.4" })]
			});
		}
		/** Shield with a question mark — never scanned. */
		function ShieldQuestionIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [
					(0, react_jsx_runtime.jsx)("path", { d: SHIELD }),
					(0, react_jsx_runtime.jsx)("path", { d: "M10.1 10.3a1.9 1.9 0 1 1 2.5 1.8c-.6.2-.9.7-.9 1.3v.3" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M11.7 16.4h.01" })
				]
			});
		}
		/** Rosette with a check — a registry-verified publisher. */
		function BadgeCheckIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [(0, react_jsx_runtime.jsx)("path", { d: "M12 3.2 9.9 5.1 7.2 4.9 6.4 7.5 4.2 9.2l1 2.6-1 2.6 2.2 1.7.8 2.6 2.7-.2 2.1 1.9 2.1-1.9 2.7.2.8-2.6 2.2-1.7-1-2.6 1-2.6-2.2-1.7-.8-2.6-2.7.2Z" }), (0, react_jsx_runtime.jsx)("path", { d: "m9.2 12.1 2.1 2.1 4-4.4" })]
			});
		}
		/** Circle with a check — installed. */
		function CheckCircleIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [(0, react_jsx_runtime.jsx)("circle", {
					cx: "12",
					cy: "12",
					r: "8.5"
				}), (0, react_jsx_runtime.jsx)("path", { d: "m8.2 12.3 2.5 2.5 5.1-5.6" })]
			});
		}
		/** Struck-through circle — not installable. */
		function CircleSlashIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [(0, react_jsx_runtime.jsx)("circle", {
					cx: "12",
					cy: "12",
					r: "8.5"
				}), (0, react_jsx_runtime.jsx)("path", { d: "m6.4 6.4 11.2 11.2" })]
			});
		}
		/** Document — the file list and the overview tab. */
		function FileTextIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [
					(0, react_jsx_runtime.jsx)("path", { d: "M13.6 3.5H7.2A1.7 1.7 0 0 0 5.5 5.2v13.6a1.7 1.7 0 0 0 1.7 1.7h9.6a1.7 1.7 0 0 0 1.7-1.7V8.4Z" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M13.6 3.5v4.9h4.9" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M9 13h6" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M9 16.4h4" })
				]
			});
		}
		/** Triangle with an exclamation — a region-level failure. */
		function AlertTriangleIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [
					(0, react_jsx_runtime.jsx)("path", { d: "M12 4.5 20.8 19.5H3.2Z" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M12 10v4" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M12 16.8h.01" })
				]
			});
		}
		/** Box — the "nothing here" mark. */
		function PackageIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [
					(0, react_jsx_runtime.jsx)("path", { d: "m12 3.5 8 4.2v8.6l-8 4.2-8-4.2V7.7Z" }),
					(0, react_jsx_runtime.jsx)("path", { d: "m4 7.7 8 4.3 8-4.3" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M12 12v8.5" })
				]
			});
		}
		/** Chevron — the select controls' trailing affordance. */
		function ChevronDownIcon(props) {
			return (0, react_jsx_runtime.jsx)(Svg, {
				...props,
				children: (0, react_jsx_runtime.jsx)("path", { d: "m6.5 9.5 5.5 5.5 5.5-5.5" })
			});
		}
		/** External link — an upstream report or page. */
		function ExternalLinkIcon(props) {
			return (0, react_jsx_runtime.jsxs)(Svg, {
				...props,
				children: [
					(0, react_jsx_runtime.jsx)("path", { d: "M14 4.5h5.5V10" }),
					(0, react_jsx_runtime.jsx)("path", { d: "m19.5 4.5-8 8" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M18 14.5V18a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V7.5A1.5 1.5 0 0 1 6 6h3.5" })
				]
			});
		}
		//#endregion
		//#region lib/client/market-format.js
		/**
		* Language-neutral display helpers for the marketplace panel.
		*
		* Ported from the reference marketplace (`marketFormat.ts`) and extended with
		* the byte/clock/avatar helpers the DSH panel needs. Nothing here formats
		* prose: every user-visible sentence comes from the locale dictionaries.
		*
		* @module dsh-skills-hub/client/market-format
		*/
		/** Compact counts: 482069 → 482.1k. Numeric and language-neutral. */
		function formatCount(value) {
			if (!Number.isFinite(value) || value < 0) return "0";
			if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
			if (value >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
			return String(Math.round(value));
		}
		/** Human-readable byte size. Binary units, one decimal above a kibibyte. */
		function formatBytes(value) {
			if (!Number.isFinite(value) || value <= 0) return "0 B";
			const units = [
				"B",
				"KiB",
				"MiB",
				"GiB"
			];
			let size = value;
			let unit = 0;
			while (size >= 1024 && unit < units.length - 1) {
				size /= 1024;
				unit += 1;
			}
			const digits = unit === 0 ? 0 : 1;
			return `${size.toFixed(digits)} ${units[unit] ?? "B"}`;
		}
		/**
		* Upstream timestamps are epoch millis; rendered as an ISO date so the same
		* skill reads the same in every locale.
		*/
		function formatIsoDate(timestamp) {
			if (timestamp === void 0) return "";
			const date = new Date(timestamp);
			return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
		}
		/** Wall-clock time of a cache fill, for the source-health line. */
		function formatClock(timestamp) {
			if (timestamp === void 0) return "";
			const date = new Date(timestamp);
			return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString();
		}
		/** Only absolute http(s) links from upstream may become an `href`. */
		function safeUrl(url) {
			return url !== void 0 && /^https?:\/\//i.test(url) ? url : void 0;
		}
		/**
		* Deterministic palette index for a skill id, so one skill keeps a stable,
		* restrained identity colour across the grid and the detail header.
		*/
		function avatarTone(id) {
			let hash = 0;
			for (let index = 0; index < id.length; index += 1) hash = hash * 31 + id.charCodeAt(index) | 0;
			return Math.abs(hash) % 6;
		}
		/** First visible character of a name, uppercased (handles CJK and surrogates). */
		function initialOf(name) {
			const first = Array.from(name.trim())[0];
			return first === void 0 ? "?" : first.toUpperCase();
		}
		/** `source · author` line, tolerant of a registry that omits the author. */
		function authorLabel(displayName, handle) {
			const name = displayName?.trim();
			return name !== void 0 && name !== "" ? name : handle;
		}
		//#endregion
		//#region \0dsh-css:D:\dsh-skills-hub\src\client\MarketAtoms.module.css.mjs
		const css$5 = ".acSboW_avatar{border:1px solid var(--dsw-alias-border-l1);box-sizing:border-box;letter-spacing:-.02em;user-select:none;flex-shrink:0;justify-content:center;align-items:center;font-weight:700;display:inline-flex;position:relative;overflow:hidden}.acSboW_avatarImage{object-fit:cover;background:var(--dsw-alias-bg-overlay);display:block}.acSboW_tone0{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base)}.acSboW_tone1{background:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-bg-base)}.acSboW_tone2{background:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-bg-base)}.acSboW_tone3{background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-bg-base)}.acSboW_tone4{background:var(--dsw-alias-state-idle-primary);color:var(--dsw-alias-bg-base)}.acSboW_tone5{background:color-mix(in oklab, var(--dsw-alias-brand-primary) 45%, var(--dsw-alias-state-warn-primary));color:var(--dsw-alias-bg-base)}.acSboW_chip{box-sizing:border-box;white-space:nowrap;border:1px solid #0000;border-radius:5px;align-items:center;gap:4px;min-width:0;height:20px;padding:0 7px;font-size:11px;font-weight:600;line-height:1;display:inline-flex}.acSboW_chipIcon{opacity:.85;flex-shrink:0}.acSboW_chipSuccess{border-color:color-mix(in oklab, var(--dsw-alias-state-success-primary) 34%, transparent);background:color-mix(in oklab, var(--dsw-alias-state-success-primary) 14%, transparent);color:color-mix(in oklab, var(--dsw-alias-state-success-primary) 72%, var(--dsw-alias-label-primary))}.acSboW_chipDanger{border-color:color-mix(in oklab, var(--dsw-alias-state-error-primary) 34%, transparent);background:color-mix(in oklab, var(--dsw-alias-state-error-primary) 14%, transparent);color:color-mix(in oklab, var(--dsw-alias-state-error-primary) 72%, var(--dsw-alias-label-primary))}.acSboW_chipWarn{border-color:color-mix(in oklab, var(--dsw-alias-state-warn-primary) 38%, transparent);background:color-mix(in oklab, var(--dsw-alias-state-warn-primary) 16%, transparent);color:color-mix(in oklab, var(--dsw-alias-state-warn-primary) 62%, var(--dsw-alias-label-primary))}.acSboW_chipNeutral{border-color:var(--dsw-alias-border-l2);background:color-mix(in oklab, var(--dsw-alias-label-primary) 6%, transparent);color:var(--dsw-alias-label-secondary)}.acSboW_chipBrand{border-color:color-mix(in oklab, var(--dsw-alias-brand-primary) 30%, transparent);background:color-mix(in oklab, var(--dsw-alias-brand-primary) 12%, transparent);color:var(--dsw-alias-brand-primary)}.acSboW_health{flex-wrap:wrap;align-items:center;gap:4px 16px;min-width:0;display:flex}.acSboW_healthLabel{color:var(--dsw-alias-label-secondary)}.acSboW_healthItem{align-items:center;gap:6px;min-width:0;font-size:12px;display:inline-flex}.acSboW_healthSource{color:var(--dsw-alias-label-primary);font-weight:600}.acSboW_healthStatus{color:var(--dsw-alias-label-secondary)}.acSboW_healthError{text-overflow:ellipsis;white-space:nowrap;max-width:22ch;overflow:hidden}.acSboW_dot{border-radius:999px;flex-shrink:0;width:6px;height:6px}.acSboW_dotOk{background:var(--dsw-alias-state-success-primary)}.acSboW_dotCached{background:var(--dsw-alias-state-idle-primary)}.acSboW_dotDegraded{background:var(--dsw-alias-state-warn-primary)}.acSboW_dotFailed{background:var(--dsw-alias-state-error-primary)}.acSboW_skeletonCard{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:12px;flex-direction:column;gap:12px;min-height:208px;padding:18px;display:flex}.acSboW_skeletonBlock{background:color-mix(in oklab, var(--dsw-alias-label-primary) 7%, transparent);border-radius:6px}.acSboW_skeletonHead{align-items:center;gap:12px;display:flex}.acSboW_skeletonAvatar{border-radius:10px;flex-shrink:0;width:44px;height:44px}.acSboW_skeletonLines{flex-direction:column;flex:1;gap:7px;min-width:0;display:flex}.acSboW_shimmer{animation:1.4s ease-in-out infinite acSboW_skillsHubPulse}@keyframes acSboW_skillsHubPulse{0%,to{opacity:1}50%{opacity:.5}}@media (prefers-reduced-motion:reduce){.acSboW_shimmer{animation:none}}";
		const tagId$5 = "@nanmicoder/dsh-skills-hub/MarketAtoms.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$5) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@nanmicoder/dsh-skills-hub";
			tag.dataset.pluginCss = tagId$5;
			tag.textContent = css$5;
			document.head.appendChild(tag);
		}
		var MarketAtoms_module_css_default = {
			"avatar": "acSboW_avatar",
			"avatarImage": "acSboW_avatarImage",
			"chip": "acSboW_chip",
			"chipBrand": "acSboW_chipBrand",
			"chipDanger": "acSboW_chipDanger",
			"chipIcon": "acSboW_chipIcon",
			"chipNeutral": "acSboW_chipNeutral",
			"chipSuccess": "acSboW_chipSuccess",
			"chipWarn": "acSboW_chipWarn",
			"dot": "acSboW_dot",
			"dotCached": "acSboW_dotCached",
			"dotDegraded": "acSboW_dotDegraded",
			"dotFailed": "acSboW_dotFailed",
			"dotOk": "acSboW_dotOk",
			"health": "acSboW_health",
			"healthError": "acSboW_healthError",
			"healthItem": "acSboW_healthItem",
			"healthLabel": "acSboW_healthLabel",
			"healthSource": "acSboW_healthSource",
			"healthStatus": "acSboW_healthStatus",
			"shimmer": "acSboW_shimmer",
			"skeletonAvatar": "acSboW_skeletonAvatar",
			"skeletonBlock": "acSboW_skeletonBlock",
			"skeletonCard": "acSboW_skeletonCard",
			"skeletonHead": "acSboW_skeletonHead",
			"skeletonLines": "acSboW_skeletonLines",
			"skillsHubPulse": "acSboW_skillsHubPulse",
			"tone0": "acSboW_tone0",
			"tone1": "acSboW_tone1",
			"tone2": "acSboW_tone2",
			"tone3": "acSboW_tone3",
			"tone4": "acSboW_tone4",
			"tone5": "acSboW_tone5"
		};
		//#endregion
		//#region lib/client/MarketAtoms.js
		/**
		* Small presentational atoms shared by the grid, the detail surface and the
		* states: the deterministic skill avatar, the two status chips, the
		* per-registry health line, and the loading skeleton card.
		*
		* @module dsh-skills-hub/client/MarketAtoms
		*/
		const AVATAR_CLASSES = [
			cls(MarketAtoms_module_css_default, "tone0"),
			cls(MarketAtoms_module_css_default, "tone1"),
			cls(MarketAtoms_module_css_default, "tone2"),
			cls(MarketAtoms_module_css_default, "tone3"),
			cls(MarketAtoms_module_css_default, "tone4"),
			cls(MarketAtoms_module_css_default, "tone5")
		];
		/** Avatar corner radius follows the tile size, as in the reference handoff. */
		function radiusFor(size) {
			return Math.round(size * .24);
		}
		/**
		* Skill icon with a deterministic letter-avatar fallback.
		*
		* The fallback's colour is a stable function of the skill id, so one skill keeps
		* the same identity tile across the grid, the detail header and a re-render.
		* An upstream icon that fails to load degrades to that same fallback instead of
		* leaving a broken image in the grid.
		*/
		function SkillAvatar({ skill, size = 44 }) {
			const [failed, setFailed] = (0, react.useState)(false);
			const radius = radiusFor(size);
			const iconUrl = skill.iconUrl;
			if (iconUrl !== void 0 && iconUrl !== "" && !failed) return (0, react_jsx_runtime.jsx)("img", {
				className: cx(cls(MarketAtoms_module_css_default, "avatar"), cls(MarketAtoms_module_css_default, "avatarImage")),
				src: iconUrl,
				alt: "",
				width: size,
				height: size,
				loading: "lazy",
				decoding: "async",
				referrerPolicy: "no-referrer",
				style: {
					width: size,
					height: size,
					borderRadius: radius
				},
				onError: () => {
					setFailed(true);
				}
			});
			return (0, react_jsx_runtime.jsx)("span", {
				className: cx(cls(MarketAtoms_module_css_default, "avatar"), AVATAR_CLASSES[avatarTone(skill.id)] ?? ""),
				"aria-hidden": "true",
				style: {
					width: size,
					height: size,
					borderRadius: radius,
					fontSize: Math.round(size * .38)
				},
				children: initialOf(skill.name)
			});
		}
		const CHIP_CLASSES = {
			success: "chipSuccess",
			danger: "chipDanger",
			warn: "chipWarn",
			neutral: "chipNeutral",
			brand: "chipBrand"
		};
		function Chip({ tone, title, icon, children }) {
			return (0, react_jsx_runtime.jsxs)("span", {
				className: cx(cls(MarketAtoms_module_css_default, "chip"), cls(MarketAtoms_module_css_default, CHIP_CLASSES[tone])),
				title,
				children: [(0, react_jsx_runtime.jsx)("span", {
					className: cls(MarketAtoms_module_css_default, "chipIcon"),
					children: icon
				}), children]
			});
		}
		const SECURITY_TONE = {
			verified: "success",
			benign: "success",
			unknown: "neutral",
			flagged: "danger"
		};
		function SecurityIcon({ status, size }) {
			if (status === "verified") return (0, react_jsx_runtime.jsx)(BadgeCheckIcon, {
				size,
				strokeWidth: 2
			});
			if (status === "benign") return (0, react_jsx_runtime.jsx)(ShieldCheckIcon, {
				size,
				strokeWidth: 2
			});
			if (status === "flagged") return (0, react_jsx_runtime.jsx)(ShieldAlertIcon, {
				size,
				strokeWidth: 2
			});
			return (0, react_jsx_runtime.jsx)(ShieldQuestionIcon, {
				size,
				strokeWidth: 2
			});
		}
		/**
		* Scan verdict of one skill version.
		* @param short - the card chip: a short label so the tag row stays on one line;
		*   the tooltip carries the full explanation either way.
		*/
		function SecurityBadge({ t, status, short = false }) {
			const label = short ? t(`securityShort.${status}`) : t(`security.${status}`);
			return (0, react_jsx_runtime.jsx)(Chip, {
				tone: SECURITY_TONE[status],
				title: t(`securityHint.${status}`),
				icon: (0, react_jsx_runtime.jsx)(SecurityIcon, {
					status,
					size: short ? 11 : 12
				}),
				children: label
			});
		}
		const INSTALL_TONE = {
			installed: "success",
			installable: "brand",
			"not-installable": "danger"
		};
		const INSTALL_KEY = {
			installed: "install.state.installed",
			installable: "install.state.installable",
			"not-installable": "install.state.notInstallable"
		};
		/**
		* Whether the skill can be written to disk right now.
		* @param reason - the host's refusal code, rendered as the chip's tooltip.
		*/
		function InstallStateBadge({ t, state, reason }) {
			const label = t(INSTALL_KEY[state]);
			const title = state === "not-installable" && reason !== void 0 ? `${label} — ${t(`reason.${reason}`)}` : label;
			const icon = state === "installed" ? (0, react_jsx_runtime.jsx)(CheckCircleIcon, {
				size: 12,
				strokeWidth: 2
			}) : state === "installable" ? (0, react_jsx_runtime.jsx)(DownloadIcon, {
				size: 12,
				strokeWidth: 2
			}) : (0, react_jsx_runtime.jsx)(CircleSlashIcon, {
				size: 12,
				strokeWidth: 2
			});
			return (0, react_jsx_runtime.jsx)(Chip, {
				tone: INSTALL_TONE[state],
				title,
				icon,
				children: label
			});
		}
		const DOT_CLASSES = {
			ok: "dotOk",
			cached: "dotCached",
			degraded: "dotDegraded",
			failed: "dotFailed"
		};
		/**
		* Per-registry reachability for the current view.
		*
		* A half-broken upstream has to be legible: without this line a failing registry
		* is indistinguishable from a registry that simply has no matching skills, and
		* the grid would look confidently empty.
		*/
		function SourceHealthLine({ t, sources }) {
			const entries = [];
			for (const source of MARKET_SOURCES) {
				const info = sources[source];
				if (info !== void 0) entries.push({
					source,
					info
				});
			}
			if (entries.length === 0) return null;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: cls(MarketAtoms_module_css_default, "health"),
				"aria-label": t("sourceStatus.label"),
				children: [(0, react_jsx_runtime.jsx)("span", {
					className: cls(MarketAtoms_module_css_default, "healthLabel"),
					children: t("sourceStatus.label")
				}), entries.map(({ source, info }) => {
					const time = formatClock(info.fetchedAt);
					const status = info.status === "cached" && time !== "" ? t("sourceStatus.cachedAt", { time }) : t(`sourceStatus.${info.status}`);
					return (0, react_jsx_runtime.jsxs)("span", {
						className: cls(MarketAtoms_module_css_default, "healthItem"),
						title: info.error ?? void 0,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: cx(cls(MarketAtoms_module_css_default, "dot"), cls(MarketAtoms_module_css_default, DOT_CLASSES[info.status])),
								"aria-hidden": "true"
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: cls(MarketAtoms_module_css_default, "healthSource"),
								children: t(`source.${source}`)
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: cls(MarketAtoms_module_css_default, "healthStatus"),
								children: status
							}),
							info.error !== void 0 && info.error !== "" && (0, react_jsx_runtime.jsxs)("span", {
								className: cls(MarketAtoms_module_css_default, "healthStatus"),
								children: ["· ", info.error]
							})
						]
					}, source);
				})]
			});
		}
		const SKELETON_WIDTHS = [
			"72%",
			"54%",
			"88%",
			"62%"
		];
		/**
		* One card-shaped placeholder; the panel's own grid positions it. Purely
		* decorative — the loading announcement belongs to the region that owns the
		* request, so this stays out of the accessibility tree.
		*/
		function SkeletonCard({ index }) {
			const widths = [SKELETON_WIDTHS[index % SKELETON_WIDTHS.length] ?? "70%", SKELETON_WIDTHS[(index + 1) % SKELETON_WIDTHS.length] ?? "50%"];
			return (0, react_jsx_runtime.jsxs)("div", {
				className: cls(MarketAtoms_module_css_default, "skeletonCard"),
				"aria-hidden": "true",
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: cls(MarketAtoms_module_css_default, "skeletonHead"),
						children: [(0, react_jsx_runtime.jsx)("div", { className: cx(cls(MarketAtoms_module_css_default, "skeletonBlock"), cls(MarketAtoms_module_css_default, "skeletonAvatar"), cls(MarketAtoms_module_css_default, "shimmer")) }), (0, react_jsx_runtime.jsxs)("div", {
							className: cls(MarketAtoms_module_css_default, "skeletonLines"),
							children: [(0, react_jsx_runtime.jsx)("div", {
								className: cx(cls(MarketAtoms_module_css_default, "skeletonBlock"), cls(MarketAtoms_module_css_default, "shimmer")),
								style: {
									height: 12,
									width: widths[1]
								}
							}), (0, react_jsx_runtime.jsx)("div", {
								className: cx(cls(MarketAtoms_module_css_default, "skeletonBlock"), cls(MarketAtoms_module_css_default, "shimmer")),
								style: {
									height: 10,
									width: "38%"
								}
							})]
						})]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: cx(cls(MarketAtoms_module_css_default, "skeletonBlock"), cls(MarketAtoms_module_css_default, "shimmer")),
						style: {
							height: 10,
							width: widths[0]
						}
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: cx(cls(MarketAtoms_module_css_default, "skeletonBlock"), cls(MarketAtoms_module_css_default, "shimmer")),
						style: {
							height: 10,
							width: "64%"
						}
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: cx(cls(MarketAtoms_module_css_default, "skeletonBlock"), cls(MarketAtoms_module_css_default, "shimmer")),
						style: {
							height: 20,
							width: "46%",
							marginTop: "auto"
						}
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\dsh-skills-hub\src\client\SkillCard.module.css.mjs
		const css$4 = ".gq_NaG_card{isolation:isolate;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);box-sizing:border-box;border-radius:12px;flex-direction:column;min-width:0;min-height:208px;padding:18px 18px 14px;transition:border-color .15s,box-shadow .15s;display:flex;position:relative}.gq_NaG_card:hover{border-color:var(--dsw-alias-border-l2);box-shadow:0 6px 20px color-mix(in oklab, var(--dsw-alias-label-primary) 9%, transparent)}.gq_NaG_open{z-index:0;cursor:pointer;background:0 0;border:0;border-radius:12px;padding:0;position:absolute;inset:0}.gq_NaG_open:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}.gq_NaG_body{z-index:1;pointer-events:none;flex-direction:column;flex:1;gap:10px;min-width:0;display:flex;position:relative}.gq_NaG_identity{align-items:center;gap:12px;min-width:0;display:flex}.gq_NaG_titleBlock{flex:1;min-width:0}.gq_NaG_nameRow{align-items:center;gap:8px;min-width:0;display:flex}.gq_NaG_name{min-width:0;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;margin:0;font-size:15px;font-weight:600;line-height:22px;overflow:hidden}.gq_NaG_version{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;border-radius:5px;flex-shrink:0;padding:1px 5px;font-size:11px;line-height:16px}.gq_NaG_meta{min-width:0;color:var(--dsw-alias-label-secondary);align-items:center;gap:6px;margin:2px 0 0;font-size:12px;line-height:18px;display:flex}.gq_NaG_metaSource{flex-shrink:0}.gq_NaG_metaAuthor{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.gq_NaG_summary{min-height:42px;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;-webkit-line-clamp:2;-webkit-box-orient:vertical;margin:0;font-size:13px;line-height:21px;display:-webkit-box;overflow:hidden}.gq_NaG_chips{flex-wrap:wrap;align-items:center;gap:6px;min-width:0;max-height:22px;display:flex;overflow:hidden}.gq_NaG_tag{background:color-mix(in oklab, var(--dsw-alias-label-primary) 6%, transparent);max-width:14ch;height:20px;color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;border-radius:5px;align-items:center;padding:0 7px;font-size:11px;display:inline-flex;overflow:hidden}.gq_NaG_footer{border-top:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:center;gap:10px;min-height:36px;margin-top:auto;padding-top:12px;display:flex}.gq_NaG_stats{min-width:0;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;align-items:center;gap:14px;font-size:12px;display:flex}.gq_NaG_stat{align-items:center;gap:5px;display:inline-flex}.gq_NaG_install{z-index:2;background:var(--dsw-alias-brand-primary);height:30px;color:var(--dsw-alias-bg-base);cursor:pointer;font:inherit;pointer-events:auto;border:0;border-radius:8px;flex-shrink:0;align-items:center;gap:6px;padding:0 12px;font-size:13px;font-weight:600;transition:opacity .15s;display:inline-flex;position:relative}.gq_NaG_install:hover:not(:disabled){opacity:.88}.gq_NaG_install:active:not(:disabled){opacity:.78}.gq_NaG_install:disabled{cursor:progress;opacity:.62}.gq_NaG_install:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}@media (prefers-reduced-motion:reduce){.gq_NaG_card,.gq_NaG_install{transition:none}}";
		const tagId$4 = "@nanmicoder/dsh-skills-hub/SkillCard.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@nanmicoder/dsh-skills-hub";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var SkillCard_module_css_default = {
			"body": "gq_NaG_body",
			"card": "gq_NaG_card",
			"chips": "gq_NaG_chips",
			"footer": "gq_NaG_footer",
			"identity": "gq_NaG_identity",
			"install": "gq_NaG_install",
			"meta": "gq_NaG_meta",
			"metaAuthor": "gq_NaG_metaAuthor",
			"metaSource": "gq_NaG_metaSource",
			"name": "gq_NaG_name",
			"nameRow": "gq_NaG_nameRow",
			"open": "gq_NaG_open",
			"stat": "gq_NaG_stat",
			"stats": "gq_NaG_stats",
			"summary": "gq_NaG_summary",
			"tag": "gq_NaG_tag",
			"titleBlock": "gq_NaG_titleBlock",
			"version": "gq_NaG_version"
		};
		//#endregion
		//#region lib/client/SkillCard.js
		/** Chip row budget: the scan verdict, then at most this many tags. */
		const MAX_VISIBLE_TAGS = 3;
		/**
		* Render one skill as a grid card.
		* @param props - card inputs.
		* @returns the card element.
		*/
		function SkillCard({ t, skill, installing, onOpen, onInstall }) {
			const tags = skill.tags;
			const visible = tags.slice(0, MAX_VISIBLE_TAGS);
			const extra = Math.max(0, tags.length - MAX_VISIBLE_TAGS);
			const author = authorLabel(skill.author.displayName, skill.author.handle);
			const summary = skill.summary.trim();
			const canInstall = skill.installState === "installable";
			const stars = skill.stats.stars;
			return (0, react_jsx_runtime.jsxs)("article", {
				className: cls(SkillCard_module_css_default, "card"),
				children: [(0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: cls(SkillCard_module_css_default, "open"),
					"aria-label": t("card.open", { name: skill.name }),
					onClick: () => {
						onOpen(skill.id);
					}
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: cls(SkillCard_module_css_default, "body"),
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: cls(SkillCard_module_css_default, "identity"),
							children: [(0, react_jsx_runtime.jsx)(SkillAvatar, {
								skill,
								size: 44
							}), (0, react_jsx_runtime.jsxs)("div", {
								className: cls(SkillCard_module_css_default, "titleBlock"),
								children: [(0, react_jsx_runtime.jsxs)("div", {
									className: cls(SkillCard_module_css_default, "nameRow"),
									children: [(0, react_jsx_runtime.jsx)("h3", {
										className: cls(SkillCard_module_css_default, "name"),
										title: skill.name,
										children: skill.name
									}), skill.version !== void 0 && skill.version !== "" && (0, react_jsx_runtime.jsxs)("span", {
										className: cls(SkillCard_module_css_default, "version"),
										children: ["v", skill.version]
									})]
								}), (0, react_jsx_runtime.jsxs)("p", {
									className: cls(SkillCard_module_css_default, "meta"),
									children: [(0, react_jsx_runtime.jsx)("span", {
										className: cls(SkillCard_module_css_default, "metaSource"),
										children: t(`source.${skill.source}`)
									}), author !== "" && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("span", {
										"aria-hidden": "true",
										children: "·"
									}), (0, react_jsx_runtime.jsx)("span", {
										className: cls(SkillCard_module_css_default, "metaAuthor"),
										children: author
									})] })]
								})]
							})]
						}),
						(0, react_jsx_runtime.jsx)("p", {
							className: cls(SkillCard_module_css_default, "summary"),
							children: summary === "" ? t("card.noSummary") : summary
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: cls(SkillCard_module_css_default, "chips"),
							children: [
								(0, react_jsx_runtime.jsx)(SecurityBadge, {
									t,
									status: skill.securityStatus,
									short: true
								}),
								visible.map((tag) => (0, react_jsx_runtime.jsx)("span", {
									className: cls(SkillCard_module_css_default, "tag"),
									children: tag
								}, tag)),
								extra > 0 && (0, react_jsx_runtime.jsx)("span", {
									className: cls(SkillCard_module_css_default, "tag"),
									children: t("card.moreTags", { count: extra })
								})
							]
						}),
						(0, react_jsx_runtime.jsxs)("footer", {
							className: cls(SkillCard_module_css_default, "footer"),
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: cls(SkillCard_module_css_default, "stats"),
								children: [(0, react_jsx_runtime.jsxs)("span", {
									className: cls(SkillCard_module_css_default, "stat"),
									title: t("card.downloads"),
									children: [(0, react_jsx_runtime.jsx)(DownloadIcon, {
										size: 12,
										strokeWidth: 1.8
									}), formatCount(skill.stats.downloads)]
								}), stars !== void 0 && stars > 0 && (0, react_jsx_runtime.jsxs)("span", {
									className: cls(SkillCard_module_css_default, "stat"),
									title: t("card.stars"),
									children: [(0, react_jsx_runtime.jsx)(StarIcon, {
										size: 12,
										strokeWidth: 1.8
									}), formatCount(stars)]
								})]
							}), canInstall ? (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: cls(SkillCard_module_css_default, "install"),
								disabled: installing,
								onClick: () => {
									onInstall(skill.id, skill.version);
								},
								children: [(0, react_jsx_runtime.jsx)(DownloadIcon, {
									size: 13,
									strokeWidth: 1.9
								}), installing ? t("install.installing") : t("install.action")]
							}) : (0, react_jsx_runtime.jsx)(InstallStateBadge, {
								t,
								state: skill.installState,
								reason: skill.notInstallableReason
							})]
						})
					]
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\dsh-skills-hub\src\client\SkillDetail.module.css.mjs
		const css$3 = "._97rgUq_detail{flex-direction:column;gap:14px;min-width:0;display:flex}._97rgUq_back{border:1px solid var(--dsw-alias-border-l2);height:30px;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;background:0 0;border-radius:8px;align-self:flex-start;align-items:center;gap:6px;padding:0 10px 0 8px;font-size:13px;display:inline-flex}._97rgUq_back:hover{background:color-mix(in oklab, var(--dsw-alias-label-primary) 6%, transparent);color:var(--dsw-alias-label-primary)}._97rgUq_back:focus-visible,._97rgUq_tab:focus-visible,._97rgUq_file:focus-visible,._97rgUq_primaryAction:focus-visible,._97rgUq_ghostAction:focus-visible,._97rgUq_closePreview:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}._97rgUq_hero{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:12px;flex-wrap:wrap;align-items:flex-start;gap:16px;min-width:0;padding:18px;display:flex}._97rgUq_heroBody{flex:1;min-width:220px}._97rgUq_name{color:var(--dsw-alias-label-primary);overflow-wrap:anywhere;margin:0;font-size:20px;font-weight:700;line-height:28px}._97rgUq_name:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:3px;border-radius:4px}._97rgUq_meta{color:var(--dsw-alias-label-secondary);flex-wrap:wrap;align-items:center;gap:6px;margin:4px 0 0;font-size:13px;display:flex}._97rgUq_chips{flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px;display:flex}._97rgUq_versionPill{border:1px solid var(--dsw-alias-border-l2);height:20px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;border-radius:5px;align-items:center;padding:0 7px;font-size:11px;display:inline-flex}._97rgUq_action{flex-wrap:wrap;flex-shrink:0;align-items:center;gap:8px;display:flex}._97rgUq_primaryAction,._97rgUq_ghostAction{cursor:pointer;height:34px;font:inherit;border-radius:8px;align-items:center;gap:6px;padding:0 14px;font-size:13px;font-weight:600;transition:opacity .15s;display:inline-flex}._97rgUq_primaryAction{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);border:0}._97rgUq_ghostAction{border:1px solid color-mix(in oklab, var(--dsw-alias-state-error-primary) 40%, transparent);color:var(--dsw-alias-state-error-primary);background:0 0}._97rgUq_primaryAction:hover:not(:disabled),._97rgUq_ghostAction:hover:not(:disabled){opacity:.86}._97rgUq_primaryAction:disabled,._97rgUq_ghostAction:disabled{cursor:progress;opacity:.6}._97rgUq_stats{border-top:1px solid var(--dsw-alias-border-l1);grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px 18px;margin:16px 0 0;padding:14px 0 0;display:grid}._97rgUq_stat{min-width:0}._97rgUq_statLabel{color:var(--dsw-alias-label-secondary);margin:0;font-size:11px}._97rgUq_statValue{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;text-overflow:ellipsis;white-space:nowrap;margin:2px 0 0;font-size:13px;overflow:hidden}._97rgUq_note{color:var(--dsw-alias-label-secondary);margin:10px 0 0;font-size:12px}._97rgUq_link{color:var(--dsw-alias-brand-primary);text-decoration:none}._97rgUq_link:hover{text-decoration:underline}._97rgUq_link:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;border-radius:3px}._97rgUq_errorBanner{border:1px solid color-mix(in oklab, var(--dsw-alias-state-error-primary) 38%, transparent);background:color-mix(in oklab, var(--dsw-alias-state-error-primary) 10%, transparent);color:var(--dsw-alias-label-primary);border-radius:10px;align-items:center;gap:8px;padding:10px 12px;font-size:13px;display:flex}._97rgUq_tabStrip{border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap;gap:4px;display:flex}._97rgUq_tab{height:34px;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;background:0 0;border:0;border-bottom:2px solid #0000;align-items:center;gap:6px;padding:0 12px;font-size:13px;font-weight:600;display:inline-flex}._97rgUq_tab:hover{color:var(--dsw-alias-label-primary)}._97rgUq_tabActive{border-bottom-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary)}._97rgUq_panel{min-width:0}._97rgUq_document{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);overflow-wrap:anywhere;white-space:pre-wrap;border-radius:12px;margin:0;padding:16px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px;line-height:1.75}._97rgUq_filesLayout{grid-template-columns:minmax(200px,320px) minmax(0,1fr);align-items:start;gap:14px;display:grid}@media (width<=720px){._97rgUq_filesLayout{grid-template-columns:minmax(0,1fr)}}._97rgUq_fileList{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:12px;margin:0;padding:6px;list-style:none}._97rgUq_fileRow{min-width:0}._97rgUq_file{width:100%;min-width:0;color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;text-align:left;background:0 0;border:0;border-radius:8px;justify-content:space-between;align-items:center;gap:10px;padding:7px 9px;font-size:12.5px;display:flex}._97rgUq_file:hover:not(:disabled){background:color-mix(in oklab, var(--dsw-alias-label-primary) 7%, transparent)}._97rgUq_file:disabled{color:var(--dsw-alias-label-secondary);cursor:not-allowed}._97rgUq_fileActive{background:color-mix(in oklab, var(--dsw-alias-brand-primary) 12%, transparent)}._97rgUq_filePath{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._97rgUq_fileSize{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;flex-shrink:0;font-size:11px}._97rgUq_preview{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:12px;min-width:0}._97rgUq_previewHead{border-bottom:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:center;gap:10px;min-width:0;padding:8px 10px 8px 14px;display:flex}._97rgUq_previewPath{color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;font-size:12px;overflow:hidden}._97rgUq_closePreview{width:26px;height:26px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:6px;flex-shrink:0;justify-content:center;align-items:center;display:inline-flex}._97rgUq_closePreview:hover{background:color-mix(in oklab, var(--dsw-alias-label-primary) 7%, transparent);color:var(--dsw-alias-label-primary)}._97rgUq_previewBody{max-height:460px;color:var(--dsw-alias-label-primary);overflow-wrap:anywhere;white-space:pre-wrap;margin:0;padding:12px 14px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.7;overflow:auto}._97rgUq_previewNote{color:var(--dsw-alias-label-secondary);margin:0;padding:0 14px 12px;font-size:12px}._97rgUq_placeholder{color:var(--dsw-alias-label-secondary);text-align:center;margin:0;padding:22px 16px;font-size:13px}._97rgUq_reports{flex-direction:column;gap:10px;margin:0;padding:0;list-style:none;display:flex}._97rgUq_report{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:12px;padding:12px 14px}._97rgUq_reportHead{flex-wrap:wrap;align-items:center;gap:8px;display:flex}._97rgUq_reportVendor{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}._97rgUq_reportStatus{color:var(--dsw-alias-label-secondary);font-size:12px}._97rgUq_reportSummary{color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;margin:6px 0 0;font-size:12.5px;line-height:1.7}._97rgUq_changelog{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:12px;padding:14px 16px}._97rgUq_changelogTitle{color:var(--dsw-alias-label-primary);flex-wrap:wrap;align-items:baseline;gap:8px;margin:0;font-size:13px;font-weight:700;display:flex}._97rgUq_changelogDate{color:var(--dsw-alias-label-secondary);font-size:11px;font-weight:400}._97rgUq_changelogText{color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;white-space:pre-wrap;margin:8px 0 0;font-size:13px;line-height:1.75}@media (prefers-reduced-motion:reduce){._97rgUq_primaryAction,._97rgUq_ghostAction{transition:none}}";
		const tagId$3 = "@nanmicoder/dsh-skills-hub/SkillDetail.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@nanmicoder/dsh-skills-hub";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var SkillDetail_module_css_default = {
			"action": "_97rgUq_action",
			"back": "_97rgUq_back",
			"changelog": "_97rgUq_changelog",
			"changelogDate": "_97rgUq_changelogDate",
			"changelogText": "_97rgUq_changelogText",
			"changelogTitle": "_97rgUq_changelogTitle",
			"chips": "_97rgUq_chips",
			"closePreview": "_97rgUq_closePreview",
			"detail": "_97rgUq_detail",
			"document": "_97rgUq_document",
			"errorBanner": "_97rgUq_errorBanner",
			"file": "_97rgUq_file",
			"fileActive": "_97rgUq_fileActive",
			"fileList": "_97rgUq_fileList",
			"filePath": "_97rgUq_filePath",
			"fileRow": "_97rgUq_fileRow",
			"fileSize": "_97rgUq_fileSize",
			"filesLayout": "_97rgUq_filesLayout",
			"ghostAction": "_97rgUq_ghostAction",
			"hero": "_97rgUq_hero",
			"heroBody": "_97rgUq_heroBody",
			"link": "_97rgUq_link",
			"meta": "_97rgUq_meta",
			"name": "_97rgUq_name",
			"note": "_97rgUq_note",
			"panel": "_97rgUq_panel",
			"placeholder": "_97rgUq_placeholder",
			"preview": "_97rgUq_preview",
			"previewBody": "_97rgUq_previewBody",
			"previewHead": "_97rgUq_previewHead",
			"previewNote": "_97rgUq_previewNote",
			"previewPath": "_97rgUq_previewPath",
			"primaryAction": "_97rgUq_primaryAction",
			"report": "_97rgUq_report",
			"reportHead": "_97rgUq_reportHead",
			"reportStatus": "_97rgUq_reportStatus",
			"reportSummary": "_97rgUq_reportSummary",
			"reportVendor": "_97rgUq_reportVendor",
			"reports": "_97rgUq_reports",
			"stat": "_97rgUq_stat",
			"statLabel": "_97rgUq_statLabel",
			"statValue": "_97rgUq_statValue",
			"stats": "_97rgUq_stats",
			"tab": "_97rgUq_tab",
			"tabActive": "_97rgUq_tabActive",
			"tabStrip": "_97rgUq_tabStrip",
			"versionPill": "_97rgUq_versionPill"
		};
		//#endregion
		//#region lib/client/SkillDetail.js
		/**
		* Detail surface of one skill: it replaces the grid inside the panel's scroll
		* region and carries everything the card cannot — the rendered `SKILL.md` body,
		* the file list with a preview pane, the security reports, and the changelog.
		*
		* The description is deliberately rendered as preformatted plain text: the
		* client bundle may not add a markdown dependency, and `dangerouslySetInnerHTML`
		* on third-party content is not an option.
		*
		* @module dsh-skills-hub/client/SkillDetail
		*/
		const TABS = [
			"overview",
			"files",
			"security"
		];
		const TAB_KEY = {
			overview: "detail.overview",
			files: "detail.files",
			security: "detail.security"
		};
		function Stat({ label, value }) {
			if (value === "") return null;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: cls(SkillDetail_module_css_default, "stat"),
				children: [(0, react_jsx_runtime.jsx)("dt", {
					className: cls(SkillDetail_module_css_default, "statLabel"),
					children: label
				}), (0, react_jsx_runtime.jsx)("dd", {
					className: cls(SkillDetail_module_css_default, "statValue"),
					title: value,
					children: value
				})]
			});
		}
		function FileRow({ t, file, active, onOpen }) {
			const title = file.tooBig ? t("detail.files.tooBig") : t("detail.files.preview", { path: file.path });
			return (0, react_jsx_runtime.jsx)("li", {
				className: cls(SkillDetail_module_css_default, "fileRow"),
				children: (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: cx(cls(SkillDetail_module_css_default, "file"), active ? cls(SkillDetail_module_css_default, "fileActive") : ""),
					disabled: file.tooBig,
					title,
					"aria-current": active ? "true" : void 0,
					onClick: () => {
						onOpen(file.path);
					},
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: cls(SkillDetail_module_css_default, "filePath"),
						children: file.path
					}), (0, react_jsx_runtime.jsx)("span", {
						className: cls(SkillDetail_module_css_default, "fileSize"),
						children: formatBytes(file.size)
					})]
				})
			});
		}
		function Preview({ t, state, onClose }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: cls(SkillDetail_module_css_default, "preview"),
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: cls(SkillDetail_module_css_default, "previewHead"),
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: cls(SkillDetail_module_css_default, "previewPath"),
							title: state.path,
							children: state.path
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: cls(SkillDetail_module_css_default, "closePreview"),
							"aria-label": t("detail.preview.close"),
							title: t("detail.preview.close"),
							onClick: onClose,
							children: (0, react_jsx_runtime.jsx)(CloseIcon, { size: 14 })
						})]
					}),
					state.status === "loading" && (0, react_jsx_runtime.jsx)("p", {
						className: cls(SkillDetail_module_css_default, "placeholder"),
						role: "status",
						children: t("detail.preview.loading")
					}),
					state.status === "error" && (0, react_jsx_runtime.jsxs)("p", {
						className: cls(SkillDetail_module_css_default, "placeholder"),
						role: "alert",
						children: [t("detail.preview.error"), state.error !== void 0 && state.error !== "" ? ` — ${state.error}` : ""]
					}),
					state.status === "ready" && state.content !== void 0 && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("pre", {
						className: cls(SkillDetail_module_css_default, "previewBody"),
						children: state.content.content
					}), state.content.truncated && (0, react_jsx_runtime.jsx)("p", {
						className: cls(SkillDetail_module_css_default, "previewNote"),
						children: t("detail.preview.truncated")
					})] })
				]
			});
		}
		function OverviewPanel({ t, skill, id, labelledBy }) {
			const description = skill.description.trim();
			return (0, react_jsx_runtime.jsx)("section", {
				className: cls(SkillDetail_module_css_default, "panel"),
				role: "tabpanel",
				id,
				"aria-labelledby": labelledBy,
				tabIndex: 0,
				children: description === "" ? (0, react_jsx_runtime.jsx)("p", {
					className: cls(SkillDetail_module_css_default, "placeholder"),
					children: t("detail.noDescription")
				}) : (0, react_jsx_runtime.jsx)("pre", {
					className: cls(SkillDetail_module_css_default, "document"),
					children: description
				})
			});
		}
		function SecurityPanel({ t, skill, id, labelledBy }) {
			const reports = skill.securityReports ?? [];
			return (0, react_jsx_runtime.jsx)("section", {
				className: cls(SkillDetail_module_css_default, "panel"),
				role: "tabpanel",
				id,
				"aria-labelledby": labelledBy,
				tabIndex: 0,
				children: reports.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
					className: cls(SkillDetail_module_css_default, "placeholder"),
					children: t("detail.security.empty")
				}) : (0, react_jsx_runtime.jsx)("ul", {
					className: cls(SkillDetail_module_css_default, "reports"),
					children: reports.map((report, index) => {
						const href = safeUrl(report.reportUrl);
						return (0, react_jsx_runtime.jsxs)("li", {
							className: cls(SkillDetail_module_css_default, "report"),
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: cls(SkillDetail_module_css_default, "reportHead"),
								children: [
									(0, react_jsx_runtime.jsx)(ShieldCheckIcon, { size: 14 }),
									(0, react_jsx_runtime.jsx)("span", {
										className: cls(SkillDetail_module_css_default, "reportVendor"),
										children: report.vendor
									}),
									(0, react_jsx_runtime.jsx)("span", {
										className: cls(SkillDetail_module_css_default, "reportStatus"),
										children: report.statusText
									}),
									href !== void 0 && (0, react_jsx_runtime.jsxs)("a", {
										className: cls(SkillDetail_module_css_default, "link"),
										href,
										target: "_blank",
										rel: "noreferrer noopener",
										children: [
											t("detail.security.viewReport"),
											" ",
											(0, react_jsx_runtime.jsx)(ExternalLinkIcon, { size: 11 })
										]
									})
								]
							}), report.summary !== void 0 && report.summary !== "" && (0, react_jsx_runtime.jsx)("p", {
								className: cls(SkillDetail_module_css_default, "reportSummary"),
								children: report.summary
							})]
						}, `${report.vendor}-${index}`);
					})
				})
			});
		}
		/**
		* Render the open skill.
		* @param props - the detail state plus the panel's actions.
		* @returns the detail surface.
		*/
		function SkillDetail(props) {
			const { t, detail, tab, onTab, file, filePath, onOpenFile, onCloseFile } = props;
			const headingRef = (0, react.useRef)(null);
			const tabRefs = (0, react.useRef)([]);
			const instance = (0, react.useId)();
			const skill = detail?.skill;
			(0, react.useEffect)(() => {
				if (detail?.status === "ready") headingRef.current?.focus();
			}, [detail?.status, detail?.id]);
			const onTabKeyDown = (event) => {
				const index = TABS.indexOf(tab);
				let next = -1;
				if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
				else if (event.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
				else if (event.key === "Home") next = 0;
				else if (event.key === "End") next = TABS.length - 1;
				if (next < 0) return;
				const target = TABS[next];
				if (target === void 0) return;
				event.preventDefault();
				onTab(target);
				tabRefs.current[next]?.focus();
			};
			const tabId = (entry) => `${instance}-tab-${entry}`;
			const panelId = (entry) => `${instance}-panel-${entry}`;
			const backButton = (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: cls(SkillDetail_module_css_default, "back"),
				onClick: props.onBack,
				children: [(0, react_jsx_runtime.jsx)(ArrowLeftIcon, { size: 14 }), t("detail.back")]
			});
			if (detail === void 0 || detail.status === "loading") return (0, react_jsx_runtime.jsxs)("div", {
				className: cls(SkillDetail_module_css_default, "detail"),
				children: [backButton, (0, react_jsx_runtime.jsx)("p", {
					className: cls(SkillDetail_module_css_default, "placeholder"),
					role: "status",
					children: t("state.loading")
				})]
			});
			if (detail.status === "error" || skill === void 0) return (0, react_jsx_runtime.jsxs)("div", {
				className: cls(SkillDetail_module_css_default, "detail"),
				children: [
					backButton,
					(0, react_jsx_runtime.jsxs)("div", {
						className: cls(SkillDetail_module_css_default, "errorBanner"),
						role: "alert",
						children: [(0, react_jsx_runtime.jsx)(AlertTriangleIcon, { size: 15 }), (0, react_jsx_runtime.jsxs)("span", { children: [t("state.error"), detail.error !== void 0 && detail.error !== "" ? ` — ${detail.error}` : ""] })]
					}),
					(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: cls(SkillDetail_module_css_default, "primaryAction"),
						onClick: props.onRetry,
						children: t("state.retry")
					})
				]
			});
			const author = authorLabel(skill.author.displayName, skill.author.handle);
			const updated = formatIsoDate(skill.updatedAt);
			const installedRaw = skill.installedInfo?.installedAt;
			const installedAt = installedRaw === void 0 ? "" : formatIsoDate(Date.parse(installedRaw));
			const pageUrl = safeUrl(skill.pageUrl);
			const installs = skill.stats.installs;
			const files = skill.files;
			const summaryLine = t("detail.files.title", {
				count: files.length,
				size: formatBytes(skill.totalSize)
			});
			const list = (0, react_jsx_runtime.jsx)("ul", {
				className: cls(SkillDetail_module_css_default, "fileList"),
				children: files.map((entry) => (0, react_jsx_runtime.jsx)(FileRow, {
					t,
					file: entry,
					active: filePath === entry.path,
					onOpen: onOpenFile
				}, entry.path))
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				className: cls(SkillDetail_module_css_default, "detail"),
				children: [
					backButton,
					(0, react_jsx_runtime.jsxs)("div", {
						className: cls(SkillDetail_module_css_default, "hero"),
						children: [
							(0, react_jsx_runtime.jsx)(SkillAvatar, {
								skill,
								size: 72
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: cls(SkillDetail_module_css_default, "heroBody"),
								children: [
									(0, react_jsx_runtime.jsx)("h2", {
										className: cls(SkillDetail_module_css_default, "name"),
										ref: headingRef,
										tabIndex: -1,
										children: skill.name
									}),
									(0, react_jsx_runtime.jsxs)("p", {
										className: cls(SkillDetail_module_css_default, "meta"),
										children: [
											(0, react_jsx_runtime.jsx)("span", { children: t(`source.${skill.source}`) }),
											(0, react_jsx_runtime.jsx)("span", {
												"aria-hidden": "true",
												children: "·"
											}),
											(0, react_jsx_runtime.jsx)("span", { children: author })
										]
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: cls(SkillDetail_module_css_default, "chips"),
										children: [
											skill.version !== void 0 && skill.version !== "" && (0, react_jsx_runtime.jsxs)("span", {
												className: cls(SkillDetail_module_css_default, "versionPill"),
												children: ["v", skill.version]
											}),
											(0, react_jsx_runtime.jsx)(SecurityBadge, {
												t,
												status: skill.securityStatus
											}),
											skill.installState !== "installable" && (0, react_jsx_runtime.jsx)(InstallStateBadge, {
												t,
												state: skill.installState,
												reason: skill.notInstallableReason
											}),
											skill.requiresApiKey === true && (0, react_jsx_runtime.jsx)("span", {
												className: cls(SkillDetail_module_css_default, "versionPill"),
												children: t("detail.apiKey")
											})
										]
									}),
									(0, react_jsx_runtime.jsxs)("dl", {
										className: cls(SkillDetail_module_css_default, "stats"),
										children: [
											(0, react_jsx_runtime.jsx)(Stat, {
												label: t("detail.stats.downloads"),
												value: formatCount(skill.stats.downloads)
											}),
											(0, react_jsx_runtime.jsx)(Stat, {
												label: t("detail.stats.installs"),
												value: installs === void 0 ? "" : formatCount(installs)
											}),
											(0, react_jsx_runtime.jsx)(Stat, {
												label: t("detail.stats.stars"),
												value: skill.stats.stars === void 0 ? "" : formatCount(skill.stats.stars)
											}),
											(0, react_jsx_runtime.jsx)(Stat, {
												label: t("count.updated"),
												value: updated
											}),
											(0, react_jsx_runtime.jsx)(Stat, {
												label: t("detail.license"),
												value: skill.license ?? ""
											}),
											(0, react_jsx_runtime.jsx)(Stat, {
												label: t("detail.dir"),
												value: skill.installedInfo?.dirName ?? ""
											}),
											(0, react_jsx_runtime.jsx)(Stat, {
												label: t("detail.stats.installedAt"),
												value: installedAt
											})
										]
									}),
									skill.upstream !== void 0 && (0, react_jsx_runtime.jsx)("p", {
										className: cls(SkillDetail_module_css_default, "note"),
										children: t("detail.upstream", { source: t(`source.${skill.upstream.source}`) })
									}),
									pageUrl !== void 0 && (0, react_jsx_runtime.jsx)("p", {
										className: cls(SkillDetail_module_css_default, "note"),
										children: (0, react_jsx_runtime.jsxs)("a", {
											className: cls(SkillDetail_module_css_default, "link"),
											href: pageUrl,
											target: "_blank",
											rel: "noreferrer noopener",
											children: [
												t("detail.page"),
												" ",
												(0, react_jsx_runtime.jsx)(ExternalLinkIcon, { size: 11 })
											]
										})
									})
								]
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: cls(SkillDetail_module_css_default, "action"),
								children: [skill.installState === "installable" && (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: cls(SkillDetail_module_css_default, "primaryAction"),
									disabled: props.installing,
									onClick: () => {
										props.onInstall(skill.id, skill.version);
									},
									children: [(0, react_jsx_runtime.jsx)(DownloadIcon, {
										size: 14,
										strokeWidth: 1.9
									}), props.installing ? t("install.installing") : t("install.action")]
								}), skill.installState === "installed" && (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: cls(SkillDetail_module_css_default, "ghostAction"),
									disabled: props.uninstalling,
									onClick: () => {
										props.onUninstall(skill.id, skill.name);
									},
									children: props.uninstalling ? t("install.uninstalling") : t("install.uninstall")
								})]
							})
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: cls(SkillDetail_module_css_default, "tabStrip"),
						role: "tablist",
						"aria-label": t("detail.tabs", { name: skill.name }),
						children: TABS.map((entry, index) => (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "tab",
							id: tabId(entry),
							"aria-selected": tab === entry,
							"aria-controls": panelId(entry),
							tabIndex: tab === entry ? 0 : -1,
							ref: (node) => {
								tabRefs.current[index] = node;
							},
							className: cx(cls(SkillDetail_module_css_default, "tab"), tab === entry ? cls(SkillDetail_module_css_default, "tabActive") : ""),
							onClick: () => {
								onTab(entry);
							},
							onKeyDown: onTabKeyDown,
							children: [(0, react_jsx_runtime.jsx)(FileTextIcon, { size: 14 }), t(TAB_KEY[entry])]
						}, entry))
					}),
					tab === "overview" && (0, react_jsx_runtime.jsx)(OverviewPanel, {
						t,
						skill,
						id: panelId("overview"),
						labelledBy: tabId("overview")
					}),
					tab === "files" && (0, react_jsx_runtime.jsx)("section", {
						className: cls(SkillDetail_module_css_default, "panel"),
						role: "tabpanel",
						id: panelId("files"),
						"aria-labelledby": tabId("files"),
						tabIndex: 0,
						children: files.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
							className: cls(SkillDetail_module_css_default, "placeholder"),
							children: t("detail.files.empty")
						}) : filePath === null || file === void 0 ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("p", {
							className: cls(SkillDetail_module_css_default, "note"),
							children: summaryLine
						}), list] }) : (0, react_jsx_runtime.jsxs)("div", {
							className: cls(SkillDetail_module_css_default, "filesLayout"),
							children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("p", {
								className: cls(SkillDetail_module_css_default, "note"),
								children: summaryLine
							}), list] }), (0, react_jsx_runtime.jsx)(Preview, {
								t,
								state: file,
								onClose: onCloseFile
							})]
						})
					}),
					tab === "security" && (0, react_jsx_runtime.jsx)(SecurityPanel, {
						t,
						skill,
						id: panelId("security"),
						labelledBy: tabId("security")
					}),
					skill.changelog !== void 0 && (0, react_jsx_runtime.jsxs)("section", {
						className: cls(SkillDetail_module_css_default, "changelog"),
						children: [(0, react_jsx_runtime.jsxs)("h3", {
							className: cls(SkillDetail_module_css_default, "changelogTitle"),
							children: [
								t("detail.changelog"),
								skill.changelog.version !== void 0 && (0, react_jsx_runtime.jsxs)("span", {
									className: cls(SkillDetail_module_css_default, "versionPill"),
									children: ["v", skill.changelog.version]
								}),
								skill.changelog.publishedAt !== void 0 && (0, react_jsx_runtime.jsx)("span", {
									className: cls(SkillDetail_module_css_default, "changelogDate"),
									children: formatIsoDate(skill.changelog.publishedAt)
								})
							]
						}), (0, react_jsx_runtime.jsx)("p", {
							className: cls(SkillDetail_module_css_default, "changelogText"),
							children: skill.changelog.text
						})]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\dsh-skills-hub\src\client\shared.module.css.mjs
		const css$2 = ".Wzh6fG_srOnly{clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}";
		const tagId$2 = "@nanmicoder/dsh-skills-hub/shared.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@nanmicoder/dsh-skills-hub";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var shared_module_css_default = { "srOnly": "Wzh6fG_srOnly" };
		//#endregion
		//#region \0dsh-css:D:\dsh-skills-hub\src\client\MarketPanel.module.css.mjs
		const css$1 = ".Qj6XhG_panel{background:var(--dsw-alias-bg-base);box-sizing:border-box;height:100%;min-height:0;max-height:100%;color:var(--dsw-alias-label-primary);flex-direction:column;font-size:14px;display:flex;overflow:hidden}.Qj6XhG_band{border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);flex-direction:column;flex:0 auto;gap:12px;min-height:0;padding:18px 24px 14px;display:flex;overflow-y:auto}.Qj6XhG_header{flex-wrap:wrap;align-items:flex-start;gap:12px;min-width:0;display:flex}.Qj6XhG_mark{background:var(--dsw-alias-brand-primary);width:42px;height:42px;color:var(--dsw-alias-bg-base);border-radius:10px;flex-shrink:0;justify-content:center;align-items:center;display:inline-flex}.Qj6XhG_headText{flex:1;min-width:0}.Qj6XhG_title{color:var(--dsw-alias-label-primary);letter-spacing:-.01em;margin:0;font-size:22px;font-weight:700;line-height:30px}.Qj6XhG_subtitle{max-width:68ch;color:var(--dsw-alias-label-secondary);margin:3px 0 0;font-size:13px;line-height:20px}.Qj6XhG_refresh{border:1px solid var(--dsw-alias-border-l2);height:32px;color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;background:0 0;border-radius:8px;flex-shrink:0;align-items:center;gap:6px;padding:0 12px;font-size:13px;display:inline-flex}.Qj6XhG_refresh:hover:not(:disabled){background:color-mix(in oklab, var(--dsw-alias-label-primary) 6%, transparent)}.Qj6XhG_refresh:disabled{cursor:progress;opacity:.65}.Qj6XhG_refreshLabel{white-space:nowrap}.Qj6XhG_spin{animation:1s linear infinite Qj6XhG_skillsHubSpin}@keyframes Qj6XhG_skillsHubSpin{to{transform:rotate(360deg)}}.Qj6XhG_warn{border:1px solid color-mix(in oklab, var(--dsw-alias-state-warn-primary) 46%, transparent);background:color-mix(in oklab, var(--dsw-alias-state-warn-primary) 13%, var(--dsw-alias-bg-layer-1));border-radius:10px;align-items:flex-start;gap:10px;min-width:0;padding:11px 12px 11px 14px;display:flex}.Qj6XhG_warnIcon{color:color-mix(in oklab, var(--dsw-alias-state-warn-primary) 70%, var(--dsw-alias-label-primary));flex-shrink:0;margin-top:1px}.Qj6XhG_warnText{min-width:0;color:var(--dsw-alias-label-primary);flex:1;margin:0;font-size:13px;line-height:1.7}.Qj6XhG_warnTitle{font-weight:700}.Qj6XhG_warnClose{width:24px;height:24px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:6px;flex-shrink:0;justify-content:center;align-items:center;display:inline-flex}.Qj6XhG_warnClose:hover{background:color-mix(in oklab, var(--dsw-alias-label-primary) 8%, transparent);color:var(--dsw-alias-label-primary)}.Qj6XhG_toolbar{flex-wrap:wrap;align-items:center;gap:8px;min-width:0;display:flex}.Qj6XhG_search{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);box-sizing:border-box;border-radius:8px;flex:240px;align-items:center;gap:8px;min-width:200px;height:34px;padding:0 8px 0 11px;display:flex}.Qj6XhG_search:focus-within{border-color:var(--dsw-alias-brand-primary);outline:2px solid color-mix(in oklab, var(--dsw-alias-brand-primary) 26%, transparent);outline-offset:0}.Qj6XhG_searchIcon{color:var(--dsw-alias-label-secondary);flex-shrink:0}.Qj6XhG_searchInput{min-width:0;color:var(--dsw-alias-label-primary);font:inherit;background:0 0;border:0;outline:none;flex:1;font-size:13.5px}.Qj6XhG_searchInput::placeholder{color:var(--dsw-alias-label-secondary)}.Qj6XhG_searchInput::-webkit-search-cancel-button,.Qj6XhG_searchInput::-webkit-search-decoration{appearance:none;display:none}.Qj6XhG_searchClear{width:22px;height:22px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:5px;flex-shrink:0;justify-content:center;align-items:center;display:inline-flex}.Qj6XhG_searchClear:hover{background:color-mix(in oklab, var(--dsw-alias-label-primary) 8%, transparent);color:var(--dsw-alias-label-primary)}.Qj6XhG_select{flex-shrink:0;align-items:center;display:inline-flex;position:relative}.Qj6XhG_selectControl{border:1px solid var(--dsw-alias-border-l2);appearance:none;background:var(--dsw-alias-bg-layer-1);height:34px;color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;border-radius:8px;padding:0 26px 0 10px;font-size:13px}.Qj6XhG_selectChevron{color:var(--dsw-alias-label-secondary);pointer-events:none;position:absolute;right:8px}.Qj6XhG_countRow{flex-wrap:wrap;align-items:baseline;gap:6px 14px;min-width:0;display:flex}.Qj6XhG_count{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;flex-wrap:wrap;align-items:baseline;gap:10px;margin:0;font-size:13.5px;font-weight:600;display:flex}.Qj6XhG_countMeta{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:400}.Qj6XhG_filterSummary{color:var(--dsw-alias-label-secondary);flex-wrap:wrap;align-items:baseline;gap:8px;margin:0;font-size:12.5px;display:flex}.Qj6XhG_linkButton{color:var(--dsw-alias-brand-primary);cursor:pointer;font:inherit;background:0 0;border:0;padding:0;font-size:12.5px;text-decoration:underline}.Qj6XhG_notice{border-radius:9px;align-items:center;gap:8px;min-width:0;padding:9px 12px;font-size:13px;display:flex}.Qj6XhG_noticeText{overflow-wrap:anywhere;flex:1;min-width:0}.Qj6XhG_noticeSuccess{border:1px solid color-mix(in oklab, var(--dsw-alias-state-success-primary) 40%, transparent);background:color-mix(in oklab, var(--dsw-alias-state-success-primary) 10%, transparent)}.Qj6XhG_noticeError{border:1px solid color-mix(in oklab, var(--dsw-alias-state-error-primary) 40%, transparent);background:color-mix(in oklab, var(--dsw-alias-state-error-primary) 10%, transparent);color:var(--dsw-alias-state-error-primary)}.Qj6XhG_noticeClose{width:22px;height:22px;color:inherit;cursor:pointer;opacity:.75;background:0 0;border:0;border-radius:5px;flex-shrink:0;justify-content:center;align-items:center;display:inline-flex}.Qj6XhG_noticeClose:hover{background:color-mix(in oklab, var(--dsw-alias-label-primary) 8%, transparent);opacity:1}.Qj6XhG_results{flex:1;min-height:0;padding:16px 24px 28px;overflow-y:auto}.Qj6XhG_grid{grid-template-columns:repeat(auto-fill,minmax(min(240px,100%),1fr));gap:14px;margin:0;padding:0;list-style:none;display:grid}.Qj6XhG_gridItem{min-width:0;display:flex}.Qj6XhG_gridItem>*{flex:1;min-width:0}.Qj6XhG_moreRow{justify-content:center;padding-top:18px;display:flex}.Qj6XhG_more{border:1px solid var(--dsw-alias-border-l2);height:34px;color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;background:0 0;border-radius:8px;padding:0 18px;font-size:13px}.Qj6XhG_more:hover:not(:disabled){background:color-mix(in oklab, var(--dsw-alias-label-primary) 6%, transparent)}.Qj6XhG_more:disabled{cursor:progress;opacity:.65}.Qj6XhG_state{border:1px dashed var(--dsw-alias-border-l2);text-align:center;border-radius:12px;flex-direction:column;align-items:center;gap:10px;padding:52px 24px;display:flex}.Qj6XhG_stateIcon{color:var(--dsw-alias-label-secondary)}.Qj6XhG_stateIconError{color:var(--dsw-alias-state-error-primary)}.Qj6XhG_stateTitle{color:var(--dsw-alias-label-primary);margin:0;font-size:14px;font-weight:600}.Qj6XhG_stateText{max-width:46ch;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;margin:0;font-size:13px;line-height:1.7}.Qj6XhG_stateAction{border:1px solid var(--dsw-alias-border-l2);height:32px;color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;background:0 0;border-radius:8px;align-items:center;gap:6px;margin-top:4px;padding:0 14px;font-size:13px;display:inline-flex}.Qj6XhG_stateAction:hover{background:color-mix(in oklab, var(--dsw-alias-label-primary) 6%, transparent)}.Qj6XhG_refresh:focus-visible,.Qj6XhG_warnClose:focus-visible,.Qj6XhG_searchClear:focus-visible,.Qj6XhG_selectControl:focus-visible,.Qj6XhG_more:focus-visible,.Qj6XhG_stateAction:focus-visible,.Qj6XhG_linkButton:focus-visible,.Qj6XhG_noticeClose:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}@media (prefers-reduced-motion:reduce){.Qj6XhG_spin{animation:none}}";
		const tagId$1 = "@nanmicoder/dsh-skills-hub/MarketPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@nanmicoder/dsh-skills-hub";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var MarketPanel_module_css_default = {
			"band": "Qj6XhG_band",
			"count": "Qj6XhG_count",
			"countMeta": "Qj6XhG_countMeta",
			"countRow": "Qj6XhG_countRow",
			"filterSummary": "Qj6XhG_filterSummary",
			"grid": "Qj6XhG_grid",
			"gridItem": "Qj6XhG_gridItem",
			"headText": "Qj6XhG_headText",
			"header": "Qj6XhG_header",
			"linkButton": "Qj6XhG_linkButton",
			"mark": "Qj6XhG_mark",
			"more": "Qj6XhG_more",
			"moreRow": "Qj6XhG_moreRow",
			"notice": "Qj6XhG_notice",
			"noticeClose": "Qj6XhG_noticeClose",
			"noticeError": "Qj6XhG_noticeError",
			"noticeSuccess": "Qj6XhG_noticeSuccess",
			"noticeText": "Qj6XhG_noticeText",
			"panel": "Qj6XhG_panel",
			"refresh": "Qj6XhG_refresh",
			"refreshLabel": "Qj6XhG_refreshLabel",
			"results": "Qj6XhG_results",
			"search": "Qj6XhG_search",
			"searchClear": "Qj6XhG_searchClear",
			"searchIcon": "Qj6XhG_searchIcon",
			"searchInput": "Qj6XhG_searchInput",
			"select": "Qj6XhG_select",
			"selectChevron": "Qj6XhG_selectChevron",
			"selectControl": "Qj6XhG_selectControl",
			"skillsHubSpin": "Qj6XhG_skillsHubSpin",
			"spin": "Qj6XhG_spin",
			"state": "Qj6XhG_state",
			"stateAction": "Qj6XhG_stateAction",
			"stateIcon": "Qj6XhG_stateIcon",
			"stateIconError": "Qj6XhG_stateIconError",
			"stateText": "Qj6XhG_stateText",
			"stateTitle": "Qj6XhG_stateTitle",
			"subtitle": "Qj6XhG_subtitle",
			"title": "Qj6XhG_title",
			"toolbar": "Qj6XhG_toolbar",
			"warn": "Qj6XhG_warn",
			"warnClose": "Qj6XhG_warnClose",
			"warnIcon": "Qj6XhG_warnIcon",
			"warnText": "Qj6XhG_warnText",
			"warnTitle": "Qj6XhG_warnTitle"
		};
		//#endregion
		//#region lib/client/market-api.js
		/**
		* HTTP client for the skills-hub host half.
		*
		* Every route lives behind the browser auth fence, so requests carry
		* `credentials: 'same-origin'`; every request takes an `AbortSignal` so the
		* panel can supersede or unmount without leaking a socket. Responses are
		* validated field by field before they reach React: a malformed payload raises
		* {@link MarketApiError} with a stable code instead of crashing the panel on a
		* missing property three renders later.
		*
		* @module dsh-skills-hub/client/market-api
		*/
		/** Mount point of the plugin's host routes. */
		const MARKET_BASE_PATH = "/plugins/dsh-skills-hub";
		/** Stable codes the client adds on top of the shared {@link MARKET_ERROR_CODES}. */
		const CLIENT_ERROR_CODES = {
			/** The route answered 2xx with a body that does not match the wire contract. */
			badResponse: "MARKET_CLIENT_BAD_RESPONSE",
			/** The route answered 2xx with a non-JSON body where JSON was required. */
			malformedBody: "MARKET_CLIENT_MALFORMED_BODY",
			/** The route failed without a readable `{ error, code }` envelope. */
			httpError: "MARKET_CLIENT_HTTP_ERROR"
		};
		/** Transport failure carrying the host's stable error code. */
		var MarketApiError = class extends Error {
			/** `MARKET_*` code from the error body, or one of {@link CLIENT_ERROR_CODES}. */
			code;
			/** HTTP status; 0 when the request never produced a response. */
			status;
			constructor(message, code, status) {
				super(message);
				this.name = "MarketApiError";
				this.code = code;
				this.status = status;
			}
		};
		function asObject(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
		}
		function asString(value) {
			return typeof value === "string" ? value : void 0;
		}
		function asFiniteNumber(value) {
			return typeof value === "number" && Number.isFinite(value) ? value : void 0;
		}
		function asBoolean(value) {
			return typeof value === "boolean" ? value : void 0;
		}
		function asArray(value) {
			return Array.isArray(value) ? value : void 0;
		}
		function isStringMember(domain, value) {
			return typeof value === "string" && domain.includes(value);
		}
		const NOT_INSTALLABLE_REASONS = [
			"empty-file-list",
			"file-too-large",
			"too-many-files",
			"invalid-name",
			"name-conflict",
			"source-unavailable"
		];
		const SOURCE_HEALTH = [
			"ok",
			"degraded",
			"failed",
			"cached"
		];
		function readSource(value) {
			return isStringMember(MARKET_SOURCES, value) ? value : void 0;
		}
		function readSecurityStatus(value) {
			return isStringMember(SECURITY_STATUSES, value) ? value : void 0;
		}
		function readAuthor(value) {
			const raw = asObject(value);
			const handle = asString(raw?.["handle"]) ?? "";
			const displayName = asString(raw?.["displayName"]);
			const avatarUrl = asString(raw?.["avatarUrl"]);
			return {
				handle,
				...displayName === void 0 ? {} : { displayName },
				...avatarUrl === void 0 ? {} : { avatarUrl }
			};
		}
		function readStats(value) {
			const raw = asObject(value);
			const downloads = asFiniteNumber(raw?.["downloads"]) ?? 0;
			const installs = asFiniteNumber(raw?.["installs"]);
			const stars = asFiniteNumber(raw?.["stars"]);
			return {
				downloads,
				...installs === void 0 ? {} : { installs },
				...stars === void 0 ? {} : { stars }
			};
		}
		function readReports(value) {
			const raw = asArray(value);
			if (raw === void 0) return void 0;
			const reports = [];
			for (const entry of raw) {
				const item = asObject(entry);
				if (item === void 0) continue;
				const vendor = asString(item["vendor"]);
				const status = asString(item["status"]);
				if (vendor === void 0 || status === void 0) continue;
				const summary = asString(item["summary"]);
				const reportUrl = asString(item["reportUrl"]);
				reports.push({
					vendor,
					status,
					statusText: asString(item["statusText"]) ?? status,
					...summary === void 0 ? {} : { summary },
					...reportUrl === void 0 ? {} : { reportUrl }
				});
			}
			return reports;
		}
		function readInstalledInfo(value) {
			const raw = asObject(value);
			if (raw === void 0) return void 0;
			const installedAt = asString(raw["installedAt"]);
			const dirName = asString(raw["dirName"]);
			if (installedAt === void 0 || dirName === void 0) return void 0;
			const version = asString(raw["version"]);
			return {
				installedAt,
				dirName,
				managed: asBoolean(raw["managed"]) ?? false,
				...version === void 0 ? {} : { version }
			};
		}
		function readUpstream(value) {
			const raw = asObject(value);
			if (raw === void 0) return void 0;
			const source = readSource(raw["source"]);
			const slug = asString(raw["slug"]);
			if (source === void 0 || slug === void 0) return void 0;
			return {
				source,
				slug
			};
		}
		/** Read one grid entry; `undefined` when a field the UI depends on is missing. */
		function readSkill(value) {
			const raw = asObject(value);
			if (raw === void 0) return void 0;
			const id = asString(raw["id"]);
			const source = readSource(raw["source"]);
			const slug = asString(raw["slug"]);
			const name = asString(raw["name"]);
			const securityStatus = readSecurityStatus(raw["securityStatus"]);
			const installStateValue = asString(raw["installState"]);
			const installState = installStateValue === "installed" || installStateValue === "installable" || installStateValue === "not-installable" ? installStateValue : void 0;
			if (id === void 0 || source === void 0 || slug === void 0 || name === void 0) return void 0;
			if (securityStatus === void 0 || installState === void 0) return void 0;
			const summaryEn = asString(raw["summaryEn"]);
			const category = asString(raw["category"]);
			const version = asString(raw["version"]);
			const updatedAt = asFiniteNumber(raw["updatedAt"]);
			const iconUrl = asString(raw["iconUrl"]);
			const reports = readReports(raw["securityReports"]);
			const requiresApiKey = asBoolean(raw["requiresApiKey"]);
			const verified = asBoolean(raw["verified"]);
			const upstream = readUpstream(raw["upstream"]);
			const installedInfo = readInstalledInfo(raw["installedInfo"]);
			const reason = isStringMember(NOT_INSTALLABLE_REASONS, raw["notInstallableReason"]) ? raw["notInstallableReason"] : void 0;
			const tags = [];
			for (const tag of asArray(raw["tags"]) ?? []) if (typeof tag === "string") tags.push(tag);
			return {
				id,
				source,
				slug,
				name,
				summary: asString(raw["summary"]) ?? "",
				...summaryEn === void 0 ? {} : { summaryEn },
				author: readAuthor(raw["author"]),
				stats: readStats(raw["stats"]),
				tags,
				...category === void 0 ? {} : { category },
				...version === void 0 ? {} : { version },
				...updatedAt === void 0 ? {} : { updatedAt },
				...iconUrl === void 0 ? {} : { iconUrl },
				securityStatus,
				...reports === void 0 ? {} : { securityReports: reports },
				...requiresApiKey === void 0 ? {} : { requiresApiKey },
				...verified === void 0 ? {} : { verified },
				...upstream === void 0 ? {} : { upstream },
				installState,
				...reason === void 0 ? {} : { notInstallableReason: reason },
				...installedInfo === void 0 ? {} : { installedInfo }
			};
		}
		function readSourceStatus(value) {
			const raw = asObject(value);
			if (raw === void 0) return void 0;
			const status = isStringMember(SOURCE_HEALTH, raw["status"]) ? raw["status"] : void 0;
			if (status === void 0) return void 0;
			const fetchedAt = asFiniteNumber(raw["fetchedAt"]);
			const error = asString(raw["error"]);
			const fromCache = asBoolean(raw["fromCache"]);
			return {
				status,
				...fetchedAt === void 0 ? {} : { fetchedAt },
				...fromCache === void 0 ? {} : { fromCache },
				...error === void 0 ? {} : { error }
			};
		}
		function readSources(value) {
			const raw = asObject(value);
			const sources = {};
			if (raw === void 0) return sources;
			for (const source of MARKET_SOURCES) {
				const info = readSourceStatus(raw[source]);
				if (info !== void 0) sources[source] = info;
			}
			return sources;
		}
		function readFileMeta(value) {
			const raw = asObject(value);
			if (raw === void 0) return void 0;
			const path = asString(raw["path"]);
			if (path === void 0) return void 0;
			const sha256 = asString(raw["sha256"]);
			const contentType = asString(raw["contentType"]);
			return {
				path,
				size: asFiniteNumber(raw["size"]) ?? 0,
				language: asString(raw["language"]) ?? "text",
				tooBig: asBoolean(raw["tooBig"]) ?? false,
				...sha256 === void 0 ? {} : { sha256 },
				...contentType === void 0 ? {} : { contentType }
			};
		}
		/** Validate a `GET /catalog` body. @returns the snapshot, or `undefined` when malformed. */
		function readCatalog(value) {
			const raw = asObject(value);
			if (raw === void 0) return void 0;
			const listed = asArray(raw["items"]);
			const generatedAt = asFiniteNumber(raw["generatedAt"]);
			if (listed === void 0 || generatedAt === void 0) return void 0;
			const cursorValue = raw["nextCursor"];
			const nextCursor = cursorValue === null || cursorValue === void 0 ? null : asString(cursorValue);
			if (cursorValue !== null && cursorValue !== void 0 && nextCursor === void 0) return void 0;
			const items = [];
			for (const entry of listed) {
				const skill = readSkill(entry);
				if (skill !== void 0) items.push(skill);
			}
			if (listed.length > 0 && items.length === 0) return void 0;
			const total = asFiniteNumber(raw["total"]);
			return {
				items,
				nextCursor: nextCursor ?? null,
				sources: readSources(raw["sources"]),
				total,
				generatedAt
			};
		}
		/** Validate a `GET /skill` body. @returns the detail, or `undefined` when malformed. */
		function readSkillDetail(value) {
			const base = readSkill(value);
			const raw = asObject(value);
			if (base === void 0 || raw === void 0) return void 0;
			const listed = asArray(raw["files"]);
			if (listed === void 0) return void 0;
			const files = [];
			for (const entry of listed) {
				const meta = readFileMeta(entry);
				if (meta !== void 0) files.push(meta);
			}
			const descriptionFrontmatter = asObject(raw["descriptionFrontmatter"]);
			const license = asString(raw["license"]);
			const pageUrl = asString(raw["pageUrl"]);
			const changelog = readChangelog(raw["changelog"]);
			return {
				...base,
				description: asString(raw["description"]) ?? "",
				...descriptionFrontmatter === void 0 ? {} : { descriptionFrontmatter },
				...license === void 0 ? {} : { license },
				files,
				totalSize: asFiniteNumber(raw["totalSize"]) ?? files.reduce((sum, file) => sum + file.size, 0),
				...changelog === void 0 ? {} : { changelog },
				...pageUrl === void 0 ? {} : { pageUrl }
			};
		}
		function readChangelog(value) {
			const raw = asObject(value);
			if (raw === void 0) return void 0;
			const text = asString(raw["text"]);
			if (text === void 0 || text.trim() === "") return void 0;
			const version = asString(raw["version"]);
			const publishedAt = asFiniteNumber(raw["publishedAt"]);
			return {
				text,
				...version === void 0 ? {} : { version },
				...publishedAt === void 0 ? {} : { publishedAt }
			};
		}
		/** Validate a `GET /file` body. */
		function readFileContent(value) {
			const raw = asObject(value);
			if (raw === void 0) return void 0;
			const path = asString(raw["path"]);
			const content = asString(raw["content"]);
			if (path === void 0 || content === void 0) return void 0;
			return {
				path,
				content,
				language: asString(raw["language"]) ?? "text",
				size: asFiniteNumber(raw["size"]) ?? content.length,
				truncated: asBoolean(raw["truncated"]) ?? false
			};
		}
		/** Validate a `POST /install` body. */
		function readInstallResponse(value) {
			const raw = asObject(value);
			if (raw === void 0 || raw["ok"] !== true) return void 0;
			const id = asString(raw["id"]);
			const dirName = asString(raw["dirName"]);
			const path = asString(raw["path"]);
			if (id === void 0 || dirName === void 0 || path === void 0) return void 0;
			const version = asString(raw["version"]);
			return {
				ok: true,
				id,
				dirName,
				path,
				...version === void 0 ? {} : { version },
				fileCount: asFiniteNumber(raw["fileCount"]) ?? 0,
				totalSize: asFiniteNumber(raw["totalSize"]) ?? 0
			};
		}
		/** Read the `{ error, code }` envelope the host returns on failure. */
		function readErrorBody(value) {
			const raw = asObject(value);
			if (raw === void 0) return void 0;
			const error = asString(raw["error"]);
			const code = asString(raw["code"]);
			if (error === void 0 || code === void 0) return void 0;
			return {
				error,
				code
			};
		}
		/** True when a rejection is the abort this panel itself requested. */
		function isAbortError(cause) {
			return typeof cause === "object" && cause !== null && cause.name === "AbortError";
		}
		/** Human-readable text of any thrown value. */
		function errorMessage(cause) {
			if (cause instanceof MarketApiError) return cause.message;
			if (cause instanceof Error) return cause.message;
			return String(cause);
		}
		function buildUrl(path, params) {
			const search = new URLSearchParams();
			for (const [name, value] of Object.entries(params)) if (value !== void 0 && value !== "") search.set(name, value);
			const query = search.toString();
			return `${MARKET_BASE_PATH}${path}${query === "" ? "" : `?${query}`}`;
		}
		async function requestRaw(url, signal, init) {
			const response = await fetch(url, {
				method: init?.method ?? "GET",
				credentials: "same-origin",
				headers: init === void 0 ? { accept: "application/json" } : {
					accept: "application/json",
					"content-type": "application/json"
				},
				signal,
				...init === void 0 ? {} : { body: JSON.stringify(init.body) }
			});
			let body;
			try {
				body = await response.json();
			} catch (cause) {
				if (isAbortError(cause)) throw cause;
				body = void 0;
			}
			return {
				ok: response.ok,
				status: response.status,
				body
			};
		}
		function toApiError(raw) {
			const failure = readErrorBody(raw.body);
			return new MarketApiError(failure?.error ?? `HTTP ${raw.status}`, failure?.code ?? CLIENT_ERROR_CODES.httpError, raw.status);
		}
		/** A request whose 2xx body must be JSON. */
		async function requestJson(url, signal, init) {
			const raw = await requestRaw(url, signal, init);
			if (!raw.ok) throw toApiError(raw);
			if (raw.body === void 0) throw new MarketApiError("response body is not JSON", CLIENT_ERROR_CODES.malformedBody, raw.status);
			return raw.body;
		}
		/** A request that only needs to succeed — `204 No Content` is a valid answer. */
		async function requestOk(url, signal, init) {
			const raw = await requestRaw(url, signal, init);
			if (!raw.ok) throw toApiError(raw);
		}
		function badResponse(url) {
			return new MarketApiError(`unexpected response shape from ${url}`, CLIENT_ERROR_CODES.badResponse, 200);
		}
		function optionalFilter(value) {
			return value === void 0 || value === "all" ? void 0 : value;
		}
		/** `GET /catalog` — one page of merged registry results. */
		async function fetchCatalog(request, signal) {
			const url = buildUrl("/catalog", {
				q: request.q?.trim() === "" ? void 0 : request.q?.trim(),
				source: optionalFilter(request.source),
				security: optionalFilter(request.security),
				install: optionalFilter(request.install),
				cursor: request.cursor,
				limit: String(request.limit ?? MARKET_LIMITS.pageSize),
				refresh: request.refresh === true ? "true" : void 0
			});
			const snapshot = readCatalog(await requestJson(url, signal));
			if (snapshot === void 0) throw badResponse(url);
			return snapshot;
		}
		/** `GET /skill` — one skill with its file list and rendered description. */
		async function fetchSkillDetail(id, signal) {
			const url = buildUrl("/skill", { id });
			const detail = readSkillDetail(await requestJson(url, signal));
			if (detail === void 0) throw badResponse(url);
			return detail;
		}
		/** `GET /file` — one file body for the preview pane. */
		async function fetchFile(id, path, signal) {
			const url = buildUrl("/file", {
				id,
				path
			});
			const content = readFileContent(await requestJson(url, signal));
			if (content === void 0) throw badResponse(url);
			return content;
		}
		/** `POST /install` — write one skill into the skills root. */
		async function installSkill(id, version, signal) {
			const url = buildUrl("/install", {});
			const result = readInstallResponse(await requestJson(url, signal, {
				method: "POST",
				body: version === void 0 ? { id } : {
					id,
					version
				}
			}));
			if (result === void 0) throw badResponse(url);
			return result;
		}
		/** `POST /uninstall` — remove one hub-managed skill. */
		async function uninstallSkill(id, signal) {
			await requestOk(buildUrl("/uninstall", {}), signal, {
				method: "POST",
				body: { id }
			});
		}
		/** `POST /refresh` — drop the host cache and re-read every upstream. */
		async function refreshMarket(signal) {
			await requestOk(buildUrl("/refresh", {}), signal, {
				method: "POST",
				body: {}
			});
		}
		const NO_FILTERS = {
			source: "all",
			security: "all",
			install: "all"
		};
		function withAdded(set, value) {
			const next = new Set(set);
			next.add(value);
			return next;
		}
		function withRemoved(set, value) {
			if (!set.has(value)) return set;
			const next = new Set(set);
			next.delete(value);
			return next;
		}
		function markInstalled(skill, dirName, version) {
			return {
				...skill,
				installState: "installed",
				installedInfo: {
					installedAt: (/* @__PURE__ */ new Date()).toISOString(),
					dirName,
					managed: true,
					...version === void 0 ? {} : { version }
				}
			};
		}
		function markInstallable(skill) {
			return {
				...skill,
				installState: "installable",
				installedInfo: void 0
			};
		}
		/**
		* @param t - namespace-bound translate, for the transient install notices.
		* @returns the panel's complete read/write surface.
		*/
		function useMarketplace(t) {
			const [items, setItems] = (0, react.useState)([]);
			const [sources, setSources] = (0, react.useState)({});
			const [total, setTotal] = (0, react.useState)(void 0);
			const [generatedAt, setGeneratedAt] = (0, react.useState)(void 0);
			const [nextCursor, setNextCursor] = (0, react.useState)(null);
			const [loading, setLoading] = (0, react.useState)(true);
			const [loadingMore, setLoadingMore] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(void 0);
			const [notice, setNotice] = (0, react.useState)(void 0);
			const [installing, setInstalling] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const [uninstalling, setUninstalling] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const [draft, setDraftState] = (0, react.useState)("");
			const [composing, setComposingState] = (0, react.useState)(false);
			const [query, setQuery] = (0, react.useState)("");
			const [filters, setFilters] = (0, react.useState)(NO_FILTERS);
			const [nonce, setNonce] = (0, react.useState)(0);
			const [detailId, setDetailId] = (0, react.useState)(null);
			const [detailNonce, setDetailNonce] = (0, react.useState)(0);
			const [detail, setDetail] = (0, react.useState)(void 0);
			const [detailTab, setDetailTabState] = (0, react.useState)("overview");
			const [filePath, setFilePath] = (0, react.useState)(null);
			const [file, setFile] = (0, react.useState)(void 0);
			const pendingRefresh = (0, react.useRef)(false);
			const controllers = (0, react.useRef)(/* @__PURE__ */ new Set());
			const begin = (0, react.useCallback)(() => {
				const controller = new AbortController();
				controllers.current.add(controller);
				return controller;
			}, []);
			const end = (0, react.useCallback)((controller) => {
				controllers.current.delete(controller);
			}, []);
			const abortAll = (0, react.useCallback)(() => {
				for (const controller of controllers.current) controller.abort();
				controllers.current.clear();
			}, []);
			(0, react.useEffect)(() => abortAll, [abortAll]);
			(0, react.useEffect)(() => {
				const controller = begin();
				const force = pendingRefresh.current;
				pendingRefresh.current = false;
				let active = true;
				setLoading(true);
				setNotice(void 0);
				if (!force) {
					setItems([]);
					setNextCursor(null);
				}
				setError(void 0);
				(async () => {
					try {
						const snapshot = await fetchCatalog({
							q: query,
							source: filters.source,
							security: filters.security,
							install: filters.install,
							limit: MARKET_LIMITS.pageSize,
							refresh: force
						}, controller.signal);
						if (!active) return;
						setItems(snapshot.items);
						setSources(snapshot.sources);
						setTotal(snapshot.total);
						setGeneratedAt(snapshot.generatedAt);
						setNextCursor(snapshot.nextCursor);
						setLoading(false);
					} catch (cause) {
						if (!active || isAbortError(cause)) return;
						setError(errorMessage(cause));
						setLoading(false);
					} finally {
						end(controller);
					}
				})();
				return () => {
					active = false;
					controller.abort();
					end(controller);
				};
			}, [
				query,
				filters,
				nonce,
				begin,
				end
			]);
			(0, react.useEffect)(() => {
				if (composing) return;
				const timer = window.setTimeout(() => {
					setQuery(draft.trim());
				}, 350);
				return () => {
					window.clearTimeout(timer);
				};
			}, [draft, composing]);
			const setDraft = (0, react.useCallback)((value) => {
				setDraftState(value);
			}, []);
			/**
			* Commit the box immediately (Enter, or the clear control).
			* @param value - the text to commit; defaults to the current draft. Passing it
			*   explicitly matters for the clear control, where the caller's draft state
			*   has not re-rendered yet and the closure still holds the old text.
			*/
			const commitDraft = (0, react.useCallback)((value) => {
				setQuery((value ?? draft).trim());
			}, [draft]);
			const setComposing = (0, react.useCallback)((value) => {
				setComposingState(value);
			}, []);
			(0, react.useEffect)(() => {
				if (detailId === null) {
					setDetail(void 0);
					return;
				}
				const controller = begin();
				let active = true;
				setDetail({
					id: detailId,
					status: "loading",
					skill: void 0,
					error: void 0
				});
				setDetailTabState("overview");
				setFilePath(null);
				setFile(void 0);
				(async () => {
					try {
						const skill = await fetchSkillDetail(detailId, controller.signal);
						if (!active) return;
						setDetail({
							id: detailId,
							status: "ready",
							skill,
							error: void 0
						});
						setItems((previous) => previous.map((item) => item.id === skill.id ? {
							...item,
							...skill
						} : item));
					} catch (cause) {
						if (!active || isAbortError(cause)) return;
						setDetail({
							id: detailId,
							status: "error",
							skill: void 0,
							error: errorMessage(cause)
						});
					} finally {
						end(controller);
					}
				})();
				return () => {
					active = false;
					controller.abort();
					end(controller);
				};
			}, [
				detailId,
				detailNonce,
				begin,
				end
			]);
			(0, react.useEffect)(() => {
				if (detailId === null || filePath === null) {
					setFile(void 0);
					return;
				}
				const controller = begin();
				let active = true;
				setFile({
					path: filePath,
					status: "loading",
					content: void 0,
					error: void 0
				});
				(async () => {
					try {
						const content = await fetchFile(detailId, filePath, controller.signal);
						if (!active) return;
						setFile({
							path: filePath,
							status: "ready",
							content,
							error: void 0
						});
					} catch (cause) {
						if (!active || isAbortError(cause)) return;
						setFile({
							path: filePath,
							status: "error",
							content: void 0,
							error: errorMessage(cause)
						});
					} finally {
						end(controller);
					}
				})();
				return () => {
					active = false;
					controller.abort();
					end(controller);
				};
			}, [
				detailId,
				filePath,
				begin,
				end
			]);
			const refresh = (0, react.useCallback)(() => {
				const controller = begin();
				refreshMarket(controller.signal).catch(() => void 0).finally(() => {
					end(controller);
					pendingRefresh.current = true;
					setNonce((value) => value + 1);
				});
			}, [begin, end]);
			const retry = (0, react.useCallback)(() => {
				setNonce((value) => value + 1);
			}, []);
			const loadMore = (0, react.useCallback)(() => {
				if (nextCursor === null || nextCursor === "" || loadingMore || loading) return;
				const controller = begin();
				setLoadingMore(true);
				(async () => {
					try {
						const snapshot = await fetchCatalog({
							q: query,
							source: filters.source,
							security: filters.security,
							install: filters.install,
							cursor: nextCursor,
							limit: MARKET_LIMITS.pageSize
						}, controller.signal);
						setItems((previous) => {
							const seen = new Set(previous.map((item) => item.id));
							const appended = snapshot.items.filter((item) => !seen.has(item.id));
							return appended.length === 0 ? previous : [...previous, ...appended];
						});
						setSources(snapshot.sources);
						if (snapshot.total !== void 0) setTotal(snapshot.total);
						setNextCursor(snapshot.nextCursor);
					} catch (cause) {
						if (!isAbortError(cause)) setError(errorMessage(cause));
					} finally {
						setLoadingMore(false);
						end(controller);
					}
				})();
			}, [
				nextCursor,
				loadingMore,
				loading,
				query,
				filters,
				begin,
				end
			]);
			const install = (0, react.useCallback)((id, version) => {
				const controller = begin();
				setInstalling((previous) => withAdded(previous, id));
				setNotice(void 0);
				(async () => {
					try {
						const result = await installSkill(id, version, controller.signal);
						setItems((previous) => previous.map((item) => item.id === id ? markInstalled(item, result.dirName, result.version) : item));
						setDetail((previous) => previous !== void 0 && previous.skill !== void 0 && previous.skill.id === id ? {
							...previous,
							skill: markInstalled(previous.skill, result.dirName, result.version)
						} : previous);
						setNotice({
							tone: "success",
							text: t("install.success", { dir: result.dirName })
						});
					} catch (cause) {
						if (isAbortError(cause)) return;
						if ((cause instanceof MarketApiError ? cause.code : "") === MARKET_ERROR_CODES.alreadyInstalled) {
							setItems((previous) => previous.map((item) => item.id === id ? markInstalled(item, item.installedInfo?.dirName ?? item.slug, item.version) : item));
							setNotice({
								tone: "success",
								text: t("install.already")
							});
							return;
						}
						setNotice({
							tone: "error",
							text: `${t("install.failed")}: ${errorMessage(cause)}`
						});
					} finally {
						setInstalling((previous) => withRemoved(previous, id));
						end(controller);
					}
				})();
			}, [
				begin,
				end,
				t
			]);
			const uninstall = (0, react.useCallback)((id, name) => {
				const controller = begin();
				setUninstalling((previous) => withAdded(previous, id));
				setNotice(void 0);
				(async () => {
					try {
						await uninstallSkill(id, controller.signal);
						setItems((previous) => previous.map((item) => item.id === id ? markInstallable(item) : item));
						setDetail((previous) => previous !== void 0 && previous.skill !== void 0 && previous.skill.id === id ? {
							...previous,
							skill: markInstallable(previous.skill)
						} : previous);
						setNotice({
							tone: "success",
							text: t("install.removed", { name })
						});
					} catch (cause) {
						if (isAbortError(cause)) return;
						setNotice({
							tone: "error",
							text: `${t("install.uninstallFailed")}: ${errorMessage(cause)}`
						});
					} finally {
						setUninstalling((previous) => withRemoved(previous, id));
						end(controller);
					}
				})();
			}, [
				begin,
				end,
				t
			]);
			const dismissNotice = (0, react.useCallback)(() => {
				setNotice(void 0);
			}, []);
			const openDetail = (0, react.useCallback)((id) => {
				setDetailId(id);
			}, []);
			const closeDetail = (0, react.useCallback)(() => {
				setDetailId(null);
			}, []);
			const retryDetail = (0, react.useCallback)(() => {
				setDetailNonce((value) => value + 1);
			}, []);
			const openFile = (0, react.useCallback)((path) => {
				setFilePath(path);
			}, []);
			const closeFile = (0, react.useCallback)(() => {
				setFilePath(null);
			}, []);
			const setDetailTab = (0, react.useCallback)((tab) => {
				setDetailTabState(tab);
			}, []);
			const setSource = (0, react.useCallback)((value) => {
				setFilters((previous) => previous.source === value ? previous : {
					...previous,
					source: value
				});
			}, []);
			const setSecurity = (0, react.useCallback)((value) => {
				setFilters((previous) => previous.security === value ? previous : {
					...previous,
					security: value
				});
			}, []);
			const setInstall = (0, react.useCallback)((value) => {
				setFilters((previous) => previous.install === value ? previous : {
					...previous,
					install: value
				});
			}, []);
			const clearFilters = (0, react.useCallback)(() => {
				setFilters((previous) => previous.source === "all" && previous.security === "all" && previous.install === "all" ? previous : NO_FILTERS);
			}, []);
			const hasActiveFilters = filters.source !== "all" || filters.security !== "all" || filters.install !== "all";
			return {
				items,
				sources,
				total,
				generatedAt,
				nextCursor,
				loading,
				loadingMore,
				error,
				unreachable: (0, react.useMemo)(() => MARKET_SOURCES.every((source) => sources[source]?.status === "failed"), [sources]),
				notice,
				installing,
				uninstalling,
				draft,
				setDraft,
				commitDraft,
				setComposing,
				filters,
				hasActiveFilters,
				setSource,
				setSecurity,
				setInstall,
				clearFilters,
				refresh,
				retry,
				loadMore,
				dismissNotice,
				detailId,
				detail,
				detailTab,
				setDetailTab,
				file,
				openDetail,
				closeDetail,
				openFile,
				closeFile,
				retryDetail,
				install,
				uninstall
			};
		}
		//#endregion
		//#region lib/client/MarketPanel.js
		/**
		* 「技能市场」 — the main-slot page.
		*
		* Structure, top to bottom: a header row, the dismissible third-party advisory,
		* the search + filter toolbar, the per-registry health line, the count line, and
		* the results region (card grid, or the detail surface when a card is open). The
		* band above the results is fixed; the results scroll under it, so a long file
		* list never pushes the filters off screen.
		*
		* @module dsh-skills-hub/client/MarketPanel
		*/
		/** `localStorage` key remembering that the advisory was acknowledged. */
		const DISCLAIMER_KEY = "dsh-skills-hub:disclaimer-dismissed";
		/** How many placeholder cards the loading grid draws. */
		const SKELETON_COUNT = 6;
		function readDismissed() {
			try {
				return typeof localStorage !== "undefined" && localStorage.getItem(DISCLAIMER_KEY) === "1";
			} catch {
				return false;
			}
		}
		function persistDismissed() {
			try {
				localStorage.setItem(DISCLAIMER_KEY, "1");
			} catch {}
		}
		function FilterSelect({ id, label, value, options, onChange }) {
			return (0, react_jsx_runtime.jsxs)("span", {
				className: cls(MarketPanel_module_css_default, "select"),
				children: [
					(0, react_jsx_runtime.jsx)("label", {
						className: cls(shared_module_css_default, "srOnly"),
						htmlFor: id,
						children: label
					}),
					(0, react_jsx_runtime.jsx)("select", {
						id,
						className: cls(MarketPanel_module_css_default, "selectControl"),
						value,
						title: label,
						onChange: (event) => {
							onChange(event.target.value);
						},
						children: options.map((option) => (0, react_jsx_runtime.jsx)("option", {
							value: option.value,
							children: option.label
						}, option.value))
					}),
					(0, react_jsx_runtime.jsx)(ChevronDownIcon, {
						size: 13,
						className: cls(MarketPanel_module_css_default, "selectChevron")
					})
				]
			});
		}
		/**
		* Render the marketplace page.
		* @param props - the framework-injected translate seat.
		* @returns the panel.
		*/
		function MarketPanel({ t }) {
			const market = useMarketplace(t);
			const [dismissed, setDismissed] = (0, react.useState)(readDismissed);
			const openerRef = (0, react.useRef)(null);
			const fieldId = (0, react.useId)();
			const composingRef = (0, react.useRef)(false);
			const { detailId, closeDetail, openDetail: openMarketDetail } = market;
			const openDetail = (0, react.useCallback)((id) => {
				const active = document.activeElement;
				openerRef.current = active instanceof HTMLElement ? active : null;
				openMarketDetail(id);
			}, [openMarketDetail]);
			(0, react.useEffect)(() => {
				if (detailId !== null) return;
				const opener = openerRef.current;
				if (opener === null) return;
				openerRef.current = null;
				if (opener.isConnected) opener.focus();
			}, [detailId]);
			(0, react.useEffect)(() => {
				if (detailId === null) return;
				const onWindowKeyDown = (event) => {
					if (event.key !== "Escape") return;
					event.stopPropagation();
					closeDetail();
				};
				window.addEventListener("keydown", onWindowKeyDown);
				return () => {
					window.removeEventListener("keydown", onWindowKeyDown);
				};
			}, [detailId, closeDetail]);
			const onSearchKeyDown = (event) => {
				if (event.key !== "Enter") return;
				if (composingRef.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
				event.preventDefault();
				market.commitDraft();
			};
			const sourceOptions = [{
				value: "all",
				label: t("source.all")
			}, ...MARKET_SOURCES.map((source) => ({
				value: source,
				label: t(`source.${source}`)
			}))];
			const securityOptions = [{
				value: "all",
				label: t("security.all")
			}, ...SECURITY_STATUSES.map((status) => ({
				value: status,
				label: t(`security.${status}`)
			}))];
			const installOptions = [
				{
					value: "all",
					label: t("installFilter.all")
				},
				{
					value: "installed",
					label: t("installFilter.installed")
				},
				{
					value: "installable",
					label: t("installFilter.installable")
				}
			];
			const filterParts = [];
			if (market.filters.source !== "all") filterParts.push(`${t("filter.source")} ${t(`source.${market.filters.source}`)}`);
			if (market.filters.security !== "all") filterParts.push(`${t("filter.security")} ${t(`security.${market.filters.security}`)}`);
			if (market.filters.install !== "all") filterParts.push(`${t("filter.install")} ${t(`installFilter.${market.filters.install}`)}`);
			const narrowed = market.draft.trim() !== "" || market.hasActiveFilters;
			const detailOpen = detailId !== null;
			let emptyTitle = t("state.empty");
			let emptyHint = t("state.emptyHint");
			if (narrowed) {
				emptyTitle = t("state.emptySearch");
				emptyHint = t("state.emptySearchHint");
			} else if (market.unreachable) {
				emptyTitle = t("state.emptyUnreachable");
				emptyHint = t("state.emptyUnreachableHint");
			}
			return (0, react_jsx_runtime.jsxs)("div", {
				className: cls(MarketPanel_module_css_default, "panel"),
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: cls(MarketPanel_module_css_default, "band"),
					children: [
						(0, react_jsx_runtime.jsxs)("header", {
							className: cls(MarketPanel_module_css_default, "header"),
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: cls(MarketPanel_module_css_default, "mark"),
									"aria-hidden": "true",
									children: (0, react_jsx_runtime.jsx)(StoreIcon, {
										size: 22,
										strokeWidth: 1.5
									})
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: cls(MarketPanel_module_css_default, "headText"),
									children: [(0, react_jsx_runtime.jsx)("h1", {
										className: cls(MarketPanel_module_css_default, "title"),
										children: t("panel.title")
									}), (0, react_jsx_runtime.jsx)("p", {
										className: cls(MarketPanel_module_css_default, "subtitle"),
										children: t("panel.subtitle")
									})]
								}),
								(0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: cls(MarketPanel_module_css_default, "refresh"),
									disabled: market.loading,
									title: t("panel.refresh"),
									onClick: market.refresh,
									children: [(0, react_jsx_runtime.jsx)(RefreshIcon, {
										size: 15,
										className: market.loading ? cls(MarketPanel_module_css_default, "spin") : void 0
									}), (0, react_jsx_runtime.jsx)("span", {
										className: cls(MarketPanel_module_css_default, "refreshLabel"),
										children: market.loading ? t("panel.refreshing") : t("panel.refresh")
									})]
								})
							]
						}),
						!dismissed && (0, react_jsx_runtime.jsxs)("div", {
							className: cls(MarketPanel_module_css_default, "warn"),
							role: "note",
							children: [
								(0, react_jsx_runtime.jsx)(ShieldAlertIcon, {
									size: 16,
									className: cls(MarketPanel_module_css_default, "warnIcon")
								}),
								(0, react_jsx_runtime.jsxs)("p", {
									className: cls(MarketPanel_module_css_default, "warnText"),
									children: [
										(0, react_jsx_runtime.jsx)("strong", {
											className: cls(MarketPanel_module_css_default, "warnTitle"),
											children: t("disclaimer.title")
										}),
										" ",
										t("disclaimer.body")
									]
								}),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: cls(MarketPanel_module_css_default, "warnClose"),
									"aria-label": t("disclaimer.dismiss"),
									title: t("disclaimer.dismiss"),
									onClick: () => {
										setDismissed(true);
										persistDismissed();
									},
									children: (0, react_jsx_runtime.jsx)(CloseIcon, { size: 14 })
								})
							]
						}),
						!detailOpen && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							(0, react_jsx_runtime.jsxs)("div", {
								className: cls(MarketPanel_module_css_default, "toolbar"),
								children: [
									(0, react_jsx_runtime.jsxs)("div", {
										className: cls(MarketPanel_module_css_default, "search"),
										children: [
											(0, react_jsx_runtime.jsx)(SearchIcon, {
												size: 15,
												className: cls(MarketPanel_module_css_default, "searchIcon")
											}),
											(0, react_jsx_runtime.jsx)("label", {
												className: cls(shared_module_css_default, "srOnly"),
												htmlFor: `${fieldId}-search`,
												children: t("search.label")
											}),
											(0, react_jsx_runtime.jsx)("input", {
												id: `${fieldId}-search`,
												className: cls(MarketPanel_module_css_default, "searchInput"),
												type: "search",
												value: market.draft,
												placeholder: t("search.placeholder"),
												enterKeyHint: "search",
												onChange: (event) => {
													market.setDraft(event.target.value);
												},
												onCompositionStart: () => {
													composingRef.current = true;
													market.setComposing(true);
												},
												onCompositionEnd: (event) => {
													composingRef.current = false;
													market.setDraft(event.currentTarget.value);
													market.setComposing(false);
												},
												onKeyDown: onSearchKeyDown
											}),
											market.draft !== "" && (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: cls(MarketPanel_module_css_default, "searchClear"),
												"aria-label": t("search.clear"),
												title: t("search.clear"),
												onClick: () => {
													market.setDraft("");
													market.commitDraft("");
												},
												children: (0, react_jsx_runtime.jsx)(CloseIcon, { size: 13 })
											})
										]
									}),
									(0, react_jsx_runtime.jsx)(FilterSelect, {
										id: `${fieldId}-source`,
										label: t("filter.source"),
										value: market.filters.source,
										options: sourceOptions,
										onChange: market.setSource
									}),
									(0, react_jsx_runtime.jsx)(FilterSelect, {
										id: `${fieldId}-security`,
										label: t("filter.security"),
										value: market.filters.security,
										options: securityOptions,
										onChange: market.setSecurity
									}),
									(0, react_jsx_runtime.jsx)(FilterSelect, {
										id: `${fieldId}-install`,
										label: t("filter.install"),
										value: market.filters.install,
										options: installOptions,
										onChange: market.setInstall
									})
								]
							}),
							(0, react_jsx_runtime.jsx)(SourceHealthLine, {
								t,
								sources: market.sources
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: cls(MarketPanel_module_css_default, "countRow"),
								children: [(0, react_jsx_runtime.jsxs)("p", {
									className: cls(MarketPanel_module_css_default, "count"),
									"aria-live": "polite",
									children: [!market.loading && market.error === void 0 && (0, react_jsx_runtime.jsx)("span", { children: t("count.skills", { count: market.total ?? market.items.length }) }), market.generatedAt !== void 0 && (0, react_jsx_runtime.jsx)("span", {
										className: cls(MarketPanel_module_css_default, "countMeta"),
										children: t("count.updated", { date: formatIsoDate(market.generatedAt) })
									})]
								}), filterParts.length > 0 && (0, react_jsx_runtime.jsxs)("p", {
									className: cls(MarketPanel_module_css_default, "filterSummary"),
									children: [(0, react_jsx_runtime.jsx)("span", { children: t("filter.active", { summary: filterParts.join(" · ") }) }), (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: cls(MarketPanel_module_css_default, "linkButton"),
										onClick: market.clearFilters,
										children: t("filter.clear")
									})]
								})]
							})
						] }),
						market.notice !== void 0 && (0, react_jsx_runtime.jsxs)("div", {
							className: cx(cls(MarketPanel_module_css_default, "notice"), market.notice.tone === "error" ? cls(MarketPanel_module_css_default, "noticeError") : cls(MarketPanel_module_css_default, "noticeSuccess")),
							role: market.notice.tone === "error" ? "alert" : "status",
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: cls(MarketPanel_module_css_default, "noticeText"),
								children: market.notice.text
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: cls(MarketPanel_module_css_default, "noticeClose"),
								"aria-label": t("notice.dismiss"),
								title: t("notice.dismiss"),
								onClick: market.dismissNotice,
								children: (0, react_jsx_runtime.jsx)(CloseIcon, { size: 13 })
							})]
						})
					]
				}), (0, react_jsx_runtime.jsx)("div", {
					className: cls(MarketPanel_module_css_default, "results"),
					children: detailOpen ? (0, react_jsx_runtime.jsx)(SkillDetail, {
						t,
						detail: market.detail,
						tab: market.detailTab,
						onTab: market.setDetailTab,
						file: market.file,
						filePath: market.file?.path ?? null,
						onOpenFile: market.openFile,
						onCloseFile: market.closeFile,
						installing: market.detail !== void 0 && market.detail.skill !== void 0 && market.installing.has(market.detail.skill.id),
						uninstalling: market.detail !== void 0 && market.detail.skill !== void 0 && market.uninstalling.has(market.detail.skill.id),
						onInstall: market.install,
						onUninstall: market.uninstall,
						onBack: market.closeDetail,
						onRetry: market.retryDetail
					}) : market.loading ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("p", {
						className: cls(shared_module_css_default, "srOnly"),
						role: "status",
						children: t("state.loading")
					}), (0, react_jsx_runtime.jsx)("ul", {
						className: cls(MarketPanel_module_css_default, "grid"),
						children: Array.from({ length: SKELETON_COUNT }, (_unused, index) => (0, react_jsx_runtime.jsx)("li", {
							className: cls(MarketPanel_module_css_default, "gridItem"),
							children: (0, react_jsx_runtime.jsx)(SkeletonCard, { index })
						}, index))
					})] }) : market.error !== void 0 && market.items.length === 0 ? (0, react_jsx_runtime.jsxs)("div", {
						className: cls(MarketPanel_module_css_default, "state"),
						role: "alert",
						children: [
							(0, react_jsx_runtime.jsx)(AlertTriangleIcon, {
								size: 26,
								className: cx(cls(MarketPanel_module_css_default, "stateIcon"), cls(MarketPanel_module_css_default, "stateIconError"))
							}),
							(0, react_jsx_runtime.jsx)("p", {
								className: cls(MarketPanel_module_css_default, "stateTitle"),
								children: t("state.error")
							}),
							(0, react_jsx_runtime.jsx)("p", {
								className: cls(MarketPanel_module_css_default, "stateText"),
								children: market.error
							}),
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: cls(MarketPanel_module_css_default, "stateAction"),
								onClick: market.retry,
								children: [(0, react_jsx_runtime.jsx)(RefreshIcon, { size: 14 }), t("state.retry")]
							})
						]
					}) : market.items.length === 0 ? (0, react_jsx_runtime.jsxs)("div", {
						className: cls(MarketPanel_module_css_default, "state"),
						children: [
							(0, react_jsx_runtime.jsx)(PackageIcon, {
								size: 26,
								className: cls(MarketPanel_module_css_default, "stateIcon")
							}),
							(0, react_jsx_runtime.jsx)("p", {
								className: cls(MarketPanel_module_css_default, "stateTitle"),
								children: emptyTitle
							}),
							(0, react_jsx_runtime.jsx)("p", {
								className: cls(MarketPanel_module_css_default, "stateText"),
								children: emptyHint
							}),
							narrowed && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: cls(MarketPanel_module_css_default, "stateAction"),
								onClick: () => {
									market.setDraft("");
									market.commitDraft("");
									market.clearFilters();
								},
								children: t("filter.clear")
							})
						]
					}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						market.error !== void 0 && (0, react_jsx_runtime.jsxs)("div", {
							className: cx(cls(MarketPanel_module_css_default, "notice"), cls(MarketPanel_module_css_default, "noticeError")),
							role: "alert",
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: cls(MarketPanel_module_css_default, "noticeText"),
								children: market.error
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: cls(MarketPanel_module_css_default, "noticeClose"),
								"aria-label": t("state.retry"),
								title: t("state.retry"),
								onClick: market.retry,
								children: (0, react_jsx_runtime.jsx)(RefreshIcon, { size: 13 })
							})]
						}),
						(0, react_jsx_runtime.jsx)("ul", {
							className: cls(MarketPanel_module_css_default, "grid"),
							children: market.items.map((skill) => (0, react_jsx_runtime.jsx)("li", {
								className: cls(MarketPanel_module_css_default, "gridItem"),
								children: (0, react_jsx_runtime.jsx)(SkillCard, {
									t,
									skill,
									installing: market.installing.has(skill.id),
									onOpen: openDetail,
									onInstall: market.install
								})
							}, skill.id))
						}),
						market.nextCursor !== null && (0, react_jsx_runtime.jsx)("div", {
							className: cls(MarketPanel_module_css_default, "moreRow"),
							children: (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: cls(MarketPanel_module_css_default, "more"),
								disabled: market.loadingMore,
								onClick: market.loadMore,
								children: market.loadingMore ? t("state.loadingMore") : t("state.loadMore")
							})
						})
					] })
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\dsh-skills-hub\src\client\RailIcon.module.css.mjs
		const css = ".x65Qha_glyph{display:block}";
		const tagId = "@nanmicoder/dsh-skills-hub/RailIcon.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@nanmicoder/dsh-skills-hub";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var RailIcon_module_css_default = { "glyph": "x65Qha_glyph" };
		//#endregion
		//#region lib/client/RailIcon.js
		/**
		* Render the rail glyph.
		* @param props - `size` and `active` from the sidebar's list row, plus the
		*   namespace-bound translate seat declared by the registration.
		* @returns the storefront glyph at the requested size.
		*/
		function SkillsHubRailIcon({ t, size, active }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				className: cls(RailIcon_module_css_default, "glyph"),
				width: size,
				height: size,
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: active ? 1.9 : 1.6,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				role: "img",
				"aria-label": t("panel.title"),
				focusable: "false",
				children: [
					(0, react_jsx_runtime.jsx)("title", { children: t("panel.title") }),
					(0, react_jsx_runtime.jsx)("path", { d: "M3.5 9.5 5.5 4h13l2 5.5" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M4.5 9.5h15V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19Z" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M9.5 13.5h5" })
				]
			});
		}
		//#endregion
		//#region lib/client/index.js
		/**
		* Browser half of `@nanmicoder/dsh-skills-hub`.
		*
		* Two contributions, both through `ctx.slots.inject` (which waits for the owning
		* plugin's slot declaration and re-runs on every re-declaration, so HMR and load
		* order are handled by the framework rather than by a probe loop):
		*
		*  - `sidebar.panellist` — the rail glyph. The list `id` addresses the matching
		*    main panel key; the sidebar owns the button, its label and `selectPanel`.
		*  - `main` — the 「技能市场」 page under the same key.
		*
		* Every contribution — both dictionaries and both slot registrations — is
		* disposed with this fiber, so unloading the plugin (or hot-reloading it) leaves
		* no orphaned row, no orphaned panel and no stale copy behind.
		*
		* @module dsh-skills-hub/client
		*/
		/** Services this plugin needs before `apply` runs. */
		const inject = [
			"slots",
			"locale",
			"layout"
		];
		/**
		* Identity shared by the sidebar row and the main panel it selects. The
		* sidebar's `selectPanel(id)` and the `main` keyed slot are addressed by this
		* one string; changing it here moves both together.
		*/
		const PANEL_ID = "skills-hub";
		/** Sort position of the rail row among the other global panels. */
		const PANEL_ORDER = 60;
		/**
		* Register the marketplace panel.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const t = ctx.locale.bind(LOCALE_NAMESPACE);
			ctx.effect(() => ctx.locale.register(LOCALE_NAMESPACE, {
				zh,
				en
			}), "skills-hub: dictionaries");
			ctx.effect(() => ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
				name: "sidebar.panellist",
				id: PANEL_ID,
				order: PANEL_ORDER,
				label: () => t("panel.title"),
				locale: LOCALE_NAMESPACE
			}, SkillsHubRailIcon)), "skills-hub: sidebar entry");
			ctx.effect(() => ctx.slots.inject("main", () => ctx.slots.register({
				name: "main",
				key: PANEL_ID,
				locale: LOCALE_NAMESPACE
			}, MarketPanel)), "skills-hub: main panel");
		}
		//#endregion
		exports.PANEL_ID = PANEL_ID;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
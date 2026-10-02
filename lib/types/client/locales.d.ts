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
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
/** Dictionary namespace owned by this plugin. */
export declare const LOCALE_NAMESPACE = "skillsHub";
/** Simplified Chinese copy — the product's primary language. */
export declare const zh: {
    readonly 'panel.title': "技能市场";
    readonly 'panel.subtitle': "浏览、预览并安装来自 ClawHub 与 SkillHub 的技能。";
    readonly 'panel.refresh': "刷新";
    readonly 'panel.refreshing': "正在刷新…";
    readonly 'disclaimer.title': "第三方技能，谨慎使用。";
    readonly 'disclaimer.body': "技能来自社区第三方来源，本应用不对其内容做安全审计。安装前请先查看技能文件，建议先让 AI 扫描一遍，确认安全后再使用。";
    readonly 'disclaimer.dismiss': "关闭安全提示";
    readonly 'search.label': "搜索技能";
    readonly 'search.placeholder': "按名称、关键词搜索技能...";
    readonly 'search.clear': "清除搜索";
    readonly 'filter.source': "来源";
    readonly 'filter.security': "安全状态";
    readonly 'filter.install': "安装状态";
    readonly 'filter.active': "已筛选：{summary}";
    readonly 'filter.clear': "清除筛选";
    readonly 'source.all': "全部来源";
    readonly 'source.clawhub': "ClawHub";
    readonly 'source.skillhub': "SkillHub";
    readonly 'security.all': "全部安全状态";
    readonly 'security.verified': "已验证";
    readonly 'security.benign': "未发现问题";
    readonly 'security.unknown': "未扫描";
    readonly 'security.flagged': "有风险";
    readonly 'securityShort.verified': "已验证";
    readonly 'securityShort.benign': "安全";
    readonly 'securityShort.unknown': "未扫描";
    readonly 'securityShort.flagged': "风险";
    readonly 'securityHint.verified': "注册表已认证发布者，且所有扫描器均未发现问题。";
    readonly 'securityHint.benign': "已通过安全扫描，未发现问题。";
    readonly 'securityHint.unknown': "该来源不提供安全扫描结果，安装前请自行检查文件。";
    readonly 'securityHint.flagged': "至少一个扫描器标记了风险，请谨慎安装。";
    readonly 'installFilter.all': "全部安装状态";
    readonly 'installFilter.installed': "已安装";
    readonly 'installFilter.installable': "可安装";
    readonly 'sourceStatus.label': "来源状态";
    readonly 'sourceStatus.ok': "正常";
    readonly 'sourceStatus.cached': "缓存";
    readonly 'sourceStatus.cachedAt': "缓存 · {time}";
    readonly 'sourceStatus.degraded': "降级";
    readonly 'sourceStatus.failed': "失败";
    readonly 'count.skills': "{count} 个技能";
    readonly 'count.updated': "更新于 {date}";
    readonly 'notice.dismiss': "关闭提示";
    readonly 'state.loading': "正在加载技能…";
    readonly 'state.loadingMore': "正在加载更多…";
    readonly 'state.loadMore': "加载更多";
    readonly 'state.empty': "暂无技能";
    readonly 'state.emptyHint': "上游注册表没有返回任何技能，稍后再试或换个来源。";
    readonly 'state.emptySearch': "没有匹配的技能";
    readonly 'state.emptySearchHint': "试试其他关键词，或清除当前的筛选条件。";
    readonly 'state.emptyUnreachable': "注册表无法访问";
    readonly 'state.emptyUnreachableHint': "当前无法连接任何技能来源，请检查网络或稍后重试。";
    readonly 'state.error': "技能列表加载失败";
    readonly 'state.retry': "重试";
    readonly 'card.open': "查看技能 {name}";
    readonly 'card.noSummary': "上游未提供简介。";
    readonly 'card.moreTags': "+{count}";
    readonly 'card.downloads': "下载量";
    readonly 'card.stars': "星标";
    readonly 'install.action': "安装";
    readonly 'install.installing': "安装中…";
    readonly 'install.state.installed': "已安装";
    readonly 'install.state.installable': "可安装";
    readonly 'install.state.notInstallable': "不可安装";
    readonly 'install.uninstall': "卸载";
    readonly 'install.uninstalling': "卸载中…";
    readonly 'install.success': "已安装到 {dir}";
    readonly 'install.already': "该技能已安装。";
    readonly 'install.removed': "已卸载 {name}";
    readonly 'install.failed': "安装失败";
    readonly 'install.uninstallFailed': "卸载失败";
    readonly 'reason.empty-file-list': "上游没有提供文件列表。";
    readonly 'reason.file-too-large': "存在超过大小上限的文件。";
    readonly 'reason.too-many-files': "文件数量超过上限。";
    readonly 'reason.invalid-name': "技能名称无法用作目录名。";
    readonly 'reason.name-conflict': "与已安装的目录重名。";
    readonly 'reason.source-unavailable': "来源当前不可用。";
    readonly 'detail.back': "返回列表";
    readonly 'detail.overview': "概览";
    readonly 'detail.files': "文件";
    readonly 'detail.security': "安全";
    readonly 'detail.tabs': "{name} 的详情分区";
    readonly 'detail.noDescription': "该技能没有提供说明文档。";
    readonly 'detail.files.title': "共 {count} 个文件 · {size}";
    readonly 'detail.files.empty': "上游没有提供文件列表。";
    readonly 'detail.files.preview': "预览 {path}";
    readonly 'detail.files.tooBig': "文件过大，无法预览。";
    readonly 'detail.files.selected': "当前预览";
    readonly 'detail.preview.loading': "正在加载文件…";
    readonly 'detail.preview.error': "文件加载失败";
    readonly 'detail.preview.truncated': "内容过长，已截断显示。";
    readonly 'detail.preview.close': "关闭预览";
    readonly 'detail.security.empty': "上游没有提供安全扫描报告。";
    readonly 'detail.security.vendor': "扫描器";
    readonly 'detail.security.status': "结果";
    readonly 'detail.security.viewReport': "查看报告";
    readonly 'detail.changelog': "更新日志";
    readonly 'detail.license': "许可证";
    readonly 'detail.updated': "更新于 {date}";
    readonly 'detail.page': "在上游查看";
    readonly 'detail.apiKey': "需要 API Key";
    readonly 'detail.upstream': "镜像自 {source}";
    readonly 'detail.stats.downloads': "下载量";
    readonly 'detail.stats.installs': "安装量";
    readonly 'detail.stats.stars': "星标";
    readonly 'detail.stats.installedAt': "安装时间";
    readonly 'detail.installedAt': "安装于 {date}";
    readonly 'detail.dir': "安装目录";
};
/** Every dictionary key of this namespace. */
export type SkillsHubKey = keyof typeof zh;
/** English copy — a faithful translation of {@link zh}, key for key. */
export declare const en: Record<SkillsHubKey, string>;
/** Key-typed translate function of this namespace. */
export type SkillsHubTranslate = TranslateNS<typeof LOCALE_NAMESPACE>;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Skills marketplace panel copy. */
        skillsHub: SkillsHubKey;
    }
}

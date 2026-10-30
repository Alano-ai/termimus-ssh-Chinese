// 轻量 i18n 模块：多语言词典 + 可插值的 t() 函数。
// 组件、store、lib 均可直接 `import { t } from "…/i18n"` 使用。
// 语言切换：useLocaleStore.setLocale() 后调用 forceRefresh()，
// 或在组件中订阅 useLocaleStore 实现自动刷新。

import { zhCN } from "./zh-CN";
import { en } from "./en";
import { getLocale } from "./locale";

export type { I18nKey } from "./zh-CN";
export { useLocaleStore, getLocale, type Locale } from "./locale";

export type I18nParams = Record<string, string | number | null | undefined>;

/** 全部词典：按 locale 索引。 */
const DICTIONARIES: Record<string, Record<string, string>> = {
  "zh-CN": zhCN as Record<string, string>,
  en: en as Record<string, string>,
};

/** 将 "{name}" 形式的占位符替换为 params 中的值；空值替换为空字符串。 */
export function interpolate(template: string, params?: I18nParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = params[key];
    return value === null || value === undefined ? "" : String(value);
  });
}

/** 按 key 取当前语言文案；key 不存在时回退：当前语言 → zh-CN → key 本身。 */
export function t(key: string, params?: I18nParams): string {
  const locale = getLocale();
  const dict: Record<string, string> | undefined = DICTIONARIES[locale] as Record<string, string> | undefined;
  const template = dict?.[key] ?? (zhCN as Record<string, string>)[key] ?? key;
  return interpolate(template, params);
}

export default t;

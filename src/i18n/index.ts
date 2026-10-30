// 轻量 i18n 模块：静态中文词典 + 可插值的 t() 函数。
// 组件、store、lib 均可直接 `import { t } from "…/i18n"` 使用。
// 未来如需多语言切换，可在此处增加 `locale` 状态并按语言选择词典。

import { zhCN, type I18nKey } from "./zh-CN";

export type { I18nKey } from "./zh-CN";

export type I18nParams = Record<string, string | number | null | undefined>;

/** 将 "{name}" 形式的占位符替换为 params 中的值；空值替换为空字符串。 */
export function interpolate(template: string, params?: I18nParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = params[key];
    return value === null || value === undefined ? "" : String(value);
  });
}

/** 按 key 取中文文案；key 不存在时回退为 key 本身。 */
export function t(key: I18nKey, params?: I18nParams): string {
  const template: string = zhCN[key] ?? key;
  return interpolate(template, params);
}

export default t;

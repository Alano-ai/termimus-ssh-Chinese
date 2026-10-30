// 关键词与地址高亮模式（终端覆盖层）。
// 正则/优先级等纯数据在模块级定义；label 是唯一需要翻译的字段，
// 由 getHighlightLabel() 在渲染期求值，跟随当前语言。

import { t } from "../i18n";

export type HighlightKey =
  | "error"
  | "warning"
  | "success"
  | "info"
  | "debug"
  | "ip"
  | "mac";

export interface HighlightPattern {
  key: HighlightKey;
  regex: RegExp;
  /** Higher wins when matches overlap (IP inside an error line stays cyan). */
  priority: number;
  underline: boolean;
}

export const HIGHLIGHT_PATTERNS: HighlightPattern[] = [
  {
    key: "mac",
    regex: /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/g,
    priority: 70,
    underline: false,
  },
  {
    key: "ip",
    // IPv4 (with optional :port) + compact IPv6 match
    regex: /\b(?:(?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?|(?:[0-9a-fA-F]{0,4}:){2,}[0-9a-fA-F:.]+)\b/g,
    priority: 60,
    underline: true,
  },
  {
    key: "error",
    regex: /\b(error|failed|failure|fatal|exception|denied|refused|timeout|timed out)\b/gi,
    priority: 50,
    underline: false,
  },
  {
    key: "warning",
    regex: /\b(warn(?:ing)?|deprecated|caution|unreachable)\b/gi,
    priority: 40,
    underline: false,
  },
  {
    key: "success",
    regex: /\b(ok|success(?:ful)?|passed|done|completed|connected)\b/gi,
    priority: 30,
    underline: false,
  },
  {
    key: "info",
    regex: /\b(info|notice|listening|starting|started)\b/gi,
    priority: 20,
    underline: false,
  },
  {
    key: "debug",
    regex: /\b(debug|trace)\b/gi,
    priority: 10,
    underline: false,
  },
];

/** 高亮类别的可读标签（渲染期求值，跟随当前语言）。 */
export function getHighlightLabel(key: HighlightKey): string {
  return t(`hl.${key}`);
}

/** 全部类别的标签映射（渲染期求值）。 */
export function getHighlightLabels(): Record<HighlightKey, string> {
  return {
    error: t("hl.error"),
    warning: t("hl.warning"),
    success: t("hl.success"),
    info: t("hl.info"),
    debug: t("hl.debug"),
    ip: t("hl.ip"),
    mac: t("hl.mac"),
  };
}

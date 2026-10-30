// Keyword + address patterns for terminal highlighting.
// Decorations are overlays only — they never modify the buffer, so
// copy/paste stays clean and curses apps (htop/vim) are unaffected.

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
  label: string;
  regex: RegExp;
  /** Higher wins when matches overlap (IP inside an error line stays cyan). */
  priority: number;
  underline: boolean;
}

export const HIGHLIGHT_PATTERNS: HighlightPattern[] = [
  {
    key: "mac",
    label: t("hl.mac"),
    regex: /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/g,
    priority: 70,
    underline: false,
  },
  {
    key: "ip",
    label: t("hl.ip"),
    // IPv4 (with optional :port) + compact IPv6 match
    regex: /\b(?:(?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?|(?:[0-9a-fA-F]{0,4}:){2,}[0-9a-fA-F:.]+)\b/g,
    priority: 60,
    underline: true,
  },
  {
    key: "error",
    label: t("hl.error"),
    regex: /\b(error|failed|failure|fatal|exception|denied|refused|timeout|timed out)\b/gi,
    priority: 50,
    underline: false,
  },
  {
    key: "warning",
    label: t("hl.warning"),
    regex: /\b(warn(?:ing)?|deprecated|caution|unreachable)\b/gi,
    priority: 40,
    underline: false,
  },
  {
    key: "success",
    label: t("hl.success"),
    regex: /\b(ok|success(?:ful)?|passed|done|completed|connected)\b/gi,
    priority: 30,
    underline: false,
  },
  {
    key: "info",
    label: t("hl.info"),
    regex: /\b(info|notice|listening|starting|started)\b/gi,
    priority: 20,
    underline: false,
  },
  {
    key: "debug",
    label: t("hl.debug"),
    regex: /\b(debug|trace)\b/gi,
    priority: 10,
    underline: false,
  },
];

export const HIGHLIGHT_LABELS: Record<HighlightKey, string> = {
  error: t("hl.error"),
  warning: t("hl.warning"),
  success: t("hl.success"),
  info: t("hl.info"),
  debug: t("hl.debug"),
  ip: t("hl.ip"),
  mac: t("hl.mac"),
};

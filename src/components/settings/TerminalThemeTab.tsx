import { Palette, Type, Highlighter, RotateCcw, Check } from "lucide-react";
import { TERMINAL_THEMES, getThemeDescription } from "../../lib/terminalThemes";
import {
  HIGHLIGHT_PATTERNS,
  getHighlightLabel,
  type HighlightKey,
} from "../../lib/highlightPatterns";
import {
  useTerminalThemeStore,
  TERMINAL_FONT_FAMILIES,
  TERMINAL_FONT_LABELS,
  normalizeFontFamily,
  type TerminalCursorStyle,
} from "../../stores/useTerminalThemeStore";
import { CustomSelect } from "../ui/CustomSelect";
import { TerminalPreview } from "./TerminalPreview";
import { t } from "../../i18n";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label
      className="relative inline-flex items-center cursor-pointer shrink-0"
      title={label}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-10 h-5.5 bg-[var(--surface-container)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[var(--primary)]" />
    </label>
  );
}

const HIGHLIGHT_ORDER: HighlightKey[] = [
  "error",
  "warning",
  "success",
  "info",
  "debug",
  "ip",
  "mac",
];

export function TerminalThemeTab() {
  const themeId = useTerminalThemeStore((s) => s.themeId);
  const setThemeId = useTerminalThemeStore((s) => s.setThemeId);
  const font = useTerminalThemeStore((s) => s.font);
  const setFont = useTerminalThemeStore((s) => s.setFont);
  const highlight = useTerminalThemeStore((s) => s.highlight);
  const setHighlight = useTerminalThemeStore((s) => s.setHighlight);
  const resetDefaults = useTerminalThemeStore((s) => s.resetDefaults);
  const getTheme = useTerminalThemeStore((s) => s.getTheme);
  const theme = getTheme();

  return (
    <div className="space-y-5">
      {/* ── Theme preset grid ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-low)] overflow-hidden shadow-sm">
        <div className="border-b border-[var(--border)] px-5 py-3.5 bg-[var(--surface-container)]/30">
          <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Palette size={15} className="text-[var(--primary)]" />
            {t("settings.terminalTheme")}
          </h4>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {t("settings.themeHint")}
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {TERMINAL_THEMES.map((t) => {
              const active = t.id === themeId;
              const swatches = [
                t.xterm.black,
                t.xterm.red,
                t.xterm.green,
                t.xterm.yellow,
                t.xterm.blue,
                t.xterm.magenta,
                t.xterm.cyan,
                t.xterm.white,
              ];
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    active
                      ? "border-[var(--primary)] ring-1 ring-[var(--primary)]/40 bg-[var(--primary)]/5"
                      : "border-[var(--border)] bg-[var(--surface-container)]/40 hover:border-[var(--border-subtle)]"
                  }`}
                >
                  <div
                    className="h-10 rounded-lg mb-2 flex items-end p-1.5 gap-0.5"
                    style={{ background: t.xterm.background }}
                  >
                    {swatches.map(
                      (c, i) =>
                        c && (
                          <span
                            key={i}
                            className="h-2.5 flex-1 rounded-[2px]"
                            style={{ background: c }}
                          />
                        )
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {t.label}
                    </span>
                    {active && (
                      <Check size={13} className="text-[var(--primary)] shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">
                    {getThemeDescription(t)}
                  </p>
                </button>
              );
            })}
          </div>

          <TerminalPreview theme={theme} font={font} />

          {theme.suggestedFont && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-container)]/40 px-4 py-3">
              <div className="text-[11px]">
                <p className="font-semibold text-[var(--text-primary)]">
                  {t("settings.recommendedFont")}
                </p>
                <p className="text-[var(--text-muted)]">
                  <span className="font-mono text-[var(--secondary)]">
                    {theme.suggestedFont.familyLabel}
                  </span>{" "}
                  {t("settings.fontPairingHint", {
                    size: theme.suggestedFont.size.toFixed(1),
                    lh: theme.suggestedFont.lineHeight.toFixed(2),
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const targetLabel = theme.suggestedFont!.familyLabel;
                  const idx = TERMINAL_FONT_LABELS.findIndex((l) =>
                    l.toLowerCase().includes(targetLabel.toLowerCase())
                  );
                  setFont({
                    fontFamily:
                      idx >= 0
                        ? TERMINAL_FONT_FAMILIES[idx]
                        : TERMINAL_FONT_FAMILIES[0],
                    fontSize: theme.suggestedFont!.size,
                    lineHeight: theme.suggestedFont!.lineHeight,
                  });
                }}
                className="shrink-0 rounded-lg bg-[var(--primary)]/15 border border-[var(--primary)]/30 px-3 py-1.5 text-[11px] font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/25 transition-colors cursor-pointer"
              >
                {t("settings.applyPairing")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Font & size ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-low)] shadow-sm">
        <div className="rounded-t-2xl border-b border-[var(--border)] px-5 py-3.5 bg-[var(--surface-container)]/30">
          <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Type size={15} className="text-[var(--secondary)]" />
            {t("settings.fontTextSize")}
          </h4>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {t("settings.fontHint")}
          </p>
        </div>

        <div className="divide-y divide-[var(--border)] text-xs">
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="font-semibold text-[var(--text-primary)]">{t("settings.fontFamily")}</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {t("settings.fontFamilyHint")}
              </p>
            </div>
            <div className="w-64 shrink-0">
              <CustomSelect
                value={normalizeFontFamily(font.fontFamily)}
                onChange={(v) => setFont({ fontFamily: v })}
                options={TERMINAL_FONT_FAMILIES.map((f, i) => ({
                  value: f,
                  label: TERMINAL_FONT_LABELS[i],
                }))}
              />
            </div>
          </div>

          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="font-semibold text-[var(--text-primary)]">
                {t("settings.fontSize")}{" "}
                <span className="font-mono text-[var(--primary)]">
                  {font.fontSize.toFixed(1)}pt
                </span>
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">{t("settings.fontSizeRange")}</p>
            </div>
            <input
              type="range"
              min={9}
              max={24}
              step={0.5}
              value={font.fontSize}
              onChange={(e) => setFont({ fontSize: Number(e.target.value) })}
              className="w-56 shrink-0 accent-[#00d2b4]"
            />
          </div>

          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="font-semibold text-[var(--text-primary)]">
                {t("settings.lineHeight")}{" "}
                <span className="font-mono text-[var(--primary)]">
                  {font.lineHeight.toFixed(2)}
                </span>
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">{t("settings.lineHeightRange")}</p>
            </div>
            <input
              type="range"
              min={1}
              max={1.8}
              step={0.05}
              value={font.lineHeight}
              onChange={(e) => setFont({ lineHeight: Number(e.target.value) })}
              className="w-56 shrink-0 accent-[#00d2b4]"
            />
          </div>

          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="font-semibold text-[var(--text-primary)]">{t("settings.cursor")}</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {t("settings.cursorHint")}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-36">
                <CustomSelect
                  value={font.cursorStyle}
                  onChange={(v) =>
                    setFont({ cursorStyle: v as TerminalCursorStyle })
                  }
                  options={[
                    { value: "bar", label: t("settings.cursorBar") },
                    { value: "block", label: t("settings.cursorBlock") },
                    { value: "underline", label: t("settings.cursorUnderline") },
                  ]}
                />
              </div>
              <Toggle
                checked={font.cursorBlink}
                onChange={(v) => setFont({ cursorBlink: v })}
                label={t("settings.cursorBlink")}
              />
              <span className="text-[11px] text-[var(--text-muted)]">{t("settings.blink")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Keyword highlighting ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-low)] shadow-sm">
        <div className="rounded-t-2xl border-b border-[var(--border)] px-5 py-3.5 bg-[var(--surface-container)]/30">
          <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Highlighter size={15} className="text-[var(--tertiary)]" />
            {t("settings.keywordHighlighting")}
          </h4>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {t("settings.highlightingHint")}
          </p>
        </div>

        <div className="divide-y divide-[var(--border)]/60 text-xs">
          {HIGHLIGHT_ORDER.map((key) => {
            const pattern = HIGHLIGHT_PATTERNS.find((p) => p.key === key);
            const color =
              theme.semantic[key as keyof typeof theme.semantic];
            return (
              <div
                key={key}
                className="px-5 py-2.5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-3 w-3 rounded-full shrink-0 border border-white/20"
                    style={{ background: color }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--text-primary)]">
                      {getHighlightLabel(key)}
                    </p>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                      {pattern?.regex.source.slice(0, 64)}
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={highlight[key]}
                  onChange={(v) => setHighlight(key, v)}
                  label={t("settings.toggleHighlight", { label: getHighlightLabel(key) })}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Reset ─────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={resetDefaults}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-low)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-container)] transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
          {t("settings.resetDefaults")}
        </button>
      </div>
    </div>
  );
}

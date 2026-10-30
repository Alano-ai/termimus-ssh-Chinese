import type { TerminalTheme } from "../../lib/terminalThemes";
import type { TerminalFontSettings } from "../../stores/useTerminalThemeStore";
import { t } from "../../i18n";

interface Segment {
  text: string;
  color?: string;
  underline?: boolean;
}

/** Fake terminal preview — plain divs, never a real xterm instance. */
export function TerminalPreview({
  theme,
  font,
}: {
  theme: TerminalTheme;
  font?: TerminalFontSettings;
}) {
  const s = theme.semantic;
  const fg = theme.xterm.foreground ?? "#f0f6fc";
  const bg = theme.xterm.background ?? "#0a0e14";

  const lines: Segment[][] = [
    [
      { text: "$ ", color: s.command },
      { text: "ssh user@192.168.1.10 -p 2200" },
    ],
    [
      { text: "信息", color: s.info },
      { text: "：已连接 -> 会话就绪" },
      { text: " [0O 1lI != <= >=]" },
    ],
    [
      { text: "警告", color: s.warning },
      { text: "：密码回退已协商 " },
      { text: "192.168.1.10:22", color: s.ip, underline: true },
    ],
    [
      { text: "构建 ", color: fg },
      { text: "成功完成", color: s.success },
      { text: " 耗时 1.24s（状态：0）" },
    ],
  ];

  return (
    <div
      className="overflow-hidden rounded-xl border border-[var(--border)] select-text shadow-sm"
      style={{
        background: bg,
        color: fg,
        fontFamily: font?.fontFamily || "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: font?.fontSize ? `${Math.min(font.fontSize, 13)}px` : "12px",
        lineHeight: font?.lineHeight || 1.35,
      }}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 opacity-75 font-sans">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 truncate text-[10px] text-[var(--text-muted)]">
            {t("settings.preview")} — ssh prod@web-01
          </span>
        </div>
        {font && (
          <span className="text-[10px] font-mono text-[var(--text-muted)] opacity-80">
            {font.fontSize.toFixed(1)}pt · lh {font.lineHeight.toFixed(2)}
          </span>
        )}
      </div>
      <div className="space-y-1 p-3.5">
        {lines.map((segments, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            {segments.map((seg, j) => (
              <span
                key={j}
                style={{
                  color: seg.color,
                  textDecoration: seg.underline ? "underline" : undefined,
                }}
              >
                {seg.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

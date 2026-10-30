// 设置页「通用」标签：界面语言切换器。
// 切换后由 App 根部的 localeRefreshKey 重挂载整棵树，全部 t() 立即生效。

import { Languages } from "lucide-react";
import { t } from "../../i18n";
import { useLocaleStore, type Locale } from "../../i18n/locale";

const LOCALE_OPTIONS: { value: Locale; label: string; native: string }[] = [
  { value: "zh-CN", label: t("settings.langZh"), native: "简体中文" },
  { value: "en", label: t("settings.langEn"), native: "English" },
];

export function GeneralTab() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <div className="space-y-5">
      {/* ── Language Card ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-low)] overflow-hidden shadow-sm">
        <div className="border-b border-[var(--border)] px-5 py-3.5 bg-[var(--surface-container)]/30">
          <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Languages size={15} className="text-[var(--primary)]" />
            {t("settings.language")}
          </h4>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {t("settings.languageHint")}
          </p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 max-w-xl">
            {LOCALE_OPTIONS.map((opt) => {
              const active = locale === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLocale(opt.value)}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                    active
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-sm"
                      : "border-[var(--border)] bg-[var(--surface-container)]/40 hover:border-[var(--primary)]/40"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-semibold text-xs ${
                      active
                        ? "bg-[var(--primary)] text-black"
                        : "bg-[var(--surface-high)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {opt.value === "zh-CN" ? "中" : "EN"}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        active
                          ? "text-[var(--primary)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {opt.native}
                    </p>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                      {opt.value}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

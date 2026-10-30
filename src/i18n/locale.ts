// 语言状态管理：持有当前 locale 并持久化到 localStorage。
// 语言切换通过递增 refreshKey，让 App 根部以 key 重挂载整棵树，
// 从而使所有模块级/渲染期 t() 调用立即使用新语言。

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "zh-CN" | "en";

interface LocaleState {
  locale: Locale;
  /** 递增计数，语言每次切换 +1，用作 React key 强制重挂载。 */
  refreshKey: number;
  setLocale: (locale: Locale) => void;
}

function readInitialLocale(): Locale {
  try {
    const raw = localStorage.getItem("termimus_locale");
    if (raw) {
      const parsed = JSON.parse(raw);
      const v = parsed?.state?.locale;
      if (v === "zh-CN" || v === "en") return v;
    }
  } catch {
    // ignore
  }
  return "zh-CN";
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: readInitialLocale(),
      refreshKey: 0,
      setLocale: (locale) =>
        set((s) => ({ locale, refreshKey: s.refreshKey + 1 })),
    }),
    {
      name: "termimus_locale",
      // 只持久化语言本身；refreshKey 是运行时状态
      partialize: (s) => ({ locale: s.locale }),
    }
  )
);

/** 同步读取当前语言（供非 React 环境调用，如 store 模块层）。 */
export function getLocale(): Locale {
  return useLocaleStore.getState().locale;
}

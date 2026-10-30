import { create } from "zustand";
import { persist } from "zustand/middleware";
import { t } from "../i18n";

export type AutoLockPolicy =
  | "never"
  | "on_close"
  | "15min"
  | "1hour"
  | "on_focus_loss";

export const AUTO_LOCK_LABELS: Record<AutoLockPolicy, string> = {
  never: t("settings.autoLockNever"),
  on_close: t("settings.autoLockOnClose"),
  "15min": t("settings.autoLock15min"),
  "1hour": t("settings.autoLock1hour"),
  on_focus_loss: t("settings.autoLockOnFocusLoss"),
};

interface SettingsState {
  useOsKeyring: boolean;
  useBiometrics: boolean;
  autoLockPolicy: AutoLockPolicy;
  setUseOsKeyring: (v: boolean) => void;
  setUseBiometrics: (v: boolean) => void;
  setAutoLockPolicy: (v: AutoLockPolicy) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      useOsKeyring: false,
      useBiometrics: false,
      autoLockPolicy: "on_close",
      setUseOsKeyring: (v) => set({ useOsKeyring: v }),
      setUseBiometrics: (v) => set({ useBiometrics: v }),
      setAutoLockPolicy: (v) => set({ autoLockPolicy: v }),
    }),
    {
      name: "termimus_settings",
    }
  )
);

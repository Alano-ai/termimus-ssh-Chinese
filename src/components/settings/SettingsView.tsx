import { useState, useEffect, useRef } from "react";
import {
  Archive,
  Lock,
  LockOpen,
  ShieldCheck,
  KeyRound,
  Fingerprint,
  Timer,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  Server,
  RotateCw,
  Trash2,
  ShieldAlert,
  Info,
  Shield,
  Palette,
  Cpu,
  Layers,
  Cloud,
  ExternalLink,
  ArrowUpCircle,
} from "lucide-react";
import { BackupRestoreSection } from "../vault/BackupRestoreSection";
import { SyncSection } from "../sync/SyncSection";
import { TerminalThemeTab } from "./TerminalThemeTab";
import { useVaultStore } from "../../stores/useVaultStore";
import { useKnownHostsStore } from "../../stores/useKnownHostsStore";
import { useConfirmStore } from "../../stores/useConfirmStore";
import { useUpdateStore } from "../../stores/useUpdateStore";
import {
  useSettingsStore,
  AutoLockPolicy,
  AUTO_LOCK_LABELS,
} from "../../stores/useSettingsStore";
import { CustomSelect } from "../ui/CustomSelect";
import { api } from "../../lib/api";
import { openExternalUrl } from "../../lib/openUrl";
import { t } from "../../i18n";

type SettingsTab = "security" | "terminal" | "sync" | "known_hosts" | "backup" | "about";

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("security");
  const { knownHosts } = useKnownHostsStore();
  const { hasUpdate } = useUpdateStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const tabs: {
    id: SettingsTab;
    label: string;
    icon: typeof Lock;
    badge?: number;
    badgeDot?: boolean;
  }[] = [
    { id: "security", label: t("settings.securityVault"), icon: Lock },
    { id: "terminal", label: t("settings.tabTerminal"), icon: Palette },
    { id: "sync", label: t("settings.selfHostedSync"), icon: Cloud },
    {
      id: "known_hosts",
      label: t("settings.trustedHostKeys"),
      icon: ShieldCheck,
      badge: knownHosts.length || undefined,
    },
    { id: "backup", label: t("settings.backupRestore"), icon: Archive },
    { id: "about", label: t("settings.aboutArchitecture"), icon: Info, badgeDot: hasUpdate },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-[var(--canvas)] select-none overflow-hidden">
      {/* ── Fixed Top Header & Navigation ─────────────────────────────────── */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface-container)]/30 px-6 pt-5 pb-4 backdrop-blur-xs">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">{t("nav.settings")}</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t("settings.headerHint")}
              </p>
            </div>
          </div>

          {/* ── Native Segmented Tab Control ──────────────────────────────── */}
          <div className="flex items-center overflow-x-auto py-0.5">
            <nav
              role="tablist"
              aria-label={t("settings.sectionsAria")}
              className="inline-flex items-center gap-1 p-1 rounded-xl border border-[var(--border)] bg-[var(--surface-low)] shrink-0"
            >
              {tabs.map(({ id, label, icon: Icon, badge, badgeDot }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => {
                      if (activeTab !== id) {
                        setActiveTab(id);
                        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "instant" });
                      }
                    }}
                    className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer select-none transition-colors duration-150 border ${
                      active
                        ? "bg-[var(--surface-high)] text-[var(--text-primary)] shadow-xs border-[var(--border-subtle)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-container)]/60 border-transparent"
                    }`}
                  >
                    <Icon
                      size={14}
                      className={`shrink-0 transition-colors duration-150 ${
                        active ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                      }`}
                    />
                    <span className="whitespace-nowrap">{label}</span>
                    {badge !== undefined && (
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono leading-none transition-colors duration-150 ${
                          active
                            ? "bg-[var(--primary)]/20 text-[var(--primary)] font-semibold"
                            : "bg-[var(--surface-highest)] text-[var(--text-muted)]"
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                    {badgeDot && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* ── Scrollable Tab Content ────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-5 [scrollbar-gutter:stable]"
      >
        <div className="w-full">
          {activeTab === "security" && <SecurityVaultTab />}
          {activeTab === "terminal" && <TerminalThemeTab />}
          {activeTab === "sync" && <SyncSection />}
          {activeTab === "known_hosts" && <KnownHostsTab />}
          {activeTab === "backup" && <BackupRestoreSection />}
          {activeTab === "about" && <AboutTab />}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1: SECURITY & VAULT
// ══════════════════════════════════════════════════════════════════════════════

function SecurityVaultTab() {
  const { isUnlocked, isInitialized, lock: lockVault, refresh: refreshVault, isBiometricSupported, openUnlockPrompt } = useVaultStore();
  const { useOsKeyring, setUseOsKeyring, useBiometrics, setUseBiometrics, autoLockPolicy, setAutoLockPolicy } = useSettingsStore();

  const [keyringLoading, setKeyringLoading] = useState(false);
  const [keyringError, setKeyringError] = useState<string | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  async function handleToggleKeyring(enable: boolean) {
    setKeyringError(null);
    setKeyringLoading(true);
    try {
      if (enable) {
        if (!isUnlocked) {
          setKeyringError(t("settings.unlockForKeyring"));
          return;
        }
        await api.saveVaultKeyring();
        setUseOsKeyring(true);
      } else {
        await api.clearVaultKeyring();
        setUseOsKeyring(false);
      }
    } catch (e) {
      setKeyringError(t("settings.keyringError", { error: String(e) }));
    } finally {
      setKeyringLoading(false);
    }
  }

  async function handleToggleBiometric(enable: boolean) {
    setBiometricError(null);
    setBiometricLoading(true);
    try {
      if (enable) {
        if (!isUnlocked) {
          setBiometricError(t("settings.unlockForBiometric"));
          return;
        }
        await api.saveVaultKeyring();
        setUseBiometrics(true);
      } else {
        setUseBiometrics(false);
      }
    } catch (e) {
      setBiometricError(t("settings.biometricError", { error: String(e) }));
    } finally {
      setBiometricLoading(false);
    }
  }

  function handleResetVault() {
    useConfirmStore.getState().confirm({
      title: t("settings.resetEntireVault"),
      message: t("settings.resetEntireVaultMessage"),
      confirmLabel: t("vault.resetVault"),
      isDanger: true,
      onConfirm: async () => {
        try {
          await api.resetVault();
          setUseOsKeyring(false);
          setUseBiometrics(false);
          await refreshVault();
        } catch (e) {
          alert(t("settings.resetVaultFailed", { error: String(e) }));
        }
      },
    });
  }

  return (
    <div className="space-y-5">
      {/* ── Vault State Card ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-low)] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${
                isUnlocked
                  ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                  : "bg-[var(--surface-container)] text-[var(--text-muted)]"
              }`}
            >
              <Lock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {isUnlocked ? t("settings.vaultUnlocked") : t("settings.vaultLocked")}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-medium ${
                    isUnlocked
                      ? "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/20"
                      : "bg-[var(--surface-high)] text-[var(--text-muted)] border border-[var(--border)]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isUnlocked ? "bg-[var(--success)] animate-pulse" : "bg-[var(--text-muted)]"
                    }`}
                  />
                  {isUnlocked ? t("settings.activeInMemory") : t("settings.locked")}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {isUnlocked
                  ? t("settings.vaultUnlockedHint")
                  : t("settings.vaultLockedHint")}
              </p>
            </div>
          </div>

          {isUnlocked ? (
            <button
              onClick={lockVault}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-high)] px-3.5 py-2 text-xs font-semibold text-[var(--warning)] hover:bg-[var(--surface-highest)] transition-colors shrink-0 self-start sm:self-auto"
            >
              <Lock size={13} />
              {t("vault.lockVault")}
            </button>
          ) : (
            <button
              onClick={openUnlockPrompt}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3.5 py-2 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors shrink-0 self-start sm:self-auto"
            >
              <LockOpen size={13} />
              {t("vault.unlockVault")}
            </button>
          )}
        </div>
      </div>

      {/* ── Vault Behavior Settings Card ──────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-low)] overflow-hidden shadow-sm">
        <div className="border-b border-[var(--border)] px-5 py-3.5 bg-[var(--surface-container)]/30">
          <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <KeyRound size={15} className="text-[var(--secondary)]" />
            {t("settings.vaultBehavior")}
          </h4>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {t("settings.vaultBehaviorHint")}
          </p>
        </div>

        <div className="divide-y divide-[var(--border)] text-xs">
          {/* A. Biometric (Touch ID) Authentication */}
          <div className="p-5 flex items-start justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                <Fingerprint size={16} className="text-[var(--accent)]" />
                <span>{t("settings.biometricUnlock")}</span>
                {isBiometricSupported && (
                  <span className="rounded-full bg-[var(--primary)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]">
                    {t("settings.available")}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                {t("settings.biometricHint")}
                {!isBiometricSupported && (
                  <span className="block text-[var(--warning)] font-medium mt-1">
                    {t("settings.biometricNotDetected")}
                  </span>
                )}
              </p>
              {biometricError && (
                <p className="text-[11px] text-[var(--danger)] flex items-center gap-1.5 pt-1.5 font-medium">
                  <AlertTriangle size={13} /> {biometricError}
                </p>
              )}
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={useBiometrics}
                disabled={biometricLoading || !isInitialized || !isBiometricSupported}
                onChange={(e) => handleToggleBiometric(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-[var(--surface-container)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
            </label>
          </div>

          {/* B. OS Keyring Integration */}
          <div className="p-5 flex items-start justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                <KeyRound size={16} className="text-[var(--primary)]" />
                <span>{t("settings.rememberOnDevice")}</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                {t("settings.keyringHintPrefix")}
                <strong>KWallet / GNOME Secret Service</strong>
                {t("settings.keyringHintAfterKWallet")}
                <strong>macOS Keychain</strong>
                {t("settings.keyringHintAfterMac")}
                <strong>Windows Credential Manager</strong>
                {t("settings.keyringHintAfterWindows")}
              </p>
              {keyringError && (
                <p className="text-[11px] text-[var(--danger)] flex items-center gap-1.5 pt-1.5 font-medium">
                  <AlertTriangle size={13} /> {keyringError}
                </p>
              )}
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={useOsKeyring}
                disabled={keyringLoading || !isInitialized}
                onChange={(e) => handleToggleKeyring(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-[var(--surface-container)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
            </label>
          </div>

          {/* B. Auto-Lock Policy */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                <Timer size={16} className="text-[var(--secondary)]" />
                <span>{t("settings.autoLockTimeout")}</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                {t("settings.autoLockHint")}
              </p>
            </div>

            <div className="w-56 shrink-0">
              <CustomSelect
                value={autoLockPolicy}
                onChange={(val) => setAutoLockPolicy(val as AutoLockPolicy)}
                options={(Object.keys(AUTO_LOCK_LABELS) as AutoLockPolicy[]).map((key) => ({
                  value: key,
                  label: AUTO_LOCK_LABELS[key],
                }))}
              />
            </div>
          </div>

          {/* C. Master Password Rotation & Danger Zone */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="font-semibold text-[var(--text-primary)]">{t("settings.masterMaintenance")}</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {t("settings.masterMaintenanceHint")}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                disabled={!isUnlocked}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-high)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-highest)] transition-colors disabled:opacity-50"
              >
                {t("settings.changeMasterPassword")}
              </button>

              <button
                onClick={handleResetVault}
                className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3.5 py-2 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-colors"
              >
                {t("vault.resetVault")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Change Password Modal Dialog ──────────────────────────────────── */}
      {isChangePasswordOpen && (
        <ChangePasswordModal onClose={() => setIsChangePasswordOpen(false)} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2: TRUSTED HOST KEYS (TOFU)
// ══════════════════════════════════════════════════════════════════════════════

function KnownHostsTab() {
  const { knownHosts, isLoading, refresh, resetKnownHost } = useKnownHostsStore();

  useEffect(() => {
    if (knownHosts.length === 0) {
      refresh();
    }
  }, [knownHosts.length, refresh]);

  function handleReset(address: string, port: number) {
    useConfirmStore.getState().confirm({
      title: t("vault.resetHostKeyTitle"),
      message: t("vault.resetHostKeyMessage", { address, port }),
      confirmLabel: t("vault.resetKey"),
      isDanger: false,
      onConfirm: async () => {
        await resetKnownHost(address, port);
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-low)] overflow-hidden shadow-sm">
        {/* toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface-container)]/30">
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheck size={16} className="text-[var(--primary)]" />
              {t("settings.trustedHostFingerprints")}
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {t("settings.tofuHint")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {t("hosts.hostCount", { count: knownHosts.length })}
            </span>
            <button
              onClick={() => refresh()}
              disabled={isLoading}
              title={t("vault.refreshKnownHosts")}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-container)] hover:text-white transition-colors"
            >
              <RotateCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {knownHosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center text-[var(--text-muted)]">
            <Server size={36} className="mb-2 opacity-30" />
            <p className="text-xs font-semibold text-[var(--text-primary)]">{t("vault.noTrustedHosts")}</p>
            <p className="text-[11px] mt-1 max-w-sm text-[var(--text-muted)]">
              {t("vault.noTrustedHostsHint")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-container)] text-[10px] uppercase font-mono text-[var(--text-muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="py-2.5 pl-5">{t("vault.colServer")}</th>
                  <th className="py-2.5 px-3">{t("settings.colAlgorithm")}</th>
                  <th className="py-2.5 px-3">{t("vault.colFingerprint")}</th>
                  <th className="py-2.5 pr-5 text-right">{t("hosts.colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/40 font-mono">
                {knownHosts.map((kh) => (
                  <tr
                    key={`${kh.address}:${kh.port}`}
                    className="hover:bg-[var(--surface-container)]/50 transition-colors"
                  >
                    <td className="py-3 pl-5 font-semibold text-[var(--text-primary)]">
                      {kh.address}:{kh.port}
                    </td>
                    <td className="py-3 px-3 text-[var(--secondary)]">{kh.key_type}</td>
                    <td className="py-3 px-3 text-[11px] text-[var(--primary)] font-mono select-all">
                      {kh.fingerprint}
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <button
                        onClick={() => handleReset(kh.address, kh.port)}
                        title={t("settings.resetHostKey")}
                        className="inline-flex items-center gap-1 rounded bg-[var(--danger)]/10 px-2 py-1 text-[11px] text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-colors border border-[var(--danger)]/20"
                      >
                        <Trash2 size={11} />
                        <span>{t("vault.reset")}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MITM Security notice */}
        <div className="flex items-start gap-2.5 border-t border-[var(--border)] bg-[var(--surface-container)]/30 px-5 py-3 text-[11px] text-[var(--text-secondary)]">
          <ShieldAlert size={15} className="shrink-0 mt-0.5 text-[var(--warning)]" />
          <span>
            <strong>{t("settings.antiMitmPrefix")}</strong> {t("settings.antiMitm")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3: ABOUT & ARCHITECTURE
// ══════════════════════════════════════════════════════════════════════════════

function AboutTab() {
  const { currentVersion, latestVersion, hasUpdate, releaseUrl, isChecking, checkForUpdates } =
    useUpdateStore();

  return (
    <div className="space-y-5">
      {/* App banner */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-low)] p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] shrink-0">
            <Cpu size={26} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Termimus</h3>
              <span className="rounded bg-[var(--primary)]/15 px-2 py-0.5 text-[10px] font-mono font-semibold text-[var(--primary)] border border-[var(--primary)]/30">
                v{currentVersion}
              </span>
              {hasUpdate && (
                <span className="rounded bg-[var(--warning)]/15 px-2 py-0.5 text-[10px] font-mono font-semibold text-[var(--warning)] border border-[var(--warning)]/30 animate-pulse">
                  {t("settings.updateAvailable", { version: latestVersion })}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {t("settings.tagline")}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-container)]/40 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
              <Shield size={14} className="text-[var(--primary)]" />
              <span>{t("settings.zeroKnowledge")}</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              {t("settings.zeroKnowledgeHint")}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-container)]/40 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
              <Layers size={14} className="text-[var(--secondary)]" />
              <span>{t("settings.localFirst")}</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              {t("settings.localFirstHint")}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-container)]/40 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
              <Server size={14} className="text-[var(--tertiary)]" />
              <span>{t("settings.selfHostedSync")}</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              {t("settings.selfHostedSyncHint")}
            </p>
          </div>
        </div>
      </div>

      {/* Software Updates Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-low)] p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${
                hasUpdate
                  ? "bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30"
                  : "bg-[var(--surface-container)] text-[var(--text-muted)]"
              }`}
            >
              {hasUpdate ? (
                <ArrowUpCircle size={22} className="animate-bounce" />
              ) : (
                <CheckCircle2 size={22} className="text-[var(--success)]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  {hasUpdate ? t("settings.updateAvailableTitle", { version: latestVersion }) : t("settings.upToDate")}
                </h4>
                {hasUpdate && (
                  <span className="rounded bg-[var(--primary)]/15 px-2 py-0.5 text-[10px] font-mono font-semibold text-[var(--primary)] border border-[var(--primary)]/30 animate-pulse">
                    {t("settings.new")}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {hasUpdate
                  ? t("settings.updateAvailableDetail", { version: latestVersion, current: currentVersion })
                  : t("settings.upToDateDetail", { current: currentVersion })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasUpdate ? (
              <button
                type="button"
                onClick={() => openExternalUrl(releaseUrl)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] hover:bg-[var(--primary-hover,var(--primary))] text-[var(--canvas)] transition-all shadow-sm cursor-pointer hover:shadow-md active:scale-95"
              >
                <ArrowUpCircle size={14} />
                <span>{t("settings.download", { version: latestVersion })}</span>
                <ExternalLink size={12} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => checkForUpdates(true)}
                disabled={isChecking}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium border border-[var(--border)] bg-[var(--surface-container)]/70 hover:bg-[var(--surface-container)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCw size={13} className={isChecking ? "animate-spin text-[var(--primary)]" : ""} />
                <span>{isChecking ? t("settings.checking") : t("settings.checkForUpdates")}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tech specs card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-low)] p-5 space-y-3 shadow-sm text-xs">
        <h4 className="font-semibold text-[var(--text-primary)]">{t("settings.coreTech")}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-container)]/50 p-2.5">
            <span className="text-[var(--text-muted)] block text-[10px]">BACKEND</span>
            <span className="text-[var(--text-primary)] font-semibold">Tauri v2 + Rust</span>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-container)]/50 p-2.5">
            <span className="text-[var(--text-muted)] block text-[10px]">FRONTEND</span>
            <span className="text-[var(--text-primary)] font-semibold">React 19 + Vite</span>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-container)]/50 p-2.5">
            <span className="text-[var(--text-muted)] block text-[10px]">DATABASE</span>
            <span className="text-[var(--text-primary)] font-semibold">SQLite (rusqlite)</span>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-container)]/50 p-2.5">
            <span className="text-[var(--text-muted)] block text-[10px]">TERMINAL</span>
            <span className="text-[var(--text-primary)] font-semibold">@xterm/xterm 6</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL: CHANGE MASTER PASSWORD
// ══════════════════════════════════════════════════════════════════════════════

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError(t("settings.newPasswordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("settings.newPasswordMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      await api.changeVaultPassword(oldPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface-low)] p-6 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-[var(--primary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {t("settings.changeMasterPassword")}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-[var(--text-muted)] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[var(--danger)] flex items-center gap-2">
            <AlertTriangle size={13} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="rounded-md border border-[var(--success)]/30 bg-[var(--success)]/10 px-3 py-3 text-[var(--success)] flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} />
            <span>{t("settings.passwordChanged")}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block font-medium text-[var(--text-muted)]">
                {t("settings.currentMasterPassword")}
              </label>
              <input
                type="password"
                required
                autoFocus
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={t("settings.enterCurrentPassword")}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:border-[var(--primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-[var(--text-muted)]">
                {t("settings.newMasterPassword")}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("settings.atLeast6Chars")}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:border-[var(--primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-[var(--text-muted)]">
                {t("settings.confirmNewPassword")}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("settings.repeatNewPassword")}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:border-[var(--primary)] focus:outline-none"
              />
            </div>

            <p className="text-[11px] text-[var(--text-muted)]">
              {t("settings.changePasswordHint")}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-md px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-container)] hover:text-white"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-md bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-[var(--on-primary)] hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 size={13} className="animate-spin" />}
                {submitting ? t("settings.reencrypting") : t("settings.updatePassword")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

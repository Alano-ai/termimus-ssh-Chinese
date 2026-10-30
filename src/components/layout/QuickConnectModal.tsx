import { useState, useMemo, useEffect } from "react";
import { Zap, Server, Plus, X, Terminal, Laptop } from "lucide-react";
import { useHostStore } from "../../stores/useHostStore";
import { useSessionStore } from "../../stores/useSessionStore";
import { useVaultStore } from "../../stores/useVaultStore";
import { Host } from "../../lib/api";
import { t } from "../../i18n";

// openSession is a single stable action reference; selecting it directly avoids
// subscribing this modal to unrelated useSessionStore state changes.

interface QuickConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: () => void;
}

export function QuickConnectModal({ isOpen, onClose, onConnect }: QuickConnectModalProps) {
  const { hosts, openCreateModal } = useHostStore();
  const openSession = useSessionStore((s) => s.openSession);
  const openLocalSession = useSessionStore((s) => s.openLocalSession);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      setInput("");
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredHosts = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return hosts;
    return hosts.filter(
      (h) =>
        h.label.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q) ||
        h.username.toLowerCase().includes(q) ||
        h.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [hosts, input]);

  if (!isOpen) return null;

  async function handleOpenLocalTerminal() {
    onClose();
    await openLocalSession(true);
    onConnect?.();
  }

  async function handleConnectToHost(host: Host) {
    onClose();
    if (!useVaultStore.getState().isUnlocked) {
      useVaultStore.getState().openUnlockPrompt();
      return;
    }
    await openSession(host);
    onConnect?.();
  }

  async function handleSubmitAdHoc(e: React.FormEvent) {
    e.preventDefault();
    const val = input.trim();
    if (!val) {
      await handleOpenLocalTerminal();
      return;
    }

    const low = val.toLowerCase();
    if (["local", "terminal", "sh", "bash", "zsh", "pwsh", "cmd"].includes(low)) {
      await handleOpenLocalTerminal();
      return;
    }

    // Check if matches an existing host exactly by label or address
    const existing = hosts.find(
      (h) =>
        h.label.toLowerCase() === val.toLowerCase() ||
        h.address.toLowerCase() === val.toLowerCase()
    );

    if (existing) {
      await handleConnectToHost(existing);
      return;
    }

    // Otherwise parse ad-hoc: [username@]hostname[:port]
    let username = "root";
    let address = val;
    let port = 22;

    if (address.includes("@")) {
      const parts = address.split("@");
      username = parts[0];
      address = parts[1];
    }
    if (address.includes(":")) {
      const parts = address.split(":");
      address = parts[0];
      port = parseInt(parts[1], 10) || 22;
    }

    const tempHost: Host = {
      id: `adhoc-${Date.now()}`,
      label: `${username}@${address}`,
      address,
      port,
      username,
      auth_method: "password",
      tags: ["quick"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onClose();
    await openSession(tempHost);
    onConnect?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface-low)] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search / Input Header */}
        <form
          onSubmit={handleSubmitAdHoc}
          className="flex items-center gap-2.5 border-b border-[var(--border)] bg-[var(--surface-container)] px-3.5 py-3"
        >
          <Zap size={16} className="text-[var(--primary)] shrink-0" />
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("qc.placeholder")}
            className="flex-1 bg-transparent font-mono text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          {input && (
            <button
              type="submit"
              className="rounded bg-[var(--primary)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--on-primary)] hover:bg-[var(--primary-hover)] transition-colors"
            >
              {t("qc.enter")}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </form>

        {/* Action button to create new configured host */}
        <div className="flex items-center justify-between border-b border-[var(--border)]/60 bg-[var(--canvas)]/40 px-3 py-1.5 text-[11px] text-[var(--text-muted)]">
          <span>{input.trim() ? t("qc.searchResults") : t("qc.savedHosts")}</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              openCreateModal();
            }}
            className="flex items-center gap-1 text-[var(--primary)] hover:underline"
          >
            <Plus size={12} />
            <span>{t("qc.newSavedHost")}</span>
          </button>
        </div>

        {/* Host List */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-1">
          {(!input.trim() ||
            "run local terminal device shell bash zsh pwsh powershell cmd".includes(
              input.trim().toLowerCase()
            )) && (
            <button
              type="button"
              onClick={handleOpenLocalTerminal}
              className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-[var(--surface-high)] transition-colors border border-[var(--primary)]/20 bg-[var(--primary)]/5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] shrink-0 group-hover:bg-[var(--primary)] group-hover:text-[var(--on-primary)] transition-colors">
                  <Laptop size={14} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <span>{t("qc.runLocalTerminal")}</span>
                    <span className="rounded bg-[var(--surface-container)] px-1.5 py-0.2 font-mono text-[9px] text-[var(--primary)] border border-[var(--border)]">
                      device
                    </span>
                  </div>
                  <div className="truncate font-mono text-[11px] text-[var(--text-muted)]">
                    {t("qc.localDesc")}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="rounded bg-[var(--primary)]/15 px-2 py-1 font-mono text-[10px] font-semibold text-[var(--primary)] opacity-80 group-hover:opacity-100 transition-opacity">
                  {t("qc.launch")}
                </span>
              </div>
            </button>
          )}

          {filteredHosts.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">
              {hosts.length === 0 ? (
                <>
                  <Server size={28} className="mx-auto mb-2 opacity-30" />
                  <p>{t("qc.noHosts")}</p>
                  <p className="mt-1 font-mono text-[11px]">
                    {t("qc.noHostsHintPrefix")} <code className="text-[var(--primary)]">user@hostname</code> {t("qc.noHostsHintSuffix")}
                  </p>
                </>
              ) : (
                <p>{t("qc.noMatch", { input })}</p>
              )}
            </div>
          ) : (
            filteredHosts.map((host) => (
              <button
                key={host.id}
                onClick={() => handleConnectToHost(host)}
                className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-[var(--surface-high)] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface-container)] text-[var(--primary)] shrink-0 group-hover:bg-[var(--primary)] group-hover:text-[var(--on-primary)] transition-colors">
                    <Terminal size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-[var(--text-primary)]">
                      {host.label}
                    </div>
                    <div className="truncate font-mono text-[11px] text-[var(--text-muted)]">
                      {host.username}@{host.address}:{host.port}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {host.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="rounded bg-[var(--surface-container)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--text-muted)] border border-[var(--border)]"
                    >
                      {t}
                    </span>
                  ))}
                  <span className="rounded bg-[var(--primary)]/15 px-2 py-1 font-mono text-[10px] font-semibold text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("qc.connect")}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--canvas)] px-3.5 py-2 font-mono text-[10px] text-[var(--text-muted)]">
          <span>{t("qc.tip")}</span>
          <span>{t("qc.escToClose")}</span>
        </div>
      </div>
    </div>
  );
}

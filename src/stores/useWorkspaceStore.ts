import { create } from "zustand";
import {
  api,
  PresetLayoutType,
  PresetNode,
  WorkspacePreset,
  WorkspacePresetInput,
} from "../lib/api";
import { t } from "../i18n";

export type { PresetLayoutType, PresetNode, WorkspacePreset, WorkspacePresetInput };

export function getPaneCountForLayout(layout: PresetLayoutType): number {
  switch (layout) {
    case "split-vertical":
    case "split-horizontal":
      return 2;
    case "grid-4":
      return 4;
    case "split-1-2":
    case "split-2-1":
    case "triple-column":
      return 3;
    default:
      return 2;
  }
}

export function getLayoutMeta(layout: PresetLayoutType): {
  label: string;
  panes: number;
  description: string;
} {
  switch (layout) {
    case "split-vertical":
      return {
        label: t("workspaces.layoutSideBySide"),
        panes: 2,
        description: t("workspaces.descSideBySide"),
      };
    case "split-horizontal":
      return {
        label: t("workspaces.layoutTopBottom"),
        panes: 2,
        description: t("workspaces.descTopBottom"),
      };
    case "grid-4":
      return {
        label: t("workspaces.layoutQuad"),
        panes: 4,
        description: t("workspaces.descQuad"),
      };
    case "split-1-2":
      return {
        label: t("workspaces.layout1Left2Right"),
        panes: 3,
        description: t("workspaces.desc1Left2Right"),
      };
    case "split-2-1":
      return {
        label: t("workspaces.layout2Top1Bottom"),
        panes: 3,
        description: t("workspaces.desc2Top1Bottom"),
      };
    case "triple-column":
      return {
        label: t("workspaces.layoutTripleColumn"),
        panes: 3,
        description: t("workspaces.descTripleColumn"),
      };
  }
}

interface WorkspaceState {
  presets: WorkspacePreset[];
  isLoading: boolean;
  error: string | null;
  isModalOpen: boolean;
  editingPreset: WorkspacePreset | null;

  refresh: () => Promise<void>;
  openCreateModal: (initialPreset?: Partial<WorkspacePreset>) => void;
  openEditModal: (preset: WorkspacePreset) => void;
  closeModal: () => void;
  savePreset: (
    preset: WorkspacePresetInput,
    id?: string
  ) => Promise<string>;
  deletePreset: (id: string) => Promise<void>;
  duplicatePreset: (id: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  presets: [],
  isLoading: false,
  error: null,
  isModalOpen: false,
  editingPreset: null,

  refresh: async () => {
    if (get().presets.length === 0) {
      set({ isLoading: true, error: null });
    }
    try {
      let presets = await api.listWorkspacePresets();

      // One-time automatic migration from legacy localStorage to SQLite
      if (presets.length === 0) {
        try {
          const raw = localStorage.getItem("termimus_workspace_presets");
          if (raw) {
            const parsed = JSON.parse(raw);
            const legacyPresets: WorkspacePreset[] = parsed?.state?.presets || [];
            if (Array.isArray(legacyPresets) && legacyPresets.length > 0) {
              for (const p of legacyPresets) {
                await api.saveWorkspacePreset(
                  {
                    name: p.name,
                    description: p.description,
                    layout: p.layout,
                    nodes: p.nodes,
                    broadcastOnLaunch: p.broadcastOnLaunch,
                  },
                  p.id
                );
              }
              localStorage.removeItem("termimus_workspace_presets");
              presets = await api.listWorkspacePresets();
            }
          }
        } catch {
          // Non-fatal legacy migration fallback
        }
      }

      set({ presets, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: String(e) });
    }
  },

  openCreateModal: (initialPreset) => {
    const dummy: WorkspacePreset = {
      id: "",
      name: initialPreset?.name || "",
      description: initialPreset?.description || "",
      layout: initialPreset?.layout || "split-vertical",
      nodes: initialPreset?.nodes || [],
      broadcastOnLaunch: initialPreset?.broadcastOnLaunch || false,
      createdAt: "",
      updatedAt: "",
    };
    set({ isModalOpen: true, editingPreset: dummy });
  },

  openEditModal: (preset) => {
    set({ isModalOpen: true, editingPreset: preset });
  },

  closeModal: () => {
    set({ isModalOpen: false, editingPreset: null });
  },

  savePreset: async (input, id) => {
    const saved = await api.saveWorkspacePreset(input, id);
    set({ isModalOpen: false, editingPreset: null });
    await get().refresh();
    return saved.id;
  },

  deletePreset: async (id: string) => {
    await api.deleteWorkspacePreset(id);
    await get().refresh();
  },

  duplicatePreset: async (id: string) => {
    const preset = get().presets.find((p) => p.id === id);
    if (!preset) return;
    await api.saveWorkspacePreset({
      name: `${preset.name} (Copy)`,
      description: preset.description,
      layout: preset.layout,
      nodes: preset.nodes,
      broadcastOnLaunch: preset.broadcastOnLaunch,
    });
    await get().refresh();
  },
}));

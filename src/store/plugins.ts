import { createSignal } from "solid-js";
import type { PluginManifest, RemotePlugin, PluginSubTabId } from "../types/plugin";
import {
  listPlugins,
  fetchMarketplacePlugins,
  installPlugin,
  uninstallPlugin,
  updatePlugin,
} from "../lib/tauri/commands";
import { pluginRuntime } from "../lib/plugins/runtime";

const STORAGE_KEY_PLUGINS = "Taleno_plugins_state";

export const [plugins, setPlugins] = createSignal<PluginManifest[]>([]);
export const [pluginFilterQuery, setPluginFilterQuery] = createSignal("");
export const [isReloadingPlugins, setIsReloadingPlugins] = createSignal(false);
export const [pluginErrors, setPluginErrors] = createSignal<Record<string, string>>({});

// Marketplace signals
export const [pluginSubTab, setPluginSubTab] = createSignal<PluginSubTabId>("installed");
export const [marketplacePlugins, setMarketplacePlugins] = createSignal<RemotePlugin[]>([]);
export const [isFetchingMarketplace, setIsFetchingMarketplace] = createSignal(false);
export const [marketplaceError, setMarketplaceError] = createSignal<string | null>(null);
export const [busyPluginIds, setBusyPluginIds] = createSignal<string[]>([]);

const loadSavedState = (): Record<string, boolean> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PLUGINS);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const savePluginState = (items: PluginManifest[]) => {
  try {
    const stateMap: Record<string, boolean> = {};
    for (const item of items) {
      stateMap[item.id] = item.enabled;
    }
    localStorage.setItem(STORAGE_KEY_PLUGINS, JSON.stringify(stateMap));
  } catch (err) {
    console.warn("Failed to persist plugin state:", err);
  }
};

/**
 * Synchronize and scan plugins from backend and initialize active ones.
 */
export const syncPlugins = async () => {
  try {
    const savedState = loadSavedState();
    let diskPlugins: PluginManifest[] = [];

    try {
      diskPlugins = await listPlugins();
    } catch {
      diskPlugins = [];
    }

    const mapped: PluginManifest[] = diskPlugins.map((item) => ({
      ...item,
      enabled: savedState[item.id] ?? item.enabled ?? false,
    }));

    setPlugins(mapped);
    savePluginState(mapped);

    const errors: Record<string, string> = {};
    for (const p of mapped) {
      if (p.enabled) {
        try {
          await pluginRuntime.loadPlugin(p);
        } catch (err: any) {
          errors[p.id] = err?.message || String(err);
        }
      }
    }
    setPluginErrors(errors);
  } catch (err) {
    console.warn("[PluginsStore] Failed to sync plugins:", err);
  }
};

export const togglePlugin = async (id: string) => {
  const currentList = plugins();
  const target = currentList.find((p) => p.id === id);
  if (!target) return;

  const nextEnabled = !target.enabled;

  const updated = currentList.map((item) =>
    item.id === id ? { ...item, enabled: nextEnabled } : item
  );

  setPlugins(updated);
  savePluginState(updated);

  if (nextEnabled) {
    try {
      await pluginRuntime.loadPlugin(target);
      setPluginErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err: any) {
      setPluginErrors((prev) => ({
        ...prev,
        [id]: err?.message || String(err),
      }));
    }
  } else {
    await pluginRuntime.unloadPlugin(id);
    setPluginErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }
};

export const reloadPlugins = async () => {
  setIsReloadingPlugins(true);
  try {
    await syncPlugins();
  } finally {
    setIsReloadingPlugins(false);
  }
};

/**
 * Fetch remote catalog from BerryUIKI/Taleno-Plugins.
 */
export const fetchMarketplace = async () => {
  setIsFetchingMarketplace(true);
  setMarketplaceError(null);
  try {
    const items = (await fetchMarketplacePlugins()) as RemotePlugin[];
    setMarketplacePlugins(items);
  } catch (err: any) {
    console.warn("[PluginsStore] Failed to fetch marketplace:", err);
    setMarketplaceError(err?.toString() || "Failed to load marketplace plugins");
  } finally {
    setIsFetchingMarketplace(false);
  }
};

/**
 * Check if a plugin is installed locally.
 */
export const isPluginInstalled = (id: string): boolean => {
  return plugins().some((p) => p.id === id);
};

/**
 * Get the local manifest for an installed plugin.
 */
export const getInstalledPlugin = (id: string): PluginManifest | undefined => {
  return plugins().find((p) => p.id === id);
};

/**
 * Check if a newer version is available for an installed plugin.
 */
export const isUpdateAvailable = (remote: RemotePlugin): boolean => {
  const installed = getInstalledPlugin(remote.id);
  if (!installed) return false;
  return compareSemver(remote.version, installed.version) > 0;
};

function compareSemver(v1: string, v2: string): number {
  const p1 = v1.replace(/^v/, "").split(".").map(Number);
  const p2 = v2.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const diff = (p1[i] || 0) - (p2[i] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

const markPluginBusy = (id: string) => {
  setBusyPluginIds((prev) => [...prev, id]);
};

const unmarkPluginBusy = (id: string) => {
  setBusyPluginIds((prev) => prev.filter((item) => item !== id));
};

export const isPluginBusy = (id: string): boolean => {
  return busyPluginIds().includes(id);
};

/**
 * Download and install a plugin from the remote repository.
 */
export const installMarketplacePlugin = async (remote: RemotePlugin) => {
  markPluginBusy(remote.id);
  try {
    await installPlugin(remote.id, remote.rawBaseUrl, remote.entryFile);
    await syncPlugins();
  } catch (err) {
    console.error(`Failed to install plugin ${remote.id}:`, err);
    throw err;
  } finally {
    unmarkPluginBusy(remote.id);
  }
};

/**
 * Update an already installed plugin to the latest version.
 */
export const updateMarketplacePlugin = async (remote: RemotePlugin) => {
  markPluginBusy(remote.id);
  try {
    await updatePlugin(remote.id, remote.rawBaseUrl, remote.entryFile);
    await syncPlugins();
  } catch (err) {
    console.error(`Failed to update plugin ${remote.id}:`, err);
    throw err;
  } finally {
    unmarkPluginBusy(remote.id);
  }
};

/**
 * Uninstall an installed plugin.
 */
export const uninstallMarketplacePlugin = async (pluginId: string) => {
  markPluginBusy(pluginId);
  try {
    await pluginRuntime.unloadPlugin(pluginId);
    setPluginErrors((prev) => {
      const next = { ...prev };
      delete next[pluginId];
      return next;
    });
    await uninstallPlugin(pluginId);
    await syncPlugins();
  } catch (err) {
    console.error(`Failed to uninstall plugin ${pluginId}:`, err);
    throw err;
  } finally {
    unmarkPluginBusy(pluginId);
  }
};

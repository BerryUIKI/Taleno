import { createSignal } from "solid-js";
import type { ThemeManifest, RemoteTheme } from "../types/theme";
import {
  listThemes,
  readThemeCss,
  openThemesFolder,
  fetchMarketplaceThemes,
  installTheme,
  uninstallTheme,
} from "../lib/tauri/commands";

const STORAGE_KEY_ACTIVE_THEME = "Taleno_active_custom_theme";
const STYLE_ELEMENT_ID = "Taleno-custom-theme-style";

export type ThemeSubTabId = "installed" | "marketplace";

export const [installedThemes, setInstalledThemes] = createSignal<ThemeManifest[]>([]);
export const [activeCustomThemeId, setActiveCustomThemeId] = createSignal<string | null>(
  typeof localStorage !== "undefined"
    ? localStorage.getItem(STORAGE_KEY_ACTIVE_THEME)
    : null
);
export const [themeSubTab, setThemeSubTab] = createSignal<ThemeSubTabId>("installed");
export const [marketplaceThemes, setMarketplaceThemes] = createSignal<RemoteTheme[]>([]);
export const [isFetchingThemes, setIsFetchingThemes] = createSignal(false);
export const [themeError, setThemeError] = createSignal<string | null>(null);
export const [busyThemeIds, setBusyThemeIds] = createSignal<string[]>([]);
export const [themeFilterQuery, setThemeFilterQuery] = createSignal("");

const markThemeBusy = (id: string) => {
  setBusyThemeIds((prev) => [...prev, id]);
};

const unmarkThemeBusy = (id: string) => {
  setBusyThemeIds((prev) => prev.filter((item) => item !== id));
};

export const isThemeBusy = (id: string): boolean => {
  return busyThemeIds().includes(id);
};

export const isThemeInstalled = (id: string): boolean => {
  return installedThemes().some((t) => t.id === id);
};

/**
 * Dynamically apply or remove the custom theme stylesheet in the document head.
 */
export const applyThemeCss = async (themeId: string | null) => {
  if (typeof document === "undefined") return;

  let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;

  if (!themeId) {
    if (styleEl) {
      styleEl.remove();
    }
    return;
  }

  try {
    const css = await readThemeCss(themeId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ELEMENT_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  } catch (err) {
    console.warn(`[ThemeStore] Failed to apply theme '${themeId}':`, err);
    if (styleEl) styleEl.remove();
  }
};

/**
 * Activate or deactivate a custom theme.
 */
export const setActiveTheme = async (themeId: string | null) => {
  setActiveCustomThemeId(themeId);
  try {
    if (themeId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_THEME, themeId);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_THEME);
    }
  } catch {}

  await applyThemeCss(themeId);
};

/**
 * Synchronize installed themes from the user directory.
 */
export const syncCustomThemes = async () => {
  try {
    let list: ThemeManifest[] = [];
    try {
      list = await listThemes();
    } catch {
      list = [];
    }
    setInstalledThemes(list);

    // If the active theme is still present, re-apply its stylesheet
    const active = activeCustomThemeId();
    if (active && list.some((t) => t.id === active)) {
      await applyThemeCss(active);
    } else if (active && list.length > 0) {
      // If the previously selected theme was removed
      await setActiveTheme(null);
    }
  } catch (err) {
    console.warn("[ThemeStore] Failed to sync custom themes:", err);
  }
};

/**
 * Fetch remote themes from the official registry.
 */
export const fetchThemes = async () => {
  setIsFetchingThemes(true);
  setThemeError(null);
  try {
    const items = await fetchMarketplaceThemes();
    setMarketplaceThemes(items);
  } catch (err: any) {
    console.warn("[ThemeStore] Failed to fetch themes marketplace:", err);
    setThemeError(err?.toString() || "Failed to load community themes");
  } finally {
    setIsFetchingThemes(false);
  }
};

/**
 * Install a theme from the community registry.
 */
export const installCommunityTheme = async (remote: RemoteTheme) => {
  markThemeBusy(remote.id);
  try {
    await installTheme(remote.id, remote.rawBaseUrl, remote.entryFile);
    await syncCustomThemes();
    // Auto-apply newly installed theme for instant user feedback
    await setActiveTheme(remote.id);
  } catch (err) {
    console.error(`Failed to install theme ${remote.id}:`, err);
    throw err;
  } finally {
    unmarkThemeBusy(remote.id);
  }
};

/**
 * Uninstall an installed custom theme.
 */
export const uninstallCustomTheme = async (themeId: string) => {
  markThemeBusy(themeId);
  try {
    if (activeCustomThemeId() === themeId) {
      await setActiveTheme(null);
    }
    await uninstallTheme(themeId);
    await syncCustomThemes();
  } catch (err) {
    console.error(`Failed to uninstall theme ${themeId}:`, err);
    throw err;
  } finally {
    unmarkThemeBusy(themeId);
  }
};

export { openThemesFolder };

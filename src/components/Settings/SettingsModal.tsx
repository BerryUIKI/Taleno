import {
  Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import {
  MARKDOWN_THEME_OPTIONS,
  automaticUpdateChecks,
  elementShadows,
  markdownTheme,
  setElementShadows,
  setAutomaticUpdateChecks,
  setMarkdownTheme,
  setTheme,
  theme,
  type Theme,
} from "../../store/settings";
import {
  plugins,
  pluginErrors,
  togglePlugin,
  pluginFilterQuery,
  setPluginFilterQuery,
  reloadPlugins,
  isReloadingPlugins,
  pluginSubTab,
  setPluginSubTab,
  marketplacePlugins,
  isFetchingMarketplace,
  marketplaceError,
  fetchMarketplace,
  installMarketplacePlugin,
  updateMarketplacePlugin,
  uninstallMarketplacePlugin,
  isPluginInstalled,
  isUpdateAvailable,
  isPluginBusy,
  getInstalledPlugin,
} from "../../store/plugins";
import {
  installedThemes,
  activeCustomThemeId,
  setActiveTheme,
  syncCustomThemes,
  themeSubTab,
  setThemeSubTab,
  marketplaceThemes,
  isFetchingThemes,
  themeError,
  themeFilterQuery,
  setThemeFilterQuery,
  fetchThemes,
  installCommunityTheme,
  uninstallCustomTheme,
  isThemeInstalled,
  isThemeBusy,
  openThemesFolder,
} from "../../store/customThemes";
import type { SettingsTabId } from "../../types/plugin";
import { openPluginsFolder } from "../../lib/tauri/commands";
import { t } from "../../i18n";

export interface SettingsModalProps {
  isOpen: boolean;
  initialTab?: SettingsTabId;
  onClose: () => void;
}

const colorModes: Array<{
  id: Theme;
  labelKey: "lightTheme" | "darkTheme" | "systemTheme";
}> = [
  { id: "light", labelKey: "lightTheme" },
  { id: "dark", labelKey: "darkTheme" },
  { id: "system", labelKey: "systemTheme" },
];

export const SettingsModal: Component<SettingsModalProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<SettingsTabId>(
    props.initialTab ?? "theme"
  );

  createEffect(() => {
    if (props.isOpen && props.initialTab) {
      setActiveTab(props.initialTab);
    }
  });

  const handleKeyDown = (event: KeyboardEvent) => {
    if (props.isOpen && event.key === "Escape") props.onClose();
  };

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
    syncCustomThemes();
  });
  onCleanup(() => window.removeEventListener("keydown", handleKeyDown));

  const filteredPlugins = createMemo(() => {
    const q = pluginFilterQuery().trim().toLowerCase();
    if (!q) return plugins();
    return plugins().filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const filteredMarketplacePlugins = createMemo(() => {
    const q = pluginFilterQuery().trim().toLowerCase();
    if (!q) return marketplacePlugins();
    return marketplacePlugins().filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const filteredCustomThemes = createMemo(() => {
    const q = themeFilterQuery().trim().toLowerCase();
    if (!q) return installedThemes();
    return installedThemes().filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const filteredMarketplaceThemes = createMemo(() => {
    const q = themeFilterQuery().trim().toLowerCase();
    if (!q) return marketplaceThemes();
    return marketplaceThemes().filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 backdrop-blur-[2px]"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) props.onClose();
        }}
      >
        <div
          class="w-full max-w-3xl h-[620px] max-h-[85vh] mx-4 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-2xl flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={t("settings.title")}
        >
          {/* Header */}
          <div class="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
            <div>
              <h2 class="text-base font-semibold">{t("settings.title")}</h2>
            </div>
            <button
              class="w-7 h-7 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center justify-center"
              onClick={props.onClose}
              aria-label={t("window.close")}
            >
              <svg
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div class="flex flex-1 min-h-0">
            {/* Sidebar Tabs */}
            <div class="w-48 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 space-y-1">
              <button
                class={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab() === "theme"
                    ? "bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-xs"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
                }`}
                onClick={() => setActiveTab("theme")}
              >
                <svg
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
                <span>{t("settings.themeTab")}</span>
              </button>

              <button
                class={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab() === "plugins"
                    ? "bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-xs"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
                }`}
                onClick={() => setActiveTab("plugins")}
              >
                <svg
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <span>{t("settings.pluginsTab")}</span>
              </button>

              <button
                class={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab() === "updates"
                    ? "bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-xs"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
                }`}
                onClick={() => setActiveTab("updates")}
              >
                <svg
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>{t("settings.updatesTab")}</span>
              </button>
            </div>

            {/* Content Area */}
            <div class="flex-1 p-6 overflow-y-auto">
              {/* Theme Settings Tab */}
              <Show when={activeTab() === "theme"}>
                <div class="space-y-6">
                  <div>
                    <h3 class="text-sm font-semibold">{t("settings.markdownTheme")}</h3>
                    <p class="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                      {t("settings.markdownThemeDescription")}
                    </p>
                  </div>

                  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <For each={MARKDOWN_THEME_OPTIONS}>
                      {(option) => (
                        <button
                          class={`p-3 rounded-xl border text-left transition-all ${
                            markdownTheme() === option.id
                              ? "border-[var(--color-accent)] bg-[var(--color-hover)] ring-2 ring-[var(--color-accent)]/20"
                              : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)]"
                          }`}
                          onClick={() => setMarkdownTheme(option.id)}
                          aria-pressed={markdownTheme() === option.id}
                        >
                          <div class="font-medium text-xs">{option.name}</div>
                        </button>
                      )}
                    </For>
                  </div>

                  <div class="flex items-center justify-between gap-5 rounded-xl border border-[var(--color-border)] p-4">
                    <div>
                      <h3 class="text-sm font-semibold">{t("settings.colorMode")}</h3>
                      <p class="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                        {t("settings.colorModeDescription")}
                      </p>
                    </div>
                    <div class="inline-flex rounded-lg border border-[var(--color-border)] p-1 bg-[var(--color-bg-secondary)]">
                      <For each={colorModes}>
                        {(mode) => (
                          <button
                            class={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              theme() === mode.id
                                ? "bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-xs"
                                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                            }`}
                            onClick={() => setTheme(mode.id)}
                            aria-pressed={theme() === mode.id}
                          >
                            {t(`view.${mode.labelKey}`)}
                          </button>
                        )}
                      </For>
                    </div>
                  </div>

                  <div class="flex items-center justify-between gap-5 rounded-xl border border-[var(--color-border)] p-4">
                    <div>
                      <h3 class="text-sm font-semibold">{t("settings.elementShadows")}</h3>
                      <p class="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                        {t("settings.elementShadowsDescription")}
                      </p>
                    </div>
                    <button
                      class={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors ${
                        elementShadows()
                          ? "bg-[var(--color-accent)]"
                          : "bg-[var(--color-border)]"
                      }`}
                      onClick={() => setElementShadows((enabled) => !enabled)}
                      role="switch"
                      aria-checked={elementShadows()}
                      aria-label={t("settings.elementShadows")}
                    >
                      <span
                        class={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          elementShadows() ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Custom & Community Themes Section */}
                  <div class="border-t border-[var(--color-border)] pt-6 space-y-4">
                    <div class="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h3 class="text-sm font-semibold">{t("settings.customThemes")}</h3>
                        <p class="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                          {t("settings.customThemesDescription")}
                        </p>
                      </div>

                      {/* Theme sub-tab pills */}
                      <div class="inline-flex rounded-lg border border-[var(--color-border)] p-0.5 bg-[var(--color-bg-secondary)]">
                        <button
                          class={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            themeSubTab() === "installed"
                              ? "bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-xs"
                              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                          }`}
                          onClick={() => setThemeSubTab("installed")}
                        >
                          {t("settings.installedTab")} ({installedThemes().length})
                        </button>
                        <button
                          class={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            themeSubTab() === "marketplace"
                              ? "bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-xs"
                              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                          }`}
                          onClick={() => {
                            setThemeSubTab("marketplace");
                            if (marketplaceThemes().length === 0) {
                              fetchThemes();
                            }
                          }}
                        >
                          {t("settings.marketplaceTab")}
                        </button>
                      </div>
                    </div>

                    {/* Action & Filter Bar */}
                    <div class="flex items-center gap-3">
                      <div class="relative flex-1">
                        <input
                          type="text"
                          class="w-full px-3 py-1.5 pl-8 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)]"
                          placeholder={t("settings.searchThemes")}
                          value={themeFilterQuery()}
                          onInput={(e) => setThemeFilterQuery(e.currentTarget.value)}
                        />
                        <svg
                          class="w-3.5 h-3.5 absolute left-2.5 top-2 text-[var(--color-text-secondary)]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </div>

                      <button
                        class="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] transition-colors flex items-center gap-1.5 flex-shrink-0"
                        onClick={() => openThemesFolder()}
                        title={t("settings.openThemesFolder")}
                      >
                        <svg
                          class="w-3.5 h-3.5 text-[var(--color-accent)]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <span>{t("settings.openThemesFolder")}</span>
                      </button>

                      <button
                        class="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] transition-colors flex items-center gap-1.5 flex-shrink-0"
                        onClick={() => {
                          if (themeSubTab() === "marketplace") {
                            fetchThemes();
                          } else {
                            syncCustomThemes();
                          }
                        }}
                        disabled={isFetchingThemes()}
                        title={t("settings.reloadPlugins")}
                      >
                        <svg
                          class={`w-3.5 h-3.5 ${isFetchingThemes() ? "animate-spin text-[var(--color-accent)]" : ""}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                        </svg>
                      </button>
                    </div>

                    {/* Installed SubTab */}
                    <Show when={themeSubTab() === "installed"}>
                      <div class="space-y-3">
                        {/* Default / None Option */}
                        <div
                          class={`flex items-center justify-between gap-4 p-3.5 rounded-xl border transition-all ${
                            activeCustomThemeId() === null
                              ? "border-[var(--color-accent)] bg-[var(--color-hover)] ring-2 ring-[var(--color-accent)]/20"
                              : "border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover,var(--color-border))]"
                          }`}
                        >
                          <div class="space-y-0.5">
                            <div class="flex items-center gap-2">
                              <span class="font-semibold text-xs text-[var(--color-text-primary)]">
                                {t("settings.defaultTheme")} ({t("settings.builtInThemes")})
                              </span>
                              <Show when={activeCustomThemeId() === null}>
                                <span class="px-1.5 py-0.2 text-[10px] rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 font-medium">
                                  {t("settings.appliedTheme")}
                                </span>
                              </Show>
                            </div>
                            <p class="text-[11px] text-[var(--color-text-secondary)]">
                              Use native Taleno theme styling without custom CSS overrides.
                            </p>
                          </div>
                          <Show when={activeCustomThemeId() !== null}>
                            <button
                              class="px-3 py-1 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                              onClick={() => setActiveTheme(null)}
                            >
                              {t("settings.applyTheme")}
                            </button>
                          </Show>
                        </div>

                        {/* Installed custom themes list */}
                        <Show
                          when={filteredCustomThemes().length > 0}
                          fallback={
                            <div class="p-6 text-center rounded-xl border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs">
                              {themeFilterQuery().trim()
                                ? t("settings.noThemesFound")
                                : t("settings.noCustomThemesInstalled")}
                            </div>
                          }
                        >
                          <For each={filteredCustomThemes()}>
                            {(customTheme) => {
                              const isActive = () => activeCustomThemeId() === customTheme.id;
                              const busy = () => isThemeBusy(customTheme.id);

                              return (
                                <div
                                  class={`flex items-start justify-between gap-4 p-3.5 rounded-xl border transition-all ${
                                    isActive()
                                      ? "border-[var(--color-accent)] bg-[var(--color-hover)] ring-2 ring-[var(--color-accent)]/20"
                                      : "border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover,var(--color-border))]"
                                  }`}
                                >
                                  <div class="space-y-1.5 flex-1 min-w-0">
                                    <div class="flex items-center gap-2 flex-wrap">
                                      {/* Color swatch indicator */}
                                      <div class="flex items-center gap-1 p-0.5 rounded border border-[var(--color-border)] bg-black/10">
                                        <div
                                          class="w-3 h-3 rounded-xs"
                                          style={{ "background-color": customTheme.backgroundColor }}
                                          title={`Background: ${customTheme.backgroundColor}`}
                                        />
                                        <div
                                          class="w-3 h-3 rounded-xs"
                                          style={{ "background-color": customTheme.accentColor }}
                                          title={`Accent: ${customTheme.accentColor}`}
                                        />
                                        <div
                                          class="w-3 h-3 rounded-xs"
                                          style={{ "background-color": customTheme.textColor }}
                                          title={`Text: ${customTheme.textColor}`}
                                        />
                                      </div>

                                      <span class="font-semibold text-xs text-[var(--color-text-primary)]">
                                        {customTheme.name}
                                      </span>
                                      <span class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[var(--color-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                                        v{customTheme.version}
                                      </span>
                                      <span class="text-[11px] text-[var(--color-text-secondary)]">
                                        • {customTheme.author}
                                      </span>
                                      <Show when={isActive()}>
                                        <span class="px-1.5 py-0.2 text-[10px] rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 font-medium">
                                          {t("settings.appliedTheme")}
                                        </span>
                                      </Show>
                                    </div>
                                    <p class="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                                      {customTheme.description}
                                    </p>
                                  </div>

                                  <div class="flex items-center gap-2 flex-shrink-0 pt-0.5">
                                    <Show when={!isActive()}>
                                      <button
                                        class="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity"
                                        onClick={() => setActiveTheme(customTheme.id)}
                                      >
                                        {t("settings.applyTheme")}
                                      </button>
                                    </Show>

                                    <button
                                      class="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
                                      onClick={() => uninstallCustomTheme(customTheme.id)}
                                      disabled={busy()}
                                      title={t("settings.uninstallTheme")}
                                    >
                                      {busy() ? t("settings.uninstalling") : t("settings.uninstallTheme")}
                                    </button>
                                  </div>
                                </div>
                              );
                            }}
                          </For>
                        </Show>
                      </div>
                    </Show>

                    {/* Marketplace SubTab */}
                    <Show when={themeSubTab() === "marketplace"}>
                      <div class="space-y-3">
                        <Show when={themeError()}>
                          <div class="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between gap-3">
                            <span>{t("settings.marketplaceOffline")}</span>
                            <button
                              class="px-2.5 py-1 text-[11px] font-medium rounded-md bg-[var(--color-bg-primary)] border border-[var(--color-border)] hover:bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                              onClick={() => fetchThemes()}
                            >
                              {t("settings.retryMarketplace")}
                            </button>
                          </div>
                        </Show>

                        <Show when={isFetchingThemes()}>
                          <div class="p-8 text-center text-xs text-[var(--color-text-secondary)] space-y-2">
                            <svg
                              class="w-5 h-5 mx-auto animate-spin text-[var(--color-accent)]"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                            </svg>
                            <p>{t("settings.installing")}</p>
                          </div>
                        </Show>

                        <Show when={!isFetchingThemes()}>
                          <Show
                            when={filteredMarketplaceThemes().length > 0}
                            fallback={
                              <div class="p-8 text-center rounded-xl border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs">
                                {t("settings.noThemesFound")}
                              </div>
                            }
                          >
                            <For each={filteredMarketplaceThemes()}>
                              {(remoteTheme) => {
                                const installed = () => isThemeInstalled(remoteTheme.id);
                                const isActive = () => activeCustomThemeId() === remoteTheme.id;
                                const busy = () => isThemeBusy(remoteTheme.id);

                                return (
                                  <div class="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover,var(--color-border))] transition-colors">
                                    <div class="space-y-1.5 flex-1 min-w-0">
                                      <div class="flex items-center gap-2 flex-wrap">
                                        {/* Color swatches */}
                                        <div class="flex items-center gap-1 p-0.5 rounded border border-[var(--color-border)] bg-black/10">
                                          <div
                                            class="w-3 h-3 rounded-xs"
                                            style={{ "background-color": remoteTheme.backgroundColor }}
                                            title={`Background: ${remoteTheme.backgroundColor}`}
                                          />
                                          <div
                                            class="w-3 h-3 rounded-xs"
                                            style={{ "background-color": remoteTheme.accentColor }}
                                            title={`Accent: ${remoteTheme.accentColor}`}
                                          />
                                          <div
                                            class="w-3 h-3 rounded-xs"
                                            style={{ "background-color": remoteTheme.textColor }}
                                            title={`Text: ${remoteTheme.textColor}`}
                                          />
                                        </div>

                                        <span class="font-semibold text-xs text-[var(--color-text-primary)]">
                                          {remoteTheme.name}
                                        </span>
                                        <span class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[var(--color-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                                          v{remoteTheme.version}
                                        </span>
                                        <span class="text-[11px] text-[var(--color-text-secondary)]">
                                          • {remoteTheme.author}
                                        </span>
                                        <Show when={installed()}>
                                          <span class="px-1.5 py-0.2 text-[10px] rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                                            {t("settings.installedBadge")}
                                          </span>
                                        </Show>
                                      </div>
                                      <p class="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                                        {remoteTheme.description}
                                      </p>
                                    </div>

                                    <div class="flex items-center gap-2 flex-shrink-0 pt-0.5">
                                      <Show when={!installed()}>
                                        <button
                                          class="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                                          onClick={() => installCommunityTheme(remoteTheme)}
                                          disabled={busy()}
                                        >
                                          {busy() ? t("settings.installing") : t("settings.installTheme")}
                                        </button>
                                      </Show>

                                      <Show when={installed() && !isActive()}>
                                        <button
                                          class="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity"
                                          onClick={() => setActiveTheme(remoteTheme.id)}
                                        >
                                          {t("settings.applyTheme")}
                                        </button>
                                      </Show>

                                      <Show when={installed()}>
                                        <button
                                          class="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
                                          onClick={() => uninstallCustomTheme(remoteTheme.id)}
                                          disabled={busy()}
                                          title={t("settings.uninstallTheme")}
                                        >
                                          {busy() ? t("settings.uninstalling") : t("settings.uninstallTheme")}
                                        </button>
                                      </Show>
                                    </div>
                                  </div>
                                );
                              }}
                            </For>
                          </Show>
                        </Show>
                      </div>
                    </Show>
                  </div>
                </div>
              </Show>

              {/* Plugins Settings Tab */}
              <Show when={activeTab() === "plugins"}>
                <div class="space-y-5">
                  <div class="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 class="text-sm font-semibold">{t("settings.pluginsTab")}</h3>
                      <p class="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                        {t("settings.pluginsDescription")}
                      </p>
                    </div>

                    {/* Sub-tab pills */}
                    <div class="inline-flex rounded-lg border border-[var(--color-border)] p-0.5 bg-[var(--color-bg-secondary)]">
                      <button
                        class={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          pluginSubTab() === "installed"
                            ? "bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-xs"
                            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        }`}
                        onClick={() => setPluginSubTab("installed")}
                      >
                        {t("settings.installedTab")} ({plugins().length})
                      </button>
                      <button
                        class={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          pluginSubTab() === "marketplace"
                            ? "bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-xs"
                            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        }`}
                        onClick={() => {
                          setPluginSubTab("marketplace");
                          if (marketplacePlugins().length === 0) {
                            fetchMarketplace();
                          }
                        }}
                      >
                        {t("settings.marketplaceTab")}
                      </button>
                    </div>
                  </div>

                  {/* Action bar */}
                  <div class="flex items-center gap-3">
                    <div class="relative flex-1">
                      <input
                        type="text"
                        class="w-full px-3 py-1.5 pl-8 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)]"
                        placeholder={
                          pluginSubTab() === "marketplace"
                            ? t("settings.searchMarketplace")
                            : t("settings.searchPlugins")
                        }
                        value={pluginFilterQuery()}
                        onInput={(e) => setPluginFilterQuery(e.currentTarget.value)}
                      />
                      <svg
                        class="w-3.5 h-3.5 absolute left-2.5 top-2 text-[var(--color-text-secondary)]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>

                    <button
                      class="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] transition-colors flex items-center gap-1.5 flex-shrink-0"
                      onClick={() => openPluginsFolder()}
                      title={t("settings.openPluginsFolder")}
                    >
                      <svg
                        class="w-3.5 h-3.5 text-[var(--color-accent)]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{t("settings.openPluginsFolder")}</span>
                    </button>

                    <button
                      class="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] transition-colors flex items-center gap-1.5 flex-shrink-0"
                      onClick={() => {
                        if (pluginSubTab() === "marketplace") {
                          fetchMarketplace();
                        } else {
                          reloadPlugins();
                        }
                      }}
                      disabled={isReloadingPlugins() || isFetchingMarketplace()}
                      title={
                        pluginSubTab() === "marketplace"
                          ? t("settings.retryMarketplace")
                          : t("settings.reloadPlugins")
                      }
                    >
                      <svg
                        class={`w-3.5 h-3.5 ${
                          isReloadingPlugins() || isFetchingMarketplace()
                            ? "animate-spin text-[var(--color-accent)]"
                            : ""
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                      </svg>
                      <span>
                        {pluginSubTab() === "marketplace"
                          ? t("settings.retryMarketplace")
                          : t("settings.reloadPlugins")}
                      </span>
                    </button>
                  </div>

                  {/* SubTab: Installed View */}
                  <Show when={pluginSubTab() === "installed"}>
                    <div class="space-y-3">
                      <Show
                        when={filteredPlugins().length > 0}
                        fallback={
                          <div class="p-8 text-center rounded-xl border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs">
                            {pluginFilterQuery().trim()
                              ? t("settings.noPluginsFound")
                              : t("settings.noPluginsInstalled")}
                          </div>
                        }
                      >
                        <For each={filteredPlugins()}>
                          {(plugin) => (
                            <div class="flex items-start justify-between gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover,var(--color-border))] transition-colors">
                              <div class="space-y-1.5 flex-1 min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                  <span class="font-semibold text-sm text-[var(--color-text-primary)]">
                                    {plugin.name}
                                  </span>
                                  <span class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[var(--color-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                                    v{plugin.version}
                                  </span>
                                  <Show when={plugin.author}>
                                    <span class="text-[11px] text-[var(--color-text-secondary)]">
                                      • {plugin.author}
                                    </span>
                                  </Show>
                                </div>
                                <p class="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                                  {plugin.description}
                                </p>
                                <Show when={plugin.tags && plugin.tags.length > 0}>
                                  <div class="flex items-center gap-1.5 pt-1 flex-wrap">
                                    <For each={plugin.tags}>
                                      {(tag) => (
                                        <span class="px-2 py-0.5 text-[10px] rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                                          #{tag}
                                        </span>
                                      )}
                                    </For>
                                  </div>
                                </Show>

                                <Show when={pluginErrors()[plugin.id]}>
                                  <div class="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-1.5">
                                    <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <circle cx="12" cy="12" r="10" />
                                      <line x1="12" y1="8" x2="12" y2="12" />
                                      <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <span class="truncate">
                                      {pluginErrors()[plugin.id]}
                                    </span>
                                  </div>
                                </Show>
                              </div>

                              <div class="flex items-center gap-3 flex-shrink-0 pt-0.5">
                                <button
                                  class={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors ${
                                    plugin.enabled
                                      ? "bg-[var(--color-accent)]"
                                      : "bg-[var(--color-border)]"
                                  }`}
                                  onClick={() => togglePlugin(plugin.id)}
                                  role="switch"
                                  aria-checked={plugin.enabled}
                                  aria-label={`${plugin.name} ${
                                    plugin.enabled
                                      ? t("settings.pluginEnabled")
                                      : t("settings.pluginDisabled")
                                  }`}
                                >
                                  <span
                                    class={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                      plugin.enabled ? "translate-x-5" : "translate-x-1"
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          )}
                        </For>
                      </Show>
                    </div>
                  </Show>

                  {/* SubTab: Marketplace View */}
                  <Show when={pluginSubTab() === "marketplace"}>
                    <div class="space-y-3">
                      <Show when={marketplaceError()}>
                        <div class="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between gap-3">
                          <span>{t("settings.marketplaceOffline")}</span>
                          <button
                            class="px-2.5 py-1 text-[11px] font-medium rounded-md bg-[var(--color-bg-primary)] border border-[var(--color-border)] hover:bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                            onClick={() => fetchMarketplace()}
                          >
                            {t("settings.retryMarketplace")}
                          </button>
                        </div>
                      </Show>

                      <Show when={isFetchingMarketplace()}>
                        <div class="p-10 text-center text-xs text-[var(--color-text-secondary)] space-y-2">
                          <svg
                            class="w-5 h-5 mx-auto animate-spin text-[var(--color-accent)]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                          </svg>
                          <p>{t("settings.installing")}</p>
                        </div>
                      </Show>

                      <Show when={!isFetchingMarketplace()}>
                        <Show
                          when={filteredMarketplacePlugins().length > 0}
                          fallback={
                            <div class="p-8 text-center rounded-xl border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs">
                              {t("settings.noMarketplacePlugins")}
                            </div>
                          }
                        >
                          <For each={filteredMarketplacePlugins()}>
                            {(remote) => {
                              const installed = () => isPluginInstalled(remote.id);
                              const updateReady = () => isUpdateAvailable(remote);
                              const busy = () => isPluginBusy(remote.id);

                              return (
                                <div class="flex items-start justify-between gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover,var(--color-border))] transition-colors">
                                  <div class="space-y-1.5 flex-1 min-w-0">
                                    <div class="flex items-center gap-2 flex-wrap">
                                      <span class="font-semibold text-sm text-[var(--color-text-primary)]">
                                        {remote.name}
                                      </span>
                                      <span class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[var(--color-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                                        v{remote.version}
                                      </span>
                                      <span class="text-[11px] text-[var(--color-text-secondary)]">
                                        • {remote.author}
                                      </span>
                                      <Show when={installed()}>
                                        <span class="px-1.5 py-0.2 text-[10px] rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                                          {t("settings.installedBadge")}
                                        </span>
                                      </Show>
                                    </div>
                                    <p class="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                                      {remote.description}
                                    </p>
                                    <Show when={remote.tags && remote.tags.length > 0}>
                                      <div class="flex items-center gap-1.5 pt-1 flex-wrap">
                                        <For each={remote.tags}>
                                          {(tag) => (
                                            <span class="px-2 py-0.5 text-[10px] rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                                              #{tag}
                                            </span>
                                          )}
                                        </For>
                                      </div>
                                    </Show>
                                  </div>

                                  <div class="flex items-center gap-2 flex-shrink-0 pt-0.5">
                                    <Show when={!installed()}>
                                      <button
                                        class="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                                        onClick={() => installMarketplacePlugin(remote)}
                                        disabled={busy()}
                                      >
                                        {busy() ? t("settings.installing") : t("settings.installPlugin")}
                                      </button>
                                    </Show>

                                    <Show when={installed() && updateReady()}>
                                      <button
                                        class="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                                        onClick={() => updateMarketplacePlugin(remote)}
                                        disabled={busy()}
                                      >
                                        {busy() ? t("settings.updating") : `${t("settings.updatePlugin")} (v${remote.version})`}
                                      </button>
                                    </Show>

                                    <Show when={installed()}>
                                      <button
                                        class="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
                                        onClick={() => uninstallMarketplacePlugin(remote.id)}
                                        disabled={busy()}
                                        title={t("settings.uninstallPlugin")}
                                      >
                                        {busy() ? t("settings.uninstalling") : t("settings.uninstallPlugin")}
                                      </button>
                                    </Show>
                                  </div>
                                </div>
                              );
                            }}
                          </For>
                        </Show>
                      </Show>
                    </div>
                  </Show>

                  {/* Directory Tip Note */}
                  <div class="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center gap-2.5 text-xs text-[var(--color-text-secondary)]">
                    <svg
                      class="w-4 h-4 flex-shrink-0 text-[var(--color-accent)]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>{t("settings.pluginsDirectoryTip")}</span>
                  </div>
                </div>
              </Show>

              {/* Updates Settings Tab */}
              <Show when={activeTab() === "updates"}>
                <div class="space-y-5">
                  <div>
                    <h3 class="text-sm font-semibold">{t("settings.automaticUpdateChecks")}</h3>
                    <p class="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                      {t("settings.automaticUpdateChecksDescription")}
                    </p>
                  </div>
                  <div class="flex items-center justify-between gap-5 rounded-xl border border-[var(--color-border)] p-4">
                    <div>
                      <h4 class="text-sm font-semibold">{t("settings.automaticUpdateChecks")}</h4>
                      <p class="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                        {t("settings.stableChannelDescription")}
                      </p>
                    </div>
                    <button
                      class={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors ${
                        automaticUpdateChecks()
                          ? "bg-[var(--color-accent)]"
                          : "bg-[var(--color-border)]"
                      }`}
                      onClick={() => setAutomaticUpdateChecks((enabled) => !enabled)}
                      role="switch"
                      aria-checked={automaticUpdateChecks()}
                      aria-label={t("settings.automaticUpdateChecks")}
                    >
                      <span
                        class={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          automaticUpdateChecks() ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};

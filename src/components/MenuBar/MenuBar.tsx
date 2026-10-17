import { Component, createSignal, Show, onMount, onCleanup, For } from "solid-js";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import {
  currentDocument,
  displayMode,
  setDisplayMode,
  cycleDisplayMode,
} from "../../store/editor";
import {
  theme,
  setTheme,
  zenMode,
  setZenMode,
  focusMode,
  setFocusMode,
  fontSize,
  increaseFontSize,
  decreaseFontSize,
  resetFontSize,
} from "../../store/settings";
import { recentFiles, openTabs, closeTab, activeTabId } from "../../store/files";
import { dispatchFormat } from "../../lib/formatter";
import { checkForUpdates } from "../../lib/updater";
import { isMacOS } from "../../lib/platform";
import {
  minimizeWindow,
  toggleMaximizeWindow,
  closeWindow,
  isWindowMaximized,
  startDrag,
} from "../../lib/tauri/commands";
import { t, SUPPORTED_LOCALES, localeSetting, setLocale, currentLocale } from "../../i18n";
import { AboutModal } from "./AboutModal";
import { LanguageModal } from "./LanguageModal";

export interface MenuBarProps {
  homeVisible: boolean;
  sidebarOpen: boolean;
  onGoHome: () => void;
  onNewDocument: () => void;
  onOpenFile: () => void;
  onOpenFolder: () => void;
  onSaveFile: () => void;
  onExport: () => void;
  onToggleSidebar: () => void;
  onOpenQuickSwitcher: () => void;
  onOpenSearchModal: () => void;
  onOpenFindReplace: () => void;
  onOpenThemeSettings: () => void;
  onOpenSettings?: (tab?: "theme" | "plugins" | "updates") => void;
  onOpenRecent: (path: string) => void;
  onCloseTab?: () => void;
  onCloseWindow?: () => void;
}

export type MenuId = "file" | "edit" | "view" | "window" | "help" | null;

export const MenuBar: Component<MenuBarProps> = (props) => {
  const [activeMenu, setActiveMenu] = createSignal<MenuId>(null);
  const [activeSubmenu, setActiveSubmenu] = createSignal<string | null>(null);
  const [aboutOpen, setAboutOpen] = createSignal(false);
  const [isMaximized, setIsMaximized] = createSignal(false);
  const [langModalOpen, setLangModalOpen] = createSignal(false);

  const localeBadge = () => {
    const code = currentLocale();
    if (code.startsWith("zh-CN")) return "简";
    if (code.startsWith("zh-TW")) return "繁";
    if (code.startsWith("ja")) return "JA";
    if (code.startsWith("ko")) return "KO";
    if (code.startsWith("de")) return "DE";
    if (code.startsWith("fr")) return "FR";
    if (code.startsWith("es")) return "ES";
    if (code.startsWith("ru")) return "RU";
    return "EN";
  };

  const doc = () => currentDocument();
  const hasDoc = () =>
    !props.homeVisible && (doc().path !== null || doc().content.length > 0);

  const closeMenus = () => {
    setActiveMenu(null);
    setActiveSubmenu(null);
  };

  const toggleMenu = (menu: MenuId) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const handleMouseEnter = (menu: MenuId) => {
    if (activeMenu() !== null) {
      setActiveMenu(menu);
    }
  };

  // Close menus on outside click or Escape key
  const handleGlobalClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".menu-bar-container")) {
      closeMenus();
    }
  };

  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeMenus();
    }
  };

  // Check window maximized state periodically and on resize
  const updateMaximizedStatus = async () => {
    try {
      const max = await isWindowMaximized();
      setIsMaximized(max);
    } catch {
      setIsMaximized(false);
    }
  };

  onMount(() => {
    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("keydown", handleGlobalKeyDown);
    if (!isMacOS) {
      window.addEventListener("resize", updateMaximizedStatus);
      updateMaximizedStatus();
    }
  });

  onCleanup(() => {
    window.removeEventListener("click", handleGlobalClick);
    window.removeEventListener("keydown", handleGlobalKeyDown);
    if (!isMacOS) {
      window.removeEventListener("resize", updateMaximizedStatus);
    }
  });

  const handleOpenLink = async (url: string) => {
    closeMenus();
    try {
      await openUrl(url);
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleCloseActiveTab = () => {
    closeMenus();
    if (props.onCloseTab) {
      props.onCloseTab();
    } else {
      const id = activeTabId();
      if (id) closeTab(id);
    }
  };

  const handleMinimize = async () => {
    try {
      await minimizeWindow();
    } catch (e) {
      console.warn("Minimize error:", e);
    }
  };

  const handleToggleMaximize = async () => {
    try {
      await toggleMaximizeWindow();
      await updateMaximizedStatus();
    } catch (e) {
      console.warn("Maximize toggle error:", e);
    }
  };

  const handleClose = async () => {
    try {
      if (props.onCloseWindow) {
        props.onCloseWindow();
      } else {
        await closeWindow();
      }
    } catch (e) {
      console.warn("Close window error:", e);
    }
  };

  const isInteractiveTarget = (e: MouseEvent) =>
    e.target instanceof Element &&
    e.target.closest("button, [role='button'], input, textarea, a, select, .no-drag, .menu-dropdown");

  const handleStartDrag = (e: MouseEvent) => {
    // Only drag on primary left click (button 0)
    if (e.button !== 0) return;
    // Don't drag if clicking buttons, menu dropdowns, links, or inputs
    if (isInteractiveTarget(e)) return;
    startDrag().catch((err) => console.warn("startDrag error:", err));
  };

  const handleTitleBarDoubleClick = (e: MouseEvent) => {
    if (e.button !== 0 || isInteractiveTarget(e)) return;
    void handleToggleMaximize();
  };

  return (
    <>
      {/* Use one drag handler; Tauri drag attributes would also start native dragging. */}
      <header
        class={`flex items-center justify-between pr-0 text-xs no-select select-none border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex-shrink-0 z-40 relative menu-bar-container cursor-default ${
          isMacOS ? "h-9 pl-[78px]" : "h-8 pl-1.5"
        }`}
        style={{ color: "var(--color-text-secondary)" }}
        onMouseDown={handleStartDrag}
        onDblClick={isMacOS ? undefined : handleTitleBarDoubleClick}
      >
        {/* Left: App Logo & Top-Level Menus (No drag on buttons) */}
        <div class="flex items-center gap-0.5 pointer-events-auto">
          {/* Sidebar toggle */}
          <button
            class="p-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors no-drag"
            onClick={(event) => {
              event.stopPropagation();
              closeMenus();
              props.onToggleSidebar();
            }}
            title={`${t("view.toggleSidebar")} (Ctrl+Shift+B)`}
            aria-pressed={props.sidebarOpen}
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>

          {/* App Icon Mark Button */}
          <button
            class="flex items-center gap-1.5 px-2 py-1 text-[var(--color-accent)] font-semibold rounded hover:bg-[var(--color-hover)] transition-colors no-drag cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              closeMenus();
              props.onGoHome();
            }}
            title={t("welcome.title")}
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span class="text-xs font-bold tracking-tight text-[var(--color-text-primary)]">Taleno</span>
          </button>

          {/* Menu: File */}
          <div class="relative">
            <button
              class={`px-2 py-1 rounded text-xs transition-colors ${
                activeMenu() === "file"
                  ? "bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                  : "hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              }`}
              onClick={() => toggleMenu("file")}
              onMouseEnter={() => handleMouseEnter("file")}
            >
              {t("menu.file")}
            </button>

            <Show when={activeMenu() === "file"}>
              <div class="absolute left-0 top-full mt-1 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-1 shadow-xl text-[var(--color-text-primary)] text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); props.onNewDocument(); }}
                >
                  <span>{t("file.newDocument")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+N</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); props.onOpenFile(); }}
                >
                  <span>{t("file.openFile")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+O</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); props.onOpenFolder(); }}
                >
                  <span>{t("file.openFolder")}</span>
                </button>

                <Show when={recentFiles().length > 0}>
                  <div class="my-1 border-t border-[var(--color-border)]" />
                  <div class="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    {t("welcome.recentFiles")}
                  </div>
                  <For each={recentFiles().slice(0, 5)}>
                    {(file) => (
                      <button
                        class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left truncate"
                        onClick={() => { closeMenus(); props.onOpenRecent(file.path); }}
                        title={file.path}
                      >
                        <span class="truncate">{file.filename}</span>
                      </button>
                    )}
                  </For>
                </Show>

                <div class="my-1 border-t border-[var(--color-border)]" />

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); props.onSaveFile(); }}
                >
                  <span>{t("file.save")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+S</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); props.onExport(); }}
                >
                  <span>{t("file.exportHtml")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+E</kbd>
                </button>

                <div class="my-1 border-t border-[var(--color-border)]" />

                {/* Preferences Submenu */}
                <div
                  class="relative"
                  onMouseEnter={() => setActiveSubmenu("preferences")}
                >
                  <button
                    class={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left ${
                      activeSubmenu() === "preferences"
                        ? "bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                        : "hover:bg-[var(--color-hover)]"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSubmenu((prev) => (prev === "preferences" ? null : "preferences"));
                    }}
                  >
                    <span>{t("menu.preferences")}</span>
                    <span class="text-[10px] text-[var(--color-text-secondary)]">›</span>
                  </button>

                  <Show when={activeSubmenu() === "preferences"}>
                    <div
                      class="absolute left-full top-0 ml-1 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-1 shadow-xl text-[var(--color-text-primary)] text-xs z-50 animate-in fade-in zoom-in-95 duration-100"
                      onMouseEnter={() => setActiveSubmenu("preferences")}
                    >
                      <button
                        class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                        onClick={() => {
                          closeMenus();
                          if (props.onOpenSettings) props.onOpenSettings("theme");
                          else props.onOpenThemeSettings();
                        }}
                      >
                        <span>{t("settings.themeTab")}</span>
                      </button>

                      <button
                        class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                        onClick={() => {
                          closeMenus();
                          if (props.onOpenSettings) props.onOpenSettings("plugins");
                        }}
                      >
                        <span>{t("settings.pluginsTab")}</span>
                        <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+Shift+X</kbd>
                      </button>

                      <button
                        class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                        onClick={() => {
                          closeMenus();
                          if (props.onOpenSettings) props.onOpenSettings("updates");
                        }}
                      >
                        <span>{t("settings.updatesTab")}</span>
                      </button>
                    </div>
                  </Show>
                </div>

                <div class="my-1 border-t border-[var(--color-border)]" />

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40"
                  disabled={openTabs().length === 0}
                  onClick={handleCloseActiveTab}
                >
                  <span>{t("file.closeTab")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+W</kbd>
                </button>
              </div>
            </Show>
          </div>

          {/* Menu: Edit */}
          <div class="relative">
            <button
              class={`px-2 py-1 rounded text-xs transition-colors ${
                activeMenu() === "edit"
                  ? "bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                  : "hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              }`}
              onClick={() => toggleMenu("edit")}
              onMouseEnter={() => handleMouseEnter("edit")}
            >
              {t("menu.edit")}
            </button>

            <Show when={activeMenu() === "edit"}>
              <div class="absolute left-0 top-full mt-1 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-1 shadow-xl text-[var(--color-text-primary)] text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("undo"); }}
                >
                  <span>{t("edit.undo")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+Z</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("redo"); }}
                >
                  <span>{t("edit.redo")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+Y</kbd>
                </button>

                <div class="my-1 border-t border-[var(--color-border)]" />

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); props.onOpenFindReplace(); }}
                >
                  <span>{t("edit.findReplace")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+F</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); props.onOpenSearchModal(); }}
                >
                  <span>{t("sidebar.searchFiles")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+Shift+F</kbd>
                </button>

                <div class="my-1 border-t border-[var(--color-border)]" />

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("bold"); }}
                >
                  <span class="font-bold">{t("edit.bold")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+B</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("italic"); }}
                >
                  <span class="italic font-serif">{t("edit.italic")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+I</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("strikethrough"); }}
                >
                  <span class="line-through">{t("edit.strikethrough")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+Shift+X</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("code_inline"); }}
                >
                  <span class="font-mono text-[11px]">{t("edit.codeBlock")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+`</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("paragraph"); }}
                >
                  <span>{t("edit.paragraph")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+0</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("h1"); }}
                >
                  <span class="font-semibold">{t("edit.heading1")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+1</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("h2"); }}
                >
                  <span class="font-semibold">{t("edit.heading2")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+2</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("bullet_list"); }}
                >
                  <span>{t("edit.bulletList")}</span>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("ordered_list"); }}
                >
                  <span>{t("edit.numberedList")}</span>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("task_list"); }}
                >
                  <span>{t("edit.taskList")}</span>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("blockquote"); }}
                >
                  <span>{t("edit.blockquote")}</span>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("table"); }}
                >
                  <span>{t("edit.table")}</span>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("link"); }}
                >
                  <span>{t("edit.link")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+K</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={displayMode() === "reading" || openTabs().length === 0}
                  onClick={() => { closeMenus(); dispatchFormat("image"); }}
                >
                  <span>{t("edit.image")}</span>
                </button>
              </div>
            </Show>
          </div>

          {/* Menu: View */}
          <div class="relative">
            <button
              class={`px-2 py-1 rounded text-xs transition-colors ${
                activeMenu() === "view"
                  ? "bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                  : "hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              }`}
              onClick={() => toggleMenu("view")}
              onMouseEnter={() => handleMouseEnter("view")}
            >
              {t("menu.view")}
            </button>

            <Show when={activeMenu() === "view"}>
              <div class="absolute left-0 top-full mt-1 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-1 shadow-xl text-[var(--color-text-primary)] text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); setDisplayMode("reading"); }}
                >
                  <span class={displayMode() === "reading" ? "font-semibold text-[var(--color-accent)]" : ""}>
                    {displayMode() === "reading" ? `✓ ${t("view.readingMode")}` : `  ${t("view.readingMode")}`}
                  </span>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); setDisplayMode("writing"); }}
                >
                  <span class={displayMode() === "writing" ? "font-semibold text-[var(--color-accent)]" : ""}>
                    {displayMode() === "writing" ? `✓ ${t("view.writingMode")}` : `  ${t("view.writingMode")}`}
                  </span>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); setDisplayMode("code"); }}
                >
                  <span class={displayMode() === "code" ? "font-semibold text-[var(--color-accent)]" : ""}>
                    {displayMode() === "code" ? `✓ ${t("view.codeMode")}` : `  ${t("view.codeMode")}`}
                  </span>
                </button>

                <div class="my-1 border-t border-[var(--color-border)]" />

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); props.onToggleSidebar(); }}
                >
                  <span>{t("view.toggleOutline")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+Shift+B</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); setZenMode((prev) => !prev); }}
                >
                  <span>{zenMode() ? "Exit Zen Mode (Esc)" : "Zen Mode (Fullscreen)"}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">F11</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); setFocusMode((prev) => !prev); }}
                >
                  <span>{focusMode() ? "Exit Focus Mode" : "Focus Mode"}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+Shift+D</kbd>
                </button>

                <div class="my-1 border-t border-[var(--color-border)]" />

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); increaseFontSize(); }}
                >
                  <span>Increase Font Size</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+=</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); decreaseFontSize(); }}
                >
                  <span>Decrease Font Size</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+-</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); resetFontSize(); }}
                >
                  <span>Reset Font Size ({fontSize()}px)</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+Shift+0</kbd>
                </button>

                <div class="my-1 border-t border-[var(--color-border)]" />

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); props.onOpenThemeSettings(); }}
                >
                  <span>{t("view.themeSettings")}</span>
                  <span class="text-[var(--color-text-secondary)]">›</span>
                </button>

                <div class="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  {t("statusBar.toggleTheme")}
                </div>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); setTheme("light"); }}
                >
                  <span class={theme() === "light" ? "font-semibold text-[var(--color-accent)]" : ""}>
                    {theme() === "light" ? `✓ ${t("view.lightTheme")}` : `  ${t("view.lightTheme")}`}
                  </span>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); setTheme("dark"); }}
                >
                  <span class={theme() === "dark" ? "font-semibold text-[var(--color-accent)]" : ""}>
                    {theme() === "dark" ? `✓ ${t("view.darkTheme")}` : `  ${t("view.darkTheme")}`}
                  </span>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); setTheme("system"); }}
                >
                  <span class={theme() === "system" ? "font-semibold text-[var(--color-accent)]" : ""}>
                    {theme() === "system" ? `✓ ${t("view.systemTheme")}` : `  ${t("view.systemTheme")}`}
                  </span>
                </button>
              </div>
            </Show>
          </div>

          {/* Menu: Window */}
          <div class="relative">
            <button
              class={`px-2 py-1 rounded text-xs transition-colors ${
                activeMenu() === "window"
                  ? "bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                  : "hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              }`}
              onClick={() => toggleMenu("window")}
              onMouseEnter={() => handleMouseEnter("window")}
            >
              {t("menu.window")}
            </button>

            <Show when={activeMenu() === "window"}>
              <div class="absolute left-0 top-full mt-1 w-52 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-1 shadow-xl text-[var(--color-text-primary)] text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); props.onOpenQuickSwitcher(); }}
                >
                  <span>{t("view.quickSwitcher")}</span>
                  <kbd class="text-[10px] text-[var(--color-text-secondary)] font-mono">Ctrl+P</kbd>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); props.onToggleSidebar(); }}
                >
                  <span>{t("view.toggleSidebar")}</span>
                </button>
              </div>
            </Show>
          </div>

          {/* Menu: Help */}
          <div class="relative">
            <button
              class={`px-2 py-1 rounded text-xs transition-colors ${
                activeMenu() === "help"
                  ? "bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                  : "hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              }`}
              onClick={() => toggleMenu("help")}
              onMouseEnter={() => handleMouseEnter("help")}
            >
              {t("menu.help")}
            </button>

            <Show when={activeMenu() === "help"}>
              <div class="absolute left-0 top-full mt-1 w-64 max-h-[80vh] overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-1 shadow-xl text-[var(--color-text-primary)] text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left font-medium"
                  onClick={() => handleOpenLink("https://github.com/BerryUIKI/Taleno")}
                >
                  <span class="flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <span>{t("help.github")}</span>
                  </span>
                  <svg class="w-3 h-3 text-[var(--color-text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => handleOpenLink("https://berryuiki.github.io/Taleno/")}
                >
                  <span>{t("help.website")}</span>
                  <svg class="w-3 h-3 text-[var(--color-text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => handleOpenLink("https://github.com/BerryUIKI/Taleno#readme")}
                >
                  <span>{t("help.documentation")}</span>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); checkForUpdates(true); }}
                >
                  <span class="flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                    <span>{t("help.checkForUpdates")}</span>
                  </span>
                </button>

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => handleOpenLink("https://github.com/BerryUIKI/Taleno/issues")}
                >
                  <span>{t("help.reportIssue")}</span>
                </button>

                <div class="my-1 border-t border-[var(--color-border)]" />

                {/* Language Switcher Modal trigger under Help */}
                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left font-medium"
                  onClick={() => { closeMenus(); setLangModalOpen(true); }}
                >
                  <span class="flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span>{t("menu.language")}...</span>
                  </span>
                  <span class="text-[10px] text-[var(--color-text-secondary)] font-mono bg-[var(--color-hover)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
                    {localeSetting() === "auto" ? "Auto" : localeSetting()}
                  </span>
                </button>

                <div class="my-1 border-t border-[var(--color-border)]" />

                <button
                  class="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--color-hover)] transition-colors text-left"
                  onClick={() => { closeMenus(); setAboutOpen(true); }}
                >
                  <span>{t("help.about")}</span>
                </button>
              </div>
            </Show>
          </div>
        </div>

        {/* Center: Draggable Region with Document Title Breadcrumb */}
        <div
          class="flex-1 flex items-center justify-center h-full px-4 text-xs text-[var(--color-text-secondary)] font-medium truncate cursor-default select-none"
        >
          <div class="flex items-center gap-1.5 truncate">
            <Show
              when={hasDoc()}
              fallback={<span class="opacity-60 font-normal">Taleno</span>}
            >
              <span class="text-[var(--color-text-primary)] font-semibold truncate">
                {doc().filename}
              </span>
              <Show when={doc().isDirty}>
                <span class="text-[10px] text-[var(--color-accent)] font-bold">●</span>
              </Show>
              <span class="opacity-40 text-[10px]">&bull;</span>
              <span class="text-[11px] capitalize opacity-80">{displayMode()}</span>
            </Show>
          </div>
        </div>

        {/* Right: Quick Action Icons + Window Control Buttons (Non-draggable) */}
        <div class="flex items-center h-full pointer-events-auto flex-shrink-0">
          {/* Quick Search Palette */}
          <button
            class="p-1.5 mr-0.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            onClick={props.onOpenQuickSwitcher}
            title={`${t("view.quickSwitcher")} (Ctrl+P)`}
            aria-label={`${t("view.quickSwitcher")} (Ctrl+P)`}
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Quick Plugins Marketplace Access */}
          <button
            class="p-1.5 mr-0.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            onClick={() => props.onOpenSettings?.("plugins")}
            title={t("menu.pluginsQuick")}
            aria-label={t("menu.pluginsQuick")}
            data-menu-quick="plugins"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m7.5 4.27 9 5.15" />
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </button>

          {/* Quick Themes Settings Access */}
          <button
            class="p-1.5 mr-0.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            onClick={() => (props.onOpenSettings ? props.onOpenSettings("theme") : props.onOpenThemeSettings())}
            title={t("menu.themesQuick")}
            aria-label={t("menu.themesQuick")}
            data-menu-quick="theme"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
              <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
              <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
              <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
            </svg>
          </button>

          {/* Quick Language Selector */}
          <button
            class="flex items-center gap-1 px-1.5 py-1 mr-0.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            onClick={() => setLangModalOpen(true)}
            title={t("menu.languageQuick")}
            aria-label={t("menu.languageQuick")}
            data-menu-quick="language"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            <span class="text-[10px] font-mono font-semibold px-1 rounded bg-[var(--color-hover)] text-[var(--color-text-primary)] border border-[var(--color-border)] leading-tight">
              {localeBadge()}
            </span>
          </button>
          {/* macOS supplies native traffic-light controls in the overlay title bar. */}
          <Show when={!isMacOS}>
            <div class="flex items-center h-full">
              {/* Minimize */}
              <button
                class="w-11 h-full flex items-center justify-center hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                onClick={handleMinimize}
                title={t("window.minimize")}
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <line x1="2" y1="8" x2="14" y2="8" />
                </svg>
              </button>

              {/* Maximize / Restore */}
              <button
              class="w-11 h-full flex items-center justify-center hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              onClick={handleToggleMaximize}
              title={isMaximized() ? t("window.restore") : t("window.maximize")}
            >
              <Show
                when={isMaximized()}
                fallback={
                  <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2.5" y="2.5" width="11" height="11" rx="0.5" />
                  </svg>
                }
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M5 3.5h7.5v7.5" />
                  <rect x="3.5" y="5" width="7.5" height="7.5" rx="0.5" />
                </svg>
              </Show>
              </button>

              {/* Close */}
              <button
              class="w-11 h-full flex items-center justify-center hover:bg-[#e81123] text-[var(--color-text-secondary)] hover:text-white transition-colors"
              onClick={handleClose}
              title={t("window.close")}
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="3.5" y1="3.5" x2="12.5" y2="12.5" />
                <line x1="12.5" y1="3.5" x2="3.5" y2="12.5" />
              </svg>
              </button>
            </div>
          </Show>
        </div>
      </header>

      {/* About Modal */}
      <AboutModal isOpen={aboutOpen()} onClose={() => setAboutOpen(false)} />

      {/* Language Selection Modal */}
      <LanguageModal isOpen={langModalOpen()} onClose={() => setLangModalOpen(false)} />
    </>
  );
};

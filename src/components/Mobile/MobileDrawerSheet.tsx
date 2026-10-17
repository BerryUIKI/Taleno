import { Component, Show, For } from "solid-js";
import { currentDocument } from "../../store/editor";
import { openTabs, activeTabId, selectTab, closeTab } from "../../store/files";
import { theme, setTheme, cycleTheme, fontSize, setFontSize, markdownTheme, setMarkdownTheme } from "../../store/settings";
import { Sidebar } from "../Sidebar/Sidebar";
import { t } from "../../i18n";
import type { MobileSheetView } from "./MobileBottomNav";

interface MobileDrawerSheetProps {
  view: MobileSheetView;
  onClose: () => void;
  onOpenFile: (path: string) => Promise<void>;
  onNewDocument: () => void;
}

export const MobileDrawerSheet: Component<MobileDrawerSheetProps> = (props) => {
  const doc = () => currentDocument();
  const tabs = () => openTabs();

  const scrollToHeading = (id: string) => {
    props.onClose();
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
  };

  return (
    <Show when={props.view !== null}>
      {/* Backdrop */}
      <div
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={props.onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Container */}
      <div
        class="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] flex flex-col rounded-t-3xl shadow-2xl safe-area-bottom animate-in slide-in-from-bottom duration-250 ease-out"
        style={{
          background: "var(--color-bg-primary)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border)",
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Grabber Handle */}
        <div class="w-full pt-3 pb-1 flex justify-center cursor-pointer" onClick={props.onClose}>
          <div class="w-10 h-1 rounded-full bg-[var(--color-text-secondary)] opacity-30" />
        </div>

        {/* Sheet Header */}
        <div class="px-4 py-2 flex items-center justify-between border-b border-[var(--color-border)]">
          <h2 class="font-bold text-sm tracking-tight">
            <Show when={props.view === "files"}>
              <span>📁 {t("mobile.filesAndWorkspace")}</span>
            </Show>
            <Show when={props.view === "outline"}>
              <span>📑 {t("mobile.outlineTitle")}</span>
            </Show>
            <Show when={props.view === "settings"}>
              <span>⚙️ {t("mobile.preferencesTitle")}</span>
            </Show>
          </h2>

          <button
            class="p-1.5 rounded-full hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs"
            onClick={props.onClose}
            aria-label={t("dialogs.close")}
          >
            ✕
          </button>
        </div>

        {/* Sheet Body Content */}
        <div class="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* VIEW: Files & Open Tabs */}
          <Show when={props.view === "files"}>
            {/* Open Document Tabs Pills */}
            <Show when={tabs().length > 0}>
              <div class="space-y-1.5">
                <span class="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  {t("mobile.openDocuments")} ({tabs().length})
                </span>
                <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <For each={tabs()}>
                    {(tab) => (
                      <div
                        class={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border flex-shrink-0 cursor-pointer transition-all ${
                          tab.id === activeTabId()
                            ? "bg-[var(--color-accent)] text-white border-transparent shadow-xs"
                            : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]"
                        }`}
                        onClick={() => {
                          selectTab(tab.id);
                          props.onClose();
                        }}
                      >
                        <span class="truncate max-w-[120px]">{tab.document.filename}</span>
                        <Show when={tab.document.isDirty}>
                          <span class="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        </Show>
                        <button
                          class="hover:opacity-75 ml-0.5 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(tab.id);
                          }}
                          aria-label={t("file.closeTab")}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            {/* Workspace File Tree */}
            <div class="space-y-1.5 pt-2">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  {t("mobile.workspaceTree")}
                </span>
                <button
                  class="text-xs text-[var(--color-accent)] font-medium hover:underline"
                  onClick={() => {
                    props.onNewDocument();
                    props.onClose();
                  }}
                >
                  {t("mobile.newNote")}
                </button>
              </div>

              <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden max-h-64 overflow-y-auto">
                <Sidebar
                  onSelectFile={(path) => {
                    props.onClose();
                    props.onOpenFile(path);
                  }}
                />
              </div>
            </div>
          </Show>

          {/* VIEW: Table of Contents Outline */}
          <Show when={props.view === "outline"}>
            <Show
              when={doc().toc && doc().toc.length > 0}
              fallback={
                <div class="py-8 text-center text-xs text-[var(--color-text-secondary)]">
                  {t("mobile.noOutline")}
                </div>
              }
            >
              <div class="space-y-1">
                <For each={doc().toc}>
                  {(item) => (
                    <button
                      class="w-full text-left py-2 px-3 rounded-lg hover:bg-[var(--color-hover)] text-xs transition-colors flex items-center gap-2 group"
                      style={{
                        "padding-left": `${Math.max(12, (item.level - 1) * 16 + 12)}px`,
                      }}
                      onClick={() => scrollToHeading(item.id)}
                    >
                      <span class="text-[10px] font-bold text-[var(--color-accent)] opacity-70 group-hover:opacity-100">
                        H{item.level}
                      </span>
                      <span class="truncate font-medium text-[var(--color-text-primary)]">
                        {item.text}
                      </span>
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </Show>

          {/* VIEW: Settings & Theme */}
          <Show when={props.view === "settings"}>
            {/* Color Mode (Light / Dark / System) */}
            <div class="space-y-2">
              <span class="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                {t("mobile.colorMode")}
              </span>
              <div class="grid grid-cols-3 gap-2">
                <button
                  class={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    theme() === "light"
                      ? "bg-[var(--color-accent)] text-white border-transparent shadow-xs"
                      : "bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)]"
                  }`}
                  onClick={() => setTheme("light")}
                >
                  <span>☀️</span>
                  <span>{t("view.lightTheme")}</span>
                </button>
                <button
                  class={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    theme() === "dark"
                      ? "bg-[var(--color-accent)] text-white border-transparent shadow-xs"
                      : "bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)]"
                  }`}
                  onClick={() => setTheme("dark")}
                >
                  <span>🌙</span>
                  <span>{t("view.darkTheme")}</span>
                </button>
                <button
                  class={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    theme() === "system"
                      ? "bg-[var(--color-accent)] text-white border-transparent shadow-xs"
                      : "bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)]"
                  }`}
                  onClick={() => setTheme("system")}
                >
                  <span>⚙️</span>
                  <span>{t("view.systemTheme")}</span>
                </button>
              </div>
            </div>

            {/* Markdown Theme Presets */}
            <div class="space-y-2 pt-2">
              <span class="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                {t("mobile.markdownThemePresets")}
              </span>
              <div class="grid grid-cols-3 gap-2">
                <button
                  class={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    markdownTheme() === "Taleno"
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                  }`}
                  onClick={() => setMarkdownTheme("Taleno")}
                >
                  🌿 Taleno
                </button>
                <button
                  class={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    markdownTheme() === "github"
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                  }`}
                  onClick={() => setMarkdownTheme("github")}
                >
                  🐙 GitHub
                </button>
                <button
                  class={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    markdownTheme() === "solarized"
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                  }`}
                  onClick={() => setMarkdownTheme("solarized")}
                >
                  ☀️ Solarized
                </button>
              </div>
            </div>

            {/* Font Size Slider */}
            <div class="space-y-2 pt-2">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  {t("mobile.fontSize")}
                </span>
                <span class="text-xs font-bold text-[var(--color-accent)]">{fontSize()}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="24"
                value={fontSize()}
                onInput={(e) => setFontSize(Number(e.currentTarget.value))}
                class="w-full accent-[var(--color-accent)]"
              />
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
};

import { Component, Show, createSignal, onMount } from "solid-js";
import { currentDocument, displayMode, cycleDisplayMode } from "../../store/editor";
import { t } from "../../i18n";
import { isMobile, isMacOS } from "../../lib/platform";
import {
  minimizeWindow,
  toggleMaximizeWindow,
  closeWindow,
  isWindowMaximized,
  startDrag,
} from "../../lib/tauri/commands";

interface MobileTopBarProps {
  onOpenFiles: () => void;
  onOpenOutline: () => void;
  onOpenSettings: () => void;
  onNewDocument: () => void;
  onSaveFile?: () => void;
  onSaveFileAs?: () => void;
  onCloseWindow?: () => void;
}

export const MobileTopBar: Component<MobileTopBarProps> = (props) => {
  const doc = () => currentDocument();
  const title = () => doc().filename || "Taleno";
  const [isMaximized, setIsMaximized] = createSignal(false);

  const updateMaximizedStatus = async () => {
    if (isMobile) return;
    try {
      const max = await isWindowMaximized();
      setIsMaximized(max);
    } catch {
      // Ignore in web/test environment
    }
  };

  onMount(async () => {
    if (!isMobile) {
      await updateMaximizedStatus();
    }
  });

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
    e.target.closest("button, [role='button'], input, textarea, a, select, .no-drag");

  const handleStartDrag = (e: MouseEvent) => {
    if (isMobile || e.button !== 0) return;
    if (isInteractiveTarget(e)) return;
    startDrag().catch((err) => console.warn("startDrag error:", err));
  };

  const handleTitleBarDoubleClick = (e: MouseEvent) => {
    if (isMobile || e.button !== 0 || isInteractiveTarget(e)) return;
    void handleToggleMaximize();
  };

  return (
    <header
      class="safe-area-top flex flex-col border-b border-[var(--color-border)] select-none flex-shrink-0 z-30 cursor-default"
      style={{
        background: "var(--color-bg-secondary)",
        color: "var(--color-text-primary)",
      }}
      onMouseDown={handleStartDrag}
      onDblClick={!isMobile && !isMacOS ? handleTitleBarDoubleClick : undefined}
    >
      <div class="h-12 px-3 flex items-center justify-between gap-2">
        {/* Left: Files & Workspace Trigger */}
        <button
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] transition-colors min-w-0 max-w-[50%] no-drag"
          onClick={props.onOpenFiles}
          aria-label={t("mobile.filesAndWorkspace")}
        >
          <svg
            class="w-4 h-4 text-[var(--color-accent)] flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span class="truncate font-semibold text-xs tracking-tight text-[var(--color-text-primary)]">
            {title()}
          </span>
          <Show when={doc().isDirty}>
            <span class="w-2 h-2 rounded-full bg-[var(--color-accent)] flex-shrink-0" title={t("dialogs.unsavedCloseTitle", { filename: title() })} />
          </Show>
          <svg
            class="w-3 h-3 text-[var(--color-text-secondary)] opacity-60 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Right Actions: Mode Toggle, Touch Save, Outline, New Doc, Desktop Window Controls */}
        <div class="flex items-center gap-1 flex-shrink-0 pointer-events-auto">
          {/* Tri-state Mode Switcher */}
          <button
            class="px-2.5 py-1 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[11px] font-medium shadow-xs flex items-center gap-1 transition-all active:scale-95 no-drag"
            onClick={cycleDisplayMode}
            title={`Mode: ${displayMode()}`}
            aria-label={t("mobile.switchMode")}
          >
            <Show when={displayMode() === "reading"}>
              <span>📖</span>
              <span class="text-[10px] font-semibold text-[var(--color-text-secondary)]">
                {t("statusBar.reading")}
              </span>
            </Show>
            <Show when={displayMode() === "writing"}>
              <span>✍️</span>
              <span class="text-[10px] font-semibold text-[var(--color-accent)]">
                {t("statusBar.writing")}
              </span>
            </Show>
            <Show when={displayMode() === "code"}>
              <span>💻</span>
              <span class="text-[10px] font-semibold text-[var(--color-text-secondary)]">
                {t("statusBar.code")}
              </span>
            </Show>
          </button>

          {/* Touch-Accessible Save Button */}
          <Show when={props.onSaveFile}>
            <button
              class={`p-2 rounded-lg transition-colors touch-target flex items-center justify-center relative no-drag ${
                doc().isDirty
                  ? "text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 font-bold"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              }`}
              onClick={props.onSaveFile}
              title={doc().isDirty ? `${t("file.save")} (*)` : t("file.save")}
              aria-label={t("file.save")}
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
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <Show when={doc().isDirty}>
                <span class="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
              </Show>
            </button>
          </Show>

          {/* Outline Shortcut */}
          <button
            class="p-2 rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors touch-target no-drag"
            onClick={props.onOpenOutline}
            title={t("view.toggleOutline")}
            aria-label={t("sidebar.outline")}
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
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="15" y1="12" x2="3" y2="12" />
              <line x1="17" y1="18" x2="3" y2="18" />
            </svg>
          </button>

          {/* New Document Button */}
          <button
            class="p-2 rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors touch-target no-drag"
            onClick={props.onNewDocument}
            title={t("file.newDocument")}
            aria-label={t("file.newDocument")}
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Narrow Desktop Window Controls (Hidden on mobile devices and macOS) */}
          <Show when={!isMobile && !isMacOS}>
            <div class="flex items-center h-full ml-1 border-l border-[var(--color-border)] pl-1">
              {/* Minimize */}
              <button
                class="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors no-drag"
                onClick={handleMinimize}
                title={t("window.minimize")}
                aria-label={t("window.minimize")}
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <line x1="2" y1="8" x2="14" y2="8" />
                </svg>
              </button>

              {/* Maximize / Restore */}
              <button
                class="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors no-drag"
                onClick={handleToggleMaximize}
                title={isMaximized() ? t("window.restore") : t("window.maximize")}
                aria-label={isMaximized() ? t("window.restore") : t("window.maximize")}
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
                class="w-7 h-7 flex items-center justify-center rounded hover:bg-[#e81123] text-[var(--color-text-secondary)] hover:text-white transition-colors no-drag"
                onClick={handleClose}
                title={t("window.close")}
                aria-label={t("window.close")}
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <line x1="3.5" y1="3.5" x2="12.5" y2="12.5" />
                  <line x1="12.5" y1="3.5" x2="3.5" y2="12.5" />
                </svg>
              </button>
            </div>
          </Show>
        </div>
      </div>
    </header>
  );
};

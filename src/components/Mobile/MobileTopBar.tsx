import { Component, Show } from "solid-js";
import { currentDocument, displayMode, cycleDisplayMode } from "../../store/editor";
import { t } from "../../i18n";

interface MobileTopBarProps {
  onOpenFiles: () => void;
  onOpenOutline: () => void;
  onOpenSettings: () => void;
  onNewDocument: () => void;
}

export const MobileTopBar: Component<MobileTopBarProps> = (props) => {
  const doc = () => currentDocument();
  const title = () => doc().filename || "Taleno";

  return (
    <header
      class="safe-area-top flex flex-col border-b border-[var(--color-border)] select-none flex-shrink-0 z-30"
      style={{
        background: "var(--color-bg-secondary)",
        color: "var(--color-text-primary)",
      }}
    >
      <div class="h-12 px-3 flex items-center justify-between gap-2">
        {/* Left: Files & Workspace Trigger */}
        <button
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] transition-colors min-w-0 max-w-[60%]"
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

        {/* Right Actions: Mode Toggle, Outline, New Doc */}
        <div class="flex items-center gap-1">
          {/* Tri-state Mode Switcher */}
          <button
            class="px-2.5 py-1 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[11px] font-medium shadow-xs flex items-center gap-1 transition-all active:scale-95"
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

          {/* Outline Shortcut */}
          <button
            class="p-2 rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors touch-target"
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
            class="p-2 rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors touch-target"
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
        </div>
      </div>
    </header>
  );
};

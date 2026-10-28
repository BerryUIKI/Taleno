import { Component, Show } from "solid-js";
import { displayMode, cycleDisplayMode } from "../../store/editor";
import { t } from "../../i18n";

export type MobileSheetView = "files" | "outline" | "search" | "settings" | null;

interface MobileBottomNavProps {
  activeSheet: MobileSheetView;
  onToggleSheet: (view: MobileSheetView) => void;
}

export const MobileBottomNav: Component<MobileBottomNavProps> = (props) => {
  return (
    <nav
      class="safe-area-bottom flex flex-col border-t border-[var(--color-border)] select-none flex-shrink-0 z-30"
      style={{
        background: "var(--color-bg-secondary)",
        color: "var(--color-text-secondary)",
      }}
      aria-label={t("mobile.navigation")}
    >
      <div class="h-14 px-2 flex items-center justify-around">
        {/* 1. Files & Workspace */}
        <button
          class={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            props.activeSheet === "files"
              ? "text-[var(--color-accent)] font-semibold"
              : "hover:text-[var(--color-text-primary)]"
          }`}
          onClick={() => props.onToggleSheet(props.activeSheet === "files" ? null : "files")}
          aria-label={t("menu.file")}
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span class="text-[10px]">{t("menu.file")}</span>
        </button>

        {/* 2. Outline / TOC */}
        <button
          class={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            props.activeSheet === "outline"
              ? "text-[var(--color-accent)] font-semibold"
              : "hover:text-[var(--color-text-primary)]"
          }`}
          onClick={() => props.onToggleSheet(props.activeSheet === "outline" ? null : "outline")}
          aria-label={t("sidebar.outline")}
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="21" y1="6" x2="3" y2="6" />
            <line x1="15" y1="12" x2="3" y2="12" />
            <line x1="17" y1="18" x2="3" y2="18" />
          </svg>
          <span class="text-[10px]">{t("sidebar.outline")}</span>
        </button>

        {/* 3. Center Mode Toggle (Quick Read/Write Switch) */}
        <button
          class="flex flex-col items-center justify-center -mt-2 w-11 h-11 rounded-full bg-[var(--color-accent)] text-white shadow-md active:scale-90 transition-transform"
          onClick={cycleDisplayMode}
          title={`Mode: ${displayMode()}`}
          aria-label={t("mobile.switchMode")}
        >
          <Show when={displayMode() === "reading"}>
            <span class="text-base">📖</span>
          </Show>
          <Show when={displayMode() === "writing"}>
            <span class="text-base">✍️</span>
          </Show>
          <Show when={displayMode() === "code"}>
            <span class="text-base">💻</span>
          </Show>
        </button>

        {/* 4. Global Search */}
        <button
          class={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            props.activeSheet === "search"
              ? "text-[var(--color-accent)] font-semibold"
              : "hover:text-[var(--color-text-primary)]"
          }`}
          onClick={() => props.onToggleSheet(props.activeSheet === "search" ? null : "search")}
          aria-label={t("mobile.search")}
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span class="text-[10px]">{t("mobile.search")}</span>
        </button>

        {/* 5. Settings */}
        <button
          class={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            props.activeSheet === "settings"
              ? "text-[var(--color-accent)] font-semibold"
              : "hover:text-[var(--color-text-primary)]"
          }`}
          onClick={() => props.onToggleSheet(props.activeSheet === "settings" ? null : "settings")}
          aria-label={t("settings.title")}
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span class="text-[10px]">{t("settings.title")}</span>
        </button>
      </div>
    </nav>
  );
};

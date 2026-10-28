import { Component } from "solid-js";
import { dispatchFormat } from "../../lib/formatter";
import { t } from "../../i18n";

interface MobileFormatBarProps {
  onCloseKeyboard?: () => void;
}

export const MobileFormatBar: Component<MobileFormatBarProps> = (props) => {
  return (
    <div
      class="h-11 px-2 flex items-center gap-1 border-t border-[var(--color-border)] select-none no-select flex-shrink-0 overflow-x-auto safe-area-bottom z-30 scrollbar-none"
      style={{
        background: "var(--color-bg-secondary)",
        color: "var(--color-text-primary)",
      }}
      aria-label="Formatting Toolbar"
    >
      {/* 1. History Group */}
      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] active:scale-95 transition-all flex-shrink-0"
        onClick={() => dispatchFormat("undo")}
        title={t("edit.undo")}
        aria-label={t("edit.undo")}
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
      </button>

      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] active:scale-95 transition-all flex-shrink-0"
        onClick={() => dispatchFormat("redo")}
        title={t("edit.redo")}
        aria-label={t("edit.redo")}
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
        </svg>
      </button>

      <span class="text-[var(--color-border)] mx-0.5 flex-shrink-0">|</span>

      {/* 2. Headings Group */}
      <button
        class="px-2 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] font-bold text-xs active:scale-95 transition-all flex-shrink-0"
        onClick={() => dispatchFormat("h1")}
        title={t("edit.heading1")}
        aria-label={t("edit.heading1")}
      >
        H1
      </button>

      <button
        class="px-2 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] font-bold text-xs active:scale-95 transition-all flex-shrink-0"
        onClick={() => dispatchFormat("h2")}
        title={t("edit.heading2")}
        aria-label={t("edit.heading2")}
      >
        H2
      </button>

      <button
        class="px-2 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] font-bold text-xs active:scale-95 transition-all flex-shrink-0"
        onClick={() => dispatchFormat("h3")}
        title={t("edit.heading3")}
        aria-label={t("edit.heading3")}
      >
        H3
      </button>

      <span class="text-[var(--color-border)] mx-0.5 flex-shrink-0">|</span>

      {/* 3. Inline Marks */}
      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] font-bold text-sm active:scale-95 transition-all flex-shrink-0"
        onClick={() => dispatchFormat("bold")}
        title={t("edit.bold")}
      >
        B
      </button>

      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] italic font-serif text-sm active:scale-95 transition-all flex-shrink-0"
        onClick={() => dispatchFormat("italic")}
        title={t("edit.italic")}
      >
        I
      </button>

      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] line-through text-sm active:scale-95 transition-all flex-shrink-0"
        onClick={() => dispatchFormat("strikethrough")}
        title={t("edit.strikethrough")}
      >
        S
      </button>

      <button
        class="px-2 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] font-mono text-xs active:scale-95 transition-all flex-shrink-0"
        onClick={() => dispatchFormat("code_inline")}
        title={t("edit.codeBlock")}
      >
        &lt;/&gt;
      </button>

      <span class="text-[var(--color-border)] mx-0.5 flex-shrink-0">|</span>

      {/* 4. Lists & Checkboxes */}
      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] active:scale-95 transition-all flex-shrink-0"
        onClick={() => dispatchFormat("bullet_list")}
        title={t("edit.bulletList")}
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </button>

      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] active:scale-95 transition-all flex-shrink-0"
        onClick={() => dispatchFormat("task_list")}
        title={t("edit.taskList")}
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </button>

      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] active:scale-95 transition-all flex-shrink-0 font-serif text-sm"
        onClick={() => dispatchFormat("blockquote")}
        title={t("edit.blockquote")}
      >
        ”
      </button>

      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] active:scale-95 transition-all flex-shrink-0"
        onClick={() => dispatchFormat("table")}
        title={t("edit.table")}
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v18" />
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M3 15h18" />
        </svg>
      </button>

      {/* Dismiss keyboard if provided */}
      {props.onCloseKeyboard && (
        <button
          class="w-8 h-8 ml-auto flex items-center justify-center rounded-lg bg-[var(--color-hover)] text-[var(--color-text-secondary)] active:scale-95 transition-all flex-shrink-0"
          onClick={props.onCloseKeyboard}
          title={t("mobile.dismissKeyboard")}
          aria-label={t("mobile.dismissKeyboard")}
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  );
};

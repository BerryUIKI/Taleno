import { Component } from "solid-js";
import { currentDocument } from "../../store/editor";
import { exportDocumentWorkflow } from "../../lib/exportWorkflow";
import { reportFileError } from "../../store/fileErrors";
import { dispatchFormat } from "../../lib/formatter";
import { t } from "../../i18n";

export const EditorToolbar: Component = () => {
  const doc = () => currentDocument();

  const handleExport = async () => {
    const current = doc();
    const result = await exportDocumentWorkflow(current);
    if (result.success && result.outputPath) {
      alert(`Exported document successfully to:\n${result.outputPath}`);
    } else if (result.error) {
      reportFileError({
        type: "export",
        message: `Failed to export document: ${result.error}`,
        path: current.filename,
      });
    }
  };

  return (
    <div
      class="h-8 flex items-center px-3 gap-0.5 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs select-none no-select flex-shrink-0"
    >
      {/* Block Type Group */}
      <button
        class="px-2 py-0.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium text-[11px] transition-colors"
        onClick={() => dispatchFormat("paragraph")}
        title={`${t("edit.paragraph")} (Ctrl+0)`}
      >
        ¶ {t("edit.paragraph").split("/")[0].trim()}
      </button>

      <button
        class="px-1.5 py-0.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-bold text-[11px] transition-colors"
        onClick={() => dispatchFormat("h1")}
        title={`${t("edit.heading1")} (Ctrl+1)`}
      >
        H1
      </button>

      <button
        class="px-1.5 py-0.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold text-[11px] transition-colors"
        onClick={() => dispatchFormat("h2")}
        title={`${t("edit.heading2")} (Ctrl+2)`}
      >
        H2
      </button>

      <button
        class="px-1.5 py-0.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold text-[11px] transition-colors"
        onClick={() => dispatchFormat("h3")}
        title={`${t("edit.heading3")} (Ctrl+3)`}
      >
        H3
      </button>

      <span class="text-[var(--color-border)] mx-1">|</span>

      {/* Inline Marks Group */}
      <button
        class="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-bold transition-colors"
        onClick={() => dispatchFormat("bold")}
        title={`${t("edit.bold")} (Ctrl+B)`}
      >
        B
      </button>

      <button
        class="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] italic transition-colors font-serif"
        onClick={() => dispatchFormat("italic")}
        title={`${t("edit.italic")} (Ctrl+I)`}
      >
        I
      </button>

      <button
        class="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] line-through transition-colors"
        onClick={() => dispatchFormat("strikethrough")}
        title={`${t("edit.strikethrough")} (Ctrl+Shift+X)`}
      >
        S
      </button>

      <button
        class="px-1.5 h-6 flex items-center justify-center rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-mono text-[11px] transition-colors"
        onClick={() => dispatchFormat("code_inline")}
        title={`${t("edit.codeBlock")} (Ctrl+\`)`}
      >
        &lt;/&gt;
      </button>

      <span class="text-[var(--color-border)] mx-1">|</span>

      {/* Structure & List Group */}
      <button
        class="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        onClick={() => dispatchFormat("bullet_list")}
        title={t("edit.bulletList")}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="3" cy="6" r="1.5" fill="currentColor" />
          <circle cx="3" cy="12" r="1.5" fill="currentColor" />
          <circle cx="3" cy="18" r="1.5" fill="currentColor" />
        </svg>
      </button>

      <button
        class="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        onClick={() => dispatchFormat("ordered_list")}
        title={t("edit.numberedList")}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="10" y1="6" x2="21" y2="6" />
          <line x1="10" y1="12" x2="21" y2="12" />
          <line x1="10" y1="18" x2="21" y2="18" />
          <path d="M4 6h2v4M4 10h4M4 14h3a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H4a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h4" />
        </svg>
      </button>

      <button
        class="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        onClick={() => dispatchFormat("task_list")}
        title={t("edit.taskList")}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </button>

      <button
        class="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        onClick={() => dispatchFormat("blockquote")}
        title={t("edit.blockquote")}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2 1 0 1 0 1 1 0 2-2 4-2 7z" />
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2 1 0 1 0 1 1 0 2-2 4-2 7z" />
        </svg>
      </button>

      <button
        class="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        onClick={() => dispatchFormat("table")}
        title={t("edit.table")}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      </button>

      <span class="text-[var(--color-border)] mx-1">|</span>

      {/* Media & Links */}
      <button
        class="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        onClick={() => dispatchFormat("link")}
        title={`${t("edit.link")} (Ctrl+K)`}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>

      <button
        class="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        onClick={() => dispatchFormat("image")}
        title={t("edit.image")}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </button>

      <div class="flex-1" />

      {/* Export Button */}
      <button
        class="px-2 py-0.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1.5 font-medium text-[11px]"
        onClick={handleExport}
        title={t("file.exportHtml")}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span>{t("file.exportAs")}</span>
      </button>
    </div>
  );
};

import { Component, For, Show } from "solid-js";
import type { TocEntry } from "../../store/editor";
import { navigateToHeading } from "../../lib/headingNavigation";
import { t } from "../../i18n";

export interface TocSidebarProps {
  toc: TocEntry[];
}

export const TocSidebar: Component<TocSidebarProps> = (props) => {

  return (
    <div class="flex flex-col h-full">
      {/* Header */}
      <div
        class="px-3 py-2.5 flex-shrink-0 flex items-center justify-between"
        style={{ "border-bottom": "1px solid var(--color-border)" }}
      >
        <div class="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
          <svg class="w-3.5 h-3.5 text-[var(--color-text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span>{t("sidebar.outline")}</span>
        </div>
        <span class="text-[11px] text-[var(--color-text-secondary)] font-medium">
          {props.toc.length} {t("sidebar.sectionsCount")}
        </span>
      </div>

      {/* TOC entries */}
      <div class="min-h-0 overflow-y-auto py-2 px-1">
        <Show
          when={props.toc.length > 0}
          fallback={
            <div class="px-3 py-6 text-center text-xs text-[var(--color-text-secondary)] italic">
              {t("sidebar.noHeadings")}
            </div>
          }
        >
          <For each={props.toc}>
            {(entry, idx) => (
              <button
                class="block w-full text-left px-2.5 py-1.5 rounded-md truncate transition-colors hover:bg-[var(--color-hover)] group"
                style={{
                  "padding-left": `${0.5 + (entry.level - 1) * 0.75}rem`,
                  color:
                    entry.level === 1
                      ? "var(--color-text-primary)"
                      : "var(--color-text-secondary)",
                  "font-weight": entry.level <= 2 ? "600" : "400",
                  "font-size": entry.level === 1 ? "0.8125rem" : "0.75rem",
                }}
                onClick={() => navigateToHeading(entry, idx())}
                title={entry.text}
              >
                <div class="flex items-center gap-1.5 truncate">
                  <span class="text-[10px] opacity-40 font-mono flex-shrink-0">
                    H{entry.level}
                  </span>
                  <span class="truncate group-hover:text-[var(--color-text-primary)]">
                    {entry.text}
                  </span>
                </div>
              </button>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};

import { Component, For, Show } from "solid-js";
import { openTabs, activeTabId, closeTab, selectTab } from "../../store/files";

export interface TabBarProps {
  onNewTab: () => void;
  onSelectTab?: () => void;
  onCloseTab?: (tabId: string) => void;
  isDragOver?: boolean;
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
}

export const TabBar: Component<TabBarProps> = (props) => {
  let lastNewTabTime = 0;
  let tabElements: HTMLDivElement[] = [];

  const handleSelectTab = (tabId: string) => {
    if (selectTab(tabId)) {
      props.onSelectTab?.();
    }
  };

  const handleCreateNewTab = () => {
    const now = Date.now();
    // Guard against multiple events in rapid succession (guarantees exactly 1 tab per double click)
    if (now - lastNewTabTime < 400) return;
    lastNewTabTime = now;
    props.onNewTab();
  };

  const handleTabKeyDown = (e: KeyboardEvent, currentIdx: number, tabId: string) => {
    const tabs = openTabs();
    if (tabs.length === 0) return;

    let targetIdx = -1;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      targetIdx = (currentIdx + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      targetIdx = (currentIdx - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      targetIdx = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      targetIdx = tabs.length - 1;
    } else if (e.key === "Delete" || (e.key === "w" && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      if (props.onCloseTab) {
        props.onCloseTab(tabId);
      } else {
        closeTab(tabId);
      }
      return;
    }

    if (targetIdx !== -1 && tabs[targetIdx]) {
      handleSelectTab(tabs[targetIdx].id);
      tabElements[targetIdx]?.focus();
    }
  };

  return (
    <div
      ref={props.ref}
      data-tab-bar="true"
      role="tablist"
      aria-label="Document tabs"
      class="h-9 flex items-center bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] overflow-x-auto select-none no-select flex-shrink-0 transition-colors relative"
      style={{
        "background-color": props.isDragOver
          ? "color-mix(in srgb, var(--color-accent) 15%, var(--color-bg-secondary))"
          : "var(--color-bg-secondary)",
        "outline": props.isDragOver ? "2px dashed var(--color-accent)" : "none",
        "outline-offset": "-2px",
      }}
      onDblClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest("[data-tab-item]") && !target.closest("button")) {
          handleCreateNewTab();
        }
      }}
    >
      <For each={openTabs()}>
        {(tab, idx) => {
          const isActive = () => activeTabId() === tab.id;
          return (
            <div
              ref={(el) => (tabElements[idx()] = el)}
              data-tab-item="true"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive()}
              tabIndex={isActive() ? 0 : -1}
              class="h-full flex items-center px-3 gap-2 border-r border-[var(--color-border)] text-xs font-medium cursor-pointer transition-colors max-w-44 truncate group focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[var(--color-accent)]"
              style={{
                background: isActive() ? "var(--color-bg-primary)" : "transparent",
                color: isActive() ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                "border-top": isActive() ? "2px solid var(--color-accent)" : "2px solid transparent",
              }}
              onClick={() => handleSelectTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, idx(), tab.id)}
            >
              <span class="truncate flex-1">{tab.document.filename}</span>

              {/* Dirty indicator */}
              <Show when={tab.document.isDirty}>
                <span class="text-[9px] text-[#e63946] font-bold" title="Unsaved changes">●</span>
              </Show>

              {/* Close button */}
              <button
                class="p-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-[var(--color-hover)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                onClick={(e) => {
                  e.stopPropagation();
                  if (props.onCloseTab) {
                    props.onCloseTab(tab.id);
                  } else {
                    closeTab(tab.id);
                  }
                }}
                title={`Close ${tab.document.filename}`}
                aria-label={`Close ${tab.document.filename}`}
              >
                ✕
              </button>
            </div>
          );
        }}
      </For>

      {/* Empty Tab Bar Area: double-click to create new document */}
      <div
        data-tab-empty="true"
        class="flex-1 h-full cursor-default select-none"
        onDblClick={(e) => {
          e.stopPropagation();
          handleCreateNewTab();
        }}
        title="Double-click to create new document"
      />

      {/* New tab button aligned to the far edge of the full-width strip */}
      <button
        class="h-full px-3 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] transition-colors flex-shrink-0"
        onClick={props.onNewTab}
        title="New Document (Ctrl+N)"
        aria-label="New Document"
      >
        +
      </button>

      {/* Drop hint when dragging over TabBar */}
      <Show when={props.isDragOver}>
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-semibold text-xs animate-pulse">
          📂 Drop here to open file in a new tab
        </div>
      </Show>
    </div>
  );
};

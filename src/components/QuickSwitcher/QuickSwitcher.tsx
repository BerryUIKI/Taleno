import { Component, createSignal, createMemo, createEffect, For, Show, onMount, onCleanup } from "solid-js";
import { openTabs, quickSwitcherOpen, setQuickSwitcherOpen, selectTab, workspaceTree } from "../../store/files";
import type { Tab } from "../../store/files";
import type { FileEntry } from "../../lib/tauri/commands";

export interface QuickSwitcherProps {
  onOpenFileByPath: (path: string) => void;
}

export type QuickSwitcherItem =
  | {
      type: "tab";
      id: string;
      title: string;
      subtitle: string;
      tab: Tab;
    }
  | {
      type: "workspaceFile";
      id: string;
      title: string;
      subtitle: string;
      path: string;
    };

function collectWorkspaceFiles(
  entry: FileEntry | null,
  openPaths: Set<string>
): { name: string; path: string }[] {
  if (!entry) return [];
  const files: { name: string; path: string }[] = [];
  const supportedExtensions = [".md", ".markdown", ".mdx", ".txt"];

  function walk(node: FileEntry) {
    if (node.is_directory) {
      if (node.children) {
        for (const child of node.children) {
          walk(child);
        }
      }
    } else {
      const isSupported = supportedExtensions.some((ext) =>
        node.name.toLowerCase().endsWith(ext)
      );
      if (isSupported && !openPaths.has(node.path)) {
        files.push({ name: node.name, path: node.path });
      }
    }
  }

  walk(entry);
  return files;
}

export const QuickSwitcher: Component<QuickSwitcherProps> = (props) => {
  const [query, setQuery] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  let inputRef!: HTMLInputElement;
  let previousActiveElement: HTMLElement | null = null;

  createEffect(() => {
    if (quickSwitcherOpen()) {
      previousActiveElement = document.activeElement as HTMLElement | null;
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef?.focus();
        inputRef?.select();
      }, 0);
    } else if (previousActiveElement) {
      previousActiveElement.focus();
      previousActiveElement = null;
    }
  });

  onCleanup(() => {
    if (previousActiveElement) {
      previousActiveElement.focus();
      previousActiveElement = null;
    }
  });

  const allItems = createMemo<QuickSwitcherItem[]>(() => {
    const tabs = openTabs();
    const openPaths = new Set(
      tabs.map((t) => t.document.path).filter((p): p is string => Boolean(p))
    );

    const tabItems: QuickSwitcherItem[] = tabs.map((t) => ({
      type: "tab",
      id: `tab-${t.id}`,
      title: t.document.filename,
      subtitle: t.document.path ?? "Unsaved",
      tab: t,
    }));

    const ws = workspaceTree();
    const wsFiles = collectWorkspaceFiles(ws, openPaths);
    const fileItems: QuickSwitcherItem[] = wsFiles.map((f) => ({
      type: "workspaceFile",
      id: `file-${f.path}`,
      title: f.name,
      subtitle: f.path,
      path: f.path,
    }));

    return [...tabItems, ...fileItems];
  });

  const filteredItems = createMemo(() => {
    const q = query().toLowerCase().trim();
    const items = allItems();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
    );
  });

  const handleSelect = (item: QuickSwitcherItem) => {
    if (item.type === "tab") {
      selectTab(item.tab.id);
    } else {
      props.onOpenFileByPath(item.path);
    }
    setQuickSwitcherOpen(false);
  };

  const scrollItemIntoView = (index: number) => {
    setTimeout(() => {
      const el = document.getElementById(`quick-switcher-option-${index}`);
      el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const items = filteredItems();
    if (e.key === "Escape") {
      e.preventDefault();
      setQuickSwitcherOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (items.length > 0) {
        const next = (selectedIndex() + 1) % items.length;
        setSelectedIndex(next);
        scrollItemIntoView(next);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length > 0) {
        const prev = (selectedIndex() - 1 + items.length) % items.length;
        setSelectedIndex(prev);
        scrollItemIntoView(prev);
      }
    } else if (e.key === "Home") {
      if (items.length > 0) {
        e.preventDefault();
        setSelectedIndex(0);
        scrollItemIntoView(0);
      }
    } else if (e.key === "End") {
      if (items.length > 0) {
        e.preventDefault();
        const last = items.length - 1;
        setSelectedIndex(last);
        scrollItemIntoView(last);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = items[selectedIndex()];
      if (current) {
        handleSelect(current);
      }
    }
  };

  return (
    <Show when={quickSwitcherOpen()}>
      <div
        class="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-xs select-none no-select"
        onClick={() => setQuickSwitcherOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Quick Switcher"
      >
        <div
          class="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Search Header */}
          <div class="p-3 border-b border-[var(--color-border)] flex items-center gap-2">
            <span class="opacity-50 text-sm">🔍</span>
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={filteredItems().length > 0}
              aria-controls="quick-switcher-list"
              aria-activedescendant={
                filteredItems().length > 0
                  ? `quick-switcher-option-${selectedIndex()}`
                  : undefined
              }
              class="w-full bg-transparent outline-none text-sm placeholder:opacity-40"
              placeholder="Search open tabs and workspace files... (Esc to close)"
              value={query()}
              onInput={(e) => {
                setQuery(e.currentTarget.value);
                setSelectedIndex(0);
              }}
            />
          </div>

          {/* Results List */}
          <div
            id="quick-switcher-list"
            role="listbox"
            aria-label="Documents and workspace files"
            class="max-h-80 overflow-y-auto p-2 space-y-1 outline-none"
            tabIndex={-1}
          >
            <Show
              when={filteredItems().length > 0}
              fallback={
                <div class="p-4 text-center text-xs opacity-50">
                  No matching files found.
                </div>
              }
            >
              <For each={filteredItems()}>
                {(item, idx) => {
                  const isSelected = () => idx() === selectedIndex();
                  return (
                    <div
                      id={`quick-switcher-option-${idx()}`}
                      role="option"
                      aria-selected={isSelected()}
                      class="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors"
                      style={{
                        background: isSelected() ? "var(--color-hover)" : "transparent",
                        color: isSelected() ? "var(--color-accent)" : "var(--color-text-primary)",
                      }}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx())}
                    >
                      <div class="flex items-center gap-2 truncate">
                        <span>{item.type === "tab" ? "📝" : "📁"}</span>
                        <span class="font-medium truncate">{item.title}</span>
                        <Show when={item.type === "workspaceFile"}>
                          <span class="text-[9px] uppercase px-1 py-0.2 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] opacity-60">
                            Workspace
                          </span>
                        </Show>
                      </div>
                      <span class="opacity-40 truncate max-w-44 text-[10px] font-mono">
                        {item.subtitle}
                      </span>
                    </div>
                  );
                }}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

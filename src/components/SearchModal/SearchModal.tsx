import { Component, createSignal, createEffect, For, Show, onMount, onCleanup } from "solid-js";
import { workspaceTree } from "../../store/files";
import type { SearchMatch } from "../../lib/tauri/commands";
import { searchWorkspace } from "../../lib/tauri/commands";

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (filePath: string, lineNumber?: number, lineContent?: string) => void;
}

export const SearchModal: Component<SearchModalProps> = (props) => {
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<SearchMatch[]>([]);
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [isSearching, setIsSearching] = createSignal(false);

  let inputRef!: HTMLInputElement;
  let previousActiveElement: HTMLElement | null = null;
  let currentRequestId = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const cancelPendingSearch = () => {
    currentRequestId++;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    setIsSearching(false);
  };

  createEffect(() => {
    if (props.isOpen) {
      previousActiveElement = document.activeElement as HTMLElement | null;
      setTimeout(() => {
        inputRef?.focus();
        inputRef?.select();
      }, 0);
    } else {
      cancelPendingSearch();
      if (previousActiveElement) {
        previousActiveElement.focus();
        previousActiveElement = null;
      }
    }
  });

  onCleanup(() => {
    cancelPendingSearch();
    if (previousActiveElement) {
      previousActiveElement.focus();
      previousActiveElement = null;
    }
  });

  const handleSearch = (val: string) => {
    setQuery(val);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    const reqId = ++currentRequestId;
    const ws = workspaceTree();

    if (!val.trim() || !ws?.path) {
      setResults([]);
      setIsSearching(false);
      setSelectedIndex(0);
      return;
    }

    setIsSearching(true);
    debounceTimer = setTimeout(async () => {
      if (reqId !== currentRequestId || !props.isOpen) return;

      try {
        const matches = await searchWorkspace(val, ws.path);
        // Only accept response if request identity matches and dialog is still open
        if (reqId === currentRequestId && props.isOpen) {
          setResults(matches);
          setSelectedIndex(0);
        }
      } catch (err) {
        if (reqId === currentRequestId) {
          console.error("Workspace search error:", err);
          setResults([]);
        }
      } finally {
        if (reqId === currentRequestId) {
          setIsSearching(false);
        }
      }
    }, 150);
  };

  const handleSelectCurrent = () => {
    const list = results();
    if (list.length === 0) return;
    const idx = Math.min(Math.max(0, selectedIndex()), list.length - 1);
    const item = list[idx];
    if (item) {
      props.onSelectResult(item.file_path, item.line_number, item.line_content);
      props.onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      props.onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const len = results().length;
      if (len > 0) {
        setSelectedIndex((prev) => (prev + 1) % len);
        scrollItemIntoView((selectedIndex() + 1) % len);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const len = results().length;
      if (len > 0) {
        setSelectedIndex((prev) => (prev - 1 + len) % len);
        scrollItemIntoView((selectedIndex() - 1 + len) % len);
      }
    } else if (e.key === "Home") {
      if (results().length > 0) {
        e.preventDefault();
        setSelectedIndex(0);
        scrollItemIntoView(0);
      }
    } else if (e.key === "End") {
      if (results().length > 0) {
        e.preventDefault();
        const lastIdx = results().length - 1;
        setSelectedIndex(lastIdx);
        scrollItemIntoView(lastIdx);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelectCurrent();
    }
  };

  const scrollItemIntoView = (index: number) => {
    setTimeout(() => {
      const itemEl = document.getElementById(`workspace-search-option-${index}`);
      itemEl?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 0);
  };

  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/45 backdrop-blur-xs select-none no-select"
        onClick={props.onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Workspace Search"
      >
        <div
          class="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex flex-col max-h-[70vh]"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div class="p-4 border-b border-[var(--color-border)] flex items-center gap-3">
            <span class="text-base opacity-60">🔎</span>
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={results().length > 0}
              aria-controls="workspace-search-results"
              aria-activedescendant={
                results().length > 0 ? `workspace-search-option-${selectedIndex()}` : undefined
              }
              class="w-full bg-transparent outline-none text-sm placeholder:opacity-40"
              placeholder="Search across all workspace Markdown files... (Esc to close)"
              value={query()}
              onInput={(e) => handleSearch(e.currentTarget.value)}
            />
            <Show when={isSearching()}>
              <span class="text-xs opacity-50 animate-pulse whitespace-nowrap">Searching...</span>
            </Show>
          </div>

          {/* Results List */}
          <div
            id="workspace-search-results"
            role="listbox"
            aria-label="Workspace search results"
            class="flex-1 overflow-y-auto p-3 space-y-2 outline-none"
            tabIndex={-1}
          >
            <Show
              when={results().length > 0}
              fallback={
                <div class="p-8 text-center text-xs opacity-40">
                  {query()
                    ? isSearching()
                      ? "Searching workspace..."
                      : "No matching results found in workspace."
                    : "Type a search keyword to find across files..."}
                </div>
              }
            >
              <div class="text-xs opacity-50 px-2 mb-1">
                Found {results().length} match{results().length === 1 ? "" : "es"}
              </div>

              <For each={results()}>
                {(item, idx) => {
                  const isSelected = () => idx() === selectedIndex();
                  return (
                    <div
                      id={`workspace-search-option-${idx()}`}
                      role="option"
                      aria-selected={isSelected()}
                      class={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected()
                          ? "border-[var(--color-accent)] bg-[var(--color-hover)] shadow-sm"
                          : "border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-hover)]"
                      }`}
                      onClick={() => {
                        props.onSelectResult(item.file_path, item.line_number, item.line_content);
                        props.onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx())}
                    >
                      <div class="flex items-center justify-between text-xs mb-1">
                        <div class="flex items-center gap-1.5 font-semibold text-[var(--color-accent)]">
                          <span>📄</span>
                          <span>{item.file_name}</span>
                        </div>
                        <span class="text-[10px] opacity-40 font-mono">
                          Line {item.line_number}
                        </span>
                      </div>

                      <div class="font-mono text-xs opacity-80 pl-5 truncate bg-[var(--color-bg-secondary)] p-1.5 rounded-md">
                        {item.line_content}
                      </div>
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

import { Component, createSignal, For, Show, onMount } from "solid-js";
import { workspaceTree } from "../../store/files";
import type { SearchMatch } from "../../lib/tauri/commands";
import { searchWorkspace } from "../../lib/tauri/commands";

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (filePath: string) => void;
}

export const SearchModal: Component<SearchModalProps> = (props) => {
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<SearchMatch[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [isTruncated, setIsTruncated] = createSignal(false);
  let inputRef!: HTMLInputElement;

  const handleSearch = async (val: string) => {
    setQuery(val);
    const ws = workspaceTree();
    if (!val.trim() || !ws?.path) {
      setResults([]);
      setIsTruncated(false);
      return;
    }

    setIsSearching(true);
    try {
      const searchRes = await searchWorkspace(val, ws.path);
      setResults(searchRes.matches);
      setIsTruncated(searchRes.truncated);
    } catch (err) {
      console.error("Workspace search error:", err);
      setResults([]);
      setIsTruncated(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      props.onClose();
    }
  };

  onMount(() => {
    inputRef?.focus();
  });

  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/45 backdrop-blur-xs select-none no-select"
        onClick={props.onClose}
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
              class="w-full bg-transparent outline-none text-sm placeholder:opacity-40"
              placeholder="Search across all workspace Markdown files... (Esc to close)"
              value={query()}
              onInput={(e) => handleSearch(e.currentTarget.value)}
            />
            <Show when={isSearching()}>
              <span class="text-xs opacity-50 animate-pulse">Searching...</span>
            </Show>
          </div>

          {/* Results List */}
          <div class="flex-1 overflow-y-auto p-3 space-y-2">
            <Show
              when={results().length > 0}
              fallback={
                <div class="p-8 text-center text-xs opacity-40">
                  {query()
                    ? "No matching results found in workspace."
                    : "Type a search keyword to find across files..."}
                </div>
              }
            >
              <div class="text-xs opacity-50 px-2 mb-1 flex items-center justify-between">
                <span>
                  Found {results().length} match{results().length === 1 ? "" : "es"}
                </span>
                <Show when={isTruncated()}>
                  <span class="text-[11px] text-amber-500 font-medium">
                    (Results capped at 100 matches)
                  </span>
                </Show>
              </div>

              <For each={results()}>
                {(item) => (
                  <div
                    class="p-2.5 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-hover)] cursor-pointer transition-all group"
                    onClick={() => {
                      props.onSelectResult(item.file_path);
                      props.onClose();
                    }}
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
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

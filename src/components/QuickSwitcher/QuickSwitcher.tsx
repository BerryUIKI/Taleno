import { Component, createSignal, createMemo, For, Show, onMount } from "solid-js";
import { openTabs, quickSwitcherOpen, setQuickSwitcherOpen, selectTab } from "../../store/files";
import type { Tab } from "../../store/files";
import { pluginRuntime, type PluginCommand } from "../../lib/plugins/runtime";

export interface QuickSwitcherProps {
  onOpenFileByPath: (path: string) => void;
}

export type QuickSwitcherItem =
  | { type: "tab"; tab: Tab }
  | { type: "command"; command: PluginCommand };

export const QuickSwitcher: Component<QuickSwitcherProps> = (_props) => {
  const [query, setQuery] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  let inputRef!: HTMLInputElement;

  const filteredItems = createMemo<QuickSwitcherItem[]>(() => {
    const q = query().toLowerCase().trim();
    const tabs = openTabs();
    const commands = pluginRuntime.getRegisteredCommands();

    const tabItems: QuickSwitcherItem[] = tabs
      .filter(
        (t) =>
          !q ||
          t.document.filename.toLowerCase().includes(q) ||
          (t.document.path && t.document.path.toLowerCase().includes(q))
      )
      .map((tab) => ({ type: "tab", tab }));

    const commandItems: QuickSwitcherItem[] = commands
      .filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.shortcut && c.shortcut.toLowerCase().includes(q))
      )
      .map((command) => ({ type: "command", command }));

    return [...tabItems, ...commandItems];
  });

  const handleSelect = (item: QuickSwitcherItem) => {
    if (item.type === "tab") {
      selectTab(item.tab.id);
    } else {
      try {
        item.command.run();
      } catch (err) {
        console.error(`[PluginCommand] Execution error for ${item.command.id}:`, err);
      }
    }
    setQuickSwitcherOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuickSwitcherOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, Math.max(0, filteredItems().length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const items = filteredItems();
      if (items[selectedIndex()]) {
        handleSelect(items[selectedIndex()]);
      }
    }
  };

  onMount(() => {
    inputRef?.focus();
  });

  return (
    <Show when={quickSwitcherOpen()}>
      <div
        class="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-xs"
        onClick={() => setQuickSwitcherOpen(false)}
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
              class="w-full bg-transparent outline-none text-sm placeholder:opacity-40"
              placeholder="Search open documents or plugin commands... (Esc to close)"
              value={query()}
              onInput={(e) => {
                setQuery(e.currentTarget.value);
                setSelectedIndex(0);
              }}
            />
          </div>

          {/* Results List */}
          <div class="max-h-80 overflow-y-auto p-2">
            <Show
              when={filteredItems().length > 0}
              fallback={
                <div class="p-4 text-center text-xs opacity-50">
                  No matching files or commands found.
                </div>
              }
            >
              <For each={filteredItems()}>
                {(item, idx) => {
                  const isSelected = () => idx() === selectedIndex();
                  return (
                    <div
                      class="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors"
                      style={{
                        background: isSelected() ? "var(--color-hover)" : "transparent",
                        color: isSelected() ? "var(--color-accent)" : "var(--color-text-primary)",
                      }}
                      onClick={() => handleSelect(item)}
                    >
                      {item.type === "tab" ? (
                        <>
                          <div class="flex items-center gap-2 truncate">
                            <span>📝</span>
                            <span class="font-medium truncate">{item.tab.document.filename}</span>
                          </div>
                          <span class="opacity-40 truncate max-w-40 text-[10px]">
                            {item.tab.document.path ?? "Unsaved"}
                          </span>
                        </>
                      ) : (
                        <>
                          <div class="flex items-center gap-2 truncate">
                            <span class="px-1.5 py-0.5 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-mono text-[9px] font-semibold border border-[var(--color-accent)]/20 uppercase tracking-wider">
                              Plugin
                            </span>
                            <span class="font-medium truncate">{item.command.title}</span>
                          </div>
                          <Show when={item.command.shortcut}>
                            <span class="px-1.5 py-0.5 rounded bg-[var(--color-hover)] border border-[var(--color-border)] text-[10px] font-mono opacity-70">
                              {item.command.shortcut}
                            </span>
                          </Show>
                        </>
                      )}
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

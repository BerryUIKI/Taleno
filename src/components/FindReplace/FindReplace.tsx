import { Component, createSignal, createMemo, createEffect, Show, onMount, onCleanup } from "solid-js";
import { currentDocument, updateDocumentContent } from "../../store/editor";
import { revealMatchAt } from "../../lib/formatter";

export interface FindReplaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface MatchEntry {
  start: number;
  end: number;
  matchedText: string;
}

export const FindReplace: Component<FindReplaceProps> = (props) => {
  const [findQuery, setFindQuery] = createSignal("");
  const [replaceQuery, setReplaceQuery] = createSignal("");
  const [caseSensitive, setCaseSensitive] = createSignal(false);
  const [useRegex, setUseRegex] = createSignal(false);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [regexError, setRegexError] = createSignal<string | null>(null);

  let findInputRef!: HTMLInputElement;
  let previousActiveElement: HTMLElement | null = null;

  createEffect(() => {
    if (props.isOpen) {
      previousActiveElement = document.activeElement as HTMLElement | null;
      setTimeout(() => {
        findInputRef?.focus();
        findInputRef?.select();
      }, 0);
    } else if (previousActiveElement) {
      previousActiveElement.focus();
      previousActiveElement = null;
    }
  });

  const matches = createMemo<MatchEntry[]>(() => {
    const q = findQuery();
    if (!q) {
      setRegexError(null);
      return [];
    }

    const text = currentDocument().content;
    const results: MatchEntry[] = [];

    if (useRegex()) {
      try {
        const flags = caseSensitive() ? "g" : "gi";
        const re = new RegExp(q, flags);
        setRegexError(null);

        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
          results.push({
            start: m.index,
            end: m.index + m[0].length,
            matchedText: m[0],
          });
          // Prevent infinite loops on zero-width assertions (e.g. ^, $, \b)
          if (m.index === re.lastIndex) {
            re.lastIndex++;
          }
        }
      } catch (err: any) {
        setRegexError(err?.message || "Invalid regular expression");
        return [];
      }
    } else {
      setRegexError(null);
      const searchText = caseSensitive() ? text : text.toLowerCase();
      const searchQ = caseSensitive() ? q : q.toLowerCase();
      let pos = 0;
      while ((pos = searchText.indexOf(searchQ, pos)) !== -1) {
        results.push({
          start: pos,
          end: pos + q.length,
          matchedText: text.substring(pos, pos + q.length),
        });
        pos += Math.max(1, q.length);
      }
    }

    return results;
  });

  // Clamp current index when match list changes
  createEffect(() => {
    const total = matches().length;
    if (total === 0) {
      setCurrentIndex(0);
    } else if (currentIndex() >= total) {
      setCurrentIndex(total - 1);
    }
  });

  const handleRevealCurrent = (index: number) => {
    const list = matches();
    if (list.length === 0 || index < 0 || index >= list.length) return;
    const match = list[index];
    revealMatchAt(match.start, match.end);
  };

  const handleNext = () => {
    const total = matches().length;
    if (total === 0) return;
    const next = (currentIndex() + 1) % total;
    setCurrentIndex(next);
    handleRevealCurrent(next);
  };

  const handlePrev = () => {
    const total = matches().length;
    if (total === 0) return;
    const prev = (currentIndex() - 1 + total) % total;
    setCurrentIndex(prev);
    handleRevealCurrent(prev);
  };

  const computeSingleReplacement = (matchedText: string, replPattern: string): string => {
    if (!useRegex()) {
      return replPattern;
    }
    try {
      const flags = caseSensitive() ? "" : "i";
      const singleRe = new RegExp(findQuery(), flags);
      return matchedText.replace(singleRe, replPattern);
    } catch {
      return replPattern;
    }
  };

  const handleReplaceOne = () => {
    const m = matches();
    if (m.length === 0) return;
    const idx = Math.min(currentIndex(), m.length - 1);
    const current = m[idx];
    const text = currentDocument().content;

    const replacementText = computeSingleReplacement(current.matchedText, replaceQuery());

    const newText =
      text.substring(0, current.start) +
      replacementText +
      text.substring(current.end);

    updateDocumentContent(newText);

    // After replacement, reveal next match if any remain
    setTimeout(() => {
      const updatedMatches = matches();
      if (updatedMatches.length > 0) {
        const nextIdx = Math.min(idx, updatedMatches.length - 1);
        setCurrentIndex(nextIdx);
        handleRevealCurrent(nextIdx);
      }
    }, 0);
  };

  const handleReplaceAll = () => {
    const q = findQuery();
    if (!q) return;
    const text = currentDocument().content;

    try {
      let newText: string;
      if (useRegex()) {
        const flags = caseSensitive() ? "g" : "gi";
        const re = new RegExp(q, flags);
        newText = text.replace(re, replaceQuery());
      } else {
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const flags = caseSensitive() ? "g" : "gi";
        const re = new RegExp(escaped, flags);
        // Replace with string literal without special dollar expansions for plain mode
        newText = text.replace(re, () => replaceQuery());
      }
      updateDocumentContent(newText);
    } catch (err) {
      console.error("Replace all error:", err);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      props.onClose();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      handlePrev();
    }
  };

  onCleanup(() => {
    if (previousActiveElement) {
      previousActiveElement.focus();
      previousActiveElement = null;
    }
  });

  return (
    <Show when={props.isOpen}>
      <div
        class="absolute top-3 right-6 z-30 p-2.5 rounded-xl shadow-2xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-xs flex flex-col gap-2 select-none no-select max-w-[calc(100vw-3rem)] w-84 animate-in fade-in slide-in-from-top-2"
        onKeyDown={handleKeyDown}
      >
        {/* Find Row */}
        <div class="flex items-center gap-1.5">
          <div
            class={`flex-1 flex items-center bg-[var(--color-bg-secondary)] rounded-md border px-2 py-1 transition-colors ${
              regexError() ? "border-red-500/70 bg-red-500/5" : "border-[var(--color-border)]"
            }`}
          >
            <span class="opacity-40 mr-1.5">🔍</span>
            <input
              ref={findInputRef}
              type="text"
              class="w-full bg-transparent outline-none text-xs"
              placeholder="Find..."
              value={findQuery()}
              onInput={(e) => {
                setFindQuery(e.currentTarget.value);
                setCurrentIndex(0);
                setTimeout(() => handleRevealCurrent(0), 0);
              }}
            />
            {/* Match Counter */}
            <span class="opacity-50 text-[10px] whitespace-nowrap pl-1">
              {matches().length > 0
                ? `${currentIndex() + 1}/${matches().length}`
                : findQuery()
                ? "0"
                : ""}
            </span>
          </div>

          {/* Options */}
          <button
            class="px-1.5 py-1 rounded font-mono text-[11px] transition-colors cursor-pointer"
            style={{
              background: caseSensitive() ? "var(--color-accent)" : "var(--color-hover)",
              color: caseSensitive() ? "white" : "inherit",
            }}
            onClick={() => {
              setCaseSensitive((prev) => !prev);
              setTimeout(() => handleRevealCurrent(currentIndex()), 0);
            }}
            title="Match Case (Aa)"
            aria-label="Match Case"
            aria-pressed={caseSensitive()}
          >
            Aa
          </button>
          <button
            class="px-1.5 py-1 rounded font-mono text-[11px] transition-colors cursor-pointer"
            style={{
              background: useRegex() ? "var(--color-accent)" : "var(--color-hover)",
              color: useRegex() ? "white" : "inherit",
            }}
            onClick={() => {
              setUseRegex((prev) => !prev);
              setTimeout(() => handleRevealCurrent(currentIndex()), 0);
            }}
            title="Use Regular Expression (.*)"
            aria-label="Use Regular Expression"
            aria-pressed={useRegex()}
          >
            .*
          </button>

          {/* Navigation buttons */}
          <button
            class="p-1 rounded hover:bg-[var(--color-hover)] cursor-pointer"
            onClick={handlePrev}
            title="Previous Match (Shift+Enter)"
            aria-label="Previous Match"
          >
            ▲
          </button>
          <button
            class="p-1 rounded hover:bg-[var(--color-hover)] cursor-pointer"
            onClick={handleNext}
            title="Next Match (Enter)"
            aria-label="Next Match"
          >
            ▼
          </button>
          <button
            class="p-1 rounded hover:bg-[var(--color-hover)] opacity-70 hover:opacity-100 cursor-pointer"
            onClick={props.onClose}
            title="Close (Esc)"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Regex Error Indicator */}
        <Show when={regexError()}>
          <div
            data-testid="regex-error"
            class="px-2 py-1 rounded text-[11px] text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 truncate"
          >
            {regexError()}
          </div>
        </Show>

        {/* Replace Row */}
        <div class="flex items-center gap-1.5">
          <div class="flex-1 flex items-center bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border)] px-2 py-1">
            <span class="opacity-40 mr-1.5">⇄</span>
            <input
              type="text"
              class="w-full bg-transparent outline-none text-xs"
              placeholder="Replace with... (supports $1, $2, $$)"
              value={replaceQuery()}
              onInput={(e) => setReplaceQuery(e.currentTarget.value)}
            />
          </div>

          <button
            class="px-2 py-1 rounded bg-[var(--color-hover)] hover:bg-[var(--color-accent)] hover:text-white transition-colors cursor-pointer"
            onClick={handleReplaceOne}
            title="Replace single match"
          >
            Replace
          </button>
          <button
            class="px-2 py-1 rounded bg-[var(--color-hover)] hover:bg-[var(--color-accent)] hover:text-white transition-colors cursor-pointer"
            onClick={handleReplaceAll}
            title="Replace all matches"
          >
            All
          </button>
        </div>
      </div>
    </Show>
  );
};

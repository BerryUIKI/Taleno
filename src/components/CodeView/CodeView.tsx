import { Component, createMemo, createSignal, Index, onMount, onCleanup } from "solid-js";
import { currentDocument, updateDocumentContent, type TocEntry } from "../../store/editor";
import { registerCodeFormatter, registerCodeMatchRevealer, registerCodeInserter, type FormatAction } from "../../lib/formatter";
import { registerCodeHeadingRevealer } from "../../lib/headingNavigation";
import { activeTabId, openTabs } from "../../store/files";
import { fontSize } from "../../store/settings";

export interface HistorySnapshot {
  content: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface DocumentHistory {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
}

const documentHistories = new Map<string, DocumentHistory>();

export function getCodeViewHistory(docKey: string): DocumentHistory {
  let hist = documentHistories.get(docKey);
  if (!hist) {
    hist = { past: [], future: [] };
    documentHistories.set(docKey, hist);
  }
  return hist;
}

export function clearCodeViewHistory(docKey?: string) {
  if (docKey) {
    documentHistories.delete(docKey);
  } else {
    documentHistories.clear();
  }
}

/**
 * Fast non-allocating line counter counting newline characters.
 */
export function countDocumentLines(text: string): number {
  if (text.length === 0) return 1;
  let count = 1;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      count++;
    }
  }
  return count;
}

export const CodeView: Component = () => {
  let textareaRef!: HTMLTextAreaElement;
  let lineGutterRef!: HTMLDivElement;
  let isComposing = false;
  let typingTimer: ReturnType<typeof setTimeout> | null = null;

  const currentDocKey = () =>
    `${activeTabId()}:${openTabs().find(tab => tab.id === activeTabId())?.instance ?? 0}:${currentDocument().loadVersion ?? 0}`;

  const recordSnapshot = (textarea: HTMLTextAreaElement) => {
    const key = currentDocKey();
    const hist = getCodeViewHistory(key);
    const snapshot: HistorySnapshot = {
      content: textarea.value,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd,
    };
    const last = hist.past[hist.past.length - 1];
    if (!last || last.content !== snapshot.content) {
      hist.past.push(snapshot);
      if (hist.past.length > 100) {
        hist.past.shift();
      }
    }
    hist.future = [];
  };

  const performUndo = (textarea: HTMLTextAreaElement): boolean => {
    if (typingTimer) clearTimeout(typingTimer);
    typingTimer = null;
    const key = currentDocKey();
    const hist = getCodeViewHistory(key);
    if (hist.past.length === 0) return false;

    const currentSnapshot: HistorySnapshot = {
      content: textarea.value,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd,
    };
    hist.future.push(currentSnapshot);

    const prev = hist.past.pop()!;
    textarea.value = prev.content;
    textarea.setSelectionRange(prev.selectionStart, prev.selectionEnd);
    textarea.focus();
    updateDocumentContent(prev.content);
    return true;
  };

  const performRedo = (textarea: HTMLTextAreaElement): boolean => {
    if (typingTimer) clearTimeout(typingTimer);
    typingTimer = null;
    const key = currentDocKey();
    const hist = getCodeViewHistory(key);
    if (hist.future.length === 0) return false;

    const currentSnapshot: HistorySnapshot = {
      content: textarea.value,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd,
    };
    hist.past.push(currentSnapshot);

    const next = hist.future.pop()!;
    textarea.value = next.content;
    textarea.setSelectionRange(next.selectionStart, next.selectionEnd);
    textarea.focus();
    updateDocumentContent(next.content);
    return true;
  };

  const revealHeadingInCode = (_entry: TocEntry, index: number): boolean => {
    const textarea = textareaRef;
    if (!textarea) return false;

    const sourceLine = _entry.source_line;
    if (sourceLine !== undefined) {
      let offset = 0;
      for (let line = 0; line < sourceLine; line++) {
        const next = textarea.value.indexOf("\n", offset);
        if (next < 0) return false;
        offset = next + 1;
      }
      const end = textarea.value.indexOf("\n", offset);
      textarea.focus();
      textarea.setSelectionRange(offset, end < 0 ? textarea.value.length : end);
      textarea.scrollTop = Math.max(0, sourceLine * Math.round(fontSize() * 1.5) - 60);
      return true;
    }
    return false;
  };

  const content = () => currentDocument().content;
  const lineCount = createMemo(() => countDocumentLines(content()));
  const [scrollTop, setScrollTop] = createSignal(0);
  const [viewportHeight, setViewportHeight] = createSignal(800);
  const rowHeight = () => Math.round(fontSize() * 1.5);
  const firstLine = createMemo(() => Math.max(0, Math.floor(scrollTop() / rowHeight()) - 8));
  const lineNumbers = createMemo(() => {
    const start = Math.min(firstLine(), Math.max(0, lineCount() - 1));
    const count = Math.min(lineCount() - start, Math.ceil(viewportHeight() / rowHeight()) + 16);
    return Array.from({ length: count }, (_, i) => start + i + 1);
  });

  const handleInput = (e: InputEvent & { currentTarget: HTMLTextAreaElement }) => {
    const target = e.currentTarget;
    if (!typingTimer) {
      const key = currentDocKey();
      const hist = getCodeViewHistory(key);
      const prevContent = currentDocument().content;
      const last = hist.past[hist.past.length - 1];
      if (!last || last.content !== prevContent) {
        hist.past.push({
          content: prevContent,
          selectionStart: target.selectionStart,
          selectionEnd: target.selectionEnd,
        });
        hist.future = [];
      }
    }
    if (typingTimer) clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      typingTimer = null;
    }, 500);

    updateDocumentContent(target.value, { deferStats: true });
  };

  const handleCompositionStart = () => {
    isComposing = true;
  };

  const handleCompositionEnd = (e: CompositionEvent & { currentTarget: HTMLTextAreaElement }) => {
    isComposing = false;
    updateDocumentContent(e.currentTarget.value, { deferStats: true });
  };

  const handleScroll = (e: Event & { currentTarget: HTMLTextAreaElement }) => {
    setScrollTop(e.currentTarget.scrollTop);
    if (lineGutterRef) {
      lineGutterRef.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const executeCodeFormat = (action: FormatAction) => {
    const textarea = textareaRef;
    if (!textarea) return;

    if (action === "undo") {
      performUndo(textarea);
      return;
    }
    if (action === "redo") {
      performRedo(textarea);
      return;
    }

    recordSnapshot(textarea);

    const val = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = val.substring(start, end);

    // Helpers
    const wrapSelection = (prefix: string, suffix: string, placeholder = "text") => {
      const textToWrap = selected.length > 0 ? selected : placeholder;
      const newVal = val.substring(0, start) + prefix + textToWrap + suffix + val.substring(end);
      textarea.value = newVal;
      const newCursorStart = start + prefix.length;
      const newCursorEnd = newCursorStart + textToWrap.length;
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
      textarea.focus();
      updateDocumentContent(newVal);
    };

    const modifyCurrentLine = (modifier: (line: string) => string) => {
      const beforeCursor = val.substring(0, start);
      const lineStart = beforeCursor.lastIndexOf("\n") + 1;
      const afterCursor = val.substring(end);
      const lineEndRelative = afterCursor.indexOf("\n");
      const lineEnd = lineEndRelative === -1 ? val.length : end + lineEndRelative;

      const currentLine = val.substring(lineStart, lineEnd);
      const modifiedLine = modifier(currentLine);

      const newVal = val.substring(0, lineStart) + modifiedLine + val.substring(lineEnd);
      textarea.value = newVal;
      const diff = modifiedLine.length - currentLine.length;
      textarea.setSelectionRange(start + diff, end + diff);
      textarea.focus();
      updateDocumentContent(newVal);
    };

    switch (action) {
      case "bold":
        wrapSelection("**", "**", "Bold");
        break;
      case "italic":
        wrapSelection("*", "*", "Italic");
        break;
      case "strikethrough":
        wrapSelection("~~", "~~", "Strikethrough");
        break;
      case "code_inline":
        wrapSelection("`", "`", "code");
        break;
      case "h1":
        modifyCurrentLine((l) => `# ${l.replace(/^#+\s*/, "")}`);
        break;
      case "h2":
        modifyCurrentLine((l) => `## ${l.replace(/^#+\s*/, "")}`);
        break;
      case "h3":
        modifyCurrentLine((l) => `### ${l.replace(/^#+\s*/, "")}`);
        break;
      case "h4":
        modifyCurrentLine((l) => `#### ${l.replace(/^#+\s*/, "")}`);
        break;
      case "h5":
        modifyCurrentLine((l) => `##### ${l.replace(/^#+\s*/, "")}`);
        break;
      case "h6":
        modifyCurrentLine((l) => `###### ${l.replace(/^#+\s*/, "")}`);
        break;
      case "paragraph":
        modifyCurrentLine((l) => l.replace(/^(#+\s*|>\s*|-\s*\[[ xX]\]\s*|-\s*|\d+\.\s*)/, ""));
        break;
      case "blockquote":
        modifyCurrentLine((l) => (l.startsWith("> ") ? l : `> ${l}`));
        break;
      case "bullet_list":
        modifyCurrentLine((l) => (l.startsWith("- ") ? l : `- ${l}`));
        break;
      case "ordered_list":
        modifyCurrentLine((l) => (l.match(/^\d+\.\s/) ? l : `1. ${l}`));
        break;
      case "task_list":
        modifyCurrentLine((l) => (l.startsWith("- [ ] ") ? l : `- [ ] ${l}`));
        break;
      case "table": {
        const tableMd = "\n| Column 1 | Column 2 | Column 3 |\n| :--- | :--- | :--- |\n| Item 1 | Item 2 | Item 3 |\n";
        const newVal = val.substring(0, start) + tableMd + val.substring(end);
        textarea.value = newVal;
        textarea.setSelectionRange(start + tableMd.length, start + tableMd.length);
        textarea.focus();
        updateDocumentContent(newVal);
        break;
      }
      case "link":
        wrapSelection("[", "](https://example.com)", selected || "Link Text");
        break;
      case "image":
        wrapSelection("![", "](https://example.com/image.png)", selected || "Alt Text");
        break;
    }
  };

  const revealMatchInCode = (start: number, end: number, line?: number): boolean => {
    const textarea = textareaRef;
    if (!textarea) return false;

    textarea.focus();
    textarea.setSelectionRange(start, end);

    const val = textarea.value;
    const lineIndex = line !== undefined ? line - 1 : val.substring(0, start).split("\n").length - 1;
    const lineHeight = 24;
    const targetScroll = Math.max(0, lineIndex * lineHeight - textarea.clientHeight / 3);
    textarea.scrollTop = targetScroll;
    return true;
  };

  const insertTextInCode = (text: string): boolean => {
    const textarea = textareaRef;
    if (!textarea) return false;

    recordSnapshot(textarea);
    const val = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newVal = val.substring(0, start) + text + val.substring(end);
    textarea.value = newVal;
    const newCursor = start + text.length;
    textarea.setSelectionRange(newCursor, newCursor);
    textarea.focus();
    updateDocumentContent(newVal);
    return true;
  };

  onMount(() => {
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => setViewportHeight(textareaRef.clientHeight || 800));
      observer.observe(textareaRef);
      onCleanup(() => observer.disconnect());
    }
    registerCodeFormatter(executeCodeFormat);
    registerCodeMatchRevealer(revealMatchInCode);
    registerCodeInserter(insertTextInCode);
    registerCodeHeadingRevealer(revealHeadingInCode);
  });

  onCleanup(() => {
    if (typingTimer) clearTimeout(typingTimer);
    registerCodeFormatter(null);
    registerCodeMatchRevealer(null);
    registerCodeInserter(null);
    registerCodeHeadingRevealer(null);
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isComposing) return;
    const isCmd = e.ctrlKey || e.metaKey;

    if (isCmd && (e.key === "z" || e.key === "Z")) {
      e.preventDefault();
      if (e.shiftKey) {
        performRedo(textareaRef);
      } else {
        performUndo(textareaRef);
      }
      return;
    }

    if (isCmd && (e.key === "y" || e.key === "Y")) {
      e.preventDefault();
      performRedo(textareaRef);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef;
      recordSnapshot(textarea);
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const newVal = val.substring(0, start) + "  " + val.substring(end);
      textarea.value = newVal;
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      updateDocumentContent(newVal);
    }
  };

  const dynamicLineHeight = () => `${Math.round(fontSize() * 1.5)}px`;

  return (
    <div class="h-full flex overflow-hidden font-mono text-sm bg-[var(--color-editor-bg)] text-[var(--color-text-primary)]">
      {/* Line Numbers Gutter (Synced Scroll) */}
      <div
        ref={lineGutterRef}
        class="w-12 flex-shrink-0 select-none py-6 text-right pr-3 overflow-hidden text-xs opacity-40 border-r border-[var(--color-border)] bg-[var(--color-sidebar-bg)] pointer-events-none"
        aria-hidden="true"
      >
        <div style={{ height: `${lineCount() * rowHeight()}px`, position: "relative" }}>
          <div style={{ position: "absolute", top: `${(lineNumbers()[0] - 1) * rowHeight()}px`, right: "0" }}>
            <Index each={lineNumbers()}>{(line) => <div data-testid="gutter-line-number" style={{ height: dynamicLineHeight(), "line-height": dynamicLineHeight() }}>{line()}</div>}</Index>
          </div>
        </div>
      </div>

      {/* Code Textarea Area with Windows IME Caret Alignment */}
      <div class="flex-1 relative h-full overflow-hidden">
        <textarea
          ref={textareaRef}
          class="w-full h-full p-6 outline-none resize-none bg-transparent font-mono text-sm border-0 overflow-y-auto block select-text focus:ring-0 code-view-textarea"
          style={{
            "box-sizing": "border-box",
            "line-height": dynamicLineHeight(),
            "font-size": `${fontSize()}px`,
            "font-family": "Consolas, 'Cascadia Code', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
            "white-space": "pre-wrap",
            "word-break": "break-word",
            "tab-size": "2",
            "caret-color": "var(--color-accent)",
          }}
          value={content()}
          onBeforeInput={() => { if (!typingTimer) recordSnapshot(textareaRef); }}
          onInput={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder="Type raw Markdown here..."
          spellcheck={false}
          autocapitalize="off"
          autocomplete="off"
          autocorrect="off"
        />
      </div>
    </div>
  );
};

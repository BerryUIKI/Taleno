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

export const CODE_FONT_FAMILY =
  "Consolas, 'Cascadia Code', 'Fira Code', Menlo, Monaco, 'Courier New', monospace";
/** Tailwind `p-6` on both the textarea and the gutter scroll container. */
export const CODE_PADDING = 24;
const GUTTER_OVERSCAN_ROWS = 8;
const GUTTER_MAX_ROWS = 320;
/**
 * Upper bound for one monospace glyph's advance in em. When every line of an
 * ASCII document is narrower than the textarea, no line can wrap and the
 * gutter can keep using the cheap uniform row model.
 */
const WIDEST_MONO_ADVANCE_EM = 0.62;

export interface DocumentTextAnalysis {
  lineCount: number;
  /** Longest logical line measured in monospace columns (tabs count as 2). */
  maxColumns: number;
  hasNonAscii: boolean;
}

/**
 * Single-pass scan used to decide whether the textarea can soft-wrap any line.
 */
export function analyzeDocumentText(text: string): DocumentTextAnalysis {
  let lineCount = 1;
  let columns = 0;
  let maxColumns = 0;
  let hasNonAscii = false;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 10) {
      lineCount++;
      if (columns > maxColumns) maxColumns = columns;
      columns = 0;
    } else {
      if (code > 127) hasNonAscii = true;
      columns += code === 9 ? 2 : 1;
    }
  }
  if (columns > maxColumns) maxColumns = columns;
  return { lineCount, maxColumns, hasNonAscii };
}

export interface GutterLine {
  number: number;
  /** Offset from the top of the rendered gutter window, in px. */
  top: number;
  height: number;
}

export interface GutterWindowState {
  start: number;
  offsetTop: number;
  totalHeight: number;
  items: GutterLine[];
}

/**
 * Selects the virtualized slice of line numbers to render. `topOf` maps a
 * logical line index to its offset inside the scrollable content; it may
 * account for soft-wrapped lines (`measured`) or assume one row per line.
 */
export function computeGutterWindow(opts: {
  lineCount: number;
  rowHeight: number;
  scrollTop: number;
  viewportHeight: number;
  measured: boolean;
  topOf: (index: number) => number;
  totalHeight: number;
}): GutterWindowState {
  const { lineCount, rowHeight, scrollTop, viewportHeight, measured, topOf, totalHeight } = opts;
  const count = Math.max(1, lineCount);
  const overscan = GUTTER_OVERSCAN_ROWS * rowHeight;
  const viewTop = scrollTop - CODE_PADDING;
  const windowTop = Math.max(0, viewTop - overscan);
  const windowBottom = viewTop + viewportHeight + overscan;

  let start = Math.max(0, Math.min(count - 1, Math.floor(windowTop / rowHeight)));
  if (measured) {
    // Start at the line whose block contains `windowTop` (the last line that
    // begins at or above it), so a tall wrapped line spanning the viewport
    // keeps its number instead of being skipped.
    let lo = 0;
    let hi = count - 1;
    let firstAfter = count;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (topOf(mid) > windowTop) {
        firstAfter = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    start = Math.max(0, firstAfter - 1);
  }

  const offsetTop = topOf(start);
  const items: GutterLine[] = [];
  for (let i = start; i < count && items.length < GUTTER_MAX_ROWS; i++) {
    const top = topOf(i);
    const nextTop = topOf(i + 1);
    items.push({
      number: i + 1,
      top: top - offsetTop,
      height: Math.max(1, nextTop - top),
    });
    if (top > windowBottom) break;
  }
  return { start, offsetTop, totalHeight, items };
}

interface GutterMetrics {
  text: string;
  width: number;
  fontSize: number;
  rowHeight: number;
  lineCount: number;
  /** Per-line blocks of the offscreen mirror; only present in measured mode. */
  lines: string[] | null;
  lineDivs: HTMLDivElement[] | null;
  measured: boolean;
  totalHeight: number;
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
  const [scrollTop, setScrollTop] = createSignal(0);
  const [viewportHeight, setViewportHeight] = createSignal(800);
  const [layoutTick, setLayoutTick] = createSignal(0);
  const [mounted, setMounted] = createSignal(false);
  const rowHeight = () => Math.round(fontSize() * 1.5);

  // Line numbers must follow the first visual row of each logical line. Long
  // lines soft-wrap, so a fixed rowHeight per logical line drifts; when a line
  // can wrap we mirror the textarea as one offscreen block per logical line and
  // position the gutter from those measured block offsets. Only edited lines
  // are updated after the mirror is built, so typing stays cheap.
  let measureMirror: HTMLDivElement | null = null;
  let metrics: GutterMetrics | null = null;
  let normalizedCache: { source: string; normalized: string } | null = null;

  const normalizedContent = (): string => {
    const source = content();
    if (normalizedCache && normalizedCache.source === source) return normalizedCache.normalized;
    const normalized = source.includes("\r") ? source.replace(/\r\n?/g, "\n") : source;
    normalizedCache = { source, normalized };
    return normalized;
  };

  const contentWidth = createMemo(() => {
    mounted();
    layoutTick();
    const textarea = textareaRef;
    if (!textarea) return 0;
    const style = getComputedStyle(textarea);
    const paddingLeft = parseFloat(style.paddingLeft) || CODE_PADDING;
    const paddingRight = parseFloat(style.paddingRight) || CODE_PADDING;
    return Math.max(0, textarea.clientWidth - paddingLeft - paddingRight);
  });

  const ensureMeasureMirror = (): HTMLDivElement | null => {
    if (typeof document === "undefined") return null;
    if (measureMirror) return measureMirror;
    const mirror = document.createElement("div");
    mirror.setAttribute("aria-hidden", "true");
    const style = mirror.style;
    style.position = "fixed";
    style.top = "0";
    style.left = "-100000px";
    style.visibility = "hidden";
    style.pointerEvents = "none";
    style.margin = "0";
    style.padding = "0";
    style.border = "0";
    style.boxSizing = "content-box";
    style.whiteSpace = "pre-wrap";
    style.wordBreak = "break-word";
    style.tabSize = "2";
    style.direction = "ltr";
    style.fontFamily = CODE_FONT_FAMILY;
    document.body.appendChild(mirror);
    measureMirror = mirror;
    return mirror;
  };

  const setMirrorLine = (div: HTMLDivElement, line: string) => {
    // A zero-width space keeps empty lexical lines exactly one row tall.
    div.textContent = line.length > 0 ? line : "\u200b";
  };

  /**
   * Keeps the mirror's per-line blocks in sync with `nextLines`. Unchanged
   * lines are left untouched so the browser only re-shapes the edited lines.
   */
  const syncMirrorLines = (
    mirror: HTMLDivElement,
    nextLines: string[],
    previous: GutterMetrics | null
  ): HTMLDivElement[] => {
    const prevLines = previous?.measured ? previous.lines : null;
    const prevDivs = previous?.measured ? previous.lineDivs : null;
    if (!prevLines || !prevDivs) {
      const fragment = document.createDocumentFragment();
      const divs: HTMLDivElement[] = [];
      for (const line of nextLines) {
        const div = document.createElement("div");
        setMirrorLine(div, line);
        divs.push(div);
        fragment.appendChild(div);
      }
      mirror.replaceChildren(fragment);
      return divs;
    }

    const minLength = Math.min(prevLines.length, nextLines.length);
    let prefix = 0;
    while (prefix < minLength && prevLines[prefix] === nextLines[prefix]) prefix++;
    let suffix = 0;
    const maxSuffix = minLength - prefix;
    while (
      suffix < maxSuffix &&
      prevLines[prevLines.length - 1 - suffix] === nextLines[nextLines.length - 1 - suffix]
    ) {
      suffix++;
    }

    const prevMiddleCount = prevLines.length - prefix - suffix;
    const nextMiddleCount = nextLines.length - prefix - suffix;
    if (prevMiddleCount === nextMiddleCount) {
      for (let i = 0; i < nextMiddleCount; i++) {
        setMirrorLine(prevDivs[prefix + i], nextLines[prefix + i]);
      }
      return prevDivs;
    }

    const reusable: HTMLDivElement[] = [];
    for (let i = 0; i < prevMiddleCount; i++) {
      const div = prevDivs[prefix + i];
      div.remove();
      reusable.push(div);
    }
    const anchor = suffix > 0 ? prevDivs[prevDivs.length - suffix] : null;
    const middleDivs: HTMLDivElement[] = [];
    for (let i = 0; i < nextMiddleCount; i++) {
      const div = reusable[i] ?? document.createElement("div");
      setMirrorLine(div, nextLines[prefix + i]);
      mirror.insertBefore(div, anchor);
      middleDivs.push(div);
    }
    return [
      ...prevDivs.slice(0, prefix),
      ...middleDivs,
      ...prevDivs.slice(prevDivs.length - suffix),
    ];
  };

  const buildMetrics = (): GutterMetrics | null => {
    mounted();
    const textarea = textareaRef;
    if (!textarea) return null;

    const text = normalizedContent();
    const width = contentWidth();
    const font = fontSize();
    const row = rowHeight();

    if (
      metrics &&
      metrics.text === text &&
      metrics.width === width &&
      metrics.fontSize === font &&
      metrics.rowHeight === row
    ) {
      return metrics;
    }

    const previous = metrics;
    const analysis = analyzeDocumentText(text);
    const needsMeasurement =
      width > 0 &&
      (analysis.hasNonAscii || analysis.maxColumns * font * WIDEST_MONO_ADVANCE_EM > width);

    const base: GutterMetrics = {
      text,
      width,
      fontSize: font,
      rowHeight: row,
      lineCount: analysis.lineCount,
      lines: null,
      lineDivs: null,
      measured: false,
      totalHeight: analysis.lineCount * row,
    };
    metrics = base;
    if (!needsMeasurement) return base;

    const mirror = ensureMeasureMirror();
    if (!mirror) return base;

    mirror.style.width = `${width}px`;
    mirror.style.fontSize = `${font}px`;
    mirror.style.lineHeight = `${row}px`;

    const lines = text.split("\n");
    const lineDivs = syncMirrorLines(mirror, lines, previous);
    const totalHeight = mirror.offsetHeight;
    if (!(totalHeight > 0) || lineDivs.length !== lines.length) return base;

    const measured: GutterMetrics = {
      ...base,
      lineCount: lines.length,
      lines,
      lineDivs,
      measured: true,
      totalHeight,
    };
    metrics = measured;
    return measured;
  };

  const lineTop = (m: GutterMetrics, index: number): number => {
    if (!m.measured || !m.lineDivs) return index * m.rowHeight;
    if (index >= m.lineDivs.length) return m.totalHeight;
    return m.lineDivs[index].offsetTop;
  };

  const gutterWindow = createMemo(() => {
    const m = buildMetrics();
    const row = rowHeight();
    const count = m ? m.lineCount : countDocumentLines(content());
    const measured = !!(m && m.measured);
    return computeGutterWindow({
      lineCount: count,
      rowHeight: row,
      scrollTop: scrollTop(),
      viewportHeight: viewportHeight(),
      measured,
      topOf: (index) => (m && m.measured ? lineTop(m, index) : index * row),
      totalHeight: m ? m.totalHeight : count * row,
    });
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
    setMounted(true);
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        setViewportHeight(textareaRef.clientHeight || 800);
        setLayoutTick((tick) => tick + 1);
      });
      observer.observe(textareaRef);
      onCleanup(() => observer.disconnect());
    }
    let cancelled = false;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          if (!cancelled) setLayoutTick((tick) => tick + 1);
        })
        .catch(() => {});
      onCleanup(() => {
        cancelled = true;
      });
    }
    registerCodeFormatter(executeCodeFormat);
    registerCodeMatchRevealer(revealMatchInCode);
    registerCodeInserter(insertTextInCode);
    registerCodeHeadingRevealer(revealHeadingInCode);
  });

  onCleanup(() => {
    if (typingTimer) clearTimeout(typingTimer);
    measureMirror?.remove();
    measureMirror = null;
    metrics = null;
    normalizedCache = null;
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
        <div style={{ height: `${gutterWindow().totalHeight}px`, position: "relative" }}>
          <div style={{ position: "absolute", top: `${gutterWindow().offsetTop}px`, right: "0", width: "0" }}>
            <Index each={gutterWindow().items}>
              {(line) => (
                <div
                  data-testid="gutter-line-number"
                  style={{
                    position: "absolute",
                    top: `${line().top}px`,
                    right: "0",
                    height: `${line().height}px`,
                    "line-height": dynamicLineHeight(),
                  }}
                >
                  {line().number}
                </div>
              )}
            </Index>
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
            "font-family": CODE_FONT_FAMILY,
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

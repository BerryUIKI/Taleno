import { Component, createEffect, onCleanup, onMount } from "solid-js";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, placeholder } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, redo, undo } from "@codemirror/commands";
import { currentDocument, updateDocumentContent, type TocEntry } from "../../store/editor";
import { registerCodeFormatter, registerCodeMatchRevealer, registerCodeInserter, type FormatAction } from "../../lib/formatter";
import { registerCodeHeadingRevealer } from "../../lib/headingNavigation";
import { activeTabId, openTabs } from "../../store/files";

export const CODE_FONT_FAMILY =
  "Consolas, 'Cascadia Code', 'Fira Code', Menlo, Monaco, 'Courier New', monospace";

/**
 * Editor state kept per document key so undo history and selection survive tab
 * switches. CodeMirror's history lives inside `EditorState`, so the session only
 * has to retain the latest state object. States are evicted oldest first; an
 * evicted tab simply starts a new undo history the next time it is opened.
 */
const MAX_DOCUMENT_SESSIONS = 24;
const documentSessions = new Map<string, EditorState>();

export function getCodeViewSession(docKey: string): EditorState | undefined {
  return documentSessions.get(docKey);
}

export function setCodeViewSession(docKey: string, state: EditorState) {
  documentSessions.delete(docKey);
  documentSessions.set(docKey, state);
  while (documentSessions.size > MAX_DOCUMENT_SESSIONS) {
    const oldest = documentSessions.keys().next().value;
    if (oldest === undefined || oldest === docKey) break;
    documentSessions.delete(oldest);
  }
}

export function clearCodeViewSessions(docKey?: string) {
  if (docKey) {
    documentSessions.delete(docKey);
  } else {
    documentSessions.clear();
  }
}

/**
 * The exact string most recently handed to the store. Comparing against it lets
 * the store→editor effect tell an editor-originated change (nothing to do) from
 * an external one (reload, plugin, writing mode) without re-serializing the
 * whole document on every keystroke.
 */
let lastSyncedContent: string | null = null;

function syncContentFromEditor(state: EditorState) {
  const text = state.doc.toString();
  lastSyncedContent = text;
  updateDocumentContent(text, { deferStats: true });
}

const tabKeymap = {
  key: "Tab",
  preventDefault: true,
  run: (view: EditorView) => {
    const { from, to } = view.state.selection.main;
    view.dispatch({ changes: { from, to, insert: "  " }, selection: { anchor: from + 2 } });
    return true;
  },
};

const codeEditorTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--color-editor-bg)",
    color: "var(--color-text-primary)",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: CODE_FONT_FAMILY,
    fontSize: "var(--editor-font-size, 16px)",
    lineHeight: "1.5",
    tabSize: "2",
    overflow: "auto",
  },
  ".cm-content": {
    padding: "24px",
    caretColor: "var(--color-accent)",
  },
  ".cm-gutters": {
    backgroundColor: "var(--color-sidebar-bg)",
    color: "var(--color-text-secondary)",
    borderRight: "1px solid var(--color-border)",
  },
  ".cm-gutter": {
    opacity: "0.55",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 12px 0 8px",
    minWidth: "24px",
    textAlign: "right",
  },
  ".cm-placeholder": {
    color: "var(--color-text-secondary)",
    opacity: "0.6",
  },
});

const codeEditorExtensions = [
  history(),
  lineNumbers(),
  EditorView.lineWrapping,
  placeholder("Type raw Markdown here..."),
  EditorView.contentAttributes.of({
    spellcheck: "false",
    autocapitalize: "off",
    autocomplete: "off",
    autocorrect: "off",
    "aria-label": "Markdown source",
  }),
  codeEditorTheme,
  keymap.of([tabKeymap, ...defaultKeymap, ...historyKeymap]),
  EditorView.updateListener.of((update) => {
    if (update.docChanged) syncContentFromEditor(update.state);
  }),
];

function createEditorState(doc: string): EditorState {
  return EditorState.create({ doc, extensions: codeEditorExtensions });
}

export const CodeView: Component = () => {
  let hostRef!: HTMLDivElement;
  let editor: EditorView | null = null;
  // Captured at mount: by the time cleanup runs the active tab may already be
  // the next document, and its state must not be filed under that key.
  let mountedDocKey = "";

  const currentDocKey = () =>
    `${activeTabId()}:${openTabs().find(tab => tab.id === activeTabId())?.instance ?? 0}:${currentDocument().loadVersion ?? 0}`;

  const content = () => currentDocument().content;

  const executeCodeFormat = (action: FormatAction) => {
    const view = editor;
    if (!view) return;

    if (action === "undo") {
      undo(view);
      view.focus();
      return;
    }
    if (action === "redo") {
      redo(view);
      view.focus();
      return;
    }

    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);

    const wrapSelection = (prefix: string, suffix: string, placeholderText = "text") => {
      const textToWrap = selected.length > 0 ? selected : placeholderText;
      const cursorStart = from + prefix.length;
      view.dispatch({
        changes: { from, to, insert: prefix + textToWrap + suffix },
        selection: { anchor: cursorStart, head: cursorStart + textToWrap.length },
      });
      view.focus();
    };

    const modifyCurrentLine = (modifier: (line: string) => string) => {
      const doc = view.state.doc;
      const lineStart = doc.lineAt(from).from;
      const lineEnd = doc.lineAt(to).to;
      const currentLine = doc.sliceString(lineStart, lineEnd);
      const modifiedLine = modifier(currentLine);
      const diff = modifiedLine.length - currentLine.length;
      view.dispatch({
        changes: { from: lineStart, to: lineEnd, insert: modifiedLine },
        selection: { anchor: from + diff, head: to + diff },
      });
      view.focus();
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
        view.dispatch({
          changes: { from, to, insert: tableMd },
          selection: { anchor: from + tableMd.length },
        });
        view.focus();
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

  const revealMatchInCode = (start: number, end: number, _line?: number): boolean => {
    const view = editor;
    if (!view) return false;
    const length = view.state.doc.length;
    const from = Math.max(0, Math.min(start, length));
    const to = Math.max(from, Math.min(end, length));
    view.dispatch({
      selection: { anchor: from, head: to },
      effects: EditorView.scrollIntoView(from, { y: "center" }),
    });
    view.focus();
    return true;
  };

  const revealHeadingInCode = (entry: TocEntry, _index: number): boolean => {
    const view = editor;
    if (!view) return false;
    const sourceLine = entry.source_line;
    if (sourceLine === undefined || sourceLine < 0) return false;
    const doc = view.state.doc;
    if (sourceLine >= doc.lines) return false;
    const line = doc.line(sourceLine + 1);
    view.dispatch({
      selection: { anchor: line.from, head: line.to },
      effects: EditorView.scrollIntoView(line.from, { y: "start", yMargin: 60 }),
    });
    view.focus();
    return true;
  };

  const insertTextInCode = (text: string): boolean => {
    const view = editor;
    if (!view) return false;
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    });
    view.focus();
    return true;
  };

  onMount(() => {
    const initialContent = content();
    lastSyncedContent = initialContent;

    const docKey = currentDocKey();
    mountedDocKey = docKey;
    const saved = getCodeViewSession(docKey);
    const state = saved && saved.doc.toString() === initialContent ? saved : createEditorState(initialContent);
    editor = new EditorView({ state, parent: hostRef });

    registerCodeFormatter(executeCodeFormat);
    registerCodeMatchRevealer(revealMatchInCode);
    registerCodeInserter(insertTextInCode);
    registerCodeHeadingRevealer(revealHeadingInCode);
  });

  onCleanup(() => {
    if (editor) {
      setCodeViewSession(mountedDocKey, editor.state);
      editor.destroy();
      editor = null;
    }
    registerCodeFormatter(null);
    registerCodeMatchRevealer(null);
    registerCodeInserter(null);
    registerCodeHeadingRevealer(null);
  });

  // Content changed outside this editor: reload, a plugin, or another view.
  // The document is replaced wholesale and undo history restarts, mirroring the
  // old textarea behaviour where an external assignment was not undoable.
  createEffect(() => {
    const next = content();
    const view = editor;
    if (!view || next === lastSyncedContent) return;
    lastSyncedContent = next;
    if (view.state.doc.toString() === next) return;
    view.setState(createEditorState(next));
  });

  return <div ref={hostRef} class="h-full w-full overflow-hidden" data-testid="code-view" />;
};

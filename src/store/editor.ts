import { batch, createSignal, type Setter } from "solid-js";
import type { OpenFileResponse, RenderResult } from "../lib/tauri/commands";

export type DisplayMode = "reading" | "writing" | "code";

export interface TocEntry {
  level: number;
  text: string;
  id: string;
}

export interface DocumentState {
  /** Last successfully read/written Markdown, used as the save conflict baseline. */
  savedContent?: string;
  /** Changes only on explicit disk reload, to reset editor history. */
  loadVersion?: number;
  path: string | null;
  filename: string;
  content: string;
  renderedContent: string;
  html: string;
  toc: TocEntry[];
  wordCount: number;
  isDirty: boolean;
  externallyModified: boolean;
}

const emptyDocument: DocumentState = {
  path: null,
  filename: "Untitled",
  content: "",
  renderedContent: "",
  html: "",
  toc: [],
  wordCount: 0,
  isDirty: false,
  externallyModified: false,
};

const [currentDocument, writeDocument] =
  createSignal<DocumentState>(emptyDocument);

let documentObserver: ((doc: DocumentState) => void) | undefined;
let editorFlush: (() => void) | undefined;
export function observeDocument(observer: (doc: DocumentState) => void) {
  documentObserver = observer;
}
export function registerEditorFlush(flush: () => void) {
  editorFlush = flush;
  return () => { if (editorFlush === flush) editorFlush = undefined; };
}
export function flushPendingEdits() { editorFlush?.(); }

const setCurrentDocument = ((value: DocumentState | ((doc: DocumentState) => DocumentState)) => {
  const next = typeof value === "function" ? value(currentDocument()) : value;
  return batch(() => {
    writeDocument(next);
    documentObserver?.(next);
    return next;
  });
}) as Setter<DocumentState>;

const [displayMode, writeDisplayMode] = createSignal<DisplayMode>("writing");
const setDisplayMode = ((value: DisplayMode | ((mode: DisplayMode) => DisplayMode)) => {
  flushPendingEdits();
  return writeDisplayMode(value);
}) as Setter<DisplayMode>;

export { currentDocument, setCurrentDocument, displayMode, setDisplayMode };

export function cycleDisplayMode() {
  const current = displayMode();
  if (current === "reading") setDisplayMode("writing");
  else if (current === "writing") setDisplayMode("code");
  else setDisplayMode("reading");
}

export function updateDocumentContent(newContent: string) {
  setCurrentDocument((prev) => {
    const words = newContent.trim().split(/\s+/).filter(Boolean).length;
    return {
      ...prev,
      content: newContent,
      savedContent: prev.savedContent ?? (prev.isDirty ? "" : prev.content),
      wordCount: words,
      isDirty: newContent !== (prev.savedContent ?? (prev.isDirty ? "" : prev.content)),
    };
  });
}

export function updateDocumentRendering(
  sourceContent: string,
  result: RenderResult
) {
  setCurrentDocument((prev) => {
    if (prev.content !== sourceContent) return prev;

    return {
      ...prev,
      renderedContent: sourceContent,
      html: result.html,
      toc: result.toc,
      wordCount: result.word_count,
    };
  });
}

export function markSaved(result: OpenFileResponse) {
  setCurrentDocument(documentFromResponse(result));
}

export function documentFromResponse(result: OpenFileResponse): DocumentState {
  return {
    path: result.path,
    filename: result.filename,
    content: result.content,
    savedContent: result.content,
    renderedContent: result.content,
    html: result.html,
    toc: result.toc,
    wordCount: result.word_count,
    isDirty: false,
    externallyModified: false,
  };
}

export function resetDocument() {
  setCurrentDocument(emptyDocument);
}

export function markExternallyModified() {
  setCurrentDocument((prev) => ({ ...prev, externallyModified: true }));
}

export function clearExternallyModified() {
  setCurrentDocument((prev) => ({ ...prev, externallyModified: false }));
}

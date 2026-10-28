import { batch, createSignal, type Setter } from "solid-js";
import { renderMarkdown, type OpenFileResponse, type RenderResult } from "../lib/tauri/commands";

export type DisplayMode = "reading" | "writing" | "code";

export interface TocEntry {
  level: number;
  text: string;
  id: string;
  source_line?: number;
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
  if (typeof value !== "function") { cancelPendingLiveOutline(); cancelDeferredStats(); }
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

let liveParseVersion = 0;
let liveOutlineTimer: ReturnType<typeof setTimeout> | null = null;
let customLiveOutlineParser:
  | ((markdown: string, docPath?: string | null) => Promise<RenderResult>)
  | null = null;

export function setLiveOutlineParser(
  parser:
    | ((markdown: string, docPath?: string | null) => Promise<RenderResult>)
    | null
) {
  customLiveOutlineParser = parser;
}

export function cancelPendingLiveOutline() {
  if (liveOutlineTimer !== null) {
    clearTimeout(liveOutlineTimer);
    liveOutlineTimer = null;
  }
  liveParseVersion++;
}

export async function processLiveOutline(
  markdown: string,
  docPath?: string | null,
  version?: number
) {
  const currentVersion = version ?? ++liveParseVersion;
  try {
    const parseFn = customLiveOutlineParser || renderMarkdown;
    const result = await parseFn(markdown, docPath);
    // Discard obsolete parse responses
    if (currentVersion !== liveParseVersion) {
      return;
    }
    setCurrentDocument((prev) => {
      if (prev.content !== markdown) return prev;
      return {
        ...prev,
        toc: result.toc,
        html: result.html,
        renderedContent: markdown,
        wordCount: result.word_count,
      };
    });
  } catch {
    // Gracefully ignore parse errors in offline/test environments
  }
}

export function scheduleLiveOutline(
  markdown: string,
  docPath?: string | null,
  delayMs = 250
) {
  if (liveOutlineTimer !== null) {
    clearTimeout(liveOutlineTimer);
    liveOutlineTimer = null;
  }
  const version = ++liveParseVersion;
  liveOutlineTimer = setTimeout(() => {
    liveOutlineTimer = null;
    void processLiveOutline(markdown, docPath, version);
  }, delayMs);
}

let wordCountTimer: ReturnType<typeof setTimeout> | null = null;
function cancelDeferredStats() {
  if (wordCountTimer !== null) clearTimeout(wordCountTimer);
  wordCountTimer = null;
}
export function countWordsFast(text: string): number {
  let count = 0, inWord = false;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    const whitespace = c <= 32 || c === 160 || c === 0x1680 || (c >= 0x2000 && c <= 0x200a) || c === 0x2028 || c === 0x2029 || c === 0x202f || c === 0x205f || c === 0x3000 || c === 0xfeff;
    if (whitespace) inWord = false;
    else if (!inWord) { inWord = true; count++; }
  }
  return count;
}
export function flushDeferredStats() {
  if (wordCountTimer === null) return;
  cancelDeferredStats();
  setCurrentDocument(prev => ({ ...prev, wordCount: countWordsFast(prev.content) }));
}
export function updateDocumentContent(newContent: string, options?: { deferStats?: boolean }) {
  cancelDeferredStats();
  const docPath = currentDocument().path;
  setCurrentDocument(prev => ({
    ...prev,
    content: newContent,
    savedContent: prev.savedContent ?? (prev.isDirty ? "" : prev.content),
    wordCount: options?.deferStats ? prev.wordCount : countWordsFast(newContent),
    isDirty: newContent !== (prev.savedContent ?? (prev.isDirty ? "" : prev.content)),
  }));
  if (options?.deferStats) wordCountTimer = setTimeout(flushDeferredStats, 150);
  scheduleLiveOutline(newContent, docPath);
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
  cancelPendingLiveOutline();
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
  cancelPendingLiveOutline();
  setCurrentDocument(emptyDocument);
}

export function markExternallyModified() {
  setCurrentDocument((prev) => ({ ...prev, externallyModified: true }));
}

export function clearExternallyModified() {
  setCurrentDocument((prev) => ({ ...prev, externallyModified: false }));
}

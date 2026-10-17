import { createSignal } from "solid-js";
import type { OpenFileResponse, RenderResult } from "../lib/tauri/commands";

export type DisplayMode = "reading" | "writing" | "code";

export interface TocEntry {
  level: number;
  text: string;
  id: string;
}

export interface DocumentState {
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

const [currentDocument, setCurrentDocument] =
  createSignal<DocumentState>(emptyDocument);

const [displayMode, setDisplayMode] = createSignal<DisplayMode>("writing");

export { currentDocument, setCurrentDocument, displayMode, setDisplayMode };

export function cycleDisplayMode() {
  const current = displayMode();
  if (current === "reading") setDisplayMode("writing");
  else if (current === "writing") setDisplayMode("code");
  else setDisplayMode("reading");
}

let wordCountTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Fast non-allocating word counter scanning characters without regex or array allocations.
 */
export function countWordsFast(text: string): number {
  let count = 0;
  let inWord = false;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // ASCII whitespace: 32 (space), 9 (tab), 10 (LF), 13 (CR)
    if (code <= 32) {
      inWord = false;
    } else if (!inWord) {
      inWord = true;
      count++;
    }
  }
  return count;
}

export interface UpdateContentOptions {
  deferStats?: boolean;
}

export function flushDeferredStats() {
  if (wordCountTimer) {
    clearTimeout(wordCountTimer);
    wordCountTimer = null;
    const content = currentDocument().content;
    const words = countWordsFast(content);
    setCurrentDocument((prev) => ({ ...prev, wordCount: words }));
  }
}

export function updateDocumentContent(
  newContent: string,
  options?: UpdateContentOptions
) {
  const isDeferred = options?.deferStats ?? false;

  if (isDeferred) {
    setCurrentDocument((prev) => ({
      ...prev,
      content: newContent,
      isDirty: prev.path !== null ? newContent !== prev.content || prev.isDirty : newContent.length > 0,
    }));

    if (wordCountTimer) clearTimeout(wordCountTimer);
    wordCountTimer = setTimeout(() => {
      const words = countWordsFast(newContent);
      setCurrentDocument((prev) => {
        if (prev.content === newContent && prev.wordCount !== words) {
          return { ...prev, wordCount: words };
        }
        return prev;
      });
      wordCountTimer = null;
    }, 150);
  } else {
    if (wordCountTimer) {
      clearTimeout(wordCountTimer);
      wordCountTimer = null;
    }
    const words = countWordsFast(newContent);
    setCurrentDocument((prev) => ({
      ...prev,
      content: newContent,
      wordCount: words,
      isDirty: prev.path !== null ? newContent !== prev.content || prev.isDirty : newContent.length > 0,
    }));
  }
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
  setCurrentDocument({
    path: result.path,
    filename: result.filename,
    content: result.content,
    renderedContent: result.content,
    html: result.html,
    toc: result.toc,
    wordCount: result.word_count,
    isDirty: false,
    externallyModified: false,
  });
}

export function resetDocument() {
  if (wordCountTimer) {
    clearTimeout(wordCountTimer);
    wordCountTimer = null;
  }
  setCurrentDocument(emptyDocument);
}

export function markExternallyModified() {
  setCurrentDocument((prev) => ({ ...prev, externallyModified: true }));
}

export function clearExternallyModified() {
  setCurrentDocument((prev) => ({ ...prev, externallyModified: false }));
}

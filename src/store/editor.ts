import { createSignal } from "solid-js";
import { renderMarkdown, type OpenFileResponse, type RenderResult } from "../lib/tauri/commands";

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

export function updateDocumentContent(newContent: string) {
  let docPath: string | null = null;
  setCurrentDocument((prev) => {
    docPath = prev.path;
    const words = newContent.trim().split(/\s+/).filter(Boolean).length;
    return {
      ...prev,
      content: newContent,
      wordCount: words,
      isDirty: prev.path !== null ? newContent !== prev.content || prev.isDirty : newContent.length > 0,
    };
  });
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
  cancelPendingLiveOutline();
  setCurrentDocument(emptyDocument);
}

export function markExternallyModified() {
  setCurrentDocument((prev) => ({ ...prev, externallyModified: true }));
}

export function clearExternallyModified() {
  setCurrentDocument((prev) => ({ ...prev, externallyModified: false }));
}

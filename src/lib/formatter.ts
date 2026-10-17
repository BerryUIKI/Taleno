import { displayMode, currentDocument, updateDocumentContent } from "../store/editor";

export type FormatAction =
  | "undo"
  | "redo"
  | "bold"
  | "italic"
  | "strikethrough"
  | "code_inline"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "paragraph"
  | "bullet_list"
  | "ordered_list"
  | "task_list"
  | "blockquote"
  | "table"
  | "link"
  | "image";

type FormatHandler = (action: FormatAction) => void;
export type MatchRevealer = (start: number, end: number, line?: number) => boolean;
export type InsertTextHandler = (text: string) => boolean;

let writingFormatHandler: FormatHandler | null = null;
let codeFormatHandler: FormatHandler | null = null;
let writingMatchRevealer: MatchRevealer | null = null;
let codeMatchRevealer: MatchRevealer | null = null;
let readingMatchRevealer: MatchRevealer | null = null;
let writingInserter: InsertTextHandler | null = null;
let codeInserter: InsertTextHandler | null = null;

export function registerWritingFormatter(handler: FormatHandler | null) {
  writingFormatHandler = handler;
}

export function registerCodeFormatter(handler: FormatHandler | null) {
  codeFormatHandler = handler;
}

export function registerWritingMatchRevealer(handler: MatchRevealer | null) {
  writingMatchRevealer = handler;
}

export function registerCodeMatchRevealer(handler: MatchRevealer | null) {
  codeMatchRevealer = handler;
}

export function registerReadingMatchRevealer(handler: MatchRevealer | null) {
  readingMatchRevealer = handler;
}

export function registerWritingInserter(handler: InsertTextHandler | null) {
  writingInserter = handler;
}

export function registerCodeInserter(handler: InsertTextHandler | null) {
  codeInserter = handler;
}

/**
 * Dispatches a formatting action to the currently active editor mode (Writing or Code).
 */
export function dispatchFormat(action: FormatAction) {
  const mode = displayMode();
  if (mode === "writing" && writingFormatHandler) {
    writingFormatHandler(action);
  } else if (mode === "code" && codeFormatHandler) {
    codeFormatHandler(action);
  }
}

/**
 * Reveals and highlights the specified character range / line in the active mode.
 */
export function revealMatchAt(start: number, end: number, line?: number): boolean {
  const mode = displayMode();
  if (mode === "writing" && writingMatchRevealer) {
    return writingMatchRevealer(start, end, line);
  } else if (mode === "code" && codeMatchRevealer) {
    return codeMatchRevealer(start, end, line);
  } else if (mode === "reading" && readingMatchRevealer) {
    return readingMatchRevealer(start, end, line);
  }
  return false;
}

/**
 * Inserts text at the active editor's selection or cursor.
 * If no editor is active (e.g. Reading mode), appends to document and marks dirty.
 */
export function insertTextAtSelection(text: string): boolean {
  const mode = displayMode();
  if (mode === "writing" && writingInserter) {
    if (writingInserter(text)) return true;
  } else if (mode === "code" && codeInserter) {
    if (codeInserter(text)) return true;
  }

  const doc = currentDocument();
  updateDocumentContent(`${doc.content}${text}`);
  return false;
}

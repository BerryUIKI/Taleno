import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { countWordsFast, currentDocument, flushDeferredStats, processLiveOutline, resetDocument, setCurrentDocument, setLiveOutlineParser, updateDocumentContent } from "./editor";

describe("deferred document derivations", () => {
  beforeEach(() => { vi.useFakeTimers(); resetDocument(); });
  afterEach(() => { resetDocument(); setLiveOutlineParser(null); vi.useRealTimers(); });

  it("rejects an outline from the previous tab even when the text is identical", async () => {
    updateDocumentContent("# identical");
    let finish!: (value: { html: string; toc: never[]; word_count: number }) => void;
    setLiveOutlineParser(() => new Promise(resolve => { finish = resolve; }));
    const pending = processLiveOutline("# identical");
    setCurrentDocument({ ...currentDocument(), path: "/other.md", html: "other" });
    finish({ html: "stale", toc: [], word_count: 99 });
    await pending;
    expect(currentDocument().html).toBe("other");
  });

  it("defers stats while preserving immediate content and baseline-derived dirty state", () => {
    setCurrentDocument({ ...currentDocument(), content: "saved", savedContent: "saved", wordCount: 1 });
    updateDocumentContent("changed two words", { deferStats: true });
    expect(currentDocument()).toMatchObject({ content: "changed two words", isDirty: true, wordCount: 1 });
    flushDeferredStats();
    expect(currentDocument().wordCount).toBe(3);
    updateDocumentContent("saved", { deferStats: true });
    expect(currentDocument().isDirty).toBe(false);
  });

  it("cancels a deferred count when loading another document", () => {
    updateDocumentContent("old document", { deferStats: true });
    setCurrentDocument({ ...currentDocument(), path: "/new.md", wordCount: 42 });
    vi.advanceTimersByTime(200);
    expect(currentDocument().wordCount).toBe(42);
  });

  it("counts Unicode and ASCII whitespace consistently", () => {
    expect(countWordsFast("a\u00a0b\u3000c\t d\n")).toBe(4);
  });
});

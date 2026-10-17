import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  currentDocument,
  setCurrentDocument,
  displayMode,
  setDisplayMode,
  cycleDisplayMode,
  updateDocumentContent,
  updateDocumentRendering,
  markSaved,
  resetDocument,
  markExternallyModified,
  clearExternallyModified,
  setLiveOutlineParser,
  processLiveOutline,
  cancelPendingLiveOutline,
} from "./editor";

describe("Editor Store", () => {
  beforeEach(() => {
    resetDocument();
    setDisplayMode("reading");
  });

  it("should initialize with default empty document state", () => {
    const doc = currentDocument();
    expect(doc.path).toBeNull();
    expect(doc.filename).toBe("Untitled");
    expect(doc.content).toBe("");
    expect(doc.isDirty).toBe(false);
  });

  it("should cycle display modes correctly (reading -> writing -> code -> reading)", () => {
    expect(displayMode()).toBe("reading");
    cycleDisplayMode();
    expect(displayMode()).toBe("writing");
    cycleDisplayMode();
    expect(displayMode()).toBe("code");
    cycleDisplayMode();
    expect(displayMode()).toBe("reading");
  });

  it("should track dirty state on content updates", () => {
    updateDocumentContent("Hello world");
    const doc = currentDocument();
    expect(doc.content).toBe("Hello world");
    expect(doc.wordCount).toBe(2);
    expect(doc.isDirty).toBe(true);
  });

  it("should apply reading-mode render data for the current source", () => {
    updateDocumentContent("# New document");
    updateDocumentRendering("# New document", {
      html: '<h1 id="new-document">New document</h1>',
      toc: [{ level: 1, text: "New document", id: "new-document" }],
      word_count: 2,
    });

    const doc = currentDocument();
    expect(doc.renderedContent).toBe("# New document");
    expect(doc.html).toContain("New document");
    expect(doc.toc).toHaveLength(1);
  });

  it("should ignore stale reading-mode render results", () => {
    updateDocumentContent("First version");
    updateDocumentContent("Latest version");
    updateDocumentRendering("First version", {
      html: "<p>First version</p>",
      toc: [],
      word_count: 2,
    });

    expect(currentDocument().content).toBe("Latest version");
    expect(currentDocument().renderedContent).toBe("");
    expect(currentDocument().html).toBe("");
  });

  it("should reset dirty flag when markSaved is invoked", () => {
    updateDocumentContent("# Saved Note");
    markSaved({
      path: "/test/doc.md",
      filename: "doc.md",
      content: "# Saved Note",
      html: "<h1>Saved Note</h1>",
      toc: [{ level: 1, text: "Saved Note", id: "saved-note" }],
      word_count: 2,
    });

    const doc = currentDocument();
    expect(doc.path).toBe("/test/doc.md");
    expect(doc.filename).toBe("doc.md");
    expect(doc.isDirty).toBe(false);
    expect(doc.externallyModified).toBe(false);
  });

  it("should toggle external modification flags", () => {
    markExternallyModified();
    expect(currentDocument().externallyModified).toBe(true);
    clearExternallyModified();
    expect(currentDocument().externallyModified).toBe(false);
  });

  it("should update outline dynamically when live outline parsing completes", async () => {
    setLiveOutlineParser(async (md) => ({
      html: `<h1 id="live-header">${md}</h1>`,
      toc: [{ level: 1, text: "Live Header", id: "live-header" }],
      word_count: 2,
    }));

    updateDocumentContent("Live Header");
    await processLiveOutline("Live Header");

    const doc = currentDocument();
    expect(doc.content).toBe("Live Header");
    expect(doc.toc).toHaveLength(1);
    expect(doc.toc[0].text).toBe("Live Header");
    expect(doc.html).toContain("Live Header");

    setLiveOutlineParser(null);
  });

  it("should discard obsolete parse responses when a newer version has started", async () => {
    let resolveFirst: ((val: any) => void) | null = null;
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    let callCount = 0;
    setLiveOutlineParser(async (md) => {
      callCount++;
      if (callCount === 1) {
        await firstPromise;
        return {
          html: "<p>First Stale Content</p>",
          toc: [{ level: 1, text: "Stale", id: "stale" }],
          word_count: 3,
        };
      }
      return {
        html: "<p>Second Fresh Content</p>",
        toc: [{ level: 1, text: "Fresh", id: "fresh" }],
        word_count: 3,
      };
    });

    // Start first parse
    updateDocumentContent("First Edit");
    const firstTask = processLiveOutline("First Edit");
    // Start second parse which increments liveParseVersion and updates document content
    updateDocumentContent("Second Edit");
    const secondTask = processLiveOutline("Second Edit");

    // Second completes first
    await secondTask;
    expect(currentDocument().toc[0]?.text).toBe("Fresh");

    // Now resolve first task (which is obsolete)
    resolveFirst!({});
    await firstTask;

    // Document state should still reflect the fresh outline, not the stale one
    expect(currentDocument().toc[0]?.text).toBe("Fresh");

    setLiveOutlineParser(null);
  });

  it("should cancel pending outline timers on markSaved and resetDocument", () => {
    updateDocumentContent("Pending edit");
    // Calling markSaved cancels pending live outline
    markSaved({
      path: "/test/doc.md",
      filename: "doc.md",
      content: "Saved Note",
      html: "<h1>Saved Note</h1>",
      toc: [{ level: 1, text: "Saved Note", id: "saved-note" }],
      word_count: 2,
    });

    expect(currentDocument().content).toBe("Saved Note");
    expect(currentDocument().toc[0].text).toBe("Saved Note");

    // Calling resetDocument also cancels pending live outline and resets state
    resetDocument();
    expect(currentDocument().content).toBe("");
    expect(currentDocument().toc).toHaveLength(0);
  });
});


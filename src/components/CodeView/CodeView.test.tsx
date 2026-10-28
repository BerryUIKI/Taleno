import { describe, it, expect, beforeEach } from "vitest";
import {
  getCodeViewHistory,
  clearCodeViewHistory,
} from "./CodeView";
import {
  setCurrentDocument,
  updateDocumentContent,
  currentDocument,
} from "../../store/editor";

describe("CodeView History and Isolation (#93)", () => {
  beforeEach(() => {
    clearCodeViewHistory();
    setCurrentDocument({
      path: "/test/doc1.md",
      filename: "doc1.md",
      content: "# Document 1 Initial",
      renderedContent: "",
      html: "",
      toc: [],
      wordCount: 3,
      isDirty: false,
      externallyModified: false,
    });
  });

  it("isolates history stacks between different documents", () => {
    const hist1 = getCodeViewHistory("/test/doc1.md");
    hist1.past.push({
      content: "doc 1 edit 1",
      selectionStart: 0,
      selectionEnd: 0,
    });

    const hist2 = getCodeViewHistory("/test/doc2.md");
    expect(hist2.past).toHaveLength(0);
    expect(hist1.past).toHaveLength(1);

    hist2.past.push({
      content: "doc 2 edit 1",
      selectionStart: 5,
      selectionEnd: 5,
    });

    expect(getCodeViewHistory("/test/doc1.md").past).toHaveLength(1);
    expect(getCodeViewHistory("/test/doc2.md").past).toHaveLength(1);
    expect(getCodeViewHistory("/test/doc1.md").past[0].content).toBe("doc 1 edit 1");
    expect(getCodeViewHistory("/test/doc2.md").past[0].content).toBe("doc 2 edit 1");
  });

  it("clears history for a specific document or all documents", () => {
    getCodeViewHistory("/test/doc1.md").past.push({
      content: "edit 1",
      selectionStart: 0,
      selectionEnd: 0,
    });
    getCodeViewHistory("/test/doc2.md").past.push({
      content: "edit 2",
      selectionStart: 0,
      selectionEnd: 0,
    });

    clearCodeViewHistory("/test/doc1.md");
    expect(getCodeViewHistory("/test/doc1.md").past).toHaveLength(0);
    expect(getCodeViewHistory("/test/doc2.md").past).toHaveLength(1);

    clearCodeViewHistory();
    expect(getCodeViewHistory("/test/doc2.md").past).toHaveLength(0);
  });
});

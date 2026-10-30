import { describe, it, expect, beforeEach } from "vitest";
import { EditorState } from "@codemirror/state";
import {
  getCodeViewSession,
  setCodeViewSession,
  clearCodeViewSessions,
} from "./CodeView";

const documentState = (doc: string) => EditorState.create({ doc });

describe("CodeView per-document sessions", () => {
  beforeEach(() => {
    clearCodeViewSessions();
  });

  it("isolates editor state between different documents", () => {
    const first = documentState("doc 1");
    setCodeViewSession("/test/doc1.md", first);

    expect(getCodeViewSession("/test/doc2.md")).toBeUndefined();
    expect(getCodeViewSession("/test/doc1.md")).toBe(first);

    const second = documentState("doc 2");
    setCodeViewSession("/test/doc2.md", second);

    expect(getCodeViewSession("/test/doc1.md")?.doc.toString()).toBe("doc 1");
    expect(getCodeViewSession("/test/doc2.md")?.doc.toString()).toBe("doc 2");
  });

  it("replaces the stored state for an existing document key", () => {
    setCodeViewSession("/test/doc1.md", documentState("before"));
    const replacement = documentState("after");
    setCodeViewSession("/test/doc1.md", replacement);

    expect(getCodeViewSession("/test/doc1.md")).toBe(replacement);
  });

  it("evicts the oldest sessions instead of growing without bound", () => {
    for (let index = 0; index < 30; index++) {
      setCodeViewSession(`doc-${index}`, documentState(`content ${index}`));
    }

    expect(getCodeViewSession("doc-0")).toBeUndefined();
    expect(getCodeViewSession("doc-5")).toBeUndefined();
    expect(getCodeViewSession("doc-29")?.doc.toString()).toBe("content 29");
  });

  it("clears a single document session or all of them", () => {
    setCodeViewSession("/test/doc1.md", documentState("one"));
    setCodeViewSession("/test/doc2.md", documentState("two"));

    clearCodeViewSessions("/test/doc1.md");
    expect(getCodeViewSession("/test/doc1.md")).toBeUndefined();
    expect(getCodeViewSession("/test/doc2.md")).toBeDefined();

    clearCodeViewSessions();
    expect(getCodeViewSession("/test/doc2.md")).toBeUndefined();
  });
});

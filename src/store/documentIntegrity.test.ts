import { beforeEach, describe, expect, it } from "vitest";
import { currentDocument, documentFromResponse, updateDocumentContent, registerEditorFlush, setDisplayMode } from "./editor";
import { activeTabId, addOrSwitchTab, applySaveResult, closeTab, hasUnsavedDocuments, markPathExternallyModified, openTabs, replaceTabFromDisk, selectTab, setActiveTabId, setOpenTabs } from "./files";

const response = (path: string, content: string) => ({ path, filename: path.split("/").pop()!, content, html: `<p>${content}</p>`, toc: [], word_count: 1 });
const open = (path: string, content: string) => addOrSwitchTab(documentFromResponse(response(path, content)));

beforeEach(() => { setOpenTabs([]); setActiveTabId(null); });

describe("document integrity across transitions", () => {
  it("preserves outgoing edits and dirty indicators for Open and New", () => {
    open("/a.md", "disk A");
    updateDocumentContent("draft A");
    expect(openTabs()[0].document.isDirty).toBe(true);
    open("/b.md", "disk B");
    selectTab("/a.md");
    expect(currentDocument().content).toBe("draft A");
    addOrSwitchTab({ ...documentFromResponse(response("", "")), path: null });
    updateDocumentContent("untitled draft");
    const id = activeTabId()!;
    open("/b.md", "disk B");
    selectTab(id);
    expect(currentDocument().content).toBe("untitled draft");
    expect(hasUnsavedDocuments()).toBe(true);
  });

  it("keeps intervening edits dirty after delayed Save and Save As", () => {
    for (const destination of ["/a.md", "/renamed.md"]) {
      open("/a.md", "base");
      updateDocumentContent("captured");
      const instance = openTabs().find((t) => t.id === "/a.md")!.instance;
      updateDocumentContent("typed during save");
      expect(applySaveResult("/a.md", response(destination, "captured"), instance)).toBe(false);
      expect(currentDocument()).toMatchObject({ content: "typed during save", path: destination, savedContent: "captured", isDirty: true });
      setOpenTabs([]); setActiveTabId(null);
    }
  });

  it("applies a save only to its originating incarnation, even after tab switches/closure", () => {
    open("/a.md", "A");
    const instance = openTabs()[0].instance;
    updateDocumentContent("saved A");
    open("/b.md", "B");
    expect(applySaveResult("/a.md", response("/a.md", "saved A"), instance)).toBe(true);
    expect(currentDocument()).toMatchObject({ path: "/b.md", content: "B" });
    closeTab("/a.md");
    open("/a.md", "reopened A");
    expect(applySaveResult("/a.md", response("/a.md", "late A"), instance)).toBe(false);
    expect(currentDocument().content).toBe("reopened A");
  });

  it("routes external events to inactive tabs and replaces old snapshots on Reload", () => {
    open("/a.md", "A"); open("/b.md", "B");
    markPathExternallyModified("/a.md");
    expect(currentDocument().externallyModified).toBe(false);
    selectTab("/a.md");
    expect(currentDocument().externallyModified).toBe(true);
    replaceTabFromDisk("/a.md", response("/a.md", "new disk A"));
    selectTab("/b.md"); selectTab("/a.md");
    expect(currentDocument()).toMatchObject({ content: "new disk A", savedContent: "new disk A", isDirty: false, externallyModified: false, loadVersion: 1 });
  });

  it("flushes pending editor transactions before transitions, update guards and mode changes", () => {
    open("/a.md", "A");
    let pending = true;
    const remove = registerEditorFlush(() => { if (pending) { pending = false; updateDocumentContent("pending edit"); } });
    expect(hasUnsavedDocuments()).toBe(true);
    open("/b.md", "B"); selectTab("/a.md");
    expect(currentDocument().content).toBe("pending edit");
    pending = true;
    setDisplayMode("code");
    expect(pending).toBe(false);
    remove();
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import {
  openTabs,
  setOpenTabs,
  activeTabId,
  setActiveTabId,
  addOrSwitchTab,
  selectTab,
  closeTab,
  syncCurrentDocumentToTab,
} from "./files";
import { currentDocument, updateDocumentContent } from "./editor";

describe("Files & Tabs Store", () => {
  beforeEach(() => {
    setOpenTabs([]);
    setActiveTabId(null);
  });

  it("should add a new tab and set it as active", () => {
    const doc = {
      path: "/docs/test1.md",
      filename: "test1.md",
      content: "# Note 1",
      renderedContent: "# Note 1",
      html: "<h1>Note 1</h1>",
      toc: [],
      wordCount: 2,
      isDirty: false,
      externallyModified: false,
    };

    addOrSwitchTab(doc);
    expect(openTabs().length).toBe(1);
    expect(activeTabId()).toBe("/docs/test1.md");
    expect(currentDocument().filename).toBe("test1.md");
  });

  it("should switch to existing tab without duplicate tabs", () => {
    const doc1 = {
      path: "/docs/test1.md",
      filename: "test1.md",
      content: "# Note 1",
      renderedContent: "# Note 1",
      html: "",
      toc: [],
      wordCount: 2,
      isDirty: false,
      externallyModified: false,
    };
    const doc2 = {
      path: "/docs/test2.md",
      filename: "test2.md",
      content: "# Note 2",
      renderedContent: "# Note 2",
      html: "",
      toc: [],
      wordCount: 2,
      isDirty: false,
      externallyModified: false,
    };

    addOrSwitchTab(doc1);
    addOrSwitchTab(doc2);
    expect(openTabs().length).toBe(2);
    expect(activeTabId()).toBe("/docs/test2.md");

    // Switch back to doc1
    addOrSwitchTab(doc1);
    expect(openTabs().length).toBe(2);
    expect(activeTabId()).toBe("/docs/test1.md");
  });

  it("should select an existing unsaved tab without creating a duplicate", () => {
    const firstDocument = {
      path: null,
      filename: "Untitled-1.md",
      content: "First draft",
      renderedContent: "First draft",
      html: "",
      toc: [],
      wordCount: 2,
      isDirty: true,
      externallyModified: false,
    };
    const secondDocument = {
      ...firstDocument,
      filename: "Untitled-2.md",
      content: "Second draft",
      renderedContent: "Second draft",
    };

    addOrSwitchTab(firstDocument);
    const firstTabId = activeTabId();
    addOrSwitchTab(secondDocument);

    expect(openTabs()).toHaveLength(2);
    expect(firstTabId).not.toBeNull();
    expect(selectTab(firstTabId!)).toBe(true);
    expect(openTabs()).toHaveLength(2);
    expect(activeTabId()).toBe(firstTabId);
    expect(currentDocument().filename).toBe("Untitled-1.md");
  });

  it("should preserve current edits when selecting another tab", () => {
    const firstDocument = {
      path: null,
      filename: "Untitled-1.md",
      content: "First draft",
      renderedContent: "First draft",
      html: "",
      toc: [],
      wordCount: 2,
      isDirty: true,
      externallyModified: false,
    };
    const secondDocument = {
      ...firstDocument,
      filename: "Untitled-2.md",
      content: "Second draft",
      renderedContent: "Second draft",
    };

    addOrSwitchTab(firstDocument);
    const firstTabId = activeTabId()!;
    addOrSwitchTab(secondDocument);
    const secondTabId = activeTabId()!;
    selectTab(firstTabId);
    updateDocumentContent("Edited first draft");

    selectTab(secondTabId);
    selectTab(firstTabId);

    expect(currentDocument().content).toBe("Edited first draft");
    expect(openTabs()).toHaveLength(2);
  });

  it("should close tab and activate remaining tab", () => {
    const doc1 = {
      path: "/docs/test1.md",
      filename: "test1.md",
      content: "# Note 1",
      renderedContent: "# Note 1",
      html: "",
      toc: [],
      wordCount: 2,
      isDirty: false,
      externallyModified: false,
    };
    const doc2 = {
      path: "/docs/test2.md",
      filename: "test2.md",
      content: "# Note 2",
      renderedContent: "# Note 2",
      html: "",
      toc: [],
      wordCount: 2,
      isDirty: false,
      externallyModified: false,
    };

    addOrSwitchTab(doc1);
    addOrSwitchTab(doc2);

    closeTab("/docs/test2.md");
    expect(openTabs().length).toBe(1);
    expect(activeTabId()).toBe("/docs/test1.md");
  });

  it("should sync current document modifications into tab list", () => {
    const doc = {
      path: "/docs/test.md",
      filename: "test.md",
      content: "Initial",
      renderedContent: "Initial",
      html: "",
      toc: [],
      wordCount: 1,
      isDirty: false,
      externallyModified: false,
    };
    addOrSwitchTab(doc);
    updateDocumentContent("Modified Content");
    syncCurrentDocumentToTab();

    const currentTab = openTabs().find((t) => t.id === "/docs/test.md");
    expect(currentTab?.document.content).toBe("Modified Content");
    expect(currentTab?.document.isDirty).toBe(true);
  });
});

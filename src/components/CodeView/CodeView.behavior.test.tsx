import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Show } from "solid-js";
import { render } from "solid-js/web";
import { CodeView, clearCodeViewSessions } from "./CodeView";
import {
  currentDocument,
  documentFromResponse,
  setCurrentDocument,
  setDisplayMode,
} from "../../store/editor";
import { activeTabId, addOrSwitchTab, selectTab, setActiveTabId, setOpenTabs } from "../../store/files";
import { dispatchFormat, insertTextAtSelection, revealMatchAt } from "../../lib/formatter";
import { navigateToHeading } from "../../lib/headingNavigation";

let dispose: (() => void) | undefined;

const documentFor = (content: string) => ({
  ...documentFromResponse({
    path: "",
    filename: "Untitled.md",
    content,
    html: "",
    toc: [],
    word_count: 1,
  }),
  path: null,
});

const mountEditor = () => {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(
    () => (
      <Show keyed when={`${activeTabId()}:${currentDocument().loadVersion ?? 0}`}>
        {(_key) => <CodeView />}
      </Show>
    ),
    host
  );
  return host;
};

/** CodeMirror renders one element per line, so newlines are implicit. */
const editorText = (host: HTMLElement) => host.querySelector(".cm-content")!.textContent;
const expectedText = (content: string) => content.replace(/\n/g, "");

beforeEach(() => {
  clearCodeViewSessions();
  setActiveTabId(null);
  setOpenTabs([]);
  setDisplayMode("code");
});

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();
  setActiveTabId(null);
  setOpenTabs([]);
  setDisplayMode("writing");
  clearCodeViewSessions();
});

describe("CodeView document binding", () => {
  it("renders the markdown source and writes edits back to the store", () => {
    addOrSwitchTab(documentFor("Alpha"));
    const host = mountEditor();

    expect(editorText(host)).toBe("Alpha");

    expect(insertTextAtSelection("Beta")).toBe(true);
    expect(currentDocument().content).toBe("BetaAlpha");
    expect(editorText(host)).toBe("BetaAlpha");
  });

  it("replaces the document when content changes outside the editor", () => {
    addOrSwitchTab(documentFor("Alpha"));
    const host = mountEditor();
    expect(editorText(host)).toBe("Alpha");

    setCurrentDocument({ ...currentDocument(), content: "Reloaded" });

    expect(editorText(host)).toBe("Reloaded");
    // An external replacement starts a fresh history: there is nothing to undo.
    dispatchFormat("undo");
    expect(currentDocument().content).toBe("Reloaded");
  });

  it("keeps undo history and selection per document across tab switches", () => {
    addOrSwitchTab(documentFor("Alpha"));
    const firstId = activeTabId()!;
    const host = mountEditor();

    expect(revealMatchAt(1, 4)).toBe(true);
    insertTextAtSelection("Y");
    expect(currentDocument().content).toBe("AYa");

    addOrSwitchTab(documentFor("Beta"));
    dispatchFormat("undo");
    expect(currentDocument().content).toBe("Beta");

    selectTab(firstId);
    dispatchFormat("undo");
    expect(currentDocument().content).toBe("Alpha");
    expect(editorText(host)).toBe("Alpha");

    // The selection survived with the session: typing replaces "lph", not the
    // document start.
    insertTextAtSelection("Z");
    expect(currentDocument().content).toBe("AZa");
  });
});

describe("CodeView formatting bridge", () => {
  it("wraps, restyles and inserts through the shared formatter actions", () => {
    addOrSwitchTab(documentFor("# Title"));
    const host = mountEditor();

    revealMatchAt(2, 7);
    dispatchFormat("bold");
    expect(currentDocument().content).toBe("# **Title**");

    expect(revealMatchAt(9, 9)).toBe(true);
    dispatchFormat("h2");
    expect(currentDocument().content).toBe("## **Title**");

    dispatchFormat("undo");
    expect(currentDocument().content).toBe("# **Title**");
    expect(editorText(host)).toBe(expectedText("# **Title**"));
  });

  it("inserts the table template at the cursor", () => {
    addOrSwitchTab(documentFor("intro"));
    mountEditor();

    dispatchFormat("table");
    expect(currentDocument().content).toContain("| Column 1 | Column 2 | Column 3 |");
    // Inserted at the cursor, so the existing text follows the template.
    expect(currentDocument().content.endsWith("intro")).toBe(true);
  });

  it("reveals find matches and headings by source line", () => {
    addOrSwitchTab(documentFor("one\ntwo\n# Three\nfour"));
    mountEditor();

    expect(revealMatchAt(4, 7)).toBe(true);
    insertTextAtSelection("X");
    expect(currentDocument().content).toBe("one\nX\n# Three\nfour");

    expect(
      navigateToHeading({ level: 1, text: "Three", id: "three", source_line: 2 }, 0)
    ).toBe(true);
    // Heading navigation selects the whole source line, as before.
    insertTextAtSelection("Z");
    expect(currentDocument().content).toBe("one\nX\nZ\nfour");
  });
});

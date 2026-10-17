import { afterEach, expect, it, vi } from "vitest";
import { Show } from "solid-js";
import { render } from "solid-js/web";
import { Editor } from "./Editor";
import { dispatchFormat } from "../../lib/formatter";
import { activeTabId, addOrSwitchTab, openTabs, replaceTabFromDisk, selectTab, setActiveTabId, setOpenTabs } from "../../store/files";
import { currentDocument, documentFromResponse, flushPendingEdits } from "../../store/editor";

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); document.body.replaceChildren(); setActiveTabId(null); setOpenTabs([]); });
const response = (path: string, content: string) => ({ path, filename: path, content, html: "", toc: [], word_count: 1 });

it("flushes a real Milkdown formatting transaction immediately and isolates history on switch/reload", async () => {
  setActiveTabId(null); setOpenTabs([]);
  addOrSwitchTab(documentFromResponse(response("/a.md", "Alpha")));
  const host = document.createElement("div"); document.body.append(host);
  dispose = render(() => <Show keyed when={`${activeTabId()}:${currentDocument().loadVersion ?? 0}`}>
    {(_identity) => <Editor />}
  </Show>, host);
  await vi.waitFor(() => expect(host.querySelector(".ProseMirror")?.textContent).toBe("Alpha"));
  await vi.waitFor(() => expect(host.querySelector('[aria-busy="false"]')).not.toBeNull());
  dispatchFormat("h1");
  expect(currentDocument().isDirty).toBe(true);
  // No debounce wait: leaving immediately must retain the visible heading transaction.
  addOrSwitchTab(documentFromResponse(response("/b.md", "Beta")));
  expect(openTabs().find((tab) => tab.id === "/a.md")?.document.content).toMatch(/^# Alpha/);
  await vi.waitFor(() => expect(host.querySelector(".ProseMirror")?.textContent).toBe("Beta"));
  await vi.waitFor(() => expect(host.querySelector('[aria-busy="false"]')).not.toBeNull());
  dispatchFormat("undo"); flushPendingEdits();
  expect(currentDocument().content).toBe("Beta");
  selectTab("/a.md");
  await vi.waitFor(() => expect(host.querySelector(".ProseMirror h1")?.textContent).toBe("Alpha"));
  replaceTabFromDisk("/a.md", response("/a.md", "Reloaded"));
  await vi.waitFor(() => expect(host.querySelector(".ProseMirror")?.textContent).toBe("Reloaded"));
  await vi.waitFor(() => expect(host.querySelector('[aria-busy="false"]')).not.toBeNull());
  dispatchFormat("undo"); flushPendingEdits();
  expect(currentDocument().content).toBe("Reloaded");
});

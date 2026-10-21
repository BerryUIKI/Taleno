import { afterEach, expect, it, vi } from "vitest";
import { Show } from "solid-js";
import { render } from "solid-js/web";
import { CodeView, clearCodeViewHistory } from "./CodeView";
import { currentDocument, documentFromResponse } from "../../store/editor";
import { activeTabId, addOrSwitchTab, selectTab, setActiveTabId, setOpenTabs } from "../../store/files";

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); document.body.replaceChildren(); setActiveTabId(null); setOpenTabs([]); clearCodeViewHistory(); vi.useRealTimers(); });

it("restores the source selection and keeps identical untitled filenames isolated", () => {
  vi.useFakeTimers();
  setActiveTabId(null); setOpenTabs([]); clearCodeViewHistory();
  const doc = (content: string) => ({ ...documentFromResponse({ path: "", filename: "Untitled.md", content, html: "", toc: [], word_count: 1 }), path: null });
  addOrSwitchTab(doc("Alpha"));
  const firstId = activeTabId()!;
  const host = document.createElement("div"); document.body.append(host);
  dispose = render(() => <Show keyed when={activeTabId()}>{(_identity) => <CodeView />}</Show>, host);
  const textarea = () => host.querySelector("textarea")!;
  textarea().setSelectionRange(1, 4);
  textarea().dispatchEvent(new InputEvent("beforeinput", { bubbles: true, inputType: "insertText", data: "X" }));
  textarea().value = "AXa";
  textarea().dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "X" }));
  expect(currentDocument().content).toBe("AXa");
  addOrSwitchTab(doc("Beta"));
  textarea().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "z", ctrlKey: true }));
  expect(currentDocument().content).toBe("Beta");
  selectTab(firstId);
  textarea().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "z", ctrlKey: true }));
  expect(currentDocument().content).toBe("Alpha");
  expect([textarea().selectionStart, textarea().selectionEnd]).toEqual([1, 4]);
  textarea().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "z", ctrlKey: true, shiftKey: true }));
  expect(currentDocument().content).toBe("AXa");
});

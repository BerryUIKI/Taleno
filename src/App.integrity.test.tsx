import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render } from "solid-js/web";
import { Show } from "solid-js";

const mocks = vi.hoisted(() => ({ open: vi.fn(), save: vi.fn(), openFile: vi.fn(), saveFile: vi.fn(), baseline: vi.fn(), changed: undefined as undefined | ((payload: { path: string }) => void) }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: mocks.open, save: mocks.save }));
vi.mock("@tauri-apps/api/window", () => ({ getCurrentWindow: () => ({ onCloseRequested: async () => () => {} }) }));
vi.mock("@tauri-apps/api/webview", () => ({ getCurrentWebview: () => ({ onDragDropEvent: async () => () => {} }) }));
vi.mock("./lib/tauri/commands", async (original) => ({
  ...await original<typeof import("./lib/tauri/commands")>(),
  openFile: mocks.openFile, saveFile: mocks.saveFile, readFileBaseline: mocks.baseline,
  getCliArgs: async () => [], startWatchingFile: async () => {}, stopWatchingFile: async () => {},
}));
vi.mock("./lib/tauri/events", () => ({ onFileChanged: async (callback: typeof mocks.changed) => { mocks.changed = callback; return () => {}; }, onSingleInstanceOpen: async () => () => {} }));
vi.mock("./store/plugins", () => ({ syncPlugins: async () => {} }));
vi.mock("./store/customThemes", () => ({ syncCustomThemes: async () => {} }));
vi.mock("./lib/updater", () => ({ scheduleAutomaticUpdateCheck: () => () => {}, updateModalOpen: () => false }));
vi.mock("./components/Updater/UpdateModal", () => ({ UpdateModal: () => null }));
vi.mock("./components/Settings/SettingsModal", () => ({ SettingsModal: () => null }));
vi.mock("./components/MenuBar/MenuBar", () => ({ MenuBar: () => null }));
vi.mock("./components/Sidebar/Sidebar", () => ({ Sidebar: () => null }));
vi.mock("./components/SearchModal/SearchModal", () => ({ SearchModal: () => null }));
vi.mock("./components/QuickSwitcher/QuickSwitcher", () => ({ QuickSwitcher: () => null }));
vi.mock("./components/Toolbar/EditorToolbar", () => ({ EditorToolbar: () => null }));
vi.mock("./components/StatusBar/StatusBar", () => ({ StatusBar: () => null }));
vi.mock("./components/Tabs/CloseConfirmModal", () => ({ CloseConfirmModal: (props: { isOpen: boolean; onSave: () => void; onDiscard: () => void; onCancel: () => void }) => <Show when={props.isOpen}><button data-save-close onClick={props.onSave}>Save close</button><button data-cancel-close onClick={props.onCancel}>Cancel close</button></Show> }));

import App from "./App";
import { currentDocument, documentFromResponse, setDisplayMode, updateDocumentContent } from "./store/editor";
import { activeTabId, addOrSwitchTab, openTabs, selectTab, setActiveTabId, setOpenTabs } from "./store/files";

const response = (path: string, content: string) => ({ path, filename: path, content, html: "", toc: [], word_count: 1 });
const key = (key: string) => window.dispatchEvent(new KeyboardEvent("keydown", { key, ctrlKey: true, bubbles: true }));
let dispose: () => void;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks(); setActiveTabId(null); setOpenTabs([]); setDisplayMode("code");
  Object.defineProperty(window, "innerWidth", { value: 1200, configurable: true });
  addOrSwitchTab(documentFromResponse(response("/a.md", "A")));
  container = document.createElement("div"); document.body.append(container);
  dispose = render(() => <App />, container);
});
afterEach(() => { dispose(); container.remove(); setActiveTabId(null); setOpenTabs([]); });

it("preserves new edits and the selected tab when delayed save IPC completes", async () => {
  let finish!: (value: ReturnType<typeof response>) => void;
  mocks.saveFile.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  updateDocumentContent("captured A"); key("s");
  expect(mocks.saveFile).toHaveBeenCalledWith("/a.md", "captured A", "A");
  updateDocumentContent("newer A");
  addOrSwitchTab(documentFromResponse(response("/b.md", "B")));
  finish(response("/a.md", "captured A"));
  await vi.waitFor(() => expect(openTabs().find((tab) => tab.id === "/a.md")?.document.savedContent).toBe("captured A"));
  expect(currentDocument()).toMatchObject({ path: "/b.md", content: "B" });
  selectTab("/a.md");
  expect(currentDocument()).toMatchObject({ content: "newer A", isDirty: true });
});

it("does not close after failed save, canceled picker, or newer edits during save", async () => {
  mocks.saveFile.mockRejectedValueOnce(new Error("permission denied"));
  updateDocumentContent("dirty"); key("w");
  container.querySelector<HTMLButtonElement>("[data-save-close]")!.click();
  await vi.waitFor(() => expect(container.querySelector('[role="alert"]')?.textContent).toContain("permission denied"));
  expect(activeTabId()).toBe("/a.md"); expect(currentDocument().isDirty).toBe(true);
  let finish!: (value: ReturnType<typeof response>) => void;
  mocks.saveFile.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  container.querySelector<HTMLButtonElement>("[data-save-close]")!.click();
  updateDocumentContent("newer dirty"); finish(response("/a.md", "dirty"));
  await vi.waitFor(() => expect(currentDocument().savedContent).toBe("dirty"));
  expect(activeTabId()).toBe("/a.md"); expect(currentDocument().isDirty).toBe(true);
  container.querySelector<HTMLButtonElement>("[data-cancel-close]")!.click();
  key("n"); updateDocumentContent("untitled"); key("w");
  mocks.save.mockResolvedValueOnce(null);
  container.querySelector<HTMLButtonElement>("[data-save-close]")!.click();
  await vi.waitFor(() => expect(mocks.save).toHaveBeenCalled());
  expect(currentDocument()).toMatchObject({ path: null, content: "untitled", isDirty: true });
});

it("blocks manual saves during conflicts and reloads the disk snapshot", async () => {
  await vi.waitFor(() => expect(mocks.changed).toBeDefined());
  updateDocumentContent("local edit"); mocks.changed!({ path: "/a.md" });
  key("s");
  expect(mocks.saveFile).not.toHaveBeenCalled();
  mocks.openFile.mockResolvedValueOnce(response("/a.md", "external edit"));
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const reload = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Reload")!;
  reload.click();
  await vi.waitFor(() => expect(currentDocument().content).toBe("external edit"));
  expect(openTabs()[0].document).toMatchObject({ content: "external edit", isDirty: false, externallyModified: false });
  vi.restoreAllMocks();
});

it("pauses auto-save for externally modified documents", async () => {
  dispose();
  vi.useFakeTimers();
  try {
    dispose = render(() => <App />, container);
    await Promise.resolve();
    updateDocumentContent("local draft");
    mocks.changed!({ path: "/a.md" });
    await vi.advanceTimersByTimeAsync(30_000);
    expect(mocks.saveFile).not.toHaveBeenCalled();
    expect(currentDocument()).toMatchObject({ content: "local draft", isDirty: true, externallyModified: true });
  } finally { vi.useRealTimers(); }
});

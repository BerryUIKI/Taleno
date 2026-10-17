import { batch, createSignal } from "solid-js";
import type { DocumentState } from "./editor";
import type { FileEntry, OpenFileResponse } from "../lib/tauri/commands";
import { currentDocument, setCurrentDocument, observeDocument, flushPendingEdits, documentFromResponse } from "./editor";

export interface Tab {
  id: string;
  instance?: number;
  document: DocumentState;
}

export interface RecentFile {
  path: string;
  filename: string;
  lastOpened: number;
}

const STORAGE_KEY_RECENT = "Taleno_recent_files";

function loadRecentFiles(): RecentFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentFiles(files: RecentFile[]) {
  try {
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(files.slice(0, 15)));
  } catch {
    // ignore
  }
}

const [openTabs, setOpenTabs] = createSignal<Tab[]>([]);
const [activeTabId, setActiveTabId] = createSignal<string | null>(null);
const [workspaceTree, setWorkspaceTree] = createSignal<FileEntry | null>(null);
const [quickSwitcherOpen, setQuickSwitcherOpen] = createSignal(false);
const [recentFiles, setRecentFiles] = createSignal<RecentFile[]>(loadRecentFiles());
let untitledTabSequence = 0;

// Keep tab snapshots authoritative even while the active editor is changing.
observeDocument((document) => {
  const id = activeTabId();
  setOpenTabs((tabs) => tabs.map((tab) => tab.id === id ? { ...tab, document } : tab));
});

export {
  openTabs,
  setOpenTabs,
  activeTabId,
  setActiveTabId,
  workspaceTree,
  setWorkspaceTree,
  quickSwitcherOpen,
  setQuickSwitcherOpen,
  recentFiles,
  setRecentFiles,
};

export function addRecentFile(path: string, filename: string) {
  setRecentFiles((prev) => {
    const filtered = prev.filter((f) => f.path !== path);
    const updated = [{ path, filename, lastOpened: Date.now() }, ...filtered].slice(0, 15);
    saveRecentFiles(updated);
    return updated;
  });
}

export function addOrSwitchTab(doc: DocumentState) {
  flushPendingEdits();
  syncCurrentDocumentToTab();
  doc = { ...doc, savedContent: doc.savedContent ?? (doc.isDirty ? "" : doc.content) };
  if (doc.path) {
    addRecentFile(doc.path, doc.filename);
  }

  const tabs = openTabs();
  const existing = tabs.find((t) => (t.document.path && t.document.path === doc.path) || (t.id === doc.path));

  if (existing) {
    batch(() => {
      setActiveTabId(existing.id);
      setCurrentDocument(existing.document);
    });
  } else {
    const newId = doc.path || `untitled-${Date.now()}-${++untitledTabSequence}`;
    const newTab: Tab = { id: newId, instance: ++untitledTabSequence, document: doc };
    batch(() => {
      setOpenTabs([...tabs, newTab]);
      setActiveTabId(newId);
      setCurrentDocument(doc);
    });
  }
}

export function selectTab(id: string): boolean {
  flushPendingEdits();
  const currentId = activeTabId();
  const current = currentDocument();
  const tabs = openTabs().map((tab) =>
    tab.id === currentId ? { ...tab, document: current } : tab
  );
  const selected = tabs.find((tab) => tab.id === id);

  if (!selected) return false;

  batch(() => {
    setOpenTabs(tabs);
    setActiveTabId(selected.id);
    setCurrentDocument(selected.document);
  });
  return true;
}

export function closeTab(id: string) {
  flushPendingEdits();
  syncCurrentDocumentToTab();
  const tabs = openTabs();
  const newTabs = tabs.filter((t) => t.id !== id);
  batch(() => {
    setOpenTabs(newTabs);

    if (activeTabId() === id) {
      if (newTabs.length > 0) {
        const nextTab = newTabs[newTabs.length - 1];
        setActiveTabId(nextTab.id);
        setCurrentDocument(nextTab.document);
      } else {
        setActiveTabId(null);
        setCurrentDocument({
          path: null,
          filename: "Untitled",
          content: "",
          renderedContent: "",
          html: "",
          toc: [],
          wordCount: 0,
          isDirty: false,
          externallyModified: false,
        });
      }
    }
  });
}

export function syncCurrentDocumentToTab() {
  const current = currentDocument();
  const id = activeTabId();
  if (!id) return;

  setOpenTabs((prev) =>
    prev.map((t) => (t.id === id ? { ...t, document: current } : t))
  );
}

export function hasUnsavedDocuments() {
  flushPendingEdits();
  return currentDocument().isDirty || openTabs().some((tab) => tab.document.isDirty);
}

/** Complete a captured save, never replacing newer text or a different tab. */
export function applySaveResult(id: string, result: OpenFileResponse, instance?: number): boolean {
  flushPendingEdits();
  const tab = openTabs().find((item) => item.id === id);
  if (!tab || (instance !== undefined && tab.instance !== instance)) return false;
  const unchanged = tab.document.content === result.content;
  const document: DocumentState = {
    ...tab.document,
    ...(unchanged ? documentFromResponse(result) : {}),
    path: result.path,
    filename: result.filename,
    savedContent: result.content,
    isDirty: !unchanged,
  };
  batch(() => {
    setOpenTabs((tabs) => tabs.map((item) => item.id === id ? { ...item, document } : item));
    if (activeTabId() === id) setCurrentDocument(document);
  });
  addRecentFile(result.path, result.filename);
  return unchanged;
}

export function replaceTabFromDisk(id: string, result: OpenFileResponse, instance?: number) {
  const tab = openTabs().find((item) => item.id === id);
  if (!tab || (instance !== undefined && tab.instance !== instance)) return;
  const document = { ...documentFromResponse(result), loadVersion: (tab.document.loadVersion ?? 0) + 1 };
  batch(() => {
    setOpenTabs((tabs) => tabs.map((item) => item.id === id ? { ...item, document } : item));
    if (activeTabId() === id) setCurrentDocument(document);
  });
}

export function markPathExternallyModified(path: string) {
  batch(() => {
    setOpenTabs((tabs) => tabs.map((tab) => tab.document.path === path
      ? { ...tab, document: { ...tab.document, externallyModified: true } } : tab));
    if (currentDocument().path === path) setCurrentDocument((doc) => ({ ...doc, externallyModified: true }));
  });
}

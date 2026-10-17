import { Component, createSignal, createEffect, Show, onMount, onCleanup } from "solid-js";
import { open, save } from "@tauri-apps/plugin-dialog";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { MenuBar } from "./components/MenuBar/MenuBar";
import { MobileShell } from "./components/Mobile/MobileShell";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { TabBar } from "./components/Tabs/TabBar";
import { QuickSwitcher } from "./components/QuickSwitcher/QuickSwitcher";
import { SearchModal } from "./components/SearchModal/SearchModal";
import { FindReplace } from "./components/FindReplace/FindReplace";
import { EditorToolbar } from "./components/Toolbar/EditorToolbar";
import { MarkdownView } from "./components/MarkdownView/MarkdownView";
import { Editor } from "./components/Editor/Editor";
import { CodeView } from "./components/CodeView/CodeView";
import { StatusBar } from "./components/StatusBar/StatusBar";
import { WelcomeHub } from "./components/Home/WelcomeHub";
import { UpdateModal } from "./components/Updater/UpdateModal";
import { SettingsModal } from "./components/Settings/SettingsModal";
import { CloseConfirmModal } from "./components/Tabs/CloseConfirmModal";
import type { SettingsTabId } from "./types/plugin";
import { syncPlugins } from "./store/plugins";
import { syncCustomThemes } from "./store/customThemes";
import { scheduleAutomaticUpdateCheck } from "./lib/updater";
import { isMobile } from "./lib/platform";
import {
  currentDocument,
  setCurrentDocument,
  updateDocumentContent,
  updateDocumentRendering,
  displayMode,
  setDisplayMode,
  cycleDisplayMode,
  markSaved,
  markExternallyModified,
  clearExternallyModified,
} from "./store/editor";
import {
  addOrSwitchTab,
  openTabs,
  closeTab,
  selectTab,
  activeTabId,
  setQuickSwitcherOpen,
  syncCurrentDocumentToTab,
  setWorkspaceTree,
} from "./store/files";
import {
  zenMode,
  setZenMode,
  focusMode,
  setFocusMode,
  increaseFontSize,
  decreaseFontSize,
  resetFontSize,
  fontSize,
} from "./store/settings";
import {
  openFile,
  saveFile,
  startWatchingFile,
  stopWatchingFile,
  exportDocument,
  listDirectoryTree,
  getCliArgs,
  closeWindow,
} from "./lib/tauri/commands";
import { onFileChanged, onSingleInstanceOpen } from "./lib/tauri/events";
import { isDropOverTabBar, processFileDrop } from "./lib/dnd";
import { dispatchFormat, type FormatAction } from "./lib/formatter";
import { createSingleFlight } from "./lib/singleFlight";

const App: Component = () => {
  const [sidebarOpen, setSidebarOpen] = createSignal(
    typeof window !== "undefined" ? window.innerWidth >= 768 && !isMobile : true
  );
  const [sidebarWidth, setSidebarWidth] = createSignal(240);
  const [isResizing, setIsResizing] = createSignal(false);
  const [isMobileViewport, setIsMobileViewport] = createSignal(
    typeof window !== "undefined" ? window.innerWidth < 768 || isMobile : false
  );
  const [findReplaceOpen, setFindReplaceOpen] = createSignal(false);
  const [searchModalOpen, setSearchModalOpen] = createSignal(false);
  const [settingsOpen, setSettingsOpen] = createSignal(false);
  const [settingsTab, setSettingsTab] = createSignal<SettingsTabId>("theme");
  const [homeVisible, setHomeVisible] = createSignal(false);
  const [dragHoverTarget, setDragHoverTarget] = createSignal<
    "window" | "tabbar" | "editor" | null
  >(null);
  const [confirmCloseTab, setConfirmCloseTab] = createSignal<{
    tabId: string;
    filename: string;
  } | null>(null);
  let pendingWindowClose = false;

  let tabBarElement: HTMLDivElement | undefined;
  let unlistenFileChanged: (() => void) | null = null;
  let unlistenDragDrop: (() => void) | null = null;
  let unlistenCloseRequested: (() => void) | null = null;
  let unlistenSingleInstance: (() => void) | null = null;
  let autoSaveTimer: number | null = null;
  let cancelAutomaticUpdateCheck: (() => void) | null = null;

  // Handle opening a file via native dialog
  const handleOpenFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: "Markdown", extensions: ["md", "markdown", "mdx", "txt"] },
        ],
      });

      if (selected && typeof selected === "string") {
        await loadFile(selected);
      }
    } catch (err) {
      console.error("Failed to open file dialog:", err);
    }
  };

  // Handle opening a workspace folder
  const handleOpenFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === "string") {
        const tree = await listDirectoryTree(selected);
        setWorkspaceTree(tree);
        setSidebarOpen(true);
      }
    } catch (err) {
      console.error("Failed to open folder:", err);
    }
  };

  // Load a file by path
  const loadFile = async (path: string) => {
    try {
      await stopWatchingFile();
      const result = await openFile(path);
      const docState = {
        path: result.path,
        filename: result.filename,
        content: result.content,
        renderedContent: result.content,
        html: result.html,
        toc: result.toc,
        wordCount: result.word_count,
        isDirty: false,
        externallyModified: false,
      };
      markSaved(result);
      addOrSwitchTab(docState);
      setHomeVisible(false);
      await startWatchingFile(path);
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  };

  // Handle saving the current file (atomic write)
  const saveCurrentFile = async (): Promise<boolean> => {
    const doc = currentDocument();
    try {
      if (doc.path) {
        const result = await saveFile(doc.path, doc.content);
        markSaved(result);
        syncCurrentDocumentToTab();
        return true;
      } else {
        const selected = await save({
          defaultPath: doc.filename.endsWith(".md")
            ? doc.filename
            : `${doc.filename}.md`,
          filters: [
            { name: "Markdown", extensions: ["md", "markdown", "mdx", "txt"] },
          ],
        });

        if (selected && typeof selected === "string") {
          const result = await saveFile(selected, doc.content);
          markSaved(result);
          syncCurrentDocumentToTab();
          await startWatchingFile(selected);
          return true;
        }
        return false;
      }
    } catch (err) {
      console.error("Failed to save file:", err);
      return false;
    }
  };
  const handleSaveFile = createSingleFlight(saveCurrentFile);

  // Request closing a tab, prompting if it has unsaved changes
  const requestCloseTab = (targetTabId?: string, onComplete?: () => void) => {
    syncCurrentDocumentToTab();
    const id = targetTabId || activeTabId();
    if (!id) return;

    const tabs = openTabs();
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;

    const isDirty =
      (id === activeTabId() ? currentDocument().isDirty : false) ||
      tab.document.isDirty;

    if (!isDirty) {
      closeTab(id);
      onComplete?.();
      return;
    }

    // Switch to tab so the user can inspect the document they are about to close
    if (activeTabId() !== id) {
      selectTab(id);
    }

    setConfirmCloseTab({
      tabId: id,
      filename: tab.document.filename,
    });
  };

  const handleConfirmCloseSave = async () => {
    const item = confirmCloseTab();
    if (!item) return;

    const saved = await handleSaveFile();
    if (saved !== false && !currentDocument().isDirty) {
      closeTab(item.tabId);
      setConfirmCloseTab(null);
      if (pendingWindowClose) {
        void checkNextWindowClose();
      }
    }
  };

  const handleConfirmCloseDiscard = () => {
    const item = confirmCloseTab();
    if (!item) return;

    closeTab(item.tabId);
    setConfirmCloseTab(null);
    if (pendingWindowClose) {
      void checkNextWindowClose();
    }
  };

  const handleConfirmCloseCancel = () => {
    setConfirmCloseTab(null);
    pendingWindowClose = false;
  };

  const checkNextWindowClose = async () => {
    syncCurrentDocumentToTab();
    const dirtyTab = openTabs().find(
      (t) =>
        t.document.isDirty ||
        (t.id === activeTabId() && currentDocument().isDirty)
    );
    if (dirtyTab) {
      pendingWindowClose = true;
      requestCloseTab(dirtyTab.id);
    } else {
      pendingWindowClose = false;
      try {
        await closeWindow();
      } catch (e) {
        console.warn("Close window error:", e);
      }
    }
  };

  const handleRequestCloseWindow = () => {
    void checkNextWindowClose();
  };

  // Handle exporting the current document to standalone HTML
  const handleExport = async () => {
    const doc = currentDocument();
    try {
      const selected = await save({
        defaultPath: `${doc.filename.replace(/\.md$/, "")}.html`,
        filters: [{ name: "HTML Document", extensions: ["html"] }],
      });
      if (selected && typeof selected === "string") {
        await exportDocument(doc.content, doc.filename, selected);
        alert(`Exported document successfully to:\n${selected}`);
      }
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  // Handle creating a new document tab
  const handleNewDocument = () => {
    const newDoc = {
      path: null,
      filename: `Untitled-${openTabs().length + 1}.md`,
      content: "",
      renderedContent: "",
      html: "",
      toc: [],
      wordCount: 0,
      isDirty: false,
      externallyModified: false,
    };
    addOrSwitchTab(newDoc);
    setHomeVisible(false);
  };

  // Handle reloading externally modified file
  const reloadCurrentFile = async () => {
    const doc = currentDocument();
    if (doc.path) {
      clearExternallyModified();
      await loadFile(doc.path);
    }
  };

  // Check for CLI startup file arguments (Windows file association opening) & Weekly Update
  onMount(async () => {
    try {
      const cliArgs = await getCliArgs();
      if (cliArgs && cliArgs.length > 0) {
        await loadFile(cliArgs[0]);
      }
    } catch (e) {
      console.warn("CLI args check error:", e);
    }

    try {
      unlistenSingleInstance = await onSingleInstanceOpen(async (files) => {
        if (Array.isArray(files)) {
          for (const filePath of files) {
            await loadFile(filePath);
          }
        }
      });
    } catch (e) {
      console.warn("Single instance listener setup error:", e);
    }

    cancelAutomaticUpdateCheck = scheduleAutomaticUpdateCheck();
    syncPlugins().catch((err) => console.warn("Plugin sync error:", err));
    syncCustomThemes().catch((err) => console.warn("Theme sync error:", err));
  });

  // Synchronize Zen Mode with native window fullscreen state
  createEffect(() => {
    const isZen = zenMode();
    try {
      getCurrentWindow().setFullscreen(isZen).catch((err) => {
        console.warn("Failed to toggle native fullscreen for Zen Mode:", err);
      });
    } catch {
      // In web or mock test environment
    }
  });

  // Set up auto-save interval (every 30 seconds for dirty files with path)
  onMount(() => {
    autoSaveTimer = window.setInterval(() => {
      const doc = currentDocument();
      if (doc.path && doc.isDirty) {
        handleSaveFile();
      }
    }, 30000);
  });

  // Set up file change listener and Drag & Drop listener
  onMount(async () => {
    try {
      unlistenFileChanged = await onFileChanged((_payload) => {
        markExternallyModified();
      });
    } catch (err) {
      console.warn("File changed listener setup:", err);
    }

    try {
      unlistenDragDrop = await getCurrentWebview().onDragDropEvent(
        async (event) => {
          const payload = event.payload;
          const hasDoc = hasDocument();

          if (payload.type === "enter" || payload.type === "over") {
            if (!hasDoc) {
              setDragHoverTarget("window");
            } else {
              const isTabBar = isDropOverTabBar(
                payload.position,
                tabBarElement || null,
                window.devicePixelRatio || 1
              );
              setDragHoverTarget(isTabBar ? "tabbar" : "editor");
            }
          } else if (payload.type === "leave") {
            setDragHoverTarget(null);
          } else if (payload.type === "drop") {
            const isTabBar = isDropOverTabBar(
              payload.position,
              tabBarElement || null,
              window.devicePixelRatio || 1
            );

            await processFileDrop({
              paths: payload.paths,
              isTabBar,
              hasOpenDocument: hasDoc,
              onOpenFile: loadFile,
              onInsertLinks: (markdownLinks) => {
                const doc = currentDocument();
                const newContent = doc.content.trim()
                  ? `${doc.content}\n\n${markdownLinks}\n`
                  : `${markdownLinks}\n`;
                updateDocumentContent(newContent);
              },
            });

            setDragHoverTarget(null);
          }
        }
      );
    } catch (err) {
      console.warn("Drag and drop listener setup:", err);
    }

    try {
      unlistenCloseRequested = await getCurrentWindow().onCloseRequested((event) => {
        syncCurrentDocumentToTab();
        const hasDirty = openTabs().some(
          (t) => t.document.isDirty || (t.id === activeTabId() && currentDocument().isDirty)
        );
        if (hasDirty) {
          event.preventDefault();
          handleRequestCloseWindow();
        }
      });
    } catch {
      // In web/test environment
    }
  });

  onCleanup(() => {
    unlistenFileChanged?.();
    unlistenDragDrop?.();
    unlistenCloseRequested?.();
    unlistenSingleInstance?.();
    cancelAutomaticUpdateCheck?.();
    if (autoSaveTimer !== null) {
      clearInterval(autoSaveTimer);
    }
  });

  // Sidebar resize handling
  const startResize = (e: MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(160, Math.min(500, e.clientX));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Global Keyboard Shortcuts (Content-focused editor first)
  const handleKeyDown = (e: KeyboardEvent) => {
    const isCmd = e.ctrlKey || e.metaKey;

    if (e.key === "Escape" && zenMode()) {
      e.preventDefault();
      setZenMode(false);
      return;
    }

    if (e.key === "F11" || (isCmd && e.shiftKey && (e.key === "Z" || e.key === "z"))) {
      e.preventDefault();
      setZenMode((prev) => !prev);
    } else if (isCmd && (e.key === "=" || e.key === "+")) {
      e.preventDefault();
      increaseFontSize();
    } else if (isCmd && (e.key === "-" || e.key === "_")) {
      e.preventDefault();
      decreaseFontSize();
    } else if (isCmd && e.shiftKey && e.key === "0") {
      e.preventDefault();
      resetFontSize();
    } else if (isCmd && e.shiftKey && (e.key === "F" || e.key === "f")) {
      e.preventDefault();
      setSearchModalOpen((prev) => !prev);
    } else if (isCmd && e.shiftKey && (e.key === "B" || e.key === "b")) {
      // Toggle sidebar shortcut migrated to Ctrl+Shift+B
      e.preventDefault();
      setSidebarOpen((prev) => !prev);
    } else if (isCmd && e.shiftKey && (e.key === "X" || e.key === "x")) {
      // Strikethrough shortcut
      e.preventDefault();
      dispatchFormat("strikethrough");
    } else if (isCmd && e.shiftKey && (e.key === "D" || e.key === "d")) {
      // Focus mode toggle (Ctrl+Shift+D)
      e.preventDefault();
      setFocusMode((prev) => !prev);
    } else if (isCmd && (e.key === "b" || e.key === "B")) {
      // Bold shortcut (Ctrl+B)
      e.preventDefault();
      dispatchFormat("bold");
    } else if (isCmd && (e.key === "i" || e.key === "I")) {
      // Italic shortcut (Ctrl+I)
      e.preventDefault();
      dispatchFormat("italic");
    } else if (isCmd && (e.key === "k" || e.key === "K")) {
      // Link shortcut (Ctrl+K)
      e.preventDefault();
      dispatchFormat("link");
    } else if (isCmd && e.key === "`") {
      // Inline code shortcut (Ctrl+`)
      e.preventDefault();
      dispatchFormat("code_inline");
    } else if (isCmd && e.key === "0") {
      // Normal paragraph shortcut (Ctrl+0)
      e.preventDefault();
      dispatchFormat("paragraph");
    } else if (isCmd && e.key >= "1" && e.key <= "6") {
      // Heading shortcuts (Ctrl+1 ~ Ctrl+6)
      e.preventDefault();
      dispatchFormat(`h${e.key}` as FormatAction);
    } else if (isCmd && e.key === "o") {
      e.preventDefault();
      handleOpenFile();
    } else if (isCmd && e.key === "s") {
      e.preventDefault();
      handleSaveFile();
    } else if (isCmd && e.key === "e") {
      e.preventDefault();
      handleExport();
    } else if (isCmd && e.key === "n") {
      e.preventDefault();
      handleNewDocument();
    } else if (isCmd && (e.key === "w" || e.key === "W")) {
      e.preventDefault();
      requestCloseTab();
    } else if (isCmd && e.key === "p") {
      e.preventDefault();
      setQuickSwitcherOpen((prev) => !prev);
    } else if (isCmd && (e.key === "f" || e.key === "h")) {
      e.preventDefault();
      setFindReplaceOpen((prev) => !prev);
    } else if (isCmd && e.shiftKey && (e.key === "X" || e.key === "x")) {
      e.preventDefault();
      handleOpenSettings("plugins");
    } else if (isCmd && e.key === ",") {
      e.preventDefault();
      handleOpenSettings("theme");
    } else if (isCmd && e.key === "/") {
      e.preventDefault();
      cycleDisplayMode();
    }
  };

  const handleOpenSettings = (tab: SettingsTabId = "theme") => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  const handleResize = () => {
    setIsMobileViewport(window.innerWidth < 768 || isMobile);
  };

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("resize", handleResize);
  });

  const doc = () => currentDocument();
  const hasDocument = () =>
    doc().path !== null || doc().content.length > 0 || openTabs().length > 0;

  // Shared Viewport Content (WelcomeHub or Tri-State Reading/Writing/Code View)
  const renderViewport = () => (
    <Show
      when={hasDocument() && !homeVisible()}
      fallback={
        <WelcomeHub
          onNewDocument={handleNewDocument}
          onOpenFile={handleOpenFile}
          onOpenRecent={loadFile}
        />
      }
    >
      <Show when={displayMode() === "reading"}>
        <MarkdownView
          content={doc().content}
          renderedContent={doc().renderedContent}
          html={doc().html}
          externallyModified={doc().externallyModified}
          onReload={reloadCurrentFile}
          onRendered={(sourceContent, result) => {
            updateDocumentRendering(sourceContent, result);
            syncCurrentDocumentToTab();
          }}
        />
      </Show>

      <Show when={displayMode() === "writing"}>
        <Editor />
      </Show>

      <Show when={displayMode() === "code"}>
        <CodeView />
      </Show>
    </Show>
  );

  return (
    <div
      class={`flex flex-col h-screen relative ${zenMode() ? "zen-mode" : ""} ${focusMode() ? "focus-mode" : ""}`}
      style={{ background: "var(--color-bg-primary)", color: "var(--color-text-primary)" }}
    >
      {/* Floating Exit Button for Zen Mode */}
      <Show when={zenMode()}>
        <button
          class="fixed top-3 right-4 z-50 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-bg-secondary)]/90 hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] shadow-md backdrop-blur-xs transition-all flex items-center gap-1.5 opacity-60 hover:opacity-100"
          onClick={() => setZenMode(false)}
          title="Exit Zen Mode (Esc)"
        >
          <span>✕</span>
          <span>Exit Zen Mode (Esc)</span>
        </button>
      </Show>

      {/* 1. MOBILE PORTRAIT LAYOUT */}
      <Show when={isMobileViewport()}>
        <MobileShell
          onOpenFile={loadFile}
          onNewDocument={handleNewDocument}
          onOpenQuickSwitcher={() => setQuickSwitcherOpen(true)}
        >
          {renderViewport()}
        </MobileShell>
      </Show>

      {/* 2. DESKTOP WIDE LAYOUT */}
      <Show when={!isMobileViewport()}>
        {/* Top VS Code-Style Menu Bar */}
        <Show when={!zenMode()}>
          <MenuBar
            homeVisible={homeVisible()}
            sidebarOpen={sidebarOpen()}
            onGoHome={() => setHomeVisible(true)}
            onNewDocument={handleNewDocument}
            onOpenFile={handleOpenFile}
            onOpenFolder={handleOpenFolder}
            onSaveFile={handleSaveFile}
            onExport={handleExport}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            onOpenQuickSwitcher={() => setQuickSwitcherOpen(true)}
            onOpenSearchModal={() => setSearchModalOpen(true)}
            onOpenFindReplace={() => setFindReplaceOpen(true)}
            onOpenThemeSettings={() => handleOpenSettings("theme")}
            onOpenSettings={handleOpenSettings}
            onOpenRecent={loadFile}
            onCloseTab={() => requestCloseTab()}
            onCloseWindow={handleRequestCloseWindow}
          />
        </Show>

        {/* Full-width document tab bar */}
        <Show when={openTabs().length > 0 && !zenMode()}>
          <TabBar
            ref={(el) => (tabBarElement = el)}
            isDragOver={dragHoverTarget() === "tabbar"}
            onNewTab={handleNewDocument}
            onSelectTab={() => setHomeVisible(false)}
            onCloseTab={(id) => requestCloseTab(id)}
          />
        </Show>

        {/* Main Desktop Workspace Area */}
        <div
          class="flex flex-1 overflow-hidden"
          style={{ cursor: isResizing() ? "col-resize" : "default" }}
        >
          {/* Workspace & Outline Sidebar */}
          <Show when={sidebarOpen() && !zenMode()}>
            <div
              class="flex-shrink-0 overflow-hidden flex flex-col no-select"
              style={{
                width: `${sidebarWidth()}px`,
                background: "var(--color-sidebar-bg)",
                "border-right": "1px solid var(--color-border)",
              }}
            >
              <Sidebar onSelectFile={loadFile} />
            </div>

            {/* Resize handle */}
            <div
              class="w-1 cursor-col-resize hover:bg-[var(--color-accent)] transition-colors flex-shrink-0"
              style={{ background: isResizing() ? "var(--color-accent)" : "transparent" }}
              onMouseDown={startResize}
            />
          </Show>

          {/* Center Panel (Toolbar + Viewport) */}
          <div class="flex-1 flex flex-col overflow-hidden relative">
            {/* Editor Quick Format Toolbar (Writing / Code modes) */}
            <Show
              when={
                hasDocument() &&
                !homeVisible() &&
                (displayMode() === "writing" || displayMode() === "code") &&
                !zenMode()
              }
            >
              <EditorToolbar />
            </Show>

            {/* Viewport Area */}
            <main class="flex-1 overflow-hidden relative">
              {/* Editor drop overlay to insert link */}
              <Show when={dragHoverTarget() === "editor"}>
                <div class="absolute inset-0 z-40 bg-[var(--color-bg-primary)]/80 backdrop-blur-xs flex items-center justify-center border-3 border-dashed border-[var(--color-accent)] m-3 rounded-xl pointer-events-none animate-in fade-in">
                  <div class="text-center space-y-1.5">
                    <svg class="w-10 h-10 mx-auto text-[var(--color-accent)] animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <p class="text-sm font-bold text-[var(--color-accent)]">
                      Drop file here to insert link
                    </p>
                    <p class="text-xs text-[var(--color-text-secondary)] opacity-70">Images render as ![](...) and docs as [](..)</p>
                  </div>
                </div>
              </Show>

              {renderViewport()}
            </main>
          </div>
        </div>

        {/* Persistent Status Bar (Desktop) */}
        <StatusBar />
      </Show>

      {/* 3. SHARED MODALS & OVERLAYS */}
      {/* Full-window drop overlay when no file is open */}
      <Show when={dragHoverTarget() === "window"}>
        <div class="fixed inset-0 z-50 bg-[var(--color-bg-primary)]/85 backdrop-blur-xs flex items-center justify-center border-3 border-dashed border-[var(--color-accent)] m-4 rounded-2xl pointer-events-none transition-all animate-in fade-in">
          <div class="text-center space-y-2">
            <svg class="w-12 h-12 mx-auto text-[var(--color-accent)] animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
            <p class="text-base font-bold text-[var(--color-accent)]">
              Drop Markdown file here to open directly
            </p>
            <p class="text-xs text-[var(--color-text-secondary)] opacity-70">Supports .md, .markdown, .txt, .mdx</p>
          </div>
        </div>
      </Show>

      {/* Quick Switcher Palette (Ctrl+P) */}
      <QuickSwitcher onOpenFileByPath={loadFile} />

      {/* Global Workspace Search Modal (Ctrl+Shift+F) */}
      <SearchModal
        isOpen={searchModalOpen()}
        onClose={() => setSearchModalOpen(false)}
        onSelectResult={loadFile}
      />

      {/* In-Document Find & Replace Toolbar (Ctrl+F / Ctrl+H) */}
      <FindReplace
        isOpen={findReplaceOpen()}
        onClose={() => setFindReplaceOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen()}
        initialTab={settingsTab()}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Unsaved Changes Close Confirmation Dialog */}
      <CloseConfirmModal
        isOpen={confirmCloseTab() !== null}
        filename={confirmCloseTab()?.filename || ""}
        onSave={handleConfirmCloseSave}
        onDiscard={handleConfirmCloseDiscard}
        onCancel={handleConfirmCloseCancel}
      />

      {/* GitHub Releases Update Modal */}
      <UpdateModal />
    </div>
  );
};

export default App;

import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

export interface TocEntry {
  level: number;
  text: string;
  id: string;
}

export interface OpenFileResponse {
  path: string;
  filename: string;
  content: string;
  html: string;
  toc: TocEntry[];
  word_count: number;
}

export interface RenderResult {
  html: string;
  toc: TocEntry[];
  word_count: number;
}

/**
 * Open a file by path: read, parse, and return full render data.
 */
export async function openFile(path: string): Promise<OpenFileResponse> {
  return invoke<OpenFileResponse>("open_file", { path });
}

/**
 * Save content to a file.
 */
export async function saveFile(
  path: string,
  content: string,
  expectedContent: string | null
): Promise<OpenFileResponse> {
  return invoke<OpenFileResponse>("save_file", { path, content, expectedContent });
}

export async function readFileBaseline(path: string): Promise<string | null> {
  return invoke<string | null>("read_file_baseline", { path });
}

/**
 * Get the currently active document.
 */
export async function getActiveDocument(): Promise<OpenFileResponse | null> {
  return invoke<OpenFileResponse | null>("get_active_document");
}

/**
 * Render markdown string to HTML with TOC and word count.
 */
export async function renderMarkdown(
  markdown: string
): Promise<RenderResult> {
  return invoke<RenderResult>("render_markdown", { markdown });
}

/**
 * Highlight a code block.
 */
export async function highlightCode(
  code: string,
  language: string
): Promise<string> {
  return invoke<string>("highlight_code", { code, language });
}

/**
 * Start watching a file for external changes.
 */
export async function startWatchingFile(path: string): Promise<void> {
  return invoke<void>("start_watching_file", { path });
}

/**
 * Stop watching the current file.
 */
export async function stopWatchingFile(path?: string): Promise<void> {
  return invoke<void>("stop_watching_file", { path });
}

/**
 * Get command line file arguments passed when opening files from Windows Explorer.
 */
export async function getCliArgs(): Promise<string[]> {
  return invoke<string[]>("get_cli_args");
}

/**
 * Minimize the application window.
 */
export async function minimizeWindow(): Promise<void> {
  try {
    await getCurrentWindow().minimize();
  } catch {
    await invoke<void>("minimize_window");
  }
}

/**
 * Toggle maximize / restore for the application window.
 */
export async function toggleMaximizeWindow(): Promise<void> {
  try {
    await getCurrentWindow().toggleMaximize();
  } catch {
    await invoke<void>("toggle_maximize_window");
  }
}

/**
 * Destroy the application window after the caller has resolved unsaved changes.
 */
export async function closeWindow(): Promise<void> {
  try {
    await getCurrentWindow().destroy();
  } catch {
    await invoke<void>("close_window");
  }
}

/**
 * Check if the application window is currently maximized.
 */
export async function isWindowMaximized(): Promise<boolean> {
  try {
    return await getCurrentWindow().isMaximized();
  } catch {
    return await invoke<boolean>("is_window_maximized");
  }
}

/**
 * Start dragging the application window.
 */
export async function startDrag(): Promise<void> {
  try {
    await getCurrentWindow().startDragging();
  } catch {
    await invoke<void>("start_drag");
  }
}

/**
 * Greet command — used to verify IPC round-trip works.
 */
export async function greet(name: string): Promise<string> {
  return invoke<string>("greet", { name });
}

export interface FileEntry {
  name: string;
  path: string;
  is_directory: boolean;
  children?: FileEntry[];
}

/**
 * List a workspace directory recursively.
 */
export async function listDirectoryTree(path: string): Promise<FileEntry> {
  return invoke<FileEntry>("list_directory_tree", { path });
}

/**
 * Create a new file or folder.
 */
export async function createEntry(
  parentPath: string,
  name: string,
  isDirectory: boolean
): Promise<void> {
  return invoke<void>("create_entry", { parentPath, name, isDirectory });
}

/**
 * Delete a file or folder.
 */
export async function deleteEntry(path: string): Promise<void> {
  return invoke<void>("delete_entry", { path });
}

/**
 * Rename a file or folder.
 */
export async function renameEntry(
  oldPath: string,
  newPath: string
): Promise<void> {
  return invoke<void>("rename_entry", { oldPath, newPath });
}

/**
 * Export document to standalone HTML/PDF.
 */
export async function exportDocument(
  markdown: string,
  title: string,
  outputPath: string
): Promise<void> {
  return invoke<void>("export_document", {
    markdown,
    title,
    outputPath,
  });
}

export interface SearchMatch {
  file_path: string;
  file_name: string;
  line_number: number;
  line_content: string;
  match_start: number;
  match_end: number;
}

export interface WorkspaceSearchResult {
  matches: SearchMatch[];
  truncated: boolean;
}

/**
 * Perform workspace full-text search.
 */
export async function searchWorkspace(
  query: string,
  rootPath: string
): Promise<WorkspaceSearchResult> {
  return invoke<WorkspaceSearchResult>("search_workspace", {
    query,
    rootPath,
  });
}

/**
 * List all installed plugins from the user's plugins directory.
 */
export async function listPlugins(): Promise<any[]> {
  return invoke<any[]>("list_plugins");
}

/**
 * Open the native plugins directory in the OS file explorer.
 */
export async function openPluginsFolder(): Promise<void> {
  return invoke<void>("open_plugins_folder");
}

/**
 * Read the main JavaScript source of a specific plugin.
 */
export async function readPluginSource(pluginId: string): Promise<string> {
  return invoke<string>("read_plugin_source", { pluginId });
}

/**
 * Fetch the list of available plugins from BerryUIKI/Taleno-Plugins registry.
 */
export async function fetchMarketplacePlugins(): Promise<any[]> {
  return invoke<any[]>("fetch_marketplace_plugins");
}

/**
 * Install a remote plugin into the user's plugins directory.
 */
export async function installPlugin(
  pluginId: string,
  rawBaseUrl: string,
  entryFile?: string
): Promise<any> {
  return invoke<any>("install_plugin", {
    pluginId,
    rawBaseUrl,
    entryFile,
  });
}

/**
 * Uninstall a plugin from the user's plugins directory.
 */
export async function uninstallPlugin(pluginId: string): Promise<void> {
  return invoke<void>("uninstall_plugin", { pluginId });
}

/**
 * Update an existing plugin from the remote registry.
 */
export async function updatePlugin(
  pluginId: string,
  rawBaseUrl: string,
  entryFile?: string
): Promise<any> {
  return invoke<any>("update_plugin", {
    pluginId,
    rawBaseUrl,
    entryFile,
  });
}

/**
 * List all installed custom themes.
 */
export async function listThemes(): Promise<any[]> {
  return invoke<any[]>("list_themes");
}

/**
 * Read the CSS stylesheet of an installed theme.
 */
export async function readThemeCss(themeId: string): Promise<string> {
  return invoke<string>("read_theme_css", { themeId });
}

/**
 * Open the user's themes folder in the OS file explorer.
 */
export async function openThemesFolder(): Promise<void> {
  return invoke<void>("open_themes_folder");
}

/**
 * Fetch available themes from the remote registry.
 */
export async function fetchMarketplaceThemes(): Promise<any[]> {
  return invoke<any[]>("fetch_marketplace_themes");
}

/**
 * Install a remote theme into the user's themes directory.
 */
export async function installTheme(
  themeId: string,
  rawBaseUrl: string,
  entryFile?: string
): Promise<any> {
  return invoke<any>("install_theme", {
    themeId,
    rawBaseUrl,
    entryFile,
  });
}

/**
 * Uninstall a theme from the user's themes directory.
 */
export async function uninstallTheme(themeId: string): Promise<void> {
  return invoke<void>("uninstall_theme", { themeId });
}




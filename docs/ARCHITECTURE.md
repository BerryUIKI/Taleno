# Taleno Architecture

Taleno is a high-performance, seamless in-place WYSIWYG Markdown reader-editor built on **Tauri 2**, **Rust**, **SolidJS**, and **Milkdown**. This document outlines the technical architecture, component boundaries, data flows, security constraints, and performance goals of the application.

---

## 1. System Overview

Taleno utilizes a cross-platform application architecture separating user interface rendering and systems-level operations across **Desktop** (Windows, macOS, Linux) and **Mobile** (iOS, Android):

- **Frontend (WebView)**: Built with **SolidJS** and **Milkdown** (ProseMirror-based). Runs within the host platform's native WebView (WebView2 on Windows, WebKit on macOS and iOS, WebKitGTK on Linux, Android System WebView on Android). Responsible for immediate user input handling, WYSIWYG Markdown rendering, responsive viewport management, editor state management, and touch/keyboard controls.
- **Backend (Rust Process)**: Built on the **Tauri 2** core. Responsible for native operating system interactions, secure file system access (atomic reads/writes within platform sandboxes), Markdown parsing/transformation for export, high-speed syntax highlighting with `syntect`, workspace indexing, and application configuration persistence.
- **Inter-Process Communication (IPC)**: Strongly typed communication layer utilizing Tauri Commands (invoke) for request-response interactions and Tauri Events (listen/emit) for asynchronous backend-driven notifications.

```
+-------------------------------------------------------------------------+
|                              Native Window                              |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                   SolidJS Frontend (WebView)                      |  |
|  |                                                                   |  |
|  |  +-------------------+ +-------------------+ +-----------------+  |  |
|  |  |   Sidebar / Nav   | |  Milkdown Editor  | |   Status Bar    |  |  |
|  |  +-------------------+ +-------------------+ +-----------------+  |  |
|  |            |                     |                    |           |  |
|  |            +---------------------+--------------------+           |  |
|  |                                  |                                |  |
|  |                        [ SolidJS Signal Store ]                   |  |
|  |                                  |                                |  |
|  |                       [ Typed IPC Wrapper lib ]                   |  |
|  +----------------------------------+--------------------------------+  |
|                                     |                                   |
|                        Tauri 2 IPC Bridge (JSON)                        |
|                                     |                                   |
|  +----------------------------------+--------------------------------+  |
|  |                        Rust Backend Core                          |  |
|  |                                                                   |  |
|  |  +-------------------+ +-------------------+ +-----------------+  |  |
|  |  |  Tauri Commands   | |    Tauri State    | |   Event Emitter |  |  |
|  |  +-------------------+ +-------------------+ +-----------------+  |  |
|  |            |                     |                    |           |  |
|  |  +-------------------+ +-------------------+ +-----------------+  |  |
|  |  |  File I/O Service | |   pulldown-cmark  | | syntect Engine  |  |  |
|  |  |  (Atomic Writes)  | |   Parser & Export | | (Highlighter)   |  |  |
|  |  +-------------------+ +-------------------+ +-----------------+  |  |
|  +----------------------------------+--------------------------------+  |
+-------------------------------------|-----------------------------------+
                                      |
                           Local File System & OS
```

---

## 2. Architecture Diagram (Mermaid)

```mermaid
flowchart TB
    subgraph Frontend["Frontend (WebView / SolidJS)"]
        UI["SolidJS UI Components\n(Sidebar, StatusBar, Tabs, Toolbar)"]
        Store["SolidJS Store & State\n(Active File, Config, Workspace)"]
        Editor["Milkdown Editor Engine\n(ProseMirror Plugins, Markdown AST)"]
        IPCClient["IPC Wrapper Client\n(invoke / listen)"]

        UI <--> Store
        UI <--> Editor
        Editor <--> Store
        Store <--> IPCClient
    end

    subgraph IPC["Tauri 2 IPC Bridge"]
        Invoke["Commands (Request / Response)"]
        Events["Events (Pub / Sub Stream)"]
    end

    subgraph Backend["Rust Backend (Tauri 2 Core)"]
        CmdRouter["Command Router / Dispatcher"]
        AppState["Managed AppState\n(Active Workspace, Cache, Settings)"]
        
        subgraph Services["Core Services"]
            FileService["File I/O Service\n(Atomic Writes, Safe Reads)"]
            ParserService["Parser Service\n(pulldown-cmark GFM)"]
            HighlightService["Highlighter Service\n(syntect Engine)"]
            SearchService["Search & Index Service\n(Workspace Scanning)"]
            ExportService["Export Service\n(HTML / PDF Generation)"]
            PluginService["Plugin Service\n(Directory Scanning & Sandbox)"]
        end

        CmdRouter --> Services
        CmdRouter <--> AppState
        Services <--> AppState
    end

    subgraph OS["Operating System & Storage"]
        FS["Local File System\n(Markdown Files, Assets, Temp Files)"]
        NativeDialogs["Native Dialogs\n(File Open, Save, Pickers)"]
    end

    IPCClient -->|Invoke Call| Invoke
    Invoke --> CmdRouter
    CmdRouter -->|Response| Invoke
    Invoke --> IPCClient

    Services -->|Emit Async Event| Events
    Events --> IPCClient

    FileService <--> FS
    SearchService --> FS
    ExportService --> FS
    CmdRouter <--> NativeDialogs
```

---

## 3. Data Flow for Key Operations

### 3.1. Open File Flow
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as SolidJS UI
    participant IPC as Tauri IPC
    participant Rust as Rust FileService
    participant FS as Local File System
    participant Editor as Milkdown Editor

    User->>UI: Selects file from tree or Open File dialog
    UI->>IPC: invoke("read_file", { path: string })
    IPC->>Rust: Handle read_file command
    Rust->>FS: Read file buffer & verify UTF-8
    FS-->>Rust: File bytes / text
    Rust-->>IPC: Return FilePayload { path, content, modified_time }
    IPC-->>UI: Resolve Promise with payload
    UI->>UI: Update ActiveFile state & mark isDirty = false
    UI->>Editor: Load Markdown content into Milkdown AST
    Editor-->>UI: Render updated DOM
```

### 3.2. Save File (Atomic Write) Flow
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as SolidJS UI
    participant Editor as Milkdown Editor
    participant IPC as Tauri IPC
    participant Rust as Rust FileService
    participant FS as Local File System

    User->>UI: Triggers Save (Ctrl+S / Cmd+S)
    UI->>Editor: Serialize current editor state to Markdown string
    Editor-->>UI: Markdown text string
    UI->>IPC: invoke("save_file_atomic", { path, content })
    IPC->>Rust: Handle save_file_atomic command
    Rust->>FS: Write content to temporary file (path + ".tmp.Taleno")
    FS-->>Rust: Temporary write successful
    Rust->>FS: Atomic rename/replace tmp file -> target file
    FS-->>Rust: Rename successful
    Rust-->>IPC: Return SaveResult { success: true, timestamp }
    IPC-->>UI: Resolve Promise
    UI->>UI: Update state (isDirty = false, lastSaved = timestamp)
```

### 3.3. Live Editing Flow
1. User types in the Milkdown editor surface.
2. ProseMirror transaction updates the internal schema document model in memory.
3. Milkdown triggers change listeners.
4. SolidJS store captures change event, sets `activeFile.isDirty = true`, and recalculates word/character counts.
5. Status bar reacts with zero-overhead SolidJS fine-grained signal subscriptions.

### 3.4. Code Syntax Highlighting Flow
1. For dynamic client-side rendering of inline/block code, standard Milkdown Prism/Shiki/highlight tokens run in the WebView.
2. For large code blocks, static preview, or Rust-side export pipelines, code blocks are routed to Rust's `syntect` engine via `invoke("highlight_code", { code, language, theme })` returning pre-highlighted HTML spans.

### 3.5. Export Flow (HTML / PDF)
1. User initiates Export (e.g. Export to HTML).
2. Frontend serializes current document or passes file path to Rust.
3. Rust backend invokes `pulldown-cmark` with GitHub Flavored Markdown (GFM) flags enabled (tables, task lists, strikethrough, footnotes).
4. Rust backend passes HTML fragments through template renderer, bundles styling and syntax-highlighted code blocks, and writes final artifact to disk or invokes native print/PDF generator.

---

## 4. Technology Stack

| Layer | Technology | Version / Specification | Rationale |
| :--- | :--- | :--- | :--- |
| **Desktop Shell** | Tauri | `v2.x` | Native OS integration, minimal memory footprint, tiny binary size, strong capability security model. |
| **Frontend Framework** | SolidJS | `v1.9+` | Fine-grained reactivity without Virtual DOM overhead; ideal for high-throughput editor interactions. |
| **Language (Frontend)** | TypeScript | `v5.x` | Strict type safety across UI components, stores, and IPC wrappers. |
| **Editor Core** | Milkdown | `v7.x` | ProseMirror-based WYSIWYG editor with first-class Markdown AST state. |
| **Styling** | Tailwind CSS | `v4.x` | Modern, utility-first CSS engine with dark/light mode CSS variable tokens. |
| **Frontend Tooling** | Vite | `v6.x` | Instant HMR, modern ESM bundling, fast build pipelines. |
| **Backend Language** | Rust | `2024 Edition (1.85+)` | Memory safety, zero-cost abstractions, native multithreading. |
| **Markdown Parser** | `pulldown-cmark` | `0.12+` | High-performance pull-parser for GFM, used in backend export and indexing. |
| **Syntax Highlighting** | `syntect` | `5.2+` | Fast, accurate Sublime-compatible syntax highlighter in pure Rust. |
| **Serialization** | `serde` / `serde_json` | `1.0+` | Type-safe JSON serialization for IPC payloads. |

---

## 5. Module Structure

### 5.1. Rust Backend (`src-tauri/`)

```
src-tauri/
├── Cargo.toml
├── tauri.conf.json
├── capabilities/
│   └── default.json          # Tauri v2 capability permissions
├── icons/                    # Application icons
└── src/
    ├── main.rs               # Application entry point
    ├── lib.rs                # App setup and command registrations
    ├── state.rs              # AppState definition and thread-safe containers
    ├── commands/             # Tauri IPC command handlers
    │   ├── mod.rs
    │   ├── editor.rs         # Markdown processing and parsing commands
    │   ├── file.rs           # File I/O, open, save, exists commands
    │   ├── highlight.rs      # Syntect syntax highlighting commands
    │   ├── plugin.rs         # Plugin listing, source reading, directory opener
    │   └── workspace.rs      # Directory traversal and file tree commands
    ├── models/               # Domain data structures (Serde-enabled)
    │   ├── mod.rs
    │   ├── document.rs       # FileEntry, DocumentMeta
    │   ├── file_item.rs      # File tree node representation
    │   ├── payload.rs        # IPC response/request wrappers
    │   ├── plugin.rs         # PluginManifest and metadata models
    │   └── settings.rs       # Editor and app settings schema
    └── services/             # Core business logic
        ├── mod.rs
        ├── atomic_writer.rs  # Safe file write implementation
        ├── exporter.rs       # Markdown to HTML/PDF transformation
        ├── fs_service.rs     # Safe file system operations
        ├── highlighter.rs    # Syntect theme and syntax manager
        ├── parser.rs         # pulldown-cmark wrapper
        ├── plugin_service.rs # Plugin scanner, starter templates & explorer opener
        └── watcher.rs        # Background file change watcher
```

### 5.2. Frontend (`src/`)

```
src/
├── index.html
├── main.tsx                  # SolidJS root mount
├── App.tsx                   # Main application layout
├── vite-env.d.ts
├── assets/                   # Static assets & icons
├── components/               # SolidJS UI components
│   ├── editor/
│   │   ├── MilkdownEditor.tsx
│   │   └── EditorToolbar.tsx
│   ├── sidebar/
│   │   ├── FileTree.tsx
│   │   ├── FileItem.tsx
│   │   └── SidebarHeader.tsx
│   ├── statusbar/
│   │   ├── StatusBar.tsx
│   │   └── StatsDisplay.tsx
│   └── common/
│       ├── Button.tsx
│       ├── Dialog.tsx
│       └── Tooltip.tsx
├── lib/                      # Utilities and backend bridges
│   ├── plugins/
│   │   └── runtime.ts        # Plugin execution sandbox & Context API
│   ├── tauri/
│   │   ├── commands.ts       # Typed Tauri invoke wrappers
│   │   ├── events.ts         # Typed Tauri event listeners
│   │   └── fs.ts             # File system client helper
│   ├── milkdown/
│   │   ├── plugins.ts        # Milkdown plugin configurations
│   │   └── theme.ts          # Editor theme integration
│   └── utils/
│       ├── platform.ts       # OS detection (macOS/Windows/Linux)
│       └── shortcuts.ts      # Keyboard shortcut manager
├── store/                    # SolidJS reactive stores & signals
│   ├── editorStore.ts        # Active file, dirty flag, cursor position
│   ├── plugins.ts            # Reactive plugin list and toggle signals
│   ├── workspaceStore.ts     # Workspace directory, expanded nodes
│   └── settingsStore.ts      # Theme, font size, auto-save settings
├── styles/                   # Stylesheets
│   ├── global.css            # Tailwind directives and base styles
│   ├── theme.css             # Light/dark mode CSS variables
│   └── typography.css        # Markdown document styling
└── types/                    # Shared TypeScript interfaces
    ├── file.ts               # FileItem, FilePayload, DirectoryTree
    ├── ipc.ts                # Command names and payload types
    ├── plugin.ts             # PluginManifest and SettingsTabId types
    └── settings.ts           # User preference types
```

---

## 6. IPC Design

Tauri 2 IPC provides a type-safe boundary between the WebView JavaScript runtime and the compiled Rust native runtime.

### 6.1. Commands (Request / Response)
Used for explicit user-initiated actions that require a direct response.

| Command Name | Arguments | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `read_file` | `{ path: string }` | `FilePayload` | Reads content and metadata of a Markdown file. |
| `write_file_atomic` | `{ path: string, content: string }` | `WriteResult` | Atomically writes document to disk. |
| `read_directory` | `{ path: string, recursive?: boolean }` | `FileItem[]` | Traverses workspace directory tree. |
| `highlight_code` | `{ code: string, lang: string, theme?: string }` | `string` | Returns syntax-highlighted HTML string. |
| `parse_markdown` | `{ content: string }` | `string` | Parses Markdown to sanitized HTML via `pulldown-cmark`. |
| `get_app_settings` | `None` | `AppSettings` | Retrieves current application configuration. |
| `save_app_settings` | `{ settings: AppSettings }` | `void` | Persists updated application configuration. |
| `list_plugins` | `None` | `PluginManifest[]` | Scans user plugins directory and returns manifests. |
| `open_plugins_folder` | `None` | `void` | Launches native OS file manager at plugins directory. |
| `read_plugin_source` | `{ pluginId: string }` | `string` | Reads JavaScript source code of a specified plugin. |

### 6.2. Events (Asynchronous Notifications)
Used for broadcasting state changes or background system events.

| Event Channel | Payload Type | Description |
| :--- | :--- | :--- |
| `Taleno://file-changed` | `{ path: string, kind: string }` | Notifies when open file is modified externally. |
| `Taleno://theme-changed` | `{ theme: "light" \| "dark" }` | Emitted on OS system theme transition. |
| `Taleno://menu-action` | `{ action: string }` | Emitted when native application menu item is clicked. |

---

## 7. Security Model

Taleno adheres to strict **least-privilege** security practices enabled by Tauri v2:

1. **Capability Scopes**:
   - Explicit permissions defined in `src-tauri/capabilities/default.json`.
   - File system access is restricted to user-opened files and designated workspace directories. Arbitrary system-level file access is denied by default.
2. **Content Security Policy (CSP)**:
   - Rigid CSP defined in `tauri.conf.json` preventing arbitrary remote script injection, inline execution of untrusted scripts, and external network calls.
   - `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' asset: https: data:; font-src 'self' data:;`
3. **Rust Memory & Input Validation**:
   - All paths received via IPC are sanitized and canonicalized to prevent path traversal attacks (`../` exploits).
   - Atomic writes prevent partial file truncation and race conditions.

---

## 8. Performance Targets

| Metric | Target | Measurement Strategy |
| :--- | :--- | :--- |
| **Cold Startup Time** | `< 1000ms` | Time from process launch to interactive editor render. |
| **Warm Startup Time** | `< 400ms` | Time to restore window and load previous session. |
| **Keystroke Latency** | `< 16ms` (60fps) | Time from keyboard event to ProseMirror DOM flush. |
| **File Open (1MB Markdown)** | `< 200ms` | Read from disk, IPC transfer, AST generation, and DOM paint. |
| **Memory Footprint (Idle)** | `< 90MB` | Total working set across WebView and Rust backend processes. |

---

## 9. Plugin & Extensibility Architecture

Taleno provides a local-first, sandboxed plugin system enabling users and developers to extend editor capabilities, register custom commands, and add workspace tooling without altering core binaries.

### 9.1 Storage & Discovery
Plugins are stored in the platform application data directory resolved from Tauri's bundle identifier (`com.berryuiki.taleno`):
- **Windows**: `%APPDATA%\com.berryuiki.taleno\plugins\<plugin-id>\`
- **macOS**: `~/Library/Application Support/com.berryuiki.taleno/plugins/<plugin-id>/`
- **Linux**: `~/.local/share/com.berryuiki.taleno/plugins/<plugin-id>/` (or `$XDG_DATA_HOME/com.berryuiki.taleno/plugins/<plugin-id>/`)

Users can reveal this directory directly from **Settings ➔ Plugins ➔ "Open Plugins Folder"** via native shell integration.
On startup, the Rust backend `plugin_service` verifies this directory exists and automatically writes a documented starter plugin (`sample-timestamp`) if empty.

### 9.2 Plugin Manifest (`manifest.json`)
```json
{
  "id": "my-custom-plugin",
  "name": "My Custom Plugin",
  "version": "1.0.0",
  "description": "Demonstrates custom command registration and editor interaction.",
  "author": "Author Name",
  "enabled": true,
  "main": "main.js",
  "tags": ["sample", "utility"],
  "permissions": ["editor:write"]
}
```

### 9.3 Runtime Sandbox & Context API (`TalenoPluginContext`)
Plugins export an `onload(ctx)` and optional `onunload()` lifecycle hook:

```javascript
export default {
  onload(ctx) {
    ctx.commands.registerCommand({
      id: "insert-greeting",
      title: "Insert Greeting",
      run() {
        ctx.editor.insertText("\n> Hello from custom plugin!\n");
      }
    });
  },
  onunload() {
    // Cleanup hooks
  }
};
```

All commands, UI elements, and event listeners registered through `ctx` are tracked in a disposal bag and cleaned up when the plugin is toggled off or reloaded.

### 9.4 Entry Points & Management UI
- **Top Menu Bar**: `File ➔ Preferences ➔ Plugins...` (<kbd>Ctrl+Shift+X</kbd> / <kbd>Cmd+Shift+X</kbd>).
- **Settings Modal**: Dedicated `Plugins` tab with real-time text filter, "Open Plugins Folder" button, "Reload Plugins" button, and on/off switches.

### 9.5 Developer Standards & Registry
- For comprehensive plugin developer instructions, see [Plugin Development Handbook](PLUGIN_DEVELOPMENT.md).
- Official plugin registry and community submission hub: [BerryUIKI/Taleno-Plugins](https://github.com/BerryUIKI/Taleno-Plugins).

### 9.6 Custom Themes & Skins Architecture
- Custom themes are managed under the identifier-derived application data directory (e.g. `%APPDATA%\com.berryuiki.taleno\themes\<theme-id>\` on Windows), accessible via the **"Open Themes Folder"** button in Settings.
- Themes provide a `theme.json` metadata file and a `theme.css` token override stylesheet that dynamically configures the CSS variables on `:root` without full DOM re-renders or application restarts.
- For complete theme styling instructions and palette references, see [Theme Development Handbook](THEME_DEVELOPMENT.md).

---

## 10. Multi-Platform & Mobile Architecture (iOS & Android)

Taleno extends its unified code base to mobile operating systems (iOS and Android) using Tauri 2's mobile toolchain and native runtime bindings.

### 10.1 Platform Target Matrix

| Layer | Desktop (macOS, Windows, Linux) | iOS | Android |
| :--- | :--- | :--- | :--- |
| **WebView Engine** | WebKit / WebView2 / WebKitGTK | WebKit (WKWebView) | Android System WebView (Chromium) |
| **Rust Entry Point** | `src-tauri/src/main.rs` | `#[tauri::mobile_entry_point]` in `lib.rs` | `#[tauri::mobile_entry_point]` in `lib.rs` |
| **Project Gen Directory** | Standard Cargo layout | `src-tauri/gen/apple/` | `src-tauri/gen/android/` |
| **Primary File Root** | Arbitrary local filesystem paths | `NSDocumentDirectory` / Security-Scoped Bookmarks | `Context.getFilesDir()` / SAF Document Provider |
| **UI Shell** | 3-pane resizable layout + VS Code Menu Bar | Single-column responsive shell + Navigation Drawer | Single-column responsive shell + Navigation Drawer |
| **Input Mode** | Hardware keyboard + mouse hover | Touch gestures, virtual keyboard, Apple Pencil | Touch gestures, virtual keyboard, soft keys |

### 10.2 Mobile UI Shell & Responsive Layout
On mobile viewports (screen width < 768px):
1. **Adaptive Navigation Drawer**: The desktop TOC and File Tree sidebars collapse into a modal slide-over drawer accessible via a top navigation bar hamburger icon or swipe-from-edge gesture.
2. **Bottom Quick Actions Bar**: Frequently used editor actions (Undo, Redo, Heading, Bold, List, Image, Mode Switcher) are anchored above the virtual keyboard / home indicator for comfortable one-handed thumb interaction.
3. **Safe-Area Insets**: The UI dynamically respects notch and home indicator bounds using CSS environment variables (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
4. **Virtual Keyboard Handling**: Dynamic viewport calculations leverage `window.visualViewport` to ensure focused ProseMirror cursor positions scroll into view automatically when the soft keyboard is presented.

### 10.3 Mobile Storage & Sandboxing
- **iOS Sandbox**: All user documents and assets default to the app container's `Documents/` folder. External documents accessed via the iOS Files app or iCloud Drive utilize security-scoped bookmark URLs.
- **Android Storage Access Framework**: Scoped storage isolation is maintained via Android `content://` URIs and app-private internal storage directories.
- **Atomic Operations**: The Rust `FileService` maintains crash-resilient atomic writes (`.tmp` write -> flush -> atomic rename) within resolved mobile sandbox directory boundaries.





# Taleno Architecture

Implementation reference: current development source, reviewed 2026-11-01. Published desktop baseline: v0.1.11 (2026-11-01). Development changes after v0.1.11 are unreleased until a later tag completes the release workflow. Historical plans in ROADMAP.md and MILESTONES.md do not establish release or platform acceptance.

## 1. Application layers

Taleno is a local-first Markdown application using Tauri 2, Rust and SolidJS. On-disk documents remain pure Markdown. `src/App.tsx` coordinates the active document, tabs, modes, saves and close confirmation. `src/lib/tauri/commands.ts` and `events.ts` provide typed IPC wrappers. Native handlers in `src-tauri/src/commands/` delegate filesystem and parsing work to `src-tauri/src/services/`. The complete registered command list is in `src-tauri/src/lib.rs`.

SolidJS signals hold frontend document state; Rust `AppState` holds read/write baselines, cached native document data and serialized document I/O. The frontend tab snapshots are authoritative for unsaved edits; a single Rust active-document cache does not represent every unsaved tab.

## 2. Documents, editing and navigation

`src/store/editor.ts` stores source, saved baseline, rendered-source snapshot, HTML, TOC and dirty state. `src/store/files.ts` synchronizes each tab by ID and instance. Save responses update only their originating instance; intervening edits remain dirty. Reload increments a load version to reset editing history.

- Writing uses Milkdown 7 / ProseMirror in `src/components/Editor/Editor.tsx`. Transactions immediately mark edits dirty. Serialization is deferred until idle and synchronously flushed before save, close, tab or mode changes. Published user content bypasses redundant external replacement; external replacements remain undoable.
- Source mode renders through CodeMirror 6 in `src/components/CodeView/CodeView.tsx`: only the visible lines are laid out, soft wrap and the line-number gutter belong to the editor, and each document keeps its `EditorState` — undo history and selection included — in a bounded module map so tab switches restore them. Formatting, match reveal, heading navigation and plugin insertion dispatch editor transactions. Word counts are deferred during input. Heading navigation consumes Rust parser source lines, including setext headings and excluding fenced-code examples.
- Reading uses `src/components/MarkdownView/MarkdownView.tsx`. Request versions discard obsolete render responses. Live outlines likewise cancel work on document replacement and reject stale content/version results. Heading anchors are globally unique across duplicate and suffix-like headings.
- Font size is persisted by `src/store/settings.ts` and applied through `--editor-font-size`. Focus mode dims other top-level blocks: Writing follows the caret block through a ProseMirror decoration, Reading highlights the pointer/focus block, and Source mode keeps its plain editor surface. Toggling focus does not rebuild document nodes.
- Zen mode hides surrounding controls and, on desktop, enters native fullscreen. The state before entry is restored on exit/disposal; Escape and the floating exit button remain available.

## 3. Rendering and export

`services/parser.rs` uses pulldown-cmark 0.13 with GFM and math extensions. It produces HTML, occurrence-aware TOC IDs, source lines and parsed word counts. Raw Markdown HTML is preserved; this is not an HTML sanitizer. The production CSP blocks inline scripts. Code language labels and generated attributes are escaped; code-copy buttons use delegated events.

`services/highlighter.rs` uses syntect and a shared immutable `LazyLock<SyntaxSet>`. Highlighted HTML uses theme classes. `commands/markdown.rs` exposes asynchronous render/highlight handlers backed by blocking workers so CPU parsing does not occupy async executor threads. Worker failures remain typed command errors.

Bundled Mermaid and KaTeX are loaded dynamically by `src/lib/richRendering.ts` only when relevant containers exist. Mermaid uses strict mode; a failed diagram retains its source and visible error. Successful diagrams replace only their own container. `src/lib/exportWorkflow.ts` is shared by menu and toolbar and flushes pending editor work before capturing the export source. `exportPresentation.ts` produces static SVG/math markup and embeds KaTeX styles and WOFF2 fonts. `services/export.rs` wraps the presentation, escapes the title and writes HTML atomically. No CDN loader is required for these exported diagrams/formulas. Relative image grants remain separate from portable image embedding; see the outstanding mobile/image acceptance item #84.

Local image paths resolve relative to the Markdown document. The Tauri asset protocol starts with an empty scope. Rust grants individual existing image targets contained in the parent of an opened/saved document; canonical traversal/symlink escapes are excluded. Re-rendering only grants images for a known native document baseline. Writing image NodeViews resolve through the same native service without changing Markdown image sources. Remote image URLs are retained. No whole-filesystem asset scope is enabled.

## 4. Persistence and external changes

`services/fs_service.rs` creates a unique `.taleno-save-*` sibling tempfile, writes UTF-8 Markdown, flushes, syncs the file and persists over the destination. Unix also syncs the parent directory. Failures propagate to recoverable UI feedback while edits remain dirty. Checked saves compare disk contents to the last read/write baseline before staging and before replacement. The final check/rename interval remains an optimistic cross-process race; this is not filesystem compare-and-swap. See ADR-004 in DESIGN_DECISIONS.md for atomic visibility, durability and post-replacement failure boundaries.

`services/watcher.rs` watches parent directories to survive atomic replacements and emits `file-changed` with `{ path }`. Watchers are retained per open path. The frontend marks the matching tab, pauses autosave and offers Reload, Save As or explicit Overwrite. `single-instance-open` delivers startup file paths from another desktop launch. Failed saves do not allow a pending close to discard edits; retry actions retain the original tab identity.

## 5. Workspaces and search

`src/lib/workspaceWorkflow.ts` provides the shared App/Sidebar folder picker. Directory listing, creation, deletion and renaming use `commands/file.rs` and `services/fs_service.rs`. Create/rename validate a single child name in Rust, report collisions and reject traversal.

`commands/search.rs` delegates to `services/search_service.rs`. The service bounds depth, result count and file size, skips ignored directories and avoids following symlinks/junctions. An optional cooperative cancellation token is available to service callers; the current IPC handler does not expose that token. Search UI request versions reject stale results. Search results retain literal-query highlighting and keyboard navigation.

## 6. Representative IPC contracts

| Command | Frontend arguments | Response |
| :--- | :--- | :--- |
| `open_file` | `{ path }` | `OpenFileResponse`: canonical path, filename, source, HTML, TOC, word_count |
| `save_file` | `{ path, content, expectedContent }` | `OpenFileResponse`; rejects conflicts and write failures |
| `read_file_baseline` | `{ path }` | `string` or `null` |
| `render_markdown` | `{ markdown, docPath }` | `RenderResult`: HTML, TOC, word_count |
| `highlight_code` | `{ code, language }` | HTML string or unsupported-language error |
| `export_document` | `{ markdown, title, outputPath, presentation? }` | `void` or write error |
| `list_directory_tree` | `{ path }` | `FileEntry` tree |
| `search_workspace` | `{ query, rootPath }` | `{ matches, truncated }` |
| `list_plugins` / `list_themes` | none | installed manifests |
| `open_plugins_folder` / `open_themes_folder` | none | opens actual native data directory |

Preferences currently use frontend localStorage. There are no `get_app_settings` / `save_app_settings` commands. Keep command examples aligned with the actual typed wrappers and generated handler registration.

## 7. Plugins, themes and security

`src/lib/plugins/runtime.ts` runs community JavaScript in an opaque sandboxed iframe via `public/plugin-sandbox.html`. A validated message broker exposes permitted editor/storage/command capabilities and disposes registrations on unload. This is an iframe boundary, not an OS process sandbox. Native package services share path containment and staging/backup/rollback logic in `services/package_paths.rs`; hostile filenames, links and failed updates must preserve existing installations.

Tauri capabilities in `src-tauri/capabilities/default.json` grant explicit window/dialog/plugin permissions. Production CSP does not permit unsafe-eval or inline scripts. Do not widen scopes merely to make rendering work. Core presets in `src/store/settings.ts` and styles require no installation and cannot be uninstalled. External plugins and community themes belong in [BerryUIKI/Taleno-Plugins](https://github.com/BerryUIKI/Taleno-Plugins), with PRs against that repository's dev branch. See PLUGIN_DEVELOPMENT.md and THEME_DEVELOPMENT.md for manifests and runtime APIs.

## 8. Mobile shell and native limits

`src/components/Mobile/MobileShell.tsx` selects the narrow shell below 768 CSS pixels. It uses visualViewport height and offsetTop, subscribes to resize/scroll and removes listeners on disposal. CSS safe-area utilities, drawer navigation, localized actions, bottom formatting controls and Save / Save As callbacks are implemented. Narrow desktop windows retain platform window controls.

Android SAF (`content://`) resolution and iOS security-scoped bookmark adapters are not implemented by the current path-based native services. Virtual keyboards, cutouts, rotation, external document/image access and native writes require real hardware acceptance. The owner confirmed on 2026-10-21 that no devices are available; #84, #96 and #102 remain pending that acceptance. Browser mocks are not physical-device evidence.

## 9. Build and release boundaries

CI runs Rust tests on Windows/macOS/Linux and frontend tests, type checking and production builds on Linux, with fmt/clippy checks. Release tags are validated against package.json, Cargo.toml and Tauri's package-derived version. `vX.Y.Z` routes to desktop packaging. Android/iOS suffixes are classified separately and explicitly fail before desktop packaging because signed mobile build jobs are not configured. Release CI evidence does not establish every native interaction or unbuilt architecture.

## 10. Verification records

See ISSUE_REPAIR_PLAN.md for issue-level evidence, DESIGN_DECISIONS.md for guarantees, and the performance record for reproducible measurement methods. Treat host measurements as host measurements; bundle size alone does not prove startup latency or a 16 ms input budget.

## 11. Feature & Platform Implementation Status Matrix

### 11.1 Core implementation paths

The published desktop baseline is v0.1.11 (2026-11-01). The following describes current development source; implementation is distinct from verification.

| Capability | Implementation | Verification boundary |
| :--- | :--- | :--- |
| WYSIWYG, history, source | Milkdown / ProseMirror in `src/components/Editor/Editor.tsx`; source in `CodeView.tsx` | Browser integration and unit coverage; physical mobile selection pending |
| Markdown, headings, syntax | `services/parser.rs` uses pulldown-cmark 0.13; `services/highlighter.rs` shares an immutable syntect SyntaxSet | Rust tests; render/highlight commands offload work to blocking workers |
| Diagrams and mathematics | Rust emits containers; `src/lib/richRendering.ts` lazily loads bundled Mermaid and KaTeX | Offline rendering and static HTML export require browser acceptance; syntax errors retain source |
| Search | `services/search_service.rs` | Bounded traversal, cancellation and ignore rules; Rust tests |
| Document saves | `services/fs_service.rs` | Unique sibling tempfile, flush, file sync, atomic persist; Unix parent sync. No blanket power-loss guarantee on every filesystem |
| Plugin runtime | `public/plugin-sandbox.html`, `src/lib/plugins/runtime.ts` | Opaque sandboxed iframe with a permission broker, not an OS process sandbox |
| Themes | `src/store/customThemes.ts`, Rust theme service | Built-in presets require no installation and cannot be uninstalled. Community themes live in Taleno-Plugins |
| Native mobile providers | No SAF/bookmark adapter | Pending implementation and physical-device acceptance |

### 11.2 Platform evidence

| Platform | Distribution evidence | Remaining limits |
| :--- | :--- | :--- |
| Windows x86_64 | v0.1.10 release CI built MSI/NSIS | No claim of Windows ARM or all Windows versions |
| macOS ARM64 and x86_64 | v0.1.10 release CI built signed app/DMG | Notarization depends on credentials; native interaction requires a Mac |
| Linux x86_64 | v0.1.10 release CI built packages | No ARM build in the release matrix; native runtime requires matching GTK/WebKit libraries |
| Android / iOS | Responsive shared shell source | No configured signed mobile release jobs; file access, save and viewport hardware acceptance pending |

### 11.3 Application data locations

Rust resolves `app.path().app_data_dir()` using identifier `com.berryuiki.taleno`. Typical paths are `%APPDATA%\com.berryuiki.taleno` (Windows), `~/Library/Application Support/com.berryuiki.taleno` (macOS), and `$XDG_DATA_HOME/com.berryuiki.taleno` or `~/.local/share/com.berryuiki.taleno` (Linux). `plugins/` and `themes/` are children of that root. Use **Open Plugins Folder** or **Open Themes Folder** in Settings as the authoritative location; platform configuration can change the base directory. Community contributions belong in BerryUIKI/Taleno-Plugins, not the core repository.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Project-wide conventions, architectural constraints and Git rules also live in [AGENTS.md](AGENTS.md) and [docs/](docs/) — read `AGENTS.md` before large changes. This file covers what you need to start working.

## Commands

```bash
pnpm tauri dev                  # Vite (port 1420, strict) + Rust debug build, opens native window
pnpm dev                        # Frontend only in a browser (no Tauri IPC; most features break)
pnpm lint                       # tsc --noEmit (strict)
pnpm test                       # Vitest run (jsdom), all unit tests
pnpm test src/store/files.test.ts        # one file
pnpm test -t "adds a tab"                # one test by name
pnpm test:watch
pnpm build                      # production frontend build

cargo test --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml <name>   # one Rust test
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings

pnpm test:e2e                   # Playwright, auto-starts `pnpm dev` and reuses a running one
```

Node is gated: `^22.22.2 || ^24.15.0 || >=26` (jsdom 30 ESM). Both `scripts/check-node-version.js` (pretest) and `vite.config.ts` exit non-zero otherwise. CI uses Node 24 and runs fmt + clippy `-D warnings` + `cargo test` on Windows/macOS/Linux.

## Architecture

Tauri 2 + Rust backend, SolidJS frontend. **All file I/O, parsing, highlighting, search and package installs live in Rust** under `src-tauri/src/services/`, exposed through `src-tauri/src/commands/` and registered in `src-tauri/src/lib.rs`. Frontend talks only via typed wrappers in `src/lib/tauri/commands.ts` / `events.ts` (`invoke` / `listen`). Note Tauri converts arg casing: the TS wrapper passes `expectedContent`, the Rust handler takes `expected_content`.

### Frontend state is two-tier — this is the main thing to understand

- [`src/store/editor.ts`](src/store/editor.ts) holds **one** `currentDocument` signal: content, `savedContent` (conflict baseline), `loadVersion`, html, toc, wordCount, `isDirty`, `externallyModified`.
- [`src/store/files.ts`](src/store/files.ts) holds `openTabs`. A `documentObserver` registered at module load mirrors the active document into its tab; `syncCurrentDocumentToTab()` does the same manually. Both tiers are authoritative — the Rust `active_document` cache represents only one of them.
- Every state transition (tab switch, close, save, mode change) calls `flushPendingEdits()` first, because the editors publish their serialized Markdown lazily. Skipping it saves stale text.
- Async results are guarded by **tab identity** (`Tab.instance`). `applySaveResult` and `replaceTabFromDisk` reject a response if the tab was closed or replaced meanwhile, and `applySaveResult` keeps `isDirty: true` when text changed during the save. Preserve this pattern in any new async path.

### Three viewports, three engines

`App.tsx` switches on `displayMode()`:

| Mode | Component | Engine |
| :--- | :--- | :--- |
| reading | `MarkdownView.tsx` | Rust-rendered HTML; render responses version-checked |
| writing | `Editor.tsx` | Milkdown 7 / ProseMirror; serializes on idle, flushes on save/close |
| code | `CodeView.tsx` | CodeMirror 6; per-document `EditorState` (undo history + selection) kept in a bounded module map |

Formatting is dispatched indirectly: `src/lib/formatter.ts` holds module-level handler slots; each editor registers itself on mount via `registerWritingFormatter` / `registerCodeFormatter`, and global shortcuts in `App.tsx` call `dispatchFormat` / `revealMatchAt`. The same indirection exists for heading navigation.

`Editor` and `CodeView` are remounted on `${activeTabId()}:${loadVersion}` — `loadVersion` is bumped only by an explicit disk reload, which is how undo history resets.

### Persistence and external changes (Rust)

- [`services/fs_service.rs`](src-tauri/src/services/fs_service.rs): writes go through a `.taleno-save-*` sibling tempfile → flush → `sync_all` → rename, serialized by a global `SAVE_LOCK`. `write_file_checked` compares disk against the expected baseline **twice** (before staging and immediately before replace) and returns a `SAVE_CONFLICT` error string; the frontend detects that literal and marks the tab externally modified. A missing baseline means "new file" and never authorizes overwriting an existing one.
- [`services/watcher.rs`](src-tauri/src/services/watcher.rs) watches the **parent directory** (atomic rename destroys a file watch) and suppresses events where disk content equals the published baseline. It emits `file-changed` `{ path }`. The frontend marks the tab, pauses autosave and offers Reload / Save As / Overwrite.
- `AppState` (`src-tauri/src/state.rs`) holds `document_io` (tokio mutex), `disk_baselines`, `active_document`, `workspace_root`.

### Rendering pipeline

`services/parser.rs` (pulldown-cmark 0.13, GFM + math) produces HTML + occurrence-unique TOC ids + `source_line` values (used by heading navigation) + word counts. `services/highlighter.rs` shares one `LazyLock` syntect `SyntaxSet`. `commands/markdown.rs` runs these on blocking workers so async executor threads aren't held. Mermaid and KaTeX are bundled and dynamically imported by `src/lib/richRendering.ts` only when a matching container exists — no CDN.

## Things that will bite you

- **Never** add wildcard Tauri capabilities. `src-tauri/capabilities/default.json` is precise by design; widen it only for a new, specific plugin permission.
- Documents are pure Markdown. No frontmatter, no proprietary metadata, no lossy AST wrappers — round-tripping is a hard constraint.
- Local image access is granted per-file through the asset protocol scope in Rust, rooted at the open document's parent with symlink/traversal containment. Do not add a broad asset scope.
- The plugin runtime executes in an opaque sandboxed iframe (`public/plugin-sandbox.html`) with a validated message broker — it is not an OS sandbox.
- External plugins and themes belong in the separate `BerryUIKI/Taleno-Plugins` repo, never this one. Built-in themes are core presets that cannot be uninstalled.
- i18n has 9 locales (`src/i18n/locales/`); new user-facing strings need an entry in every dictionary, with `en.ts` as the shape reference.
- Keystroke latency budget is 16 ms. Use fine-grained Solid signals/memos; do not recreate DOM subtrees on input.
- Mobile: no Android SAF (`content://`) or iOS bookmark adapters exist yet — path-based services are all that is implemented.

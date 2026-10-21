# AGENTS.md — AI Agent & Automation Guidelines

This document provides context, architectural constraints, project conventions, and operational instructions for AI coding agents and autonomous assistants contributing to the **Taleno** codebase.

---

## 🧠 Architectural Mental Model

Taleno is a **local-first, in-place WYSIWYG Markdown reader & editor** built on **Tauri 2 + Rust + SolidJS**.

```
┌────────────────────────────────────────────────────────┐
│               Frontend (SolidJS + Webview)             │
│   • Reactive UI Components (Sidebar, TOC, Viewport)    │
│   • Editor Engine (Milkdown / ProseMirror)             │
│   • Theme & Settings Signals (localStorage / DOM)     │
│   • Typed IPC Wrappers (invoke / listen)               │
└──────────────────────────┬─────────────────────────────┘
                           │ IPC Bridge (JSON / Events)
┌──────────────────────────▼─────────────────────────────┐
│                 Backend (Rust Native App)              │
│   • State Management (Mutex<AppState>)                 │
│   • File I/O & Atomic Writes (tempfile -> rename)      │
│   • Markdown Parsing (pulldown-cmark zero-copy AST)   │
│   • Code Syntax Highlighting (syntect)                 │
│   • File System Watcher (notify crate)                 │
└────────────────────────────────────────────────────────┘
```

---

## ⛔ Core Architectural Constraints

When implementing features or refactoring:

1. **Strict IPC Boundary**:
   - **NEVER** attempt direct filesystem access or heavy computation in the frontend.
   - All file reading, writing, renaming, directory listing, AST parsing, and code highlighting **MUST** reside in the Rust backend under `src-tauri/src/services/` and be exposed via `src-tauri/src/commands/`.
2. **Atomic File Operations**:
   - Never overwrite document files directly in place. Always use the atomic write pattern (`write to .tmp` -> `flush` -> `fs::rename`) implemented in `fs_service.rs` to guarantee crash resilience.
3. **Tauri v2 Least-Privilege Capabilities**:
   - Permissions are defined strictly in `src-tauri/capabilities/default.json`. Do not introduce wildcard permissions (`fs:allow-all` or `shell:allow-all`). Scope permissions precisely.
4. **Pure Markdown Source of Truth**:
   - Taleno's on-disk and in-memory representation is pure Markdown. Avoid introducing proprietary metadata, custom frontmatter, or incompatible AST wrappers that could break roundtripping.
5. **DOM Performance Budget**:
   - Keystroke latency must remain under 16ms (60 FPS).
   - Use SolidJS fine-grained reactivity (`createSignal`, `createMemo`, `<Show>`, `<For>`) rather than recreating entire DOM trees.
6. **Mobile Sandboxing & Viewport Ergonomics**:
   - Mobile platforms (iOS and Android) enforce isolated application sandboxes and dynamic display geometries.
   - UI layout must adapt responsively to touch targets, virtual keyboards (`visualViewport`), and display cutouts (`env(safe-area-inset-*)`).
   - File I/O operations must resolve within sandboxed document roots or security-scoped container bookmarks.

---

## 🌐 Ecosystem Separation: Taleno vs Taleno-Plugins

Taleno operates as a multi-repository ecosystem with clear boundaries:

| Concern | Target Repository | Submission / Workflow |
| :--- | :--- | :--- |
| **Core Application** | [`BerryUIKI/Taleno`](https://github.com/BerryUIKI/Taleno) | PR against `dev` branch |
| **External Plugins** | [`BerryUIKI/Taleno-Plugins`](https://github.com/BerryUIKI/Taleno-Plugins) | PR against `dev` branch under `plugins/<id>/` |
| **External Themes & Skins** | [`BerryUIKI/Taleno-Plugins`](https://github.com/BerryUIKI/Taleno-Plugins) | PR against `dev` branch under `themes/<id>/` |

### ⛔ Critical Contribution Rule
- **NEVER submit external plugins or community themes to the `Taleno` repository.**
- All third-party plugins and external themes **MUST** be submitted to the [`BerryUIKI/Taleno-Plugins`](https://github.com/BerryUIKI/Taleno-Plugins) repository.
- The `Taleno` repository is reserved exclusively for the core application codebase, runtime engine, native commands, and official documentation.

### 🎨 Theme Categorization & Taxonomy
Themes in Taleno are strictly divided into two categories:

1. **Built-in Themes (Core Presets)**:
   - Included by default with the software (e.g., `Taleno`, `GitHub`, `Solarized`).
   - Configured within the core CSS tokens and settings store (`src/styles/` & `src/store/settings.ts`).
   - Require **no installation** and **cannot be uninstalled** via the GUI.
2. **External Themes (Community Skins)**:
   - Hosted in the [`BerryUIKI/Taleno-Plugins`](https://github.com/BerryUIKI/Taleno-Plugins) repository and cataloged in `themes.json`.
   - Stored in `%APPDATA%/com.berryuiki.taleno/themes/<theme-id>/` (Windows) or platform application data directories.
   - Users can freely choose to **install**, **apply**, or **uninstall** them at any time directly through the theme settings interface.


---

## 📁 Repository Directory Structure

```
Taleno/
├── .github/                      # GitHub issue & PR templates
├── docs/                         # Project documentation suite
│   ├── ARCHITECTURE.md           # System design & data flow
│   ├── COLLABORATION.md          # Team workflow & review rules
│   ├── DESIGN_DECISIONS.md       # ADRs (SolidJS, Milkdown, etc.)
│   ├── DEVELOPMENT.md            # Developer setup & debug guide
│   ├── MILESTONES.md             # Project milestones & schedule
│   ├── MOBILE_DEVELOPMENT.md     # iOS & Android cross-platform guide
│   ├── NEXT_STEPS.md             # Phase 2 implementation blueprint
│   ├── PLUGIN_DEVELOPMENT.md     # Plugin developer handbook
│   ├── ROADMAP.md                # Phased feature roadmap & MoSCoW
│   └── THEME_DEVELOPMENT.md      # Theme developer handbook
├── src/                          # SolidJS Frontend
│   ├── components/               # UI components
│   │   ├── Editor/               # Milkdown editor integration
│   │   ├── MarkdownView/         # Rendered Markdown viewer
│   │   ├── Sidebar/              # TOC sidebar & File tree
│   │   └── StatusBar/            # Bottom metadata status bar
│   ├── lib/
│   │   └── tauri/                # Typed IPC wrappers (commands.ts, events.ts)
│   ├── store/                    # SolidJS reactive state signals
│   ├── styles/                   # Tailwind CSS 4 & theme variables
│   └── types/                    # Shared TypeScript interfaces
├── src-tauri/                    # Rust Backend (Tauri 2)
│   ├── capabilities/             # Tauri v2 security scopes
│   ├── icons/                    # Multi-platform app icons
│   ├── src/
│   │   ├── commands/             # #[tauri::command] handlers
│   │   ├── models/               # Serde data structs
│   │   ├── services/             # Core business logic (parser, watcher, fs)
│   │   ├── lib.rs                # App builder, plugin init, command routing
│   │   ├── main.rs               # Windows entry point
│   │   └── state.rs              # Managed AppState
│   ├── Cargo.toml                # Rust dependencies & metadata
│   └── tauri.conf.json           # Tauri window & bundle config
├── AGENTS.md                     # This agent guideline document
├── CHANGELOG.md                  # Keep a Changelog format
├── package.json                  # Frontend dependencies & scripts
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## 🛠️ Verification & Build Commands

Before committing or concluding a task, run the following verification commands:

```bash
# 1. Run all Rust unit tests
cargo test --manifest-path src-tauri/Cargo.toml

# 2. Strict TypeScript type check
pnpm tsc --noEmit

# 3. Production frontend build
pnpm build

# 4. Production Tauri package build (when checking release readiness)
pnpm tauri build
```

---

## 🌿 Git & Branch Management Rules

1. **Branch Workflow**:
   - `main` is protected for stable releases only.
   - All active development occurs on `dev` or feature branches (`feature/<name>`).
   - PRs must be opened against `dev` for review before merging to `main`.
2. **Conventional Commits**:
   - All commit messages must follow the format: `<type>(<scope>): <short summary>`
   - Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
   - Examples:
     - `feat(editor): integrate Milkdown core in-place WYSIWYG renderer`
     - `fix(watcher): prevent duplicate reload banner on consecutive writes`
     - `docs(agents): add AGENTS.md workflow and constraints handbook`
3. **Commit Granularity**:
   - Break large features into logical, independently compilable chunks with descriptive commit messages.
4. **Platform-Split Release Tags**:
   - Desktop releases: `vX.Y.Z` (e.g. `v0.2.0`)
   - Android releases: `vX.Y.Z-android` (e.g. `v0.1.9-android`)
   - iOS releases: `vX.Y.Z-ios` (e.g. `v0.1.9-ios`)

---

## ➕ How to Add a New Tauri Command

When exposing a new capability from Rust to TypeScript:

1. **Implement Service Logic**: Add pure Rust business logic in `src-tauri/src/services/<service_name>.rs` with unit tests.
2. **Define Data Models**: If exchanging structured data, add `#[derive(Serialize, Deserialize)]` structs in `src-tauri/src/models/` or `src-tauri/src/state.rs`.
3. **Create Command Handler**: Add a `#[tauri::command]` function in `src-tauri/src/commands/<command_name>.rs`.
4. **Register in `lib.rs`**: Add the command function to `tauri::generate_handler![...]` in `src-tauri/src/lib.rs`.
5. **Add Typed Frontend Wrapper**: Add a corresponding TypeScript wrapper using `invoke<T>` in `src/lib/tauri/commands.ts` or `src/lib/tauri/events.ts`.
6. **Update Capabilities**: If using a new Tauri plugin or permission, add it to `src-tauri/capabilities/default.json`.

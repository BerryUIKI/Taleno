# Taleno Project Roadmap

This document outlines the phased development roadmap and milestone deliverables for Taleno, from the initial scaffold through the production MVP and future internationalized releases.

---

## 1. Phased Development Plan

```mermaid
gantt
    title Taleno Development Timeline
    dateFormat  YYYY-MM-DD
    section Pre-1.0 Core (v0.1.0–v0.1.5)
    Phase 0 - Scaffold             :done, p0, 2026-08-01, 1d
    Phase 1 - Core Editor          :done, p1, after p0, 14d
    Phase 2 - File Operations      :done, p2, after p1, 7d
    Phase 3 - File Tree & Nav      :done, p3, after p2, 7d
    Phase 4 - Code & Polish        :done, p4, after p3, 7d
    Phase 5 - Core MVP (v0.1.0)    :done, p5, after p4, 7d
    Phase 6 - Utilities (v0.1.1-5) :done, p6, after p5, 21d
    section Extended Features (v0.1.6–v0.1.9)
    Phase 7 - Advanced Rendering   :done, p7, after p6, 30d
    Phase 8 - Multi-Language i18n  :done, p8, after p7, 21d
    Phase 9 - Plugin System        :done, p9, after p8, 14d
    section Mobile & Stable Release
    Phase 10 - Mobile Support      :active, p10, after p9, 30d
    Phase 11 - Stable v1.0.0       :p11, after p10, 21d
```

---

### Phase 0 — Project Scaffold (~1 day) :white_check_mark: Completed
- [x] Initialize Tauri 2 + SolidJS + Vite 6 project base.
- [x] Configure TypeScript strict mode and Tailwind CSS 4.
- [x] Establish Rust backend architecture (`commands`, `models`, `services`, `state`).
- [x] Implement initial IPC hello world ping-pong command.
- [x] Configure repository documentation, formatting, and linting standards.

---

### Phase 1 — Core Reader MVP (~1–2 weeks) :white_check_mark: Completed
- [x] Resizable three-part layout (TOC sidebar on left, main markdown render view in center, status bar footer).
- [x] Local `.md`, `.markdown`, `.mdx`, `.txt` file open dialog via native dialog plugin.
- [x] High-performance GFM Markdown parsing and TOC extraction in Rust via `pulldown-cmark`.
- [x] Background file watcher service (`notify`) with live external modification alert banner.
- [x] Dark / Light / System theme toggle using CSS variables with OS preference auto-detection.
- [x] Status bar showing filename, word count, theme toggle, and external modification badge.
- [x] Standalone executable and Windows installers (NSIS 3.38 MB, WiX MSI 4.92 MB).

---

### Phase 2 — In-Place WYSIWYG & Display Modes (~1–2 weeks) :white_check_mark: Completed
- [x] **Three Tri-State Display Modes** (switchable via bottom status bar & shortcuts):
  1. **Reading Mode** (📖): Read-only view rendering clean GFM Markdown text.
  2. **Writing Mode** (✍️): In-place WYSIWYG editing (reveal syntax on cursor focus, render on blur).
  3. **Code Mode** (💻): Raw plain-text Markdown source view with monospace font and line numbers.
- [x] Milkdown v7 editor integration inside SolidJS lifecycle.
- [x] Full keyboard shortcut support (<kbd>Ctrl+B</kbd>, <kbd>Ctrl+I</kbd>, <kbd>Ctrl+K</kbd>, <kbd>Ctrl+1..6</kbd>).
- [x] Robust Undo / Redo history stack via ProseMirror state (<kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Y</kbd>).
- [x] Native atomic file saving (<kbd>Ctrl+S</kbd>) with temporary file rename pattern.
- [x] Dirty document state tracking and unsaved changes confirmation prompt on close/exit.

---

### Phase 3 — File Tree & Navigation (~1 week) :white_check_mark: Completed
- [x] Open Workspace Folder capability via native dialog.
- [x] Recursive directory scanner and structured file tree model in Rust (`list_directory_tree`).
- [x] SolidJS nested File Tree sidebar component with expandable folders and file creation, rename, and delete actions.
- [x] Multi-document tab bar (`TabBar`) with tab switching, dirty indicators, and close actions.
- [x] Quick file switcher command palette (<kbd>Ctrl+P</kbd>).
- [x] Collapsible sidebar toggle (<kbd>Ctrl+Shift+B</kbd>).

---

### Phase 4 — Code Highlighting & Polish (~1 week) :white_check_mark: Completed
- [x] Rust-side `syntect` integration for server-rendered syntax highlighting with rich themes.
- [x] Client-side code block syntax highlighting for standard languages (Rust, JS, TS, Python, Go, JSON, YAML, etc.).
- [x] Code block language badge and instant copy-to-clipboard action button.
- [x] Comprehensive Status Bar displaying word count, character count, encoding (UTF-8), line endings (LF/CRLF), theme toggle, and display mode switcher.

---

### Phase 5 — Core MVP Release & Testing (~1 week) :white_check_mark: Completed (shipped in v0.1.0)
- [x] Comprehensive Vitest unit tests for SolidJS components and stores (`editor.test.ts`, `files.test.ts`, `settings.test.ts`, `formatter.test.ts`, `dnd.test.ts`).
- [x] Full Rust unit test coverage for atomic writer, directory scanner, syntect highlighter, and parser.
- [x] Tauri v2 capability lockdown (minimal required filesystem and dialog scopes).
- [x] Cross-platform release builds & GitHub Actions packaging workflows configured.
- [x] **Taleno Desktop Core MVP Release Ready (v0.1.0)**.

---

### Phase 6 — Productivity & Search Utilities (~2–3 weeks) :white_check_mark: Completed (shipped in v0.1.1–v0.1.5)
- [x] In-document Find & Replace with regex support, case sensitivity, and navigation (<kbd>Ctrl+F</kbd>, <kbd>Ctrl+H</kbd>).
- [x] Standalone self-contained HTML & print-ready export engine via Rust backend (`export_document`).
- [x] Quick Markdown formatting toolbar for tables, images, blockquotes, headings, lists, and task lists.
- [x] Configurable background auto-save timer for modified documents.

---

### Phase 7 — Advanced Rendering & Navigation :white_check_mark: Completed (shipped in v0.1.6–v0.1.7)
- [x] Mathematical formula rendering wrapper for KaTeX (`math`/`katex` and `$$...$$`).
- [x] Live diagram rendering wrapper for Mermaid.js (`mermaid` code blocks).
- [x] Zen Mode distraction-free full-screen editor (<kbd>F11</kbd> / <kbd>Ctrl+Shift+Z</kbd>).
- [x] Focus Mode active block styling (<kbd>Ctrl+Shift+D</kbd>).
- [x] Global workspace-wide full-text search indexing & result jumping modal (<kbd>Ctrl+Shift+F</kbd>).
- [x] VS Code-style top in-app Menu Bar with full File, Edit, View, Window, Help menus.
- [x] Windows default `.md` file associations and CLI startup document loading.
- [x] Official GitHub repository integration ([BerryUIKI/Taleno](https://github.com/BerryUIKI/Taleno)).

---

### Phase 8 — Multi-Language Internationalization (i18n) & Localization :white_check_mark: Completed (shipped in v0.1.8)
- [x] **Reactive i18n Translation Engine**: Lightweight, zero-dependency translation dictionary store integrated into SolidJS signals.
- [x] **Supported Language Locales**:
  - `en` (English - Default)
  - `zh-CN` (Simplified Chinese / 简体中文)
  - `zh-TW` (Traditional Chinese / 繁體中文)
  - `ja` (Japanese / 日本語)
  - `ko` (Korean / 한국어)
  - `de` (German / Deutsch)
  - `fr` (French / Français)
  - `es` (Spanish / Español)
  - `ru` (Russian / Русский)
- [x] **Language Selection UI**: Settings menu language picker with automatic OS system locale detection and persistent `localStorage` preference.
- [x] **Full UI Translation Coverage**: Menu bar items, tooltips, status bar metadata, search modals, find & replace dialog, welcome hub, and about screen.

---

### Phase 9 — Plugin System & Extensibility (~1–2 weeks) :white_check_mark: Completed (shipped in v0.1.9)
- [x] **Rust Plugin Service**: Directory resolution (`com.berryuiki.taleno/plugins/`), directory scanning, manifest validation, starter template initialization.
- [x] **Frontend Runtime Engine**: Sandboxed `TalenoPluginContext` providing command registration, editor content hooks, and isolated local storage.
- [x] **Settings UI & Navigation**: Dedicated `Plugins` tab in `SettingsModal` with search filter, reload action, directory opener, and enable/disable toggle switches.
- [x] **Menu Integration**: `File ➔ Preferences ➔ Plugins...` sub-menu with global shortcut <kbd>Ctrl+Shift+X</kbd> (or <kbd>Cmd+Shift+X</kbd> on macOS).

---

### Phase 10 — Mobile Cross-Platform Support (iOS & Android) (~3–4 weeks) :hammer_and_wrench: In Progress
- [ ] **Mobile Toolchain & Initialization**: Tauri 2 mobile generator configs (`src-tauri/gen/apple/` and `src-tauri/gen/android/`), iOS/Android compilation targets.
- [x] **Responsive Mobile Shell**: Single-column viewport adapter, collapsible navigation drawer, safe-area inset management (`env(safe-area-inset-top)` / `bottom`).
- [ ] **Touch-First Markdown Editing**: On-screen bottom quick-action formatting bar, mobile selection gestures, virtual keyboard height listener (`visualViewport`).
- [ ] **Sandboxed File Operations**: Scoped mobile storage integration (iOS Documents/iCloud Drive and Android SAF content providers) preserving crash-safe atomic saves.
- [ ] **Mobile Capabilities & Permissions**: Strict `capabilities/mobile.json` configuration for iOS and Android webviews.
- [ ] **Packaging & Automated CI/CD**: iOS IPA build pipelines and Android APK / AAB artifact generation workflows.

---

### Phase 11 — Production v1.0.0 Stable Release (~2–3 weeks) :hourglass_flowing_sand: Planned
- [ ] **Desktop & Mobile Hardening**: Full regression test passes across physical macOS, Linux, Windows, iOS, and Android devices.
- [ ] **Accessibility (a11y) & Keyboard Navigation**: Full WCAG 2.1 AA keyboard navigation, high-contrast themes, and screen reader labels.
- [ ] **Cross-Platform Release Packaging**: Official distribution builds (Windows MSI/NSIS, macOS notarized DMG, Linux AppImage/deb, Android signed APK/AAB, iOS TestFlight/App Store).
- [ ] **Community & Plugin Ecosystem**: Stable v1 plugin/theme extension APIs and documentation.

---

## 2. Feature Priority Matrix (MoSCoW)

| Category | Features | Target Phase |
| :--- | :--- | :--- |
| **Must Have**<br>*(Critical for MVP & Mobile)* | - In-place WYSIWYG editor via Milkdown<br>- Atomic file open / save operations<br>- Tabbed interface & dirty state tracking<br>- Workspace folder navigation & file tree<br>- Dark / Light mode switching<br>- Status bar (word count, line/column)<br>- Strict security capabilities & local-only storage<br>- Custom top Menu Bar (VS Code style)<br>- Windows `.md` default file associations<br>- Mobile responsive drawer & safe-area support<br>- Mobile sandboxed document I/O | Phase 0–5, Phase 10 |
| **Should Have**<br>*(Important for v1.1 & Mobile)* | - Find and Replace toolbar<br>- HTML export engine<br>- Interactive table insertion<br>- Document outline / TOC sidebar with smooth scrolling<br>- Auto-save timer<br>- Multi-language i18n localization<br>- Mobile bottom quick action formatting bar<br>- Virtual keyboard automatic cursor scrolling | Phase 6, 8, Phase 10 |
| **Could Have**<br>*(Desirable for v1.2+)* | - KaTeX math rendering<br>- Mermaid diagram rendering<br>- Typewriter mode & Zen mode<br>- Custom user themes & CSS overrides<br>- Global workspace full-text search<br>- Mobile haptic feedback on editor formatting<br>- Vim keybinding mode | Phase 7, Phase 9, Phase 10 |
| **Won't Have**<br>*(Out of Scope)* | - Cloud sync backend / proprietary account login (Taleno remains 100% local-first)<br>- Multi-user real-time collaborative editing (CRDTs)<br>- Heavy IDE extensions / LSP debugging | Out of Scope |


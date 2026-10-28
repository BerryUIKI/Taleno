# Changelog

All notable changes to Taleno will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.10] - 2026-10-28

### Added
- **Workspace Search & Quick Switcher**:
  - Keyboard-selectable workspace search results that open the matching file, line and text, including files that are not already open in a tab.
  - Quick Switcher lists registered plugin commands and their declared shortcuts, with reserved-core-shortcut conflict protection.
- **In-Document Find & Replace**:
  - Find Next/Previous and Replace One/Replace All across Reading, Writing and Code modes, with match highlighting and scrolling to the active match.
  - Consistent regex replacement semantics (`$1`, `$&`, `$$`), live regex feedback and zero-width match advancement.
  - The Find panel is anchored inside the document viewport instead of covering application chrome.
- **Testing & CI**:
  - A runnable Playwright end-to-end suite with document-integrity journeys.
  - Frontend unit tests and `pnpm lint` run in CI, and Rust formatting and Clippy checks are enforced.

### Changed
- **Accessibility & Keyboard Navigation**:
  - Document tabs expose tablist semantics and Arrow/Home/End navigation, with an accessible close action.
  - Dialogs focus their input on open, trap focus, restore the previously focused element and require an explicit discard shortcut.
- **Plugin Runtime**:
  - Plugins execute in an isolated sandbox with a permission broker, domain-typed IPC responses and actionable load errors.
  - Plugin text inserts at the active selection in Writing and Code modes instead of appending to the document.
- **Mobile & Desktop UI**:
  - Mobile actions and viewport handling are localized and adapted for virtual keyboards and display cutouts.
  - Zen Mode records native fullscreen state, and Writing focus mode highlights the active caret block.
  - Reading and Writing text follow the configured text size, and narrow desktop windows retain their window controls.
- **Performance & Release Tooling**:
  - Cached immutable Syntect syntax registries and moved CPU-heavy render/highlight work off synchronous command execution; heavy frontend modules load lazily with retry.
  - Platform release tags are classified and validated separately, and unsupported mobile release tags fail explicitly before desktop packaging.
  - Removed dead Rust code and normalized formatting.

### Fixed
- **Document Integrity & Save Flow**:
  - Edits are preserved across tab switches, external reloads and failed saves; save, close and reload are serialized against document transitions.
  - The updater re-checks unsaved edits before installing and restarting.
  - Relative image previews refresh after Save As, and images resolve against the originating document.
- **Files, Search & Packages**:
  - Workspace traversal and search are bounded by root containment, depth and directory-link cycle checks, with a global match cap and truncation notice.
  - Plugin and theme package paths are contained within their directories, and failed installs preserve existing files.
- **Rendering & Code Mode**:
  - Mermaid diagrams and KaTeX formulas render offline and in static HTML exports; invalid diagrams and formulas preserve their source.
  - Outline navigation uses occurrence-aware heading anchors and rejects stale results.
  - Code mode line numbers now stay on the first visual row of each logical line when long lines soft-wrap, including CJK text, empty/trailing lines, tabs and scrolled virtual windows.
  - The source editor keeps per-document undo histories, and link, image, task-list, undo and redo actions work in Writing and Code modes.

## [0.1.9] - 2026-10-16

### Fixed
- **Window Close Failure on Desktop**:
  - Unified title-bar dragging so window controls do not trigger native dragging or double-click maximization, and title clicks start only one drag operation.
  - Prefer Tauri's window destruction API after unsaved-change confirmation, with an asynchronous native `close_window` command as a fallback.
  - Granted the scoped `"core:window:allow-destroy"` permission for closing borderless windows.
- **Single Instance Application Constraint**:
  - Integrated `tauri-plugin-single-instance` to restrict application execution to a single instance.
  - Automatically restores, unminimizes, and focuses the existing window when a second instance is launched.
  - Forwards CLI file arguments to the running instance, seamlessly loading files in new tabs.

### Added
- **Cross-Platform Mobile Support (iOS & Android)**:
  - Full mobile build toolchains configured for iOS (Xcode, Simulator, Device targets `aarch64-apple-ios`, `aarch64-apple-ios-sim`, `x86_64-apple-ios`) and Android (Gradle, NDK, Platform 34, `aarch64-linux-android`, `x86_64-linux-android`, `armv7-linux-androideabi`, `i686-linux-android`).
  - Mobile platform detection in [`src/lib/platform.ts`](src/lib/platform.ts) supporting iPhones, iPads, and Android smartphones.
  - Rust backend mobile compatibility with `#[cfg(desktop)]` guarded window controls and mobile no-op fallbacks.
- **Dedicated Vertical Smartphone Portrait GUI**:
  - **`MobileShell`**: Fluid root layout container adapting to mobile portrait viewports with virtual keyboard height tracking via `window.visualViewport`.
  - **`MobileTopBar`**: Compact 44px top navigation supporting notches, Dynamic Island (`safe-area-top`), breadcrumb folder/tab navigation, and 1-tap mode switcher.
  - **`MobileBottomNav`**: Thumb-zone bottom navigation bar (`safe-area-bottom`) providing instant access to Files, Outline, Display Mode, Search, and Settings.
  - **`MobileFormatBar`**: Soft-keyboard attached horizontal scrolling Markdown formatting toolbelt (Undo, Redo, H1~H3, Bold, Italic, Strikethrough, Code, Lists, Blockquote, Table, Keyboard Dismiss).
  - **`MobileDrawerSheet`**: Native-feeling bottom sheet modal for workspace file browsing, active document tabs, live TOC outline navigation, and theme/font preferences.
- **Platform-Split Release Track**:
  - Independent release tag conventions established for Desktop (`vX.Y.Z`), Android (`vX.Y.Z-android`), and iOS (`vX.Y.Z-ios`).
  - Android Release packages generated: optimized universal Google Play AAB (`Taleno-v0.1.8-GooglePlay.aab`, 31 MB) and signed direct-install ARM64 APK (`Taleno-v0.1.8-arm64.apk`, 25 MB).
- **Mobile Documentation**:
  - Published comprehensive [`docs/MOBILE_DEVELOPMENT.md`](docs/MOBILE_DEVELOPMENT.md) and updated architecture, roadmap, and collaboration guidelines.

## [0.1.8] - 2026-09-02

### Added
- **Unsaved Document Close Confirmation Flow**:
  - Interactive close confirmation dialog (`CloseConfirmModal`) prompting when closing unsaved documents.
  - Three-way action choice: **Save** (<kbd>Enter</kbd>), **Don't Save** (<kbd>Alt+D</kbd>), and **Cancel** (<kbd>Esc</kbd>).
  - Intercepts tab close buttons, `File ➔ Close Tab` (<kbd>Ctrl+W</kbd>), window close buttons, and native OS window close requests (`onCloseRequested`).
- **Title Bar Quick Access Actions**:
  - Added dedicated quick action buttons on the title bar for Plugins Marketplace (<kbd>Ctrl+Shift+X</kbd>), Themes (<kbd>Ctrl+,</kbd>), and Language modal.
- **Status Bar Version Indicator**:
  - Interactive version badge placed at the far left corner of the bottom status bar (`[v0.1.8] | ...`).
  - Supports in-place update check (with spinner and up-to-date checkmark) and highlight notification when updates are available.
- **Tab Bar Interactions**:
  - Double-clicking on empty tab bar space creates a new document (throttled to guarantee exactly one document per action).

### Changed
- **Fixed Settings Dialog Dimensions**:
  - Locked Settings Modal container to a fixed height (`h-[620px] max-h-[85vh]`), preventing layout resizing when switching between Theme, Plugin, and Update tabs.
- **Localization**:
  - Added localized confirmation dialog strings and action titles across all 9 supported languages (`en`, `zh-CN`, `zh-TW`, `ja`, `ko`, `de`, `fr`, `es`, `ru`).

## [0.1.7] - 2026-09-02

### Added
- **Plugin System & Extensibility Sandbox**:
  - Full-stack plugin runtime connecting SolidJS frontend and Tauri 2 Rust backend.
  - Rust Plugin Service managing `%APPDATA%/Taleno/plugins/`, directory scanning, schema validation, and automatic starter plugin initialization (`sample-timestamp`).
  - Native IPC commands: `list_plugins`, `open_plugins_folder`, and `read_plugin_source`.
  - Frontend execution sandbox (`runtime.ts`) exposing `TalenoPluginContext` with command registration, active editor content manipulation, and persistent key-value storage.
  - In-app Plugin Marketplace connecting to `BerryUIKI/Taleno-Plugins` with offline caching, search filtering, and one-click install/uninstall.
- **Custom Themes & Community Skins Engine**:
  - Pure CSS design-token engine dynamically overriding editor, reader, and chrome tokens without app reload or DOM reconstruction.
  - Rust Theme Service managing `%APPDATA%/Taleno/themes/`, theme manifest parsing, atomic downloads, path traversal protection, and offline registry caching.
  - Community Theme Marketplace browser in Settings Modal featuring live 3-color palette swatches (Background, Accent, Text) and one-click install/uninstall.
  - Explicit theme taxonomy separating Built-in Themes (bundled, permanent presets) from External Themes (community skins installable/uninstallable via GUI).
- **Preferences & Menu Integrations**:
  - Added `File ➔ Preferences ➔ Plugins...` (<kbd>Ctrl+Shift+X</kbd>) and `File ➔ Preferences ➔ Settings...` (<kbd>Ctrl+,</kbd>).
  - Modern tabbed Settings Modal organizing Theme (Built-in + Custom Marketplace), Plugins (Installed + Marketplace), and Updates channels.
- **Documentation & Ecosystem Standards**:
  - Published [`PLUGIN_DEVELOPMENT.md`](docs/PLUGIN_DEVELOPMENT.md) and [`THEME_DEVELOPMENT.md`](docs/THEME_DEVELOPMENT.md) developer handbooks.
  - Official starter plugins (`sample-timestamp`, `wordcount-pro`, `callout-boxes`, `katex-macros`) and community themes (`dracula`, `nord`, `catppuccin-macchiato`) published to the [`BerryUIKI/Taleno-Plugins`](https://github.com/BerryUIKI/Taleno-Plugins) repository.
  - Full localization support for custom themes and plugins across all 9 interface languages.

## [0.1.6] - 2026-08-31

### Changed
- Document details now appear on the far left of the status bar, while display-mode controls sit immediately before the icon-only theme toggle on the far right.
- macOS release packages now require a valid Developer ID Application signature, with automatic notarization when App Store Connect credentials are configured.

### Fixed
- Clicking an already open unsaved tab no longer creates a duplicate tab.
- A single Save keyboard shortcut no longer opens multiple native Save dialogs.
- macOS release verification now rejects ad-hoc or otherwise invalid application signatures before publishing.

## [0.1.5] - 2026-08-28

### Added
- Official website links in the title bar, Help menu, and About dialog.
- Non-destructive home navigation from the Taleno title-bar icon.
- Raw block and inline HTML formatting in rendered Markdown, including HTML inside headings.

### Changed
- Manual update checks now display an immediate progress state and keep the About dialog open.
- In-app update notes now come from Taleno's nine-language translation dictionaries; GitHub release descriptions remain English-only.
- The latest-version result now displays a green confirmation checkmark.
- The sidebar toggle now sits at the far left of the title bar, while the display-mode switcher anchors the bottom-left status area; redundant bottom Open and Save buttons were removed.

## [0.1.4] - 2026-08-27

### Added
- Signed, in-app updates for Windows, macOS, and Linux with download progress and user-confirmed installation.
- Daily stable-channel update checks with startup jitter and an opt-out setting.
- Localized in-app release notes for all nine supported interface languages.

### Changed
- Update installation now warns when any open tab has unsaved changes before Taleno exits or restarts.
- Application versioning now derives from `package.json` and is validated against Cargo and the release tag in CI.

## [0.1.3] - 2026-08-26

### Changed
- macOS now uses native traffic-light window controls and overlay title-bar styling while Windows and Linux retain Taleno's custom window controls.
- Release assets now use stable `Taleno_<OS>_<architecture>` names without embedded app versions, and README download lists have been simplified.
- Markdown tables no longer apply header, row, or column background fills, improving text contrast across platforms and themes.

## [0.1.2] - 2026-08-25

### Added
- **Dedicated Language Selection Modal (`LanguageModal`)**:
  - Independent, full-featured language picker dialog supporting all 9 languages with flags and `Auto (Follow System)` toggle.
  - Replaced nested dropdown hover trigger to eliminate menu collision and hover-closing glitches.
  - Fully localized subtitle and description dynamically following active language.
- **Rust Native GitHub Update Detection (`check_github_update`)**:
  - Implemented high-performance native HTTPS client in Rust (`reqwest` + `tokio`), completely bypassing browser WebView CSP and CORS restrictions.
  - Three-state version comparison (`UpdateStatus`): Update Available, Up to Date, and Ahead of Release (Preview Build).
  - Explicit rate-limit detection (HTTP 403 / 429), strict repository format validation, and draft/prerelease release filtering.
  - Added "🌟 领先于官方发行版 (Ahead of Public Release)" state with full 9-language localization.
- **Apple Silicon Native Artifact Naming & Permanent Latest Aliases**:
  - Automated aliasing in CI to generate `Taleno_Apple-Silicon.dmg`, `Taleno_x64-setup.exe`, `Taleno_amd64.AppImage`, etc.
- **9-Language Localized READMEs & Instant Direct Downloads**:
  - Added dedicated READMEs for all 9 supported languages with top navigation switcher.
  - Embedded permanent 1-click latest direct download matrix (`/releases/latest/download/...`).

---

## [0.1.1] - 2026-08-25

### Added
- **9-Language Internationalization (i18n) Engine**:
  - Full native localization support for 9 languages:
    - English (`en-US` - Primary default fallback)
    - Simplified Chinese (`zh-CN` - 简体中文)
    - Traditional Chinese (`zh-TW` - 繁體中文)
    - Japanese (`ja-JP` - 日本語)
    - Korean (`ko-KR` - 한국어)
    - German (`de-DE` - Deutsch)
    - French (`fr-FR` - Français)
    - Spanish (`es-ES` - Español)
    - Russian (`ru-RU` - Русский)
  - Automatic system language detection on initial launch (`navigator.language`) with English fallback.
  - Persistent user preference stored in `localStorage` under `Taleno_locale_setting`.
  - Type-safe reactive translation function `t(key, params)` providing seamless, instant UI updates without page reload.
- **Top MenuBar Language Switcher (`Help -> Language`)**:
  - Added dedicated `Language (语言)` submenu under the `Help` menu with native language labels and active checkmark indicators.
  - Includes an `Auto (Follow System)` option to dynamically adapt to OS language changes.

### Changed
- **Open-Source License Migration**:
  - Migrated repository license from MIT to **GNU Affero General Public License v3.0 (AGPL-3.0)** across `LICENSE`, `package.json`, `Cargo.toml`, `README.md`, and the About dialog.

---

## [1.5.0] - 2026-08-25

### Added
- **VS Code-Style In-App Top Menu Bar**:
  - Custom themed top Menu Bar (`File`, `Edit`, `View`, `Window`, `Help`) with smooth hover switching, keyboard navigation, and shortcut indicators.
  - Centered document name badge with modified indicator dot.
  - Direct quick action controls for file palette, theme switching, and GitHub repository access.
- **Windows `.md` Shell File Associations & CLI Startup Resolver**:
  - Configured installer bundle file associations registering `.md`, `.markdown`, `.mdx`, and `.txt` with the Windows shell.
  - Implemented `get_cli_args` command in Rust backend and initial startup resolver to automatically open documents when double-clicked in Windows Explorer.
- **Official GitHub Repository Integration**:
  - Integrated [BerryUIKI/Taleno](https://github.com/BerryUIKI/Taleno) repository links in the Help menu, Top Menu Bar, Welcome Hub, and About dialog.
  - Added About Taleno dialog detailing version, open-source MIT license, author contributors, and technology stack.
- **Multi-Language Internationalization (i18n) Roadmap**:
  - Added Phase 8 / Milestone 8 roadmap plan to support English, Simplified Chinese, Traditional Chinese, Japanese, German, French, and Spanish.

---

## [1.4.0] - 2026-08-25

### Added
- **Content-Focused Shortcut Architecture**:
  - Restored <kbd>Ctrl+B</kbd> to standard text bolding across Writing and Code modes.
  - Added <kbd>Ctrl+0</kbd> shortcut for normal paragraph / text formatting, and <kbd>Ctrl+1~6</kbd> for H1~H6 headings.
  - Added <kbd>Ctrl+I</kbd> (Italic), <kbd>Ctrl+K</kbd> (Link), <kbd>Ctrl+`</kbd> (Inline Code), <kbd>Ctrl+Shift+X</kbd> (Strikethrough).
  - Migrated sidebar toggle shortcut to <kbd>Ctrl+Shift+B</kbd>.
- **Monochrome Vector Iconography**:
  - Completely removed colorful emojis from the status bar, format toolbar, and sidebar mode switcher.
  - Standardized on minimalist, clean vector line SVG icons using `stroke="currentColor"` that adapt to any theme.
- **In-Place Formatting & Selection Support**:
  - Refactored Writing Mode (Milkdown) and Code Mode format execution to transform active selection or current block in-place.
  - Added Paragraph (`¶ Text`) block format option in the editor toolbar.
- **Outline-First Sidebar & Cross-Mode Smooth Scrolling**:
  - Sidebar defaults to document Outline (TOC), allowing immediate navigation.
  - Rust parser generates explicit `id="{slug}"` anchor attributes on heading HTML tags.
  - Seamless smooth scrolling to heading anchors in Reading, Writing, and Code modes.
- **Code Mode Line Numbers Synchronized Scrolling**:
  - Synchronized line numbers gutter scroll position directly with textarea scrolling.
- **Welcome Hub / Home Workspace**:
  - Integrated modern Welcome Hub shown when no document is open, featuring quick creation/opening, recent file history, keyboard shortcuts cheat sheet, and drop hints.

---

## [1.3.0] - 2026-08-25

### Added
- **Intelligent Drag & Drop File Integration**:
  - Dragging files into the window when no document is open opens the document directly.
  - Dragging files onto the top Tab Bar when a document is open opens the file in a new tab.
  - Dragging files onto the active Editor / Text Area automatically inserts Markdown links (image files insert as `![name](path)`, documents and other files insert as `[name](path)`).
  - Real-time animated drop hint overlays for window, tab bar, and editor targets.
  - Comprehensive unit test suite for drag-and-drop parsing and routing logic.

---

## [1.2.0] - 2026-08-24

### Added
- **Global Workspace Full-Text Search**:
  - <kbd>Ctrl+Shift+F</kbd> search modal scanning across all Markdown documents in the workspace.
  - Line-by-line result match previews and instant navigation.
- **Diagrams & Math Rendering**:
  - Live Mermaid.js diagram container rendering for `mermaid` fenced code blocks.
  - Math formula wrappers for KaTeX `$$...$$` blocks.
- **Distraction-Free Zen & Focus Modes**:
  - Zen Mode (<kbd>F11</kbd> / <kbd>Ctrl+Shift+Z</kbd>) toggling full-screen editor without sidebars, tab bars, or toolbars.
  - Focus Mode (<kbd>Ctrl+Shift+X</kbd>).

---

## [1.1.0] - 2026-08-24

### Added
- **Find & Replace Toolbar**:
  - Full in-document search with regex, case sensitivity, previous/next match jumping, and replace/replace-all (<kbd>Ctrl+F</kbd>, <kbd>Ctrl+H</kbd>).
- **Standalone Document Export**:
  - Export document to styled, self-contained HTML/PDF with print typography and responsive layouts via Rust backend (`export_document`).
- **Editor Quick Format Toolbar**:
  - Instant insertion buttons for Tables, Images, Quotes, Task Lists, Bullet Lists, and Headings.
- **Background Auto-Save**:
  - Periodic background auto-saver for modified open documents.

---

## [1.0.0] - 2026-08-24

### Added
- **Automated Test Suite**:
  - Full Vitest reactive store unit tests (`editor.test.ts`, `files.test.ts`, `settings.test.ts`).
  - Comprehensive Rust unit tests for `pulldown-cmark` GFM parsing, TOC extraction, word counting, `syntect` syntax highlighting, atomic writes, and recursive directory tree scanning.
- **Security & Capabilities**:
  - Audited Tauri v2 capability configuration (`capabilities/default.json`) strictly scoped to essential filesystem and dialog operations.
- **Production Readiness**:
  - Multi-platform GitHub Actions automated CI matrix and release builder.

---

## [0.4.0] - 2026-08-24

### Added
- **Server-Side Code Highlighting (`syntect`)**:
  - Direct integration into AST parser for fenced code blocks with Ocean Dark theme.
  - Automatic language badge on code block header.
  - One-click copy-to-clipboard button on every code snippet.
- **Advanced Status Bar**:
  - Real-time word count & character count display.
  - Encoding (UTF-8) and line-ending detector (LF / CRLF).
  - Quick-switch toggle buttons for themes and display modes.

---

## [0.3.0] - 2026-08-24

### Added
- **Workspace File Tree**:
  - "Open Folder" workspace root browser via native dialog.
  - Recursive directory scanner in Rust (`list_directory_tree`) filtering build artifacts and hidden directories.
  - Interactive nested File Tree with folder expansion, file icons, and file creation, deletion, and rename actions.
  - Sidebar mode switcher: 📁 **Workspace** / 📑 **Outline**.
- **Multi-Document Tabs**:
  - `TabBar` component with tab switching, dirty indicator dots, and tab close buttons.
- **Quick Switcher Command Palette**:
  - <kbd>Ctrl+P</kbd> palette for fast keyboard fuzzy search and document switching.
- **Enhanced Keyboard Navigation**:
  - <kbd>Ctrl+B</kbd> to toggle the sidebar.

---

## [0.2.0] - 2026-08-24

### Added
- **Tri-State Display Modes**:
  - Seamless toggle between 📖 **Reading Mode** (read-only rendered view), ✍️ **Writing Mode** (in-place WYSIWYG editor), and 💻 **Code Mode** (raw Markdown source view with line numbers).
  - Status bar mode switcher button and global shortcut <kbd>Ctrl+/</kbd>.
- **In-Place WYSIWYG Editor**:
  - Milkdown v7 editor integration inside SolidJS component lifecycle.
  - Live GFM rendering with in-place Markdown formatting.
  - ProseMirror undo/redo transaction history stack (<kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Y</kbd>).
- **Code Viewport**:
  - Monospace raw source editor with dynamically synchronized line number gutter.
- **Atomic File Saving & Safety**:
  - Native atomic save (<kbd>Ctrl+S</kbd>) and Save As dialog with `.tmp` rename pattern.
  - Real-time dirty state tracking (`● unsaved` badge).
  - New Document creation (<kbd>Ctrl+N</kbd>).

---

## [0.1.0] - 2026-08-24

### Added
- **Core Markdown Reader Layout**:
  - Resizable three-part layout (TOC Sidebar, Main Viewport, Status Bar).
  - Dynamic Table of Contents generation with smooth-scrolling section anchors.
  - Sidebar drag-to-resize handle (160px–500px).
- **Backend Document Architecture**:
  - Native file open dialog supporting `.md`, `.markdown`, `.mdx`, and `.txt` files.
  - Rust-managed `ActiveDocument` state inside `AppState`.
  - Zero-copy GFM AST parsing, heading extraction, and word counting via `pulldown-cmark`.
- **Live File Watcher**:
  - Background file system watcher (`notify`) detecting external file modifications.
  - UI notification banner with instant reload action.
- **Theming System**:
  - Dark / Light / System theme palette with Tokyo Night styling.
  - Real-time OS color scheme detection and persistence in `localStorage`.
- **Status Bar Footer**:
  - Live status indicators for filename, word count, theme cycle button, and external modification badge.
- **Production Build & Packaging**:
  - Standalone executable (`Taleno.exe`).
  - Lightweight NSIS Windows installer (3.38 MB).
  - WiX MSI Windows installer (4.92 MB).
- **Documentation Suite**:
  - Architecture specifications, Design Decisions (ADRs), Development & Contributing guides.
  - Milestone tracking (`docs/MILESTONES.md`), Collaboration handbook (`docs/COLLABORATION.md`), and Phase 2 blueprint (`docs/NEXT_STEPS.md`).

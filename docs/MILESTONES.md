# Taleno — Project Milestones & Release Schedule

> Current release baseline (2026-10-21): the latest published desktop release is **v0.1.9**, released 2026-10-16. The v0.2.x/v1.x labels and dates below are historical planning labels, not evidence of published releases. Their original numbering is preserved. Development after v0.1.9 is unreleased. See [implementation status](ARCHITECTURE.md#11-feature--platform-implementation-status-matrix) and [issue acceptance](ISSUE_REPAIR_PLAN.md) for current evidence and outstanding work. Mobile file access, save, keyboard and safe-area acceptance remain pending Android/iOS hardware; no mobile packaging/signing workflow is configured.


This document tracks the strategic milestones, deliverables, acceptance criteria, and progress for **Taleno** — the seamless in-place Markdown reader-editor built on **Tauri 2 + Rust + SolidJS**.

---

## 🎯 Milestone Overview

```mermaid
gantt
    title Taleno Engineering Roadmap
    dateFormat  YYYY-MM-DD
    section Core Reader
    M0 - Project Scaffolding       :done, m0, 2026-08-20, 2026-08-22
    M1 - Core Reader MVP           :done, m1, 2026-08-23, 2026-08-24
    section Editor & Workspace
    M2 - WYSIWYG & Display Modes   :done, m2, 2026-08-24, 2026-08-24
    M3 - Workspace & Multi-Tab     :done, m3, 2026-08-24, 2026-08-24
    section Polish & Extensions
    M4 - Code & Theme Engine       :done, m4, 2026-08-24, 2026-08-24
    M5 - Testing & v1.0.0 Release  :done, m5, 2026-08-24, 2026-08-24
    M6 - Export & Find/Replace     :done, m6, 2026-08-24, 2026-08-24
    section Advanced Features
    M7 - Search, Math & MenuBar    :done, m7, 2026-08-24, 2026-08-25
    section Localization & i18n
    M8 - Multi-Language i18n       :done, m8, 2026-08-25, 2026-09-01
    section Plugins & Extensibility
    M9 - Plugin & Theme Engine     :done, m9, 2026-09-01, 2026-09-02
    section Mobile Cross-Platform
    M10 - iOS & Android Mobile Port:active, m10, 2026-09-02, 2026-09-30
```

---

## 📌 Milestone Details

### Milestone 0: Scaffolding & Foundation (v0.0.1)
- **Status**: ✅ Completed
- **Target Date**: 2026-08-22
- **Objective**: Establish the dual-runtime architecture, module layout, toolchain pipelines, and security sandboxing.
- **Key Deliverables**:
  - [x] Tauri 2 configuration with capability-based security permissions (`capabilities/default.json`).
  - [x] Rust backend module structure (`commands`, `models`, `services`, `state`).
  - [x] SolidJS + TypeScript + Vite 6 + Tailwind CSS 4 frontend pipeline.
  - [x] IPC bridge contract for commands and asynchronous event streaming.
  - [x] GitHub Actions CI/CD workflows and automated release packager (`.github/workflows/`).

---

### Milestone 1: Core Reader MVP (v0.1.0)
- **Status**: ✅ Completed
- **Target Date**: 2026-08-24
- **Objective**: Deliver a high-performance, native Markdown reader with GFM parsing, TOC navigation, and file system awareness.
- **Key Deliverables**:
  - [x] Resizable 3-part viewport (TOC Sidebar, Main Viewport, Status Bar).
  - [x] Native file open dialog supporting `.md`, `.markdown`, `.mdx`, and `.txt`.
  - [x] Fast AST parsing and word count in Rust via `pulldown-cmark`.
  - [x] Interactive Table of Contents with automatic heading anchor generation and smooth scroll.
  - [x] Asynchronous background file watcher (`notify`) detecting external edits.
  - [x] Tokyo Night-inspired dark/light theme switching with OS detection.

---

### Milestone 2: In-Place WYSIWYG Editing & Tri-State Display Modes (v0.2.0)
- **Status**: ✅ Completed
- **Target Date**: 2026-08-24
- **Objective**: Introduce seamless inline Markdown editing and three rapidly toggleable display modes.
- **Key Deliverables**:
  - [x] **Tri-State Display Mode Switcher** (Status bar toggle & shortcut <kbd>Ctrl+/</kbd>):
    - 📖 **Reading**: Read-only rendering of GFM Markdown text.
    - ✍️ **Writing**: In-place live WYSIWYG editing.
    - 💻 **Code**: Raw Markdown source code view with line numbers.
  - [x] Milkdown v7 editor integration inside SolidJS lifecycle.
  - [x] ProseMirror undo/redo transaction history stack (<kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Y</kbd>).
  - [x] Native atomic document saving (<kbd>Ctrl+S</kbd>) with `.tmp` rename pattern.
  - [x] Dirty document state tracking and unsaved changes confirmation.

---

### Milestone 3: Workspace & Multi-Document Tabs (v0.3.0)
- **Status**: ✅ Completed
- **Target Date**: 2026-08-24
- **Objective**: Enable multi-document management and folder-based workspace browsing.
- **Key Deliverables**:
  - [x] "Open Folder" workspace root browser with asynchronous recursive directory tree.
  - [x] Workspace tree item creation, deletion, and renaming.
  - [x] Multi-tab document bar with dirty indicators and close buttons.
  - [x] Quick file switcher palette (<kbd>Ctrl+P</kbd>) for instant workspace navigation.

---

### Milestone 4: Code Syntax & Theme Engine (v0.4.0)
- **Status**: ✅ Completed
- **Target Date**: 2026-08-24
- **Objective**: High-fidelity code block styling and rich metadata status bar.
- **Key Deliverables**:
  - [x] Rust `syntect` code syntax highlighting with language badges.
  - [x] Copy-to-clipboard button on fenced code blocks.
  - [x] Expanded status bar with word count, character count, UTF-8 encoding, and LF/CRLF detection.

---

### Milestone 5: MVP Release & Test Suite (v1.0.0)
- **Status**: ✅ Completed
- **Target Date**: 2026-08-24
- **Objective**: Comprehensive automated test suites and capability security audit.
- **Key Deliverables**:
  - [x] End-to-end and unit test matrix covering Rust and SolidJS layers (Vitest + `cargo test`).
  - [x] Tauri v2 capabilities security review.
  - [x] Automated GitHub Actions multi-platform release CI/CD workflow.

---

### Milestone 6: Productivity & Search Utilities (v1.1.0)
- **Status**: ✅ Completed
- **Target Date**: 2026-08-24
- **Objective**: In-document Find & Replace, document export, and background auto-save.
- **Key Deliverables**:
  - [x] In-document Find & Replace (<kbd>Ctrl+F</kbd>, <kbd>Ctrl+H</kbd>).
  - [x] Standalone HTML document export engine (`export_document`).
  - [x] Formatting toolbar for tables, blockquotes, headings, lists, and links.
  - [x] Background auto-save timer for active dirty files.

---

### Milestone 7: Advanced Rendering, MenuBar & Navigation (v1.2.0)
- **Status**: ✅ Completed
- **Target Date**: 2026-08-25
- **Objective**: Visual diagram support, mathematical expressions, VS Code-style MenuBar, and Windows shell integration.
- **Key Deliverables**:
  - [x] KaTeX mathematical formula rendering for `$$...$$` blocks.
  - [x] Mermaid.js live diagram rendering container.
  - [x] Zen Mode (<kbd>F11</kbd>) and Focus Mode (<kbd>Ctrl+Shift+D</kbd>).
  - [x] Global workspace full-text search (<kbd>Ctrl+Shift+F</kbd>).
  - [x] VS Code-style top in-app Menu Bar with File, Edit, View, Window, Help menus.
  - [x] Windows default `.md` file associations and CLI startup argument opening.
  - [x] Official GitHub repository integration ([BerryUIKI/Taleno](https://github.com/BerryUIKI/Taleno)).

---

### Milestone 8: Multi-Language Internationalization (i18n) (v1.3.0)
- **Status**: ✅ Completed
- **Target Date**: 2026-09-01
- **Objective**: Provide comprehensive multi-lingual UI localization for global users.
- **Key Deliverables**:
  - [x] SolidJS reactive i18n locale store with auto-detection and persistence.
  - [x] Complete language dictionaries for English (`en`), Simplified Chinese (`zh-CN`), Traditional Chinese (`zh-TW`), Japanese (`ja`), Korean (`ko`), German (`de`), French (`fr`), Spanish (`es`), and Russian (`ru`).
  - [x] In-app language switcher accessible via top Menu Bar and Settings.
  - [x] Localized shortcut tooltips, dialogs, error messages, and documentation references.

---

### Milestone 9: Extensibility, Plugins & Custom Themes (v1.4.0)
- **Status**: ✅ Completed
- **Target Date**: 2026-09-02
- **Objective**: Provide a secure, local-first plugin and theme runtime engine and marketplace directory.
- **Key Deliverables**:
  - [x] Rust plugin discovery service (`%APPDATA%/com.berryuiki.taleno/plugins/`) and manifest validator.
  - [x] Sandboxed `TalenoPluginContext` runtime for command injection and editor hooks.
  - [x] Community Theme engine (`theme.json` + `theme.css`) with hot live-reloading.
  - [x] GitHub marketplace catalog integrations for remote plugin/theme discovery and 1-click installation.

---

### Milestone 10: Mobile Cross-Platform MVP (iOS & Android) (v1.5.0)
- **Status**: 🔄 In Progress
- **Target Date**: 2026-09-30
- **Objective**: Deliver a unified, touch-first mobile experience on iOS and Android powered by Tauri 2 and SolidJS.
- **Key Deliverables**:
  - [ ] Native iOS Xcode project generation (`src-tauri/gen/apple/`) and Android Studio Gradle setup (`src-tauri/gen/android/`).
  - [ ] Single-column mobile responsive layout with collapsible navigation drawer.
  - [ ] Safe-area inset support (`env(safe-area-inset-top)` / `bottom`) across dynamic islands and home bars.
  - [ ] Bottom action formatting toolbar for one-handed mobile Markdown editing.
  - [ ] Virtual keyboard viewport dynamic resizing via `window.visualViewport`.
  - [ ] Mobile sandboxed file storage integration (iOS Documents/iCloud and Android SAF content providers) with atomic crash-safe writes.
  - [ ] Automated mobile test & packaging workflows (iOS IPA / TestFlight and Android APK / AAB).

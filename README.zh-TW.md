<div align="center">

[English](README.md) · [简体中文](README.zh-CN.md) · [**繁體中文**](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Русский](README.ru.md)

<img src="app-icon.svg" alt="Taleno" width="96" height="96">

# ✨ Taleno

**一款 Typora 風格、本機優先、極速響應的 Markdown 閱讀與原位所見即所得編輯器。**

<span style="font-size: 13px;">v0.1.11 已發佈 · AGPL-3.0 開源</span>

[![Website](https://img.shields.io/badge/website-berryuiki.github.io%2FTaleno-4895ef.svg?style=for-the-badge)](https://berryuiki.github.io/Taleno/)
[![Release](https://img.shields.io/badge/release-latest-4361ee.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases/latest)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-10b981.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-6366f1.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/BerryUIKI/Taleno/ci.yml?style=for-the-badge&label=CI&logo=githubactions&logoColor=white&color=3a0ca3)](https://github.com/BerryUIKI/Taleno/actions)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.85+-DEA584?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.9+-2C4F7C?style=for-the-badge&logo=solid&logoColor=white)](https://www.solidjs.com/)

<p align="center">
  <b>🚀 本機優先</b> • <b>📝 無需分割視窗即時排版</b> • <b>🌐 9 種語言介面</b> • </p>

[**📥 立即下載**](#-一鍵直接下載) · [**🖥️ 介面預覽**](#-介面預覽) · [**🌟 核心功能**](#-核心功能亮點) · [**⌨️ 常用快捷鍵**](#-常用快捷鍵) · [**📚 文件**](#-文件) · [**🌐 官網**](https://berryuiki.github.io/Taleno/)

</div>

> 已發布桌面版本：**v0.1.11（2026-11-01）**。後續開發修改尚未發布。實際依賴、實作路徑與驗證邊界見[功能與平台狀態矩陣](docs/ARCHITECTURE.md#11-feature--platform-implementation-status-matrix)。Android/iOS 外部檔案、儲存、鍵盤與安全區域仍待實機驗收，尚未設定行動簽章發布工作。啟動耗時與套件大小依建置和平台而異，以實測紀錄為準。

---

## 📖 目錄

- [🖥️ 介面預覽](#-介面預覽)
- [📥 一鍵直接下載](#-一鍵直接下載)
- [🌟 核心功能亮點](#-核心功能亮點)
- [💡 為什麼選擇 Taleno](#-為什麼選擇-Taleno)
- [⌨️ 常用快捷鍵](#-常用快捷鍵)
- [🛠️ 架構與技術棧](#-架構與技術棧)
- [💻 開發者指南](#-開發者指南)
- [📚 文件](#-文件)
- [🤝 參與貢獻](#-參與貢獻)
- [💬 社群與支援](#-社群與支援)
- [❤️ 致謝](#-致謝)
- [📄 開源許可證](#-開源許可證)

---

## 🖥️ 介面預覽

一睹 Taleno 的真實面貌——選單列、多分頁、大綱側邊欄與原位所見即所得編輯，全部整合於單一視窗。無需分割視窗、無需預覽、零干擾。

<p align="center">
  <img src="assets/Taleno-ui.svg" alt="Taleno 原位所見即所得 Markdown 編輯器" width="85%">
</p>

> **閱讀** · **寫作** · **程式碼** —— 三種顯示模式，一鍵（`Ctrl+/`）切換。

---

## 📥 一鍵直接下載

選擇作業系統和安裝包：

- **Windows x86_64：** [安裝程式 (`.exe`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.exe) · [MSI](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.msi)
- **macOS Apple Silicon：** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_aarch64.dmg)
- **macOS Intel：** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_x86_64.dmg)
- **Linux x86_64：** [AppImage](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.AppImage) · [Debian/Ubuntu (`.deb`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.deb) · [Fedora/RHEL (`.rpm`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.rpm)

[查看全部發行版和原始碼歸檔](https://github.com/BerryUIKI/Taleno/releases/latest)。

---

## 📖 專案簡介

**Taleno** 是一款為作家、開發者與學者量身打造的開源 Markdown 編輯器。它徹底摒棄傳統編輯器"左邊寫程式碼、右邊看預覽"的分割視窗模式，採用如同 Typora 的原位即時排版渲染。

基於 **Tauri 2 + Rust + SolidJS** 現代技術棧構建，擁有流暢原生效能與極簡沉浸的寫作體驗。

---

## 🌟 核心功能亮點

| 功能分類 | 特性說明 | 狀態 |
|---|---|:---:|
| 🌐 **9 語言國際化** | 原生支援 **繁體中文**、**簡體中文**、**English**、**日本語**、**한국어**、**Deutsch**、**Français**、**Español**、**Русский**，自動辨識系統語言並支援執行時切換 | ✅ 已就緒 |
| 🪟 **平台原生視窗外觀** | Windows/Linux 使用緊湊的自訂控制項，macOS 保留原生「紅黃綠」視窗按鈕 | ✅ 已就緒 |
| 🏷️ **Windows `.md` 檔案關聯** | 自動註冊關聯 `.md`、`.markdown`、`.mdx` 與 `.txt`，在檔案總管中按兩下直接開啟 | ✅ 已就緒 |
| 🔄 **三態顯示模式** | 一鍵無縫切換（`Ctrl+/`）：**閱讀模式** (唯讀渲染)、**寫作模式** (所見即所得) 與 **原始碼模式** (行號同步) | ✅ 已就緒 |
| 📥 **智慧拖曳** | 拖曳檔案即開、拖至分頁列開啟新分頁、拖至文字內自動插入格式化連結 | ✅ 已就緒 |
| ✍️ **原位快捷排版** | 選取文字直接快捷排版 (<kbd>Ctrl+B</kbd> 粗體、<kbd>Ctrl+0</kbd> 正文段落、<kbd>Ctrl+1~6</kbd> 標題) | ✅ 已就緒 |
| 🔲 **單色向量圖示** | 全域採用自適應佈景主題色的單色向量 SVG 圖示 (`stroke="currentColor"`) | ✅ 已就緒 |
| 💾 **防當機原子化儲存** | 採用 Rust 原子寫入機制 (`.tmp` 寫入 -> 瞬間原子重新命名)，杜絕掉電遺失檔案 | ✅ 已就緒 |
| 📂 **工作區與多分頁** | 支援多文件分頁瀏覽、側邊欄遞迴檔案目錄管理與快速切換器 (<kbd>Ctrl+P</kbd>) | ✅ 已就緒 |
| 🌈 **程式碼語法突顯** | 基於 Rust `syntect` 高效能著色，帶語言標籤與一鍵複製按鈕 | ✅ 已就緒 |
| 📑 **動態大綱目錄** | 擷取各級標題產生階層化文件大綱，點擊平滑滾動定位 | ✅ 已就緒 |
| 📊 **Mermaid 圖表與數學公式排版** | 基於容器版面的流程圖、循序圖 (`mermaid`) 與襯線 LaTeX 數學公式 (`math`/`katex`/`$$`) 渲染 | ✅ 已就緒 |
| 🔍 **Rust 原生全域搜尋** | 基於 Rust 後端遞迴檢索 (`src-tauri/src/commands/search.rs`)，帶行符合定位 (<kbd>Ctrl+Shift+F</kbd>) 與單文件搜尋取代 (<kbd>Ctrl+F</kbd> / <kbd>Ctrl+H</kbd>) | ✅ 已就緒 |
| 📤 **獨立 HTML 匯出** | 一鍵將任意 Markdown 匯出為自包含、離線樣式的獨立網頁 (<kbd>Ctrl+E</kbd>) | ✅ 已就緒 |
| 🧩 **外掛系統與擴充能力** | 模組化外掛引擎，支援標準應用程式資料目錄掃描 (`plugins/`)、熱重載、JS 安全沙箱執行階段與偏好設定管理子選單 (<kbd>Ctrl+Shift+X</kbd>) | ✅ 已就緒 |

*後續規劃詳見[路線圖](docs/ROADMAP.md)。*

---

## 💡 為什麼選擇 Taleno

| 對比項 | Taleno | 分割視窗預覽編輯器 | 線上筆記 |
|---|---|---|---|
| **渲染方式** | 原位所見即所得，零分割 | 並排雙欄預覽 | 瀏覽器分頁切換 |
| **啟動速度** | < 400 ms 原生冷啟動 | 取決於 Electron 體積 | 頁面載入 + 同步等待 |
| **隱私** | 100% 本機優先，零遙測 | 本機檔案 | 資料存於雲端 |
| **離線** | 完全離線 | 完全離線 | 需要網路 |
| **儲存格式** | 磁碟上純 Markdown | 可能存在專有格式 | 供應商鎖定 |

Taleno 讓您的文件保持 **磁碟上的純 Markdown** —— 可攜、可 diff、永遠屬於您。無需雲端帳號、無需同步引擎、無任何鎖定。

---

## ⌨️ 常用快捷鍵

| 分類 | 快捷鍵 | 功能操作 |
|---|---|---|
| **文件操作** | <kbd>Ctrl</kbd> + <kbd>N</kbd> | 新增文件 |
| | <kbd>Ctrl</kbd> + <kbd>O</kbd> | 開啟檔案... |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>O</kbd> | 開啟工作區資料夾... |
| | <kbd>Ctrl</kbd> + <kbd>S</kbd> | 儲存目前文件 |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | 另存新檔... |
| | <kbd>Ctrl</kbd> + <kbd>W</kbd> | 關閉目前分頁 |
| | <kbd>Ctrl</kbd> + <kbd>E</kbd> | 匯出為獨立 HTML 檔案... |
| **文字排版** | <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Ctrl</kbd> + <kbd>Y</kbd> | 復原 / 重做 |
| | <kbd>Ctrl</kbd> + <kbd>B</kbd> | 切換粗體 |
| | <kbd>Ctrl</kbd> + <kbd>I</kbd> | 切換斜體 |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> | 切換刪除線 |
| | <kbd>Ctrl</kbd> + <kbd>K</kbd> | 插入 / 包裝超連結 |
| | <kbd>Ctrl</kbd> + <kbd>`</kbd> | 切換行內程式碼 |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> | 轉換為標準正文段落 |
| | <kbd>Ctrl</kbd> + <kbd>1</kbd> ~ <kbd>6</kbd> | 轉換為 1 級 ~ 6 級標題 |
| **檢索導覽** | <kbd>Ctrl</kbd> + <kbd>P</kbd> | 快速文件切換器 |
| | <kbd>Ctrl</kbd> + <kbd>F</kbd> | 文件內搜尋 |
| | <kbd>Ctrl</kbd> + <kbd>H</kbd> | 文件內取代 |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | 全工作區全文搜尋 |
| **檢視外觀** | <kbd>Ctrl</kbd> + <kbd>/</kbd> | 切換顯示模式 (閱讀 / 寫作 / 程式碼) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> | 折疊 / 展開側邊欄 (檔案 / 大綱) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> | 切換專注模式 (隱藏介面干擾) |
| | <kbd>F11</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | 切換禪意模式 (全螢幕無干擾) |
| | <kbd>Ctrl</kbd> + <kbd>+</kbd> / <kbd>-</kbd> | 放大 / 縮小字級 |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> (數字鍵盤) | 重設預設字級 (16px) |
| **偏好設定與外掛** | <kbd>Ctrl</kbd> + <kbd>,</kbd> | 開啟偏好設定 / 設定面板 |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> | 開啟外掛模組管理面板 |

*(在 macOS 上，請將 <kbd>Ctrl</kbd> 替換為 <kbd>Cmd</kbd>)*

---

## 🛠️ 架構與技術棧

```
┌────────────────────────────────────────────────────────┐
│               Frontend (SolidJS + Webview)             │
│   • Reactive UI Components (MenuBar, Sidebar, Tabs)   │
│   • Editor Engine (Milkdown / ProseMirror WYSIWYG)     │
│   • Multi-language Engine (Solid Signals, 9 Locales)   │
│   • Typed IPC Wrappers (invoke / listen)               │
└──────────────────────────┬─────────────────────────────┘
                           │ IPC Bridge (JSON / Events)
┌──────────────────────────▼─────────────────────────────┐
│                 Backend (Rust Native App)              │
│   • State Management (Mutex<AppState>)                 │
│   • Native Update Checker (HTTPS Reqwest Client)       │
│   • Atomic File I/O & FS Watcher (notify crate)        │
│   • Zero-Copy AST Parser (pulldown-cmark)              │
│   • Code Syntax Highlighter (syntect)                  │
└────────────────────────────────────────────────────────┘
```

---

## 💻 開發者指南

### 環境需求
* [Node.js](https://nodejs.org/) 20+
* [pnpm](https://pnpm.io/) 9+
* [Rust](https://rustup.rs/) 1.85+
* [Tauri 2 環境配置](https://v2.tauri.app/start/prerequisites/)

### 本機執行與建置
```bash
git clone https://github.com/BerryUIKI/Taleno.git
cd Taleno

# 安裝前端依賴
pnpm install

# 啟動本機 Tauri 開發環境
pnpm tauri dev
```

### 測試與驗證
```bash
# 執行全部 Rust 單元測試
cargo test --manifest-path src-tauri/Cargo.toml

# 嚴格 TypeScript 型別檢查
pnpm tsc --noEmit

# 執行前端單元測試 (Vitest)
pnpm test
```

### 生產建置
```bash
# 編譯各平台生產版安裝包
pnpm tauri build
```

---

## 📚 文件

| 文件 | 說明 |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 系統設計與資料流 |
| [DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) | 架構決策記錄 (ADRs) |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | 開發者環境與除錯指南 |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | 貢獻指南與規範 |
| [COLLABORATION.md](docs/COLLABORATION.md) | 團隊協作與審查規則 |
| [ROADMAP.md](docs/ROADMAP.md) | 分階段功能路線圖 (MoSCoW) |
| [MILESTONES.md](docs/MILESTONES.md) | 里程碑與計畫 |
| [NEXT_STEPS.md](docs/NEXT_STEPS.md) | Phase 2 實作藍圖 |

---

## 🤝 參與貢獻

我們熱忱歡迎各類貢獻 —— 問題回報、功能建議、翻譯與拉取請求皆可。

1. Fork 本倉庫並從 `dev` 分支建立新分支。
2. 遵循[貢獻指南](docs/CONTRIBUTING.md)與[協作手冊](docs/COLLABORATION.md)。
3. 提交訊息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 規範。
4. 向 `dev` 分支發起 Pull Request。

提交訊息格式：`<type>(<scope>): <short summary>` —— 例如 `feat(editor): integrate Milkdown core in-place WYSIWYG renderer`。

---

## 💬 社群與支援

- 🐛 [回報 Bug / 提交需求](https://github.com/BerryUIKI/Taleno/issues)
- 🌐 [官網](https://berryuiki.github.io/Taleno/)
- 💡 [發起討論](https://github.com/BerryUIKI/Taleno/discussions)
- 🔒 [安全政策](https://github.com/BerryUIKI/Taleno/security)
- 📦 [全部發行版](https://github.com/BerryUIKI/Taleno/releases)

---

## ❤️ 致謝

Taleno 站在這些傑出開源專案的肩膀上：

- [Tauri 2](https://tauri.app) — 輕量、安全的桌面殼
- [Rust](https://www.rust-lang.org/) — 記憶體安全的原生後端
- [SolidJS](https://www.solidjs.com/) — 細粒度響應式前端
- [Milkdown](https://milkdown.dev) / [ProseMirror](https://prosemirror.net) — 所見即所得編輯引擎
- [pulldown-cmark](https://github.com/pulldown-cmark/pulldown-cmark) — 零拷貝 GFM AST 解析
- [syntect](https://github.com/trishume/syntect) — 程式碼語法突顯
- [notify](https://github.com/notify-rs/notify) — 檔案系統監聽
- [tokio](https://tokio.rs) — 非同步執行階段與檔案檢索
- [Mermaid](https://mermaid.js.org) — 圖表渲染
- [KaTeX](https://katex.org) — 數學公式渲染
- [Tailwind CSS](https://tailwindcss.com) — 原子化樣式方案

---

## 📄 開源許可證

本專案基於 **GNU Affero General Public License v3.0 (AGPL-3.0)** 許可證開源。詳情請參閱 [LICENSE](LICENSE) 檔案。

如果您修改 Taleno 並以網路服務形式執行，AGPL-3.0 要求您向使用者提供修改後的原始碼。

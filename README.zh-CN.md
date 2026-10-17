<div align="center">

[English](README.md) · [**简体中文**](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Русский](README.ru.md)

<img src="app-icon.svg" alt="Taleno" width="96" height="96">

# ✨ Taleno

**一款 Typora 风格、本地优先、极速响应的 Markdown 阅读与原位所见即所得编辑器。**

<span style="font-size: 13px;">v0.1.9 已发布 · AGPL-3.0 开源</span>

[![Website](https://img.shields.io/badge/website-berryuiki.github.io%2FTaleno-4895ef.svg?style=for-the-badge)](https://berryuiki.github.io/Taleno/)
[![Release](https://img.shields.io/badge/release-latest-4361ee.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases/latest)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-10b981.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-6366f1.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/BerryUIKI/Taleno/ci.yml?style=for-the-badge&label=CI&logo=githubactions&logoColor=white&color=3a0ca3)](https://github.com/BerryUIKI/Taleno/actions)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.85+-DEA584?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.9+-2C4F7C?style=for-the-badge&logo=solid&logoColor=white)](https://www.solidjs.com/)

<p align="center">
  <b>🚀 本地优先</b> • <b>⚡ 毫秒级极速冷启动 (&lt;400ms)</b> • <b>📝 无需分屏实时排版</b> • <b>🌐 9 种语言界面</b> • <b>📦 轻量安装包 (~3.6 MB)</b>
</p>

[**📥 立即下载**](#-一键直接下载) · [**🖥️ 界面预览**](#-界面预览) · [**🌟 核心功能**](#-核心功能亮点) · [**⌨️ 常用快捷键**](#-常用快捷键) · [**📚 文档**](#-文档) · [**🌐 官网**](https://berryuiki.github.io/Taleno/)

</div>

---

## 📖 目录

- [🖥️ 界面预览](#-界面预览)
- [📥 一键直接下载](#-一键直接下载)
- [🌟 核心功能亮点](#-核心功能亮点)
- [💡 为什么选择 Taleno](#-为什么选择-Taleno)
- [⌨️ 常用快捷键](#-常用快捷键)
- [🛠️ 架构与技术栈](#-架构与技术栈)
- [💻 开发者指南](#-开发者指南)
- [📚 文档](#-文档)
- [🤝 参与贡献](#-参与贡献)
- [💬 社区与支持](#-社区与支持)
- [❤️ 致谢](#-致谢)
- [📄 开源许可证](#-开源许可证)

---

## 🖥️ 界面预览

一睹 Taleno 的真实面貌——菜单栏、多标签页、大纲侧边栏与原位所见即所得编辑，全部集成于一个窗口。无需分屏、无需预览、零干扰。

<p align="center">
  <img src="assets/Taleno-ui.svg" alt="Taleno 原位所见即所得 Markdown 编辑器" width="85%">
</p>

> **阅读** · **写作** · **代码** —— 三种显示模式，一键（`Ctrl+/`）切换。

---

## 📥 一键直接下载

选择操作系统和安装包：

- **Windows x86_64：** [安装程序 (`.exe`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.exe) · [MSI](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.msi)
- **macOS Apple Silicon：** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_aarch64.dmg)
- **macOS Intel：** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_x86_64.dmg)
- **Linux x86_64：** [AppImage](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.AppImage) · [Debian/Ubuntu (`.deb`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.deb) · [Fedora/RHEL (`.rpm`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.rpm)

[查看全部发行版和源码归档](https://github.com/BerryUIKI/Taleno/releases/latest)。

---

## 📖 项目简介

**Taleno** 是一款为作家、开发者与学者量身定制的开源 Markdown 编辑器。它彻底摒弃了传统编辑器"左边写代码、右边看预览"的分屏模式，采用如同 Typora 的原位即时排版渲染。

基于 **Tauri 2 + Rust + SolidJS** 现代技术栈开发，拥有近乎原生的桌面性能与极简沉浸的交互体验。

---

## 🌟 核心功能亮点

| 功能分类 | 特性说明 | 状态 |
|---|---|:---:|
| 🌐 **9 语言国际化** | 原生支持 **简体中文**、**繁體中文**、**English**、**日本語**、**한국어**、**Deutsch**、**Français**、**Español**、**Русский**，自动识别系统语言并支持运行时切换 | ✅ 已就绪 |
| 🪟 **平台原生窗口外观** | Windows/Linux 使用紧凑的自定义控件，macOS 保留原生"红黄绿"窗口按钮 | ✅ 已就绪 |
| 🏷️ **Windows `.md` 关联** | 自动注册关联 `.md`、`.markdown`、`.mdx` 与 `.txt`，在资源管理器中双击即刻打开 | ✅ 已就绪 |
| 🔄 **三态显示模式** | 一键无缝切换（`Ctrl+/`）：**阅读模式** (只读渲染)、**写作模式** (所见即所得) 与 **源码模式** (行号同步) | ✅ 已就绪 |
| 📥 **智能拖拽** | 拖拽文件即开、拖到标签栏开启新标签页、拖到文本内自动插入格式化链接 | ✅ 已就绪 |
| ✍️ **原位快捷排版** | 选中文字直接快捷排版 (<kbd>Ctrl+B</kbd> 加粗、<kbd>Ctrl+0</kbd> 正文段落、<kbd>Ctrl+1~6</kbd> 标题) | ✅ 已就绪 |
| 🔲 **单色矢量图标** | 全局采用自适应主题色的单色矢量 SVG 图标 (`stroke="currentColor"`)，告别杂乱视觉干扰 | ✅ 已就绪 |
| 💾 **防崩溃原子化保存** | 采用 Rust 原子写入机制 (`.tmp` 写入 -> 瞬间原子重命名)，杜绝掉电与崩溃丢文件 | ✅ 已就绪 |
| 📂 **工作区与多标签** | 支持多文档分标签浏览、侧边栏递归文件目录管理与快捷切换器 (<kbd>Ctrl+P</kbd>) | ✅ 已就绪 |
| 🌈 **代码块语法高亮** | 基于 Rust `syntect` 高性能着色，带语言标签与一键复制按钮 | ✅ 已就绪 |
| 📑 **动态大纲目录** | 提取各级标题生成层次化文档大纲，点击平滑滚动定位 | ✅ 已就绪 |
| 📊 **Mermaid 图表与数学公式排版** | 基于容器布局的流程图、时序图 (`mermaid`) 与衬线 LaTeX 数学公式 (`math`/`katex`/`$$`) 渲染 | ✅ 已就绪 |
| 🔍 **Rust 原生全局搜索** | 基于 Rust 后端递归检索 (`src-tauri/src/commands/search.rs`)，带行匹配定位 (<kbd>Ctrl+Shift+F</kbd>) 与单文档查找替换 (<kbd>Ctrl+F</kbd> / <kbd>Ctrl+H</kbd>) | ✅ 已就绪 |
| 📤 **独立 HTML 导出** | 一键将任意 Markdown 导出为自包含、离线样式的独立网页 (<kbd>Ctrl+E</kbd>) | ✅ 已就绪 |
| 🧩 **插件系统与扩展能力** | 模块化插件引擎，支持标准应用数据目录扫描 (`plugins/`)、热重载、JS 安全沙箱运行时与首选项管理子菜单 (<kbd>Ctrl+Shift+X</kbd>) | ✅ 已就绪 |

*后续规划详见 [路线图](docs/ROADMAP.md)。*

---

## 💡 为什么选择 Taleno

| 对比项 | Taleno | 分屏预览编辑器 | 在线笔记 |
|---|---|---|---|
| **渲染方式** | 原位所见即所得，零分屏 | 并排双栏预览 | 浏览器标签页切换 |
| **启动速度** | < 400 ms 原生冷启动 | 取决于 Electron 体积 | 页面加载 + 同步等待 |
| **隐私** | 100% 本地优先，零遥测 | 本地文件 | 数据存于云端 |
| **体积** | ~3.6 MB 安装包 | 100+ MB 安装包 | 不适用 |
| **离线** | 完全离线 | 完全离线 | 需要网络 |
| **存储格式** | 磁盘上纯 Markdown | 可能存在专有格式 | 供应商锁定 |

Taleno 让您的文档保持 **磁盘上的纯 Markdown** —— 可移植、可 diff、永远属于您。无需云账号、无需同步引擎、无任何锁定。

---

## ⌨️ 常用快捷键

| 分类 | 快捷键 | 功能操作 |
|---|---|---|
| **文档操作** | <kbd>Ctrl</kbd> + <kbd>N</kbd> | 新建文档 |
| | <kbd>Ctrl</kbd> + <kbd>O</kbd> | 打开文件... |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>O</kbd> | 打开工作区文件夹... |
| | <kbd>Ctrl</kbd> + <kbd>S</kbd> | 保存当前文档 |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | 另存为... |
| | <kbd>Ctrl</kbd> + <kbd>W</kbd> | 关闭当前标签页 |
| | <kbd>Ctrl</kbd> + <kbd>E</kbd> | 导出为独立 HTML 文件... |
| **文本排版** | <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Ctrl</kbd> + <kbd>Y</kbd> | 撤销 / 重做 |
| | <kbd>Ctrl</kbd> + <kbd>B</kbd> | 粗体切换 |
| | <kbd>Ctrl</kbd> + <kbd>I</kbd> | 斜体切换 |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> | 删除线切换 |
| | <kbd>Ctrl</kbd> + <kbd>K</kbd> | 插入 / 包装超链接 |
| | <kbd>Ctrl</kbd> + <kbd>`</kbd> | 行内代码切换 |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> | 转换为标准正文段落 |
| | <kbd>Ctrl</kbd> + <kbd>1</kbd> ~ <kbd>6</kbd> | 转换为 1 级 ~ 6 级标题 |
| **检索导航** | <kbd>Ctrl</kbd> + <kbd>P</kbd> | 快速文档切换器 |
| | <kbd>Ctrl</kbd> + <kbd>F</kbd> | 文档内查找 |
| | <kbd>Ctrl</kbd> + <kbd>H</kbd> | 文档内替换 |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | 全工作区全文搜索 |
| **视图外观** | <kbd>Ctrl</kbd> + <kbd>/</kbd> | 切换显示模式 (阅读 / 写作 / 代码) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> | 折叠 / 展开侧边栏 (文件 / 大纲) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> | 切换专注模式 (隐藏界面干扰) |
| | <kbd>F11</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | 切换禅意模式 (全屏无干扰) |
| | <kbd>Ctrl</kbd> + <kbd>+</kbd> / <kbd>-</kbd> | 放大 / 缩小字号 |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> (数字键盘) | 恢复默认字号 (16px) |
| **首选项与插件** | <kbd>Ctrl</kbd> + <kbd>,</kbd> | 打开首选项 / 设置面板 |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> | 打开插件管理面板 |

*(在 macOS 上，请将 <kbd>Ctrl</kbd> 替换为 <kbd>Cmd</kbd>)*

---

## 🛠️ 架构与技术栈

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

## 💻 开发者指南

### 环境要求
* [Node.js](https://nodejs.org/) 20+
* [pnpm](https://pnpm.io/) 9+
* [Rust](https://rustup.rs/) 1.85+
* [Tauri 2 环境配置](https://v2.tauri.app/start/prerequisites/)

### 本地运行与构建
```bash
git clone https://github.com/BerryUIKI/Taleno.git
cd Taleno

# 安装前端依赖
pnpm install

# 启动本地 Tauri 开发环境
pnpm tauri dev
```

### 测试与验证
```bash
# 运行全部 Rust 单元测试
cargo test --manifest-path src-tauri/Cargo.toml

# 严格 TypeScript 类型检查
pnpm tsc --noEmit

# 运行前端单元测试 (Vitest)
pnpm test
```

### 生产构建
```bash
# 编译各平台生产版安装包
pnpm tauri build
```

---

## 📚 文档

| 文档 | 说明 |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 系统设计与数据流 |
| [DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) | 架构决策记录 (ADRs) |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | 开发者环境与调试指南 |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | 贡献指南与规范 |
| [COLLABORATION.md](docs/COLLABORATION.md) | 团队协作与评审规则 |
| [ROADMAP.md](docs/ROADMAP.md) | 分阶段功能路线图 (MoSCoW) |
| [MILESTONES.md](docs/MILESTONES.md) | 里程碑与计划 |
| [NEXT_STEPS.md](docs/NEXT_STEPS.md) | Phase 2 实现蓝图 |

---

## 🤝 参与贡献

我们热忱欢迎各类贡献 —— 问题反馈、功能建议、翻译与拉取请求皆可。

1. Fork 本仓库并从 `dev` 分支创建新分支。
2. 遵循[贡献指南](docs/CONTRIBUTING.md)与[协作手册](docs/COLLABORATION.md)。
3. 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。
4. 向 `dev` 分支发起 Pull Request。

提交信息格式：`<type>(<scope>): <short summary>` —— 例如 `feat(editor): integrate Milkdown core in-place WYSIWYG renderer`。

---

## 💬 社区与支持

- 🐛 [报告 Bug / 提交需求](https://github.com/BerryUIKI/Taleno/issues)
- 🌐 [官网](https://berryuiki.github.io/Taleno/)
- 💡 [发起讨论](https://github.com/BerryUIKI/Taleno/discussions)
- 🔒 [安全策略](https://github.com/BerryUIKI/Taleno/security)
- 📦 [全部发行版](https://github.com/BerryUIKI/Taleno/releases)

---

## ❤️ 致谢

Taleno 站在这些杰出开源项目的肩膀上：

- [Tauri 2](https://tauri.app) — 轻量、安全的桌面壳
- [Rust](https://www.rust-lang.org/) — 内存安全的原生后端
- [SolidJS](https://www.solidjs.com/) — 细粒度响应式前端
- [Milkdown](https://milkdown.dev) / [ProseMirror](https://prosemirror.net) — 所见即所得编辑引擎
- [pulldown-cmark](https://github.com/pulldown-cmark/pulldown-cmark) — 零拷贝 GFM AST 解析
- [syntect](https://github.com/trishume/syntect) — 代码语法高亮
- [notify](https://github.com/notify-rs/notify) — 文件系统监听
- [tokio](https://tokio.rs) — 异步运行时与文件检索
- [Mermaid](https://mermaid.js.org) — 图表渲染
- [KaTeX](https://katex.org) — 数学公式渲染
- [Tailwind CSS](https://tailwindcss.com) — 原子化样式方案

---

## 📄 开源许可证

本项目基于 **GNU Affero General Public License v3.0 (AGPL-3.0)** 许可证开源。详情请参阅 [LICENSE](LICENSE) 文件。

如果您修改 Taleno 并以网络服务形式运行，AGPL-3.0 要求您向用户提供修改后的源代码。

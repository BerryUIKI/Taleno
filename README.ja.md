<div align="center">

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [**日本語**](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Русский](README.ru.md)

<img src="app-icon.svg" alt="Taleno" width="96" height="96">

# ✨ Taleno

**Typora スタイルのローカルファースト、超高速 Markdown リーダー & インプレース WYSIWYG エディター。**

<span style="font-size: 13px;">v0.1.9 リリース · AGPL-3.0 オープンソース</span>

[![Website](https://img.shields.io/badge/website-berryuiki.github.io%2FTaleno-4895ef.svg?style=for-the-badge)](https://berryuiki.github.io/Taleno/)
[![Release](https://img.shields.io/badge/release-latest-4361ee.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases/latest)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-10b981.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-6366f1.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/BerryUIKI/Taleno/ci.yml?style=for-the-badge&label=CI&logo=githubactions&logoColor=white&color=3a0ca3)](https://github.com/BerryUIKI/Taleno/actions)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.85+-DEA584?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.9+-2C4F7C?style=for-the-badge&logo=solid&logoColor=white)](https://www.solidjs.com/)

<p align="center">
  <b>🚀 ローカルファースト</b> • <b>⚡ 超高速起動 (&lt;400ms)</b> • <b>📝 画面分割なしの即時レンダリング</b> • <b>🌐 9言語対応</b> • <b>📦 軽量 (~3.6 MB)</b>
</p>

[**📥 ダウンロード**](#-ダイレクトダウンロード) · [**🖥️ インターフェースプレビュー**](#-インターフェースプレビュー) · [**🌟 主な機能**](#-主な機能) · [**⌨️ ショートカット**](#-ショートカット一覧) · [**📚 ドキュメント**](#-ドキュメント) · [**🌐 ウェブサイト**](https://berryuiki.github.io/Taleno/)

</div>

---

## 📖 目次

- [🖥️ インターフェースプレビュー](#-インターフェースプレビュー)
- [📥 ダイレクトダウンロード](#-ダイレクトダウンロード)
- [🌟 主な機能](#-主な機能)
- [💡 なぜ Taleno なのか](#-なぜ-Taleno-なのか)
- [⌨️ ショートカット一覧](#-ショートカット一覧)
- [🛠️ アーキテクチャと技術スタック](#-アーキテクチャと技術スタック)
- [💻 開発者ガイド](#-開発者ガイド)
- [📚 ドキュメント](#-ドキュメント)
- [🤝 コントリビューション](#-コントリビューション)
- [💬 コミュニティとサポート](#-コミュニティとサポート)
- [❤️ 謝辞](#-謝辞)
- [📄 ライセンス](#-ライセンス)

---

## 🖥️ インターフェースプレビュー

Taleno の実際の姿 — メニューバー、複数タブ、アウトラインサイドバー、インプレース WYSIWYG 編集をすべて 1 つのウィンドウに統合。分割画面もプレビューも不要、ノイズゼロ。

<p align="center">
  <img src="assets/Taleno-ui.svg" alt="Taleno インプレース WYSIWYG Markdown エディター" width="85%">
</p>

> **閲覧** · **編集** · **コード** — 3 つの表示モードをワンキー（`Ctrl+/`）で切り替え。

---

## 📥 ダイレクトダウンロード

OS とパッケージを選択してください：

- **Windows x86_64:** [インストーラー (`.exe`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.exe) · [MSI](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.msi)
- **macOS Apple Silicon:** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_aarch64.dmg)
- **macOS Intel:** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_x86_64.dmg)
- **Linux x86_64:** [AppImage](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.AppImage) · [Debian/Ubuntu (`.deb`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.deb) · [Fedora/RHEL (`.rpm`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.rpm)

[すべてのリリースとソースアーカイブを表示](https://github.com/BerryUIKI/Taleno/releases/latest)。

---

## 📖 はじめに

**Taleno** は、ライター・開発者・研究者のために作られたオープンソースの Markdown エディターです。「左にコード、右にプレビュー」という従来の分割画面を廃し、Typora のように入力した場所にそのままレンダリングします。

**Tauri 2 + Rust + SolidJS** というモダンな技術スタックにより、ネイティブに近いデスクトップパフォーマンスと、ミニマルで没入感のある執筆体験を両立しています。

---

## 🌟 主な機能

| 機能 | ハイライト | 状態 |
|---|---|:---:|
| 🌐 **9言語国際化** | **日本語**、English、简体中文、繁體中文、한국어、Deutsch、Français、Español、Русский をネイティブサポート。OS 言語を自動検出し、実行時切り替えに対応 | ✅ 完了 |
| 🪟 **プラットフォームネイティブなウィンドウ** | Windows/Linux はカスタムコントロール、macOS はネイティブの信号機ボタンを採用 | ✅ 完了 |
| 🏷️ **Windows `.md` ファイル関連付け** | `.md` / `.markdown` / `.mdx` / `.txt` を自動登録。エクスプローラーでダブルクリックで即起動 | ✅ 完了 |
| 🔄 **3つの表示モード** | `Ctrl+/` でワンキー切替：**閲覧モード** (読み取り専用)、**編集モード** (WYSIWYG)、**コードモード** (行番号同期) | ✅ 完了 |
| 📥 **スマートドラッグ＆ドロップ** | ウィンドウへドロップで開く、タブバーへドロップで新規タブ、テキストへドロップで Markdown リンク挿入 | ✅ 完了 |
| ✍️ **インプレース整形** | 選択範囲を標準ショートカットで直接整形 (<kbd>Ctrl+B</kbd> 太字、<kbd>Ctrl+0</kbd> 段落、<kbd>Ctrl+1~6</kbd> 見出し) | ✅ 完了 |
| 🔲 **モノクロベクター UI** | テーマ追従の単色 SVG アイコン (`stroke="currentColor"`) でテキストに集中 | ✅ 完了 |
| 💾 **クラッシュ防止アトミック保存** | `.tmp` 書き込み → アトミックリネームによる確実な保存とダーティ状態追跡 | ✅ 完了 |
| 📂 **ワークスペースとタブ** | 複数ドキュメントタブ、再帰ファイルツリー CRUD、クイックスイッチャー (<kbd>Ctrl+P</kbd>) | ✅ 完了 |
| 🌈 **コードシンタックスハイライト** | `syntect` による高速ハイライト、言語タグとコピーボタン付き | ✅ 完了 |
| 📑 **動的目次** | 見出しから階層アウトラインを生成、全モードでスムーズスクロール | ✅ 完了 |
| 📊 **Mermaid & 数式レイアウト** | フローチャート、シーケンス図 (`mermaid`) とセリフ体 LaTeX 数式 (`math`/`katex`/`$$`) のコンテナ描画 | ✅ 完了 |
| 🔍 **Rust ネイティブ全文検索** | Rust バックエンド再帰検索 (`src-tauri/src/commands/search.rs`) による行マッチ抽出 (<kbd>Ctrl+Shift+F</kbd>) とドキュメント内検索・置換 (<kbd>Ctrl+F</kbd> / <kbd>Ctrl+H</kbd>) | ✅ 完了 |
| 📤 **単体 HTML エクスポート** | 自己完結のオフライン HTML にワンクリックエクスポート (<kbd>Ctrl+E</kbd>) | ✅ 完了 |
| 🧩 **プラグインシステムと拡張性** | モジュール式プラグインエンジン、標準アプリデータディレクトリ走査 (`plugins/`)、ホットリロード、JS サンドボックス実行環境と設定サブメニュー (<kbd>Ctrl+Shift+X</kbd>) | ✅ 完了 |

*今後の計画は[ロードマップ](docs/ROADMAP.md)をご覧ください。*

---

## 💡 なぜ Taleno なのか

| | Taleno | 分割画面プレビュー | オンラインノート |
|---|---|---|---|
| **レンダリング** | インプレース WYSIWYG、分割なし | 左右分割プレビュー | ブラウザタブの行き来 |
| **起動速度** | < 400 ms ネイティブ起動 | Electron 依存 | ページ読み込み + 同期待ち |
| **プライバシー** | 100% ローカル、テレメトリなし | ローカルファイル | クラウド保存 |
| **サイズ** | 約 3.6 MB インストーラー | 100+ MB インストーラー | なし |
| **オフライン** | 完全オフライン | 完全オフライン | ネットワーク必須 |
| **保存形式** | 純粋な Markdown | 独自形式の可能性 | ベンダーロックイン |

Taleno はドキュメントを **ディスク上の純粋な Markdown** として保持します — ポータブル、差分可能、そして永遠にあなたのもの。クラウドアカウントも同期エンジンもロックインも不要です。

---

## ⌨️ ショートカット一覧

| カテゴリ | ショートカット | 操作 |
|---|---|---|
| **ドキュメント** | <kbd>Ctrl</kbd> + <kbd>N</kbd> | 新規ドキュメント |
| | <kbd>Ctrl</kbd> + <kbd>O</kbd> | ファイルを開く... |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>O</kbd> | ワークスペースフォルダを開く... |
| | <kbd>Ctrl</kbd> + <kbd>S</kbd> | 現在のドキュメントを保存 |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | 名前を付けて保存... |
| | <kbd>Ctrl</kbd> + <kbd>W</kbd> | 現在のタブを閉じる |
| | <kbd>Ctrl</kbd> + <kbd>E</kbd> | HTML としてエクスポート... |
| **編集** | <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Ctrl</kbd> + <kbd>Y</kbd> | 元に戻す / やり直す |
| | <kbd>Ctrl</kbd> + <kbd>B</kbd> | 太字を切り替え |
| | <kbd>Ctrl</kbd> + <kbd>I</kbd> | 斜体を切り替え |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> | 取り消し線を切り替え |
| | <kbd>Ctrl</kbd> + <kbd>K</kbd> | リンクを挿入 / ラップ |
| | <kbd>Ctrl</kbd> + <kbd>`</kbd> | インラインコードを切り替え |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> | 標準段落に整形 |
| | <kbd>Ctrl</kbd> + <kbd>1</kbd> ~ <kbd>6</kbd> | 見出し 1 ~ 6 に整形 |
| **ナビゲーションと検索** | <kbd>Ctrl</kbd> + <kbd>P</kbd> | クイックファイルスイッチャー |
| | <kbd>Ctrl</kbd> + <kbd>F</kbd> | ドキュメント内を検索 |
| | <kbd>Ctrl</kbd> + <kbd>H</kbd> | ドキュメント内を置換 |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | ワークスペース全体を検索 |
| **表示** | <kbd>Ctrl</kbd> + <kbd>/</kbd> | 表示モード切替 (閲覧 / 編集 / コード) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> | サイドバーを切り替え (ファイル / アウトライン) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> | フォーカスモード (気を散らすものを非表示) |
| | <kbd>F11</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | 禅モード (全画面) |
| | <kbd>Ctrl</kbd> + <kbd>+</kbd> / <kbd>-</kbd> | フォントサイズ拡大 / 縮小 |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> (テンキー) | フォントサイズをリセット (16px) |
| **設定とプラグイン** | <kbd>Ctrl</kbd> + <kbd>,</kbd> | 設定・環境設定を開く |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> | プラグイン管理パネルを開く |

*(macOS では <kbd>Ctrl</kbd> を <kbd>Cmd</kbd> に置き換えてください)*

---

## 🛠️ アーキテクチャと技術スタック

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

## 💻 開発者ガイド

### 前提条件
* [Node.js](https://nodejs.org/) 20+
* [pnpm](https://pnpm.io/) 9+
* [Rust](https://rustup.rs/) 1.85+
* [Tauri の前提条件](https://v2.tauri.app/start/prerequisites/)

### クローンして実行
```bash
git clone https://github.com/BerryUIKI/Taleno.git
cd Taleno

# フロントエンドの依存関係をインストール
pnpm install

# ローカル Tauri 開発サーバーを起動
pnpm tauri dev
```

### テストと検証
```bash
# すべての Rust ユニットテストを実行
cargo test --manifest-path src-tauri/Cargo.toml

# 厳密な TypeScript 型チェック
pnpm tsc --noEmit

# フロントエンドのユニットテストを実行 (Vitest)
pnpm test
```

### プロダクションビルド
```bash
# スタンドアロン実行ファイルと OS インストーラーをビルド
pnpm tauri build
```

---

## 📚 ドキュメント

| ドキュメント | 説明 |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | システム設計とデータフロー |
| [DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) | アーキテクチャ決定記録 (ADRs) |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | 開発環境とデバッグガイド |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | コントリビューションガイドライン |
| [COLLABORATION.md](docs/COLLABORATION.md) | チームワークフローとレビュー規則 |
| [ROADMAP.md](docs/ROADMAP.md) | 段階的な機能ロードマップ (MoSCoW) |
| [MILESTONES.md](docs/MILESTONES.md) | マイルストーンとスケジュール |
| [NEXT_STEPS.md](docs/NEXT_STEPS.md) | Phase 2 実装ブループリント |

---

## 🤝 コントリビューション

バグ報告、機能アイデア、翻訳、プルリクエストなど、あらゆるコントリビューションを歓迎します。

1. リポジトリをフォークし、`dev` ブランチから作業ブランチを作成します。
2. [コントリビューションガイド](docs/CONTRIBUTING.md)と[コラボレーションハンドブック](docs/COLLABORATION.md)に従ってください。
3. コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) 形式に従ってください。
4. `dev` ブランチに対してプルリクエストを開いてください。

コミットメッセージ形式：`<type>(<scope>): <short summary>` — 例：`feat(editor): integrate Milkdown core in-place WYSIWYG renderer`。

---

## 💬 コミュニティとサポート

- 🐛 [バグ報告 / 機能リクエスト](https://github.com/BerryUIKI/Taleno/issues)
- 🌐 [ウェブサイト](https://berryuiki.github.io/Taleno/)
- 💡 [ディスカッションを開始](https://github.com/BerryUIKI/Taleno/discussions)
- 🔒 [セキュリティポリシー](https://github.com/BerryUIKI/Taleno/security)
- 📦 [すべてのリリース](https://github.com/BerryUIKI/Taleno/releases)

---

## ❤️ 謝辞

Taleno は以下の素晴らしいオープンソースプロジェクトの上に成り立っています：

- [Tauri 2](https://tauri.app) — 軽量で安全なデスクトップシェル
- [Rust](https://www.rust-lang.org/) — メモリ安全なネイティブバックエンド
- [SolidJS](https://www.solidjs.com/) — 細粒度リアクティブなフロントエンド
- [Milkdown](https://milkdown.dev) / [ProseMirror](https://prosemirror.net) — WYSIWYG 編集エンジン
- [pulldown-cmark](https://github.com/pulldown-cmark/pulldown-cmark) — ゼロコピー GFM AST パーサー
- [syntect](https://github.com/trishume/syntect) — コードシンタックスハイライト
- [notify](https://github.com/notify-rs/notify) — ファイルシステム監視
- [tokio](https://tokio.rs) — 非同期ランタイムとファイル検索
- [Mermaid](https://mermaid.js.org) — ダイアグラム
- [KaTeX](https://katex.org) — 数式レンダリング
- [Tailwind CSS](https://tailwindcss.com) — ユーティリティファーストなスタイリング

---

## 📄 ライセンス

本プロジェクトは **GNU Affero General Public License v3.0 (AGPL-3.0)** のもとで公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

Taleno を改変してネットワークサービスとして運用する場合、AGPL-3.0 はその利用者に改変後のソースコードを提供することを要求します。

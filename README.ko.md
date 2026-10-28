<div align="center">

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [**한국어**](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Русский](README.ru.md)

<img src="app-icon.svg" alt="Taleno" width="96" height="96">

# ✨ Taleno

**Typora 스타일의 로컬 우선, 초고속 Markdown 리더 및 인플레이스 WYSIWYG 편집기.**

<span style="font-size: 13px;">v0.1.10 출시 · AGPL-3.0 오픈소스</span>

[![Website](https://img.shields.io/badge/website-berryuiki.github.io%2FTaleno-4895ef.svg?style=for-the-badge)](https://berryuiki.github.io/Taleno/)
[![Release](https://img.shields.io/badge/release-latest-4361ee.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases/latest)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-10b981.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-6366f1.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/BerryUIKI/Taleno/ci.yml?style=for-the-badge&label=CI&logo=githubactions&logoColor=white&color=3a0ca3)](https://github.com/BerryUIKI/Taleno/actions)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.85+-DEA584?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.9+-2C4F7C?style=for-the-badge&logo=solid&logoColor=white)](https://www.solidjs.com/)

<p align="center">
  <b>🚀 로컬 우선</b> • <b>📝 화면 분할 없는 실시간 렌더링</b> • <b>🌐 9개 언어 지원</b> • </p>

[**📥 다운로드**](#-원클릭-다운로드) · [**🖥️ 인터페이스 미리보기**](#-인터페이스-미리보기) · [**🌟 주요 기능**](#-주요-기능) · [**⌨️ 단축키**](#-주요-단축키) · [**📚 문서**](#-문서) · [**🌐 웹사이트**](https://berryuiki.github.io/Taleno/)

</div>

> 공개된 데스크톱 버전은 **v0.1.10 (2026-10-28)**입니다. 이후 개발 변경은 아직 출시되지 않았습니다. 실제 의존성, 구현 경로와 검증 범위는 [기능 및 플랫폼 현황](docs/ARCHITECTURE.md#11-feature--platform-implementation-status-matrix)을 참조하세요. Android/iOS 외부 파일, 저장, 키보드와 안전 영역은 실제 기기 검증 대기 중이며 모바일 서명 출시 작업은 구성되지 않았습니다. 시작 시간과 패키지 크기는 빌드와 플랫폼에 따라 다르므로 측정 기록을 기준으로 합니다.

---

## 📖 목차

- [🖥️ 인터페이스 미리보기](#-인터페이스-미리보기)
- [📥 원클릭 다운로드](#-원클릭-다운로드)
- [🌟 주요 기능](#-주요-기능)
- [💡 왜 Taleno인가](#-왜-Taleno인가)
- [⌨️ 주요 단축키](#-주요-단축키)
- [🛠️ 아키텍처와 기술 스택](#-아키텍처와-기술-스택)
- [💻 개발자 가이드](#-개발자-가이드)
- [📚 문서](#-문서)
- [🤝 기여하기](#-기여하기)
- [💬 커뮤니티와 지원](#-커뮤니티와-지원)
- [❤️ 감사의 말](#-감사의-말)
- [📄 라이선스](#-라이선스)

---

## 🖥️ 인터페이스 미리보기

Taleno의 실제 모습 — 메뉴 바, 다중 탭, 아웃라인 사이드바, 인플레이스 WYSIWYG 편집이 하나의 창에 통합되어 있습니다. 화면 분할도, 프리뷰도, 방해 요소도 없습니다.

<p align="center">
  <img src="assets/Taleno-ui.svg" alt="Taleno 인플레이스 WYSIWYG Markdown 편집기" width="85%">
</p>

> **읽기** · **쓰기** · **코드** — 세 가지 표시 모드를 한 번의 키(`Ctrl+/`)로 전환.

---

## 📥 원클릭 다운로드

운영체제와 패키지를 선택하세요:

- **Windows x86_64:** [설치 프로그램 (`.exe`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.exe) · [MSI](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.msi)
- **macOS Apple Silicon:** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_aarch64.dmg)
- **macOS Intel:** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_x86_64.dmg)
- **Linux x86_64:** [AppImage](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.AppImage) · [Debian/Ubuntu (`.deb`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.deb) · [Fedora/RHEL (`.rpm`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.rpm)

[모든 릴리스와 소스 아카이브 보기](https://github.com/BerryUIKI/Taleno/releases/latest).

---

## 📖 소개

**Taleno**는 작가, 개발자, 연구자를 위해 설계된 오픈소스 Markdown 편집기입니다. "왼쪽에 코드, 오른쪽에 프리뷰"라는 전통적인 분할 화면 방식을 버리고, Typora처럼 입력한 위치에 그대로 렌더링합니다.

**Tauri 2 + Rust + SolidJS** 현대적 기술 스택으로 네이티브에 가까운 데스크톱 성능과 미니멀하고 몰입감 있는 작성 경험을 제공합니다.

---

## 🌟 주요 기능

| 기능 | 하이라이트 | 상태 |
|---|---|:---:|
| 🌐 **9개 언어 국제화** | **한국어**, English, 简体中文, 繁體中文, 日本語, Deutsch, Français, Español, Русский 네이티브 지원. OS 언어 자동 감지 및 실행 중 전환 | ✅ 완료 |
| 🪟 **플랫폼 네이티브 윈도우** | Windows/Linux는 커스텀 컨트롤, macOS는 네이티브 트래픽 라이트 버튼 사용 | ✅ 완료 |
| 🏷️ **Windows `.md` 파일 연결** | `.md` / `.markdown` / `.mdx` / `.txt` 자동 등록, 탐색기에서 더블클릭으로 즉시 열기 | ✅ 완료 |
| 🔄 **3가지 표시 모드** | `Ctrl+/`로 원키 전환: **읽기 모드** (읽기 전용), **쓰기 모드** (WYSIWYG), **코드 모드** (줄 번호 동기화) | ✅ 완료 |
| 📥 **스마트 드래그 & 드롭** | 창에 드롭하면 열기, 탭 바에 드롭하면 새 탭, 텍스트에 드롭하면 Markdown 링크 삽입 | ✅ 완료 |
| ✍️ **인플레이스 서식** | 선택 영역을 표준 단축키로 바로 서식 (<kbd>Ctrl+B</kbd> 굵게, <kbd>Ctrl+0</kbd> 문단, <kbd>Ctrl+1~6</kbd> 제목) | ✅ 완료 |
| 🔲 **모노크롬 벡터 UI** | 테마를 따르는 단색 SVG 아이콘 (`stroke="currentColor"`)으로 텍스트에 집중 | ✅ 완료 |
| 💾 **크래시 방지 원자적 저장** | `.tmp` 쓰기 → 원자적 리네임 방식으로 확실한 저장과 더티 상태 추적 | ✅ 완료 |
| 📂 **워크스페이스와 탭** | 다중 문서 탭, 재귀 파일 트리 CRUD, 퀵 스위처 (<kbd>Ctrl+P</kbd>) | ✅ 완료 |
| 🌈 **코드 신택스 하이라이팅** | `syntect` 기반 고속 하이라이팅, 언어 태그와 복사 버튼 제공 | ✅ 완료 |
| 📑 **동적 목차** | 제목에서 계층적 아웃라인 생성, 모든 모드에서 부드러운 스크롤 | ✅ 완료 |
| 📊 **Mermaid 다이어그램 & 수식 레이아웃** | 플로우차트, 시퀀스 다이어그램 (`mermaid`) 및 세리프체 LaTeX 수식 (`math`/`katex`/`$$`) 컨테이너 렌더링 | ✅ 완료 |
| 🔍 **Rust 네이티브 전체 검색** | Rust 백엔드 재귀 검색 (`src-tauri/src/commands/search.rs`) 기반 라인 일치 추출 (<kbd>Ctrl+Shift+F</kbd>) 및 문서 내 찾기/바꾸기 (<kbd>Ctrl+F</kbd> / <kbd>Ctrl+H</kbd>) | ✅ 완료 |
| 📤 **단독 HTML 내보내기** | 자체 포함 오프라인 HTML로 원클릭 내보내기 (<kbd>Ctrl+E</kbd>) | ✅ 완료 |
| 🧩 **플러그인 시스템 및 확장성** | 모듈식 확장 엔진, 표준 앱 데이터 디렉터리 탐색 (`plugins/`), 핫 리로드, JS 샌드박스 런타임 및 환경설정 하위 메뉴 (<kbd>Ctrl+Shift+X</kbd>) | ✅ 완료 |

*향후 계획은 [로드맵](docs/ROADMAP.md)을 참조하세요.*

---

## 💡 왜 Taleno인가

| | Taleno | 분할 화면 편집기 | 온라인 노트 |
|---|---|---|---|
| **렌더링** | 인플레이스 WYSIWYG, 분할 없음 | 좌우 분할 프리뷰 | 브라우저 탭 전전 |
| **시작 속도** | < 400 ms 네이티브 시작 | Electron 의존 | 페이지 로드 + 동기화 대기 |
| **프라이버시** | 100% 로컬, 텔레메트리 없음 | 로컬 파일 | 클라우드 저장 |
| **오프라인** | 완전 오프라인 | 완전 오프라인 | 네트워크 필요 |
| **저장 형식** | 순수 Markdown | 독점 형식 가능성 | 벤더 락인 |

Taleno는 문서를 **디스크의 순수 Markdown**으로 유지합니다 — 휴대 가능하고, diff 가능하며, 영원히 여러분의 것입니다. 클라우드 계정도, 동기화 엔진도, 락인도 없습니다.

---

## ⌨️ 주요 단축키

| 카테고리 | 단축키 | 동작 |
|---|---|---|
| **문서** | <kbd>Ctrl</kbd> + <kbd>N</kbd> | 새 문서 |
| | <kbd>Ctrl</kbd> + <kbd>O</kbd> | 파일 열기... |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>O</kbd> | 워크스페이스 폴더 열기... |
| | <kbd>Ctrl</kbd> + <kbd>S</kbd> | 현재 문서 저장 |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | 다른 이름으로 저장... |
| | <kbd>Ctrl</kbd> + <kbd>W</kbd> | 현재 탭 닫기 |
| | <kbd>Ctrl</kbd> + <kbd>E</kbd> | HTML로 내보내기... |
| **편집** | <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Ctrl</kbd> + <kbd>Y</kbd> | 실행 취소 / 다시 실행 |
| | <kbd>Ctrl</kbd> + <kbd>B</kbd> | 굵게 전환 |
| | <kbd>Ctrl</kbd> + <kbd>I</kbd> | 기울임 전환 |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> | 취소선 전환 |
| | <kbd>Ctrl</kbd> + <kbd>K</kbd> | 링크 삽입 / 감싸기 |
| | <kbd>Ctrl</kbd> + <kbd>`</kbd> | 인라인 코드 전환 |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> | 일반 문단으로 서식 |
| | <kbd>Ctrl</kbd> + <kbd>1</kbd> ~ <kbd>6</kbd> | 제목 1 ~ 6으로 서식 |
| **탐색 및 검색** | <kbd>Ctrl</kbd> + <kbd>P</kbd> | 퀵 파일 스위처 |
| | <kbd>Ctrl</kbd> + <kbd>F</kbd> | 문서 내 찾기 |
| | <kbd>Ctrl</kbd> + <kbd>H</kbd> | 문서 내 바꾸기 |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | 워크스페이스 전체 검색 |
| **보기** | <kbd>Ctrl</kbd> + <kbd>/</kbd> | 표시 모드 전환 (읽기 / 쓰기 / 코드) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> | 사이드바 전환 (파일 / 아웃라인) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> | 집중 모드 전환 (방해 요소 숨김) |
| | <kbd>F11</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | 젠 모드 전환 (전체 화면) |
| | <kbd>Ctrl</kbd> + <kbd>+</kbd> / <kbd>-</kbd> | 글꼴 크기 확대 / 축소 |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> (숫자 키패드) | 글꼴 크기 초기화 (16px) |

*(macOS에서는 <kbd>Ctrl</kbd>을 <kbd>Cmd</kbd>로 바꾸세요)*

---

## 🛠️ 아키텍처와 기술 스택

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

## 💻 개발자 가이드

### 사전 요구 사항
* [Node.js](https://nodejs.org/) 20+
* [pnpm](https://pnpm.io/) 9+
* [Rust](https://rustup.rs/) 1.85+
* [Tauri 사전 요구 사항](https://v2.tauri.app/start/prerequisites/)

### 클론 및 실행
```bash
git clone https://github.com/BerryUIKI/Taleno.git
cd Taleno

# 프론트엔드 의존성 설치
pnpm install

# 로컬 Tauri 개발 서버 시작
pnpm tauri dev
```

### 테스트 및 검증
```bash
# 모든 Rust 유닛 테스트 실행
cargo test --manifest-path src-tauri/Cargo.toml

# 엄격한 TypeScript 타입 검사
pnpm tsc --noEmit

# 프론트엔드 유닛 테스트 실행 (Vitest)
pnpm test
```

### 프로덕션 빌드
```bash
# 독립 실행 파일 및 OS 설치 프로그램 빌드
pnpm tauri build
```

---

## 📚 문서

| 문서 | 설명 |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 시스템 설계 및 데이터 흐름 |
| [DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) | 아키텍처 결정 기록 (ADRs) |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | 개발 환경 및 디버그 가이드 |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | 기여 지침 및 규칙 |
| [COLLABORATION.md](docs/COLLABORATION.md) | 팀 워크플로 및 리뷰 규칙 |
| [ROADMAP.md](docs/ROADMAP.md) | 단계별 기능 로드맵 (MoSCoW) |
| [MILESTONES.md](docs/MILESTONES.md) | 마일스톤 및 일정 |
| [NEXT_STEPS.md](docs/NEXT_STEPS.md) | Phase 2 구현 청사진 |

---

## 🤝 기여하기

버그 리포트, 기능 제안, 번역, 풀 리퀘스트 등 모든 기여를 환영합니다.

1. 저장소를 포크하고 `dev` 브랜치에서 작업 브랜치를 만드세요.
2. [기여 가이드](docs/CONTRIBUTING.md)와 [협업 핸드북](docs/COLLABORATION.md)을 따르세요.
3. 커밋 메시지는 [Conventional Commits](https://www.conventionalcommits.org/) 형식을 따르세요.
4. `dev` 브랜치에 풀 리퀘스트를 여세요.

커밋 메시지 형식: `<type>(<scope>): <short summary>` — 예: `feat(editor): integrate Milkdown core in-place WYSIWYG renderer`.

---

## 💬 커뮤니티와 지원

- 🐛 [버그 신고 / 기능 요청](https://github.com/BerryUIKI/Taleno/issues)
- 🌐 [웹사이트](https://berryuiki.github.io/Taleno/)
- 💡 [토론 시작](https://github.com/BerryUIKI/Taleno/discussions)
- 🔒 [보안 정책](https://github.com/BerryUIKI/Taleno/security)
- 📦 [모든 릴리스](https://github.com/BerryUIKI/Taleno/releases)

---

## ❤️ 감사의 말

Taleno는 다음과 같은 훌륭한 오픈소스 프로젝트 위에 서 있습니다:

- [Tauri 2](https://tauri.app) — 가볍고 안전한 데스크톱 셸
- [Rust](https://www.rust-lang.org/) — 메모리 안전 네이티브 백엔드
- [SolidJS](https://www.solidjs.com/) — 세밀한 반응형 프론트엔드
- [Milkdown](https://milkdown.dev) / [ProseMirror](https://prosemirror.net) — WYSIWYG 편집 엔진
- [pulldown-cmark](https://github.com/pulldown-cmark/pulldown-cmark) — 제로 카피 GFM AST 파서
- [syntect](https://github.com/trishume/syntect) — 코드 신택스 하이라이팅
- [notify](https://github.com/notify-rs/notify) — 파일 시스템 감시
- [tokio](https://tokio.rs) — 비동기 런타임 및 파일 검색
- [Mermaid](https://mermaid.js.org) — 다이어그램
- [KaTeX](https://katex.org) — 수식 렌더링
- [Tailwind CSS](https://tailwindcss.com) — 유틸리티 우선 스타일링

---

## 📄 라이선스

이 프로젝트는 **GNU Affero General Public License v3.0 (AGPL-3.0)**에 따라 라이선스가 부여됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

Taleno를 수정하여 네트워크 서비스로 운영하는 경우, AGPL-3.0은 수정된 소스 코드를 이용자에게 제공하도록 요구합니다.

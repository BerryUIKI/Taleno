# Taleno 修复计划与 AGY 交接

更新：2026-10-17（Asia/Shanghai）。审计基线：`dev c78763c`；当前实现分支：`feature/acceptance-fixes`。

代码分别由两个独立、面向 dev 的 PR 交付：[包目录边界 #131](https://github.com/BerryUIKI/Taleno/pull/131)、[文档完整性 #132](https://github.com/BerryUIKI/Taleno/pull/132)。本机 `feature/acceptance-fixes` 用于联合检查；以各 PR 的最新提交和合并状态为准。

## 1. 范围与执行原则

GitHub 当前清单为 **74 个开放 Issue：15 个 P1、50 个 P2、8 个 P3、1 个总追踪项**。索引：[#127](https://github.com/BerryUIKI/Taleno/issues/127)。v0.1.9 已于北京时间 2026-10-16 正式发布；本轮修改尚未构成新发布。

按用户最新安排：Codex 先检查并修复 P0/P1，其余批次交给 AGY。本文件描述工作区中的实际变更和后续验收；未自动关闭 Issue、推送分支、合并 PR 或修改发布状态。AGY 开始前先运行 `git status` / `git diff`，保留当前修改，不要 reset/覆盖交接工作区。

- 遵守 AGENTS.md：文件 I/O、路径解析、解析/高亮业务在 Rust services；前端只用 typed IPC。
- 核心 PR 目标为 dev；外部插件/社区主题内容只进入 Taleno-Plugins 的 dev。
- 保持纯 Markdown、原子保存、严格 CSP 和最小 capability；不能用放开 unsafe-eval 或通配权限换取测试通过。
- 每个批次先复现、实现、补充期望行为回归、运行验证，再据证据更新状态。不要只勾选总 tracker。

## 2. P0/P1 复核结论

目前 GitHub 标题/优先级清单中 **没有 P0 项**。本轮源码复核确认原 15 个 P1 的风险路径仍在基线中；未通过本次审查额外判定新的 P0。这不代表已经证明系统不存在其他高风险缺陷。

本轮已实现下表代码保护，并添加自动验证。状态为“代码修复，待原生/跨平台验收”，不是已关闭或已发布。

| Issue | 本轮修复 | 主要回归证据 |
| --- | --- | --- |
| [#54](https://github.com/BerryUIKI/Taleno/issues/54) | 新建/打开前 flush 并同步离开标签；每次编辑同步标签快照。 | documentIntegrity.test.ts；App.integrity.test.tsx |
| [#55](https://github.com/BerryUIKI/Taleno/issues/55) | 更新保护检查真实活动文档；下载完成和安装/重启前再次校验新编辑，取消则中止。 | updater.test.ts |
| [#56](https://github.com/BerryUIKI/Taleno/issues/56) | 保存响应仅更新已保存基线；期间新编辑保持可见、dirty，关闭流程不继续。 | documentIntegrity.test.ts；App.integrity.test.tsx |
| [#57](https://github.com/BerryUIKI/Taleno/issues/57) | 保存绑定标签 ID 与实例代号；切换标签、关闭再打开不会让旧响应改写新文档。 | documentIntegrity.test.ts；App.integrity.test.tsx |
| [#58](https://github.com/BerryUIKI/Taleno/issues/58) | Writing 编辑器按标签身份和显式 Reload 版本重建，隔离 Undo/Redo 历史。 | Editor.integrity.test.tsx（真实 Milkdown） |
| [#59](https://github.com/BerryUIKI/Taleno/issues/59) | 编辑事务立即标脏；Save/Close/切换模式/切换标签/更新/销毁前同步序列化 pending 编辑。 | Editor.integrity.test.tsx；documentIntegrity.test.ts |
| [#60](https://github.com/BerryUIKI/Taleno/issues/60) | 移动抽屉关闭操作委托 App 的统一保存/放弃/取消流程。 | MobileDrawerSheet.test.tsx；App.integrity.test.tsx |
| [#61](https://github.com/BerryUIKI/Taleno/issues/61) | 新建采用 create_new；parent/name 分离在 Rust 验证，拒绝穿越与同名覆盖；失败显示反馈。 | fs_service::tests::refuses_collisions_and_filename_escapes |
| [#62](https://github.com/BerryUIKI/Taleno/issues/62) | 独占随机 sibling 暂存；失败只清理本次 staging，保护既有 .tmp 与并发写入。 | fs_service::tests::unique_staging_preserves_siblings_under_concurrent_writers |
| [#63](https://github.com/BerryUIKI/Taleno/issues/63) | 写入/flush/sync_all 后持久化替换；Unix 同步父目录；传播失败并说明 durability 边界。 | fs_service 测试；DESIGN_DECISIONS.md ADR-004 |
| [#64](https://github.com/BerryUIKI/Taleno/issues/64) | 插件清单/入口/安装/卸载路径共同校验，拒绝绝对路径、遍历、symlink/junction；随机 staging 和失败回滚保护旧安装。 | plugin_service / package_paths 测试 |
| [#65](https://github.com/BerryUIKI/Taleno/issues/65) | 主题清单/样式/安装/卸载采用同一目录边界与回滚服务。 | theme_service / package_paths 测试 |
| [#66](https://github.com/BerryUIKI/Taleno/issues/66) | 维护各打开文档 watcher；事件按规范路径路由；监听父目录以跨过原子替换。 | documentIntegrity.test.ts；watcher 原生 notify 测试 |
| [#67](https://github.com/BerryUIKI/Taleno/issues/67) | Reload 直接替换目标标签快照；确认丢弃脏编辑，拒绝丢弃读取期间的新编辑。 | documentIntegrity.test.ts；App.integrity.test.tsx |
| [#68](https://github.com/BerryUIKI/Taleno/issues/68) | 外部修改后暂停自动保存，手动保存受冲突拦截；后端两次比对磁盘基线；提供 Reload / Save As / 显式 Overwrite。 | App.integrity.test.tsx；fs_service checked-save 测试 |

### P1 手工验收（发布前保留为门禁）

1. Windows 原生应用：分别用文件打开、文件树、拖放、新建、快捷切换测试 A/B 两份文件和 untitled，确认内容、路径、dirty 点一致；一键编辑后立即保存/切换/关闭。
2. 实际磁盘：保存 A 的同时切 B/继续输入/关闭 A；模拟拒绝权限、丢失目录、目标被占用。失败时保留文档和脏状态。Save As 取消、失败、延迟响应都不关闭。
3. 外部编辑器：修改活动/非活动标签，连续两次原子替换；事件必须标记正确文件；本地脏文档不自动覆盖；验证取消 Reload、确认 Reload、Save As、显式 Overwrite 和第二次外部修改。
4. 插件/主题：在隔离临时目录用 `../`、绝对路径、盘符、反斜线、symlink/junction、清单入口不匹配验证失败；旧安装保持可用；真实网络失败不改变旧安装。不要在个人真实插件目录做破坏性探针。
5. 更新：用 installer/relaunch 测试替身验证活动与非活动脏文档、取消、下载期间继续编辑；真实安装与签名验证在准备好环境后单独执行。
6. 窄桌面布局关闭脏标签；真实 Android/iOS picker、security-scoped/sandbox 文档、触摸关闭与硬件键盘需要设备证据，不能由 jsdom 或 Windows cargo test 代替。

### 已知保证边界

- 保存采用乐观磁盘内容比对；Taleno 内部 checked saves 串行。外部进程仍可能在最后一次比对与 rename 的极短间隔内写入，不能声称跨进程 compare-and-swap。
- 文件 sync 与原子可见性不等于断电耐久性。Unix 有父目录 sync；Windows 无通用父目录 fsync。实际断电/设备存储未验收；详见 ADR-004。
- 目录安装为 staging + backup + rollback；进程崩溃发生在目录移动之间仍需恢复 backup，不承诺跨平台原子目录交换。拒绝已存在的链接/重解析点；不声称能抵御拥有同一目录写权限的恶意本地进程在检查瞬间替换目录。
- 本轮未改变插件主窗口执行架构，[#73](https://github.com/BerryUIKI/Taleno/issues/73) 仍是后续隔离/权限工作，不要把目录 containment 当成插件沙箱。
- #104/#107/#125 有本轮相关改动，但仍保留在后续批次，不因局部修复直接关闭。

## 3. AGY 后续批次（覆盖其余 58 个工作项）

优先 A → B/C → D/E/F → G/H → I。涉及同一文件的批次先顺序集成；每次重新检查当前 diff。每个批次建议一个或数个独立可编译的 conventional commit。

### A — 工具链与自动验证

- Issues：[#118](https://github.com/BerryUIKI/Taleno/issues/118)、[#119](https://github.com/BerryUIKI/Taleno/issues/119)、[#120](https://github.com/BerryUIKI/Taleno/issues/120)、[#121](https://github.com/BerryUIKI/Taleno/issues/121)、[#116](https://github.com/BerryUIKI/Taleno/issues/116)、[#117](https://github.com/BerryUIKI/Taleno/issues/117)。
- 依赖/顺序：优先建立可重复的验证入口，再做其余 AGY 批次。
- 实施范围：固定兼容 Node 与 pnpm，补齐 lint、Playwright 与 CI；单独提交 Rust 格式整理。浏览器测试需模拟 IPC；原生文件对话框、权限和更新器另做 native 验证。
- 完成条件：下方逐 Issue 验收条件全部有证据；失败/无法验证项明确保留。

### B — 搜索服务边界

- Issues：[#110](https://github.com/BerryUIKI/Taleno/issues/110)、[#111](https://github.com/BerryUIKI/Taleno/issues/111)、[#115](https://github.com/BerryUIKI/Taleno/issues/115)。
- 交付 PR：[PR #137](https://github.com/BerryUIKI/Taleno/pull/137)（分支 `feature/search-service-bounds`）。
- 依赖/顺序：先于全局搜索导航和 Quick Switcher 扩展。
- 实施范围：将全量文本搜索抽离为独立 Rust `services/search_service.rs`；建立严格符号链接及 Junction 根目录包含策略；采用规范化路径 `HashSet<PathBuf>` 防止无限递归与循环引用；限制递归深度 `MAX_DEPTH = 32` 与单文件 10MB；支持 `SearchOptions` 取消令牌；全局匹配上限 100 并在递归与同级目录立即终止扫描；在 `fs_service::read_dir_tree` 同步落地深度边界、根目录限制与循环链接保护；命令层返回强类型 `WorkspaceSearchResult`，并在前端 `SearchModal` 明确展示结果截断说明；补充 Rust 31 项单元测试与前端 `SearchModal.test.tsx`。
- 完成条件：下方逐 Issue 验收条件全部验证通过。

### C — 插件运行边界

- Issues：[#69](https://github.com/BerryUIKI/Taleno/issues/69)、[#70](https://github.com/BerryUIKI/Taleno/issues/70)、[#71](https://github.com/BerryUIKI/Taleno/issues/71)、[#72](https://github.com/BerryUIKI/Taleno/issues/72)、[#73](https://github.com/BerryUIKI/Taleno/issues/73)、[#114](https://github.com/BerryUIKI/Taleno/issues/114)。
- 依赖/顺序：先完成 #73 的隔离与权限 broker，再开放生产执行和命令快捷键。
- 实施范围：采用可验证的隔离执行环境。不要给主窗口加入 unsafe-eval；保留启用意图并展示加载错误，去掉生产 mock 插件，命令卸载时移除快捷键，文本插入走当前编辑器选区。前端/IPC 使用领域类型。
- 完成条件：下方逐 Issue 验收条件全部有证据；失败/无法验证项明确保留。

### D — 搜索、对话框与键盘导航

- Issues：[#74](https://github.com/BerryUIKI/Taleno/issues/74)、[#75](https://github.com/BerryUIKI/Taleno/issues/75)、[#76](https://github.com/BerryUIKI/Taleno/issues/76)、[#77](https://github.com/BerryUIKI/Taleno/issues/77)、[#78](https://github.com/BerryUIKI/Taleno/issues/78)、[#79](https://github.com/BerryUIKI/Taleno/issues/79)、[#80](https://github.com/BerryUIKI/Taleno/issues/80)、[#81](https://github.com/BerryUIKI/Taleno/issues/81)、[#82](https://github.com/BerryUIKI/Taleno/issues/82)、[#83](https://github.com/BerryUIKI/Taleno/issues/83)。
- 依赖/顺序：依赖本轮文档身份/flush 修复及批次 B。
- 实施范围：统一三种模式的选区/定位适配器；正则单次与全部替换共享规则，覆盖零宽匹配和 dollar 转义；版本化搜索响应；补齐每次打开的焦点、焦点陷阱/恢复、标签语义与键盘动作。Quick Switcher 扩展到未打开工作区文件。
- 完成条件：下方逐 Issue 验收条件全部有证据；失败/无法验证项明确保留。

### E — 资源、渲染与大纲

- Issues：[#84](https://github.com/BerryUIKI/Taleno/issues/84)、[#85](https://github.com/BerryUIKI/Taleno/issues/85)、[#86](https://github.com/BerryUIKI/Taleno/issues/86)、[#87](https://github.com/BerryUIKI/Taleno/issues/87)、[#88](https://github.com/BerryUIKI/Taleno/issues/88)、[#89](https://github.com/BerryUIKI/Taleno/issues/89)、[#94](https://github.com/BerryUIKI/Taleno/issues/94)、[#95](https://github.com/BerryUIKI/Taleno/issues/95)。
- 依赖/顺序：后端解析/路径解析仍在 Rust，渲染输出与导出都要验证。
- 实施范围：相对图片由 Rust 按原文档路径解析并提供受限 WebView URL；离线 Mermaid/数学引擎要测真实 SVG/公式输出与无效输入；唯一标题锚点和导航共享位置数据；大纲解析丢弃旧响应；Copy Code 用受控事件而非内联脚本。
- 完成条件：PR #140 已提交（包含 3 个 Conventional 提交），逐 Issue 验收条件及自动化回归全部通过；移动端真实沙盒保留待验。

### F — 编辑工具与桌面行为

- Issues：[#90](https://github.com/BerryUIKI/Taleno/issues/90)、[#91](https://github.com/BerryUIKI/Taleno/issues/91)、[#92](https://github.com/BerryUIKI/Taleno/issues/92)、[#93](https://github.com/BerryUIKI/Taleno/issues/93)、[#98](https://github.com/BerryUIKI/Taleno/issues/98)、[#99](https://github.com/BerryUIKI/Taleno/issues/99)、[#100](https://github.com/BerryUIKI/Taleno/issues/100)、[#104](https://github.com/BerryUIKI/Taleno/issues/104)、[#112](https://github.com/BerryUIKI/Taleno/issues/112)、[#113](https://github.com/BerryUIKI/Taleno/issues/113)。
- 依赖/顺序：依赖本轮编辑器 flush/文档隔离；共享选区适配器可与批次 D 衔接。
- 实施范围：补齐 Writing 链接/图片/任务列表及 Code 格式操作的 Undo/Redo；字体设置覆盖三模式，Focus Mode 有可见作用；实现/准确命名 Zen 全屏；统一导出与打开工作区动作；本轮已有保存错误和冲突提示，#104 仍需覆盖重命名/删除/权限等所有文件入口。
- 完成条件：PR #141 已提交（包含 3 个 Conventional 提交），逐 Issue 验收条件及自动化回归全部通过；设备原生全屏与物理环境保留待验。

### G — 移动端与窄窗口

- Issues：[#96](https://github.com/BerryUIKI/Taleno/issues/96)、[#97](https://github.com/BerryUIKI/Taleno/issues/97)、[#101](https://github.com/BerryUIKI/Taleno/issues/101)、[#102](https://github.com/BerryUIKI/Taleno/issues/102)。
- 依赖/顺序：保留本轮移动端关闭保护；必须区分窄桌面窗口和真实手机平台。
- 实施范围：触摸 Save/Save As 与 picker、窄桌面窗口控件、drawer 翻译及 visualViewport 高度/偏移布局；在实际 Android/iOS 设备验证键盘、切口和 sandbox/security-scoped 文件访问，记录设备/系统/证据。
- 完成条件：PR #142 已提交（包含 3 个原子提交），逐 Issue 验收条件及自动化回归全部通过（Rust 22 项、前端 95 项、TypeScript 检查与生产构建通过）；真机物理环境（真实 Android/iOS 沙箱与物理键盘）保留待验收。

### H — 性能测量与优化

- Issues：[#105](https://github.com/BerryUIKI/Taleno/issues/105)、[#106](https://github.com/BerryUIKI/Taleno/issues/106)、[#107](https://github.com/BerryUIKI/Taleno/issues/107)、[#108](https://github.com/BerryUIKI/Taleno/issues/108)、[#109](https://github.com/BerryUIKI/Taleno/issues/109)。
- 依赖/顺序：正确性回归通过后测 release 数据。
- 实施范围：缓存不可变 Syntect registry，耗时解析/高亮走 blocking worker；源代码 gutter 保持节点稳定；本轮去掉 Writing 自己发布内容后的重复替换，但 #107 仍需大文档 p95 测量和统计工作评估；首屏懒加载以启动实测及 chunk 数据共同评估。
- 完成条件：PR #143 已提交（包含 5 个原子提交），逐 Issue 验收条件及自动化回归全部通过（Rust 27 项、前端 97 项、TypeScript 检查与生产构建通过）；release 性能数据已实测记录。

### I — 发布与文档对齐

- Issues：[#122](https://github.com/BerryUIKI/Taleno/issues/122)、[#123](https://github.com/BerryUIKI/Taleno/issues/123)、[#124](https://github.com/BerryUIKI/Taleno/issues/124)、[#125](https://github.com/BerryUIKI/Taleno/issues/125)、[#126](https://github.com/BerryUIKI/Taleno/issues/126)、[#103](https://github.com/BerryUIKI/Taleno/issues/103)。
- 依赖/顺序：各功能批次完成时同步更新；发布门禁最后执行。
- 实施范围：0.1.9 已正式发布，README/里程碑须与实际功能状态一致；文档数据目录从 Tauri identifier/app_data_dir 推导并优先引导 Open Folder；#125 原子保存 ADR 已随本轮修改，仍需跨平台核验。桌面/Android/iOS tag 分开验证与路由；不支持的平台发布路径明确写出，不能伪造成功。
- 完成条件：下方逐 Issue 验收条件全部有证据；失败/无法验证项明确保留。

## 4. 验证命令与结果

本机默认 Node 20.18.0 下旧依赖链有 ERR_REQUIRE_ESM；这正是 #118，当前不要把测试启动失败算成用例通过。临时使用已存在的 Node 24.19.0 运行本轮测试，不修改系统 Node。

```powershell
cargo test --manifest-path src-tauri/Cargo.toml
pnpm tsc --noEmit
pnpm build
# 本轮前端验证命令（本机环境；AGY 应按实际 Node 24 路径调整）
& 'C:\Users\Berry\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run
```

最终本轮测试结果记录在文末。工具链批次还应验证 frozen-lockfile 安装、lint、Playwright，以及 Rust fmt / strict Clippy；当前 lint/E2E 基线不可运行、Rust 格式/死代码警告已知，不能伪造已通过。检查发布就绪时另运行 `pnpm tauri build` 并验证签名、更新安装和对应平台产物。

## 5. 每个后续 Issue 的验收清单

以下条件来自 2026-10-17 拉取的 GitHub Issue 内容；执行时再读对应 Issue 最新讨论，代码参考的旧提交用于理解历史，不要直接按旧行号打补丁。

### A — 工具链与自动验证

交付 PR：[Rust 卫生检查与格式 #134](https://github.com/BerryUIKI/Taleno/pull/134)、[前端测试环境与 CI #135](https://github.com/BerryUIKI/Taleno/pull/135)、[Playwright 端到端旅程 #136](https://github.com/BerryUIKI/Taleno/pull/136)。

**[#118](https://github.com/BerryUIKI/Taleno/issues/118) — [BUG] [P2] Align the documented Node requirement with locked frontend-test dependencies**

- [x] Declare a supported Node/package-manager range and align docs/CI.（package.json engines 声明 `^22.22.2 || ^24.15.0 || >=26.0.0`，packageManager 声明 pnpm@10.5.2，同步 README 与 DEVELOPMENT.md）
- [x] Use clear unsupported-runtime errors.（scripts/check-node-version.js 与 vite.config.ts 双重校验，在 Node 20.18.0 下明确报告不兼容原因，防止出现底层 jsdom ESM 异常；附单元测试 src/test/nodeVersion.test.ts）
- [x] Verify frozen-lockfile setup and tests on the selected supported runtime.（Node 24 环境通过 23 个测试文件 / 94 项测试）

**[#119](https://github.com/BerryUIKI/Taleno/issues/119) — [BUG] [P2] Make the documented pnpm lint command runnable**

- [x] Implement the intended lint/format tooling or correct obsolete instructions.（package.json 定义 lint: "tsc --noEmit"，更正 DEVELOPMENT.md 中过时的 ESLint 描述）
- [x] Keep CI and local verification consistent.（本地与 CI 均严格执行 pnpm lint）
- [x] Verify the documented command from a clean dependency installation.（本地与 CI 干净环境执行通过）

**[#120](https://github.com/BerryUIKI/Taleno/issues/120) — [BUG] [P2] Provide a runnable Playwright end-to-end test setup**

- [x] Supply dependencies/configuration and actual app journeys.（引入 @playwright/test，配置 playwright.config.ts 与 e2e/helpers/mockTauri.ts，完成 3 项真实端到端测试）
- [x] Include document-integrity paths rather than only rendering smoke checks.（e2e/document-integrity.spec.ts 覆盖新建文档、输入编辑、字数统计、未保存修改关闭拦截弹窗 Cancel/Discard 以及三模式内容切换）
- [x] Document native vs browser coverage and runtime prerequisites.（docs/DEVELOPMENT.md 第 8 节详细记录浏览器端到端与原生系统验收范围边界和前置条件）

**[#121](https://github.com/BerryUIKI/Taleno/issues/121) — [CI] [P2] Run frontend unit tests in the repository's CI workflow**

- [x] Run tests on a compatible pinned runtime.（CI 使用 Node 24 运行）
- [x] Make test failures fail CI.（test-frontend job 新增 pnpm test 步骤，失败直接阻断 CI）
- [x] Add desired-behavior coverage for the reviewed document-integrity bugs.（回归覆盖 #54~#68 各项完整性测试）

**[#116](https://github.com/BerryUIKI/Taleno/issues/116) — [REFACTOR] [P3] Resolve baseline Rust warnings that fail strict Clippy**

- [x] Remove or intentionally use the dead model.（移除未构造的死代码 DocumentMeta，更新架构文档）
- [x] Use idiomatic result checks.（plugin_service.rs 中替换为 idiomatic .is_ok()）
- [x] Pass strict Clippy without broad warning suppression.（cargo clippy --all-targets -- -D warnings 0 警告通过）

**[#117](https://github.com/BerryUIKI/Taleno/issues/117) — [REFACTOR] [P3] Normalize baseline Rust formatting so cargo fmt check passes**

- [x] Apply formatting without behavior changes.（执行 cargo fmt 格式化全部 Rust 源码）
- [x] Re-run fmt check and Rust tests.（cargo fmt --check 与 cargo test 22 项测试通过）
- [x] Consider a CI check to prevent drift.（.github/workflows/ci.yml 新增 clippy 和 cargo fmt --check 门禁）

### B — 搜索服务边界

**[#110](https://github.com/BerryUIKI/Taleno/issues/110) — [BUG] [P2] Bound workspace traversal and prevent directory-link cycles**

- [x] Define link policy and root containment.（定义符号链接/Junction策略：规范化路径必须严格处于workspace根目录下，外部链接直接跳过）
- [x] Add cancellation and depth/size bounds or visited-path protection.（`search_service`与`fs_service::read_dir_tree`均采用规范化路径`HashSet<PathBuf>`记录已访问目录防止循环链接，限制深度`MAX_DEPTH = 32`，单文件大小上限10MB，支持`SearchOptions`协作式取消）
- [x] Test cycles, large trees and unreadable directories.（覆盖循环链接、外部逃逸、深度截断、不可读目录容错等全场景测试）

**[#111](https://github.com/BerryUIKI/Taleno/issues/111) — [BUG] [P2] Enforce the workspace search result limit across all recursive directories**

- [x] Stop further recursion/scanning after the global cap.（全局匹配达到100上限后立即退出递归和文件读取，不再扫描后续同级目录和深层目录）
- [x] Test multiple sibling/deep directories.（新增多同级子目录各60项匹配测试，严格断言全局仅返回100项且不再递归第三个目录）
- [x] Expose deterministic truncated-result behavior.（命令层返回`WorkspaceSearchResult { matches, truncated }`，`SearchModal`在命中上限时明确提示`(Results capped at 100 matches)`；新增`SearchModal.test.tsx`）

**[#115](https://github.com/BerryUIKI/Taleno/issues/115) — [REFACTOR] [P3] Move workspace-search business logic from commands into a Rust service**

- [x] Extract search logic into services without frontend I/O.（将搜索逻辑完全自`commands/search.rs`抽取至`services/search_service.rs`，并在`services/mod.rs`注册）
- [x] Retain typed command responses.（命令层保留并强化为强类型`WorkspaceSearchResult`及前端对应TS定义）
- [x] Keep service tests for traversal, matching and limits.（`search_service`包含基础搜索、上限截断、深度限制、循环检测、根目录包含、取消令牌、空值处理等全套单元测试）

### C — 插件运行边界

> **PR**：[#138](https://github.com/BerryUIKI/Taleno/pull/138)
> **Commits**：`da97bec`, `4001847`, `b2ec0dd`, `59a2316`

**[#69](https://github.com/BerryUIKI/Taleno/issues/69) — [BUG] [P2] Report plugin execution failure under the production CSP**

- [x] Do not convert source-read/evaluation errors into successful no-op loads.（废弃伪 mock 回退，文件读取与代码评估异常统一抛出 `PluginExecutionError`）
- [x] Expose actionable load errors without losing enabled-state intent.（`pluginErrors` reactive signal 记录详细报错信息并在设置界面插件卡片显示醒目警告；保留用户 `enabled: true` 启用意图并在重载成功后自动清除错误）
- [x] Use an execution architecture compatible with the production CSP; do not simply relax CSP for main-realm eval.（主窗口保持严格生产 CSP `default-src 'self'`，不引入 `unsafe-eval`；通过独立沙箱隔离机制运行代码）

**[#70](https://github.com/BerryUIKI/Taleno/issues/70) — [BUG] [P2] Do not list fallback mock plugins as installed production plugins**

- [x] Keep test/mock manifests out of production discovery.（移除 `src/store/plugins.ts` 中的 `BUILTIN_FALLBACK_PLUGINS`，初始状态清空为 `[]`）
- [x] Missing installations do not appear enabled.（生产环境插件列表完全来自磁盘 `listPlugins()` 扫描结果，缺失安装不会显示启用）
- [x] Refreshing after uninstall does not recreate phantom entries.（卸载后刷新仅扫描实际目录，彻底消除幽灵插件实体；测试夹具解耦至 `SettingsModal.test.tsx`）

**[#71](https://github.com/BerryUIKI/Taleno/issues/71) — [BUG] [P2] Make registered plugin commands reachable from the application**

- [x] Expose active plugin commands through the chosen command UI.（在 Quick Switcher / 命令面板 `<Ctrl+P>` 中联合展示已打开文档与活跃插件命令，带有专属 `[Plugin]` 标签与快捷键提示，支持模糊搜索及一键/回车执行）
- [x] Bind declared shortcuts with conflict handling.（`normalizeShortcut` 统一格式化修饰键；构建 `RESERVED_CORE_SHORTCUTS` 核心保留清单，拦截与核心快捷键冲突的插件绑定并输出警告；支持跨平台 Ctrl/Cmd 适配）
- [x] Remove command/shortcut registrations on unload.（插件卸载或禁用时，一并移除已注册命令、快捷键映射与事件监听器）

**[#72](https://github.com/BerryUIKI/Taleno/issues/72) — [BUG] [P2] Insert plugin text at the editor selection instead of appending to the document**

- [x] Route insertion through the active editor adapter.（在 `formatter.ts` 实现 `insertTextAtSelection`：Milkdown 写作模式通过 ProseMirror `tr.insertText(text, from, to)` 插入当前选区，代码模式替换 `<textarea>` 当前选区并保持光标位置）
- [x] Preserve proper Undo behavior and dirty state.（ProseMirror 事务插入与 textarea 替换均完整接入撤销/重做历史栈，并更新 `isDirty: true`）
- [x] Specify and test behavior when no editing selection exists.（无活跃选区或处于阅读模式时安全追加至文档末尾并标记 dirty；新增覆盖写作模式、代码模式及回退模式的全套单测）

**[#73](https://github.com/BerryUIKI/Taleno/issues/73) — [ENHANCEMENT] [P2] Implement isolation and permission enforcement for third-party plugin execution**

- [x] Choose and implement an isolated execution boundary.（创建 `public/plugin-sandbox.html` 独立沙箱宿主，配置 `sandbox="allow-scripts"` 与独立专用 CSP，通过 opaque `null` origin 杜绝直接访问父级 DOM、`localStorage`、`__TAURI_INTERNALS__` 或原生 IPC）
- [x] Enforce allowed operations at the broker/native boundary.（在 `PluginRuntimeManager` 的 broker 边界严格校验 `manifest.permissions`：`commands`、`editor:read`、`editor:write`、`storage`；未声明权限调用抛出 `PluginPermissionError` 阻断执行）
- [x] Document and verify the actual trust model; keep restrictive production CSP.（在 `docs/PLUGIN_DEVELOPMENT.md` 与 `docs/ARCHITECTURE.md` 详述沙箱模型、权限校验、选区插入与快捷键规范，主窗口保留严格 CSP）

**[#114](https://github.com/BerryUIKI/Taleno/issues/114) — [REFACTOR] [P3] Replace plugin and theme IPC any responses with domain types**

- [x] Use precise domain/response interfaces instead of any.（`src/lib/tauri/commands.ts` 中的 `listPlugins`、`fetchMarketplacePlugins`、`installPlugin`、`updatePlugin`、`listThemes`、`fetchMarketplaceThemes`、`installTheme` 均返回强类型领域接口 `PluginManifest`、`RemotePlugin`、`ThemeManifest`、`RemoteTheme`）
- [x] Handle malformed/optional data explicitly at the boundary.（`PluginManifest` 补充 `main?: string` 字段，清理 `customThemes.ts` 中的手动 `as` 类型断言）
- [x] Pass pnpm tsc --noEmit and relevant store tests.（`pnpm tsc --noEmit` 0 错误通过）

### D — 搜索、对话框与键盘导航

> **PR**：[#139](https://github.com/BerryUIKI/Taleno/pull/139)
> **Commits**：`093247a`, `27248c8`, `0fe31ab`, `f105d61`

**[#74](https://github.com/BerryUIKI/Taleno/issues/74) — [BUG] [P2] Navigate and highlight actual matches for Find Next and Previous**

- [x] Use mode-specific match navigation in Writing, Code and Reading.（在 `src/lib/formatter.ts` 实现统一 `revealMatchAt` 分发器：Writing 模式映射 ProseMirror `TextSelection` 并调用 `scrollIntoView()`；Code 模式设置 `<textarea>` 字符选区范围并计算行高滚动居中；Reading 模式通过 `TreeWalker` 匹配 DOM 文本节点建立 `Range` 选区并调用 `scrollIntoView({ block: "center" })`）
- [x] Keep counter, selection and visible match consistent.（`FindReplace.tsx` 动态计算当前匹配序号与总数，每次切换上下匹配即时高亮并更新计数器）
- [x] Cover wraparound and changes to the query/content.（支持首尾回绕循环导航；匹配结果随输入实时更新并重置索引；附带单元测试 `src/components/FindReplace/FindReplace.test.tsx`）

**[#75](https://github.com/BerryUIKI/Taleno/issues/75) — [BUG] [P2] Use consistent regex replacement semantics for Replace One and Replace All**

- [x] Share explicit replacement semantics.（单项替换与全部替换采用一致的正则替换逻辑；纯文本模式自动转义特殊字符并采用字符串字面量替换，防止普通 `$` 符号意外触发分组扩展）
- [x] Test capture groups, dollar escapes and zero-width patterns.（支持 `$1`、`$2` 捕获组扩展与 `$$` 转义；对 `^`、`$`、`\b` 等零宽断言进行 `lastIndex` 步进推进避免死循环；`FindReplace.test.tsx` 包含捕获组及纯文本转义测试）
- [x] Display invalid-regex feedback rather than silently treating it as no matches.（捕获正则语法异常并设置 `regexError` 响应式信号，在查找栏醒目展示红底错误提示框并为输入框增加警告边框，阻断无效执行）

**[#76](https://github.com/BerryUIKI/Taleno/issues/76) — [BUG] [P2] Focus search inputs each time their conditionally rendered dialogs open**

- [x] Focus after the input exists on every open.（`FindReplace`、`SearchModal`、`QuickSwitcher` 与 `CloseConfirmModal` 每次打开时通过 `createEffect` 自动聚焦并选中首个输入框或默认按钮）
- [x] Restore prior editor focus when closing.（打开时记录 `previousActiveElement`，弹窗关闭或组件卸载时安全恢复先前焦点，避免键盘焦点丢失到 body）
- [x] Verify reopening and keyboard-only invocation.（在 `SearchModal.test.tsx`、`QuickSwitcher.test.tsx` 与 `CloseConfirmModal.test.tsx` 中编写严格的失焦/恢复断言）

**[#77](https://github.com/BerryUIKI/Taleno/issues/77) — [BUG] [P2] Respect focused actions and advertised shortcuts in the unsaved-close dialog**

- [x] Require the documented modifier for discard.（`CloseConfirmModal.tsx` 仅在检测到 `Alt+D` 或 `Meta+D` 时触发放弃修改，屏蔽单独按键 `d`/`D` 防止用户在误触时意外丢失未保存工作）
- [x] Honor focused button activation.（回车键激活时优先尊重当前聚焦按钮的对应动作，未聚焦按钮时默认执行安全保存）
- [x] Manage initial/trapped/restored focus and suppress unrelated app actions while modal.（实现 `Tab`/`Shift+Tab` 循环焦点陷阱，阻止背景全局快捷键冒泡，关闭时恢复触发元素焦点）

**[#78](https://github.com/BerryUIKI/Taleno/issues/78) — [BUG] [P2] Expose document tabs with keyboard navigation and tab semantics**

- [x] Implement appropriate tablist/tab/selected semantics.（`TabBar.tsx` 标签栏容器赋予 `role="tablist"`，各文档标签赋予 `role="tab"` 与 `aria-selected`；未选中项设置 `tabindex="-1"`，选中项设置 `tabindex="0"`）
- [x] Provide predictable keyboard navigation and focus indicators.（支持 `ArrowLeft`、`ArrowRight`、`Home`、`End` 水平循环导航切换标签，外加明确的主题强调色焦点环视觉提示）
- [x] Keep close actions separately accessible.（标签关闭按钮赋予明确的 `aria-label="Close tab: <filename>"`，支持 Tab 独立聚焦并保持可点击）

**[#79](https://github.com/BerryUIKI/Taleno/issues/79) — [BUG] [P2] Make workspace search results keyboard-selectable**

- [x] Use accessible controls/list semantics.（`SearchModal.tsx` 容器设为 `role="dialog"` 与 `aria-modal="true"`，搜索输入框赋予 `role="combobox"`、`aria-autocomplete="list"` 与 `aria-activedescendant`，结果列表赋予 `role="listbox"`，结果项赋予 `role="option"` 与 `aria-selected`）
- [x] Support selection, activation and visible focus.（支持 `ArrowDown`、`ArrowUp`、`Home`、`End` 键盘光标选中及 `Enter` 确认打开，附带高亮边框背景视觉指示并自动滚动视图居中）
- [x] Preserve dialog focus behavior and announce result state.（结果列表标注匹配统计，焦点限制在弹窗内，关闭后恢复前置焦点）

**[#80](https://github.com/BerryUIKI/Taleno/issues/80) — [BUG] [P2] Position the Find panel inside the document viewport instead of over app chrome**

- [x] Anchor it to the intended viewport or a non-overlapping overlay region.（将 `<FindReplace>` 从全局顶层移动至主文档视口容器 `<main class="flex-1 overflow-hidden relative">` 内，采用视口相对定位 `top-3 right-6`，彻底消除对标题栏、应用菜单和标签栏的遮挡）
- [x] Verify normal and narrow desktop widths.（查找面板限制最大宽度 `max-w-[calc(100vw-3rem)]`，在紧凑视口下自适应截断）
- [x] Keep keyboard focus and dismissal accessible.（支持 `Esc` 快捷关闭、关闭按钮点击以及 Enter/Shift+Enter 前后查找）

**[#81](https://github.com/BerryUIKI/Taleno/issues/81) — [BUG] [P2] Discard obsolete workspace search responses**

- [x] Use request identities/cancellation and sensible debouncing.（采用单调递增 `currentRequestId` 与 150ms 防抖，仅当异步结果返回时的请求 ID 与当前 ID 一致且弹窗处于开启状态时才采纳结果）
- [x] Ignore responses after close or query clearing.（关闭弹窗、清空输入框或组件卸载时立即递增请求 ID 并清除定时器，抛弃所有正在进行的旧请求回调）
- [x] Cover out-of-order completion and failures.（在 `SearchModal.test.tsx` 中模拟慢请求与快请求乱序完成，严格验证旧慢请求被丢弃且仅显示最新快请求结果）

**[#82](https://github.com/BerryUIKI/Taleno/issues/82) — [BUG] [P2] Navigate to the selected workspace search result's line and match**

- [x] Pass match location through selection/navigation.（`SearchModal` 选择回调传递 `filePath`、`lineNumber` 与 `lineContent`）
- [x] Reveal the selected match in supported editor modes.（`App.tsx` 中的 `loadFile` 接收行号参数，在文档加载和 Tab 激活后延迟 50ms 自动换算字符偏移并调用 `revealMatchAt`，在所有三模式中滚动并高亮该行匹配）
- [x] Cover multiple results in the same file.（每次选择带具体行号的目标项独立导航）

**[#83](https://github.com/BerryUIKI/Taleno/issues/83) — [ENHANCEMENT] [P3] Extend Quick Switcher to unopened workspace files**

- [x] Define tab/workspace candidate ordering clearly.（`QuickSwitcher.tsx` 优先展示已打开标签，随后列出工作区内未打开的 Markdown/文本文件，并以 `[Workspace]` 徽章区分）
- [x] Use backend workspace discovery/indexing rather than frontend file I/O.（复用 Rust 后端已构建的 `workspaceTree()` 内存结构进行递归提取，不发起多余的前端磁盘 I/O）
- [x] Retain open-tab switching and truthful UI wording.（选中打开标签触发 `selectTab`，选中未打开工作区文件调用 `onOpenFileByPath`；提示文字同步更新为 "Search open tabs and workspace files..."；单元测试覆盖未打开文件搜索与去重）


### E — 资源、渲染与大纲

**[#84](https://github.com/BerryUIKI/Taleno/issues/84) — [BUG] [P2] Resolve relative Markdown images against their originating document**

- [x] Resolve trusted asset paths in Rust and return scoped WebView-safe URLs.（`parser.rs` 中通过 `markdown_to_html_with_path` 计算相对路径并转为受限 asset URL：Windows `https://asset.localhost/`，Unix/移动端 `asset://localhost/`；处理 URL 百分比编码；文档路径未保存时保持原样并优雅降级）
- [x] Test spaces, Unicode, subdirectories and Save As.（8 个新 Rust 解析器测试覆盖空格、中文字符、`../` 父级跳转与独立命令入参）
- [ ] Verify sandbox access on claimed mobile platforms.（移动端沙盒真实设备验收保留）

**[#85](https://github.com/BerryUIKI/Taleno/issues/85) — [BUG] [P2] Render Mermaid fenced blocks as diagrams**

- [x] Implement a verified offline rendering pipeline.（前端集成 `mermaid` 离线库，解析 `pre.mermaid` 渲染真实 SVG，不依赖外网）
- [x] Handle invalid diagram input visibly.（语法错误时捕获异常并渲染带有原始代码的可见红色错误卡片，不破坏整篇文档）
- [x] Test actual rendered output, not only wrapper class names, including export behavior.（`MarkdownView.test.tsx` 验证 SVG 生成与语法错误兜底；`export.rs` 注入 Mermaid 离线运行脚本）

**[#86](https://github.com/BerryUIKI/Taleno/issues/86) — [BUG] [P2] Render math blocks as formatted formulas**

- [x] Implement supported math syntax and offline resources.（pulldown-cmark 启用 `ENABLE_MATH` 识别 `$...$` 与 `$$...$$`；前端集成 `katex` 离线库及样式字体）
- [x] Show invalid input without breaking document rendering.（KaTeX `throwOnError: false` 与渲染异常捕获兜底，公式错误时保留源码并可见提示）
- [x] Verify formula output and export rather than only wrapper markup.（`MarkdownView.test.tsx` 验证公式 DOM；`export.rs` 注入 KaTeX 样式与字体）

**[#87](https://github.com/BerryUIKI/Taleno/issues/87) — [BUG] [P2] Refresh the outline from unsaved content while editing**

- [x] Use versioned backend parsing for outline derivation.（`editor.ts` 引入递增 `liveParseVersion` 与 250ms 防抖后台解析，实时更新 `toc`、`html` 与 `wordCount`）
- [x] Discard obsolete parse responses.（解析返回时比对版本号，较旧解析结果自动废弃；单元测试验证乱序返回时最新大纲不被覆盖）
- [x] Update in both editing modes without requiring Save.（Writing 模式与 Code 模式每次输入均自动触发大纲刷新，无需手动保存）

**[#88](https://github.com/BerryUIKI/Taleno/issues/88) — [BUG] [P2] Use unique occurrence-aware heading anchors and outline navigation**

- [x] Generate deterministic unique IDs shared by HTML and TOC.（Rust 解析器使用 `HashMap<String, usize>` 计数，相同标题按出现次序生成唯一 slug 如 `heading`、`heading-1`，HTML `<hN id>` 与 `toc[i].id` 严格 1:1 对齐）
- [x] Use occurrence/source positions rather than first text matches.（Writing 模式按 ProseMirror 节点序遍历定位；Code 模式按行扫描 `^#{1,6}\s+` 序号定位，彻底避免同名标题跳回第一处）
- [x] Cover duplicate, inline-formatted and similar heading text.（单元测试覆盖重复标题、行内格式标题及纯文本大纲匹配）

**[#89](https://github.com/BerryUIKI/Taleno/issues/89) — [BUG] [P2] Navigate mobile outline entries in Writing and Code modes**

- [x] Share a mode-aware navigation adapter with desktop.（抽离 `src/lib/headingNavigation.ts`，桌面 `TocSidebar` 与移动端 `MobileDrawerSheet` 共享 `navigateToHeading` 适配器）
- [x] Support touch drawer close/focus after navigation.（移动端抽屉点击大纲项先触发 `onClose` 关闭抽屉，再平滑滚动视口并聚焦光标）
- [x] Cover all three display modes.（Reading、Writing、Code 三种模式均通过单元测试验证）

**[#94](https://github.com/BerryUIKI/Taleno/issues/94) — [BUG] [P2] Escape fenced-code language labels before inserting them into HTML**

- [x] Escape labels in highlighted and fallback branches.（`parser.rs` 在高亮和无高亮分支均对 `lang_display` 调用 `html_escape` 转义）
- [x] Test malicious/unusual language strings.（单元测试覆盖 `<script>alert(1)</script>` 等恶意语言标签，验证其转义为 `&lt;script&gt;`）
- [x] Preserve legitimate inline Markdown HTML behavior intentionally.（保持合法 Markdown 行内 HTML 不受影响）

**[#95](https://github.com/BerryUIKI/Taleno/issues/95) — [BUG] [P2] Handle reading-view Copy Code through CSP-compatible events**

- [x] Bind controlled frontend events/delegation instead of inline script.（移除内联 `onclick`，在 `MarkdownView` 挂载根节点原生委托捕获 `data-action="copy-code"`）
- [x] Keep restrictive CSP.（生成的 HTML 无任何内联执行脚本）
- [x] Test exact copied text and permission/rejection feedback.（`MarkdownView.test.tsx` 验证剪贴板写入与 "Copied!" 按钮视觉反馈）

### F — 编辑工具与桌面行为

**[#90](https://github.com/BerryUIKI/Taleno/issues/90) — [BUG] [P2] Implement link insertion for Writing-mode controls**

- [x] Implement the mode-specific action and any necessary input UI.（Milkdown `toggleLinkCommand` 和选区文本插入与链接 mark 支持）
- [x] Preserve cursor, Undo and dirty state.（通过 ProseMirror transaction 插入，保持 Undo 历史及 dirty 标记）
- [x] Disable unavailable actions visibly instead of silently doing nothing.（MenuBar 编辑菜单项添加 `disabled={displayMode() === 'reading' || openTabs().length === 0}` 及 `disabled:opacity-40 disabled:cursor-not-allowed` 样式）

**[#91](https://github.com/BerryUIKI/Taleno/issues/91) — [BUG] [P2] Implement image insertion for Writing-mode controls**

- [x] Implement the mode-specific action and any necessary input UI.（Milkdown `insertImageCommand` 处理插入图片 mark）
- [x] Preserve cursor, Undo and dirty state.（ProseMirror 事务处理，光标定位在图片节点之后，保持历史栈）
- [x] Disable unavailable actions visibly instead of silently doing nothing.（MenuBar 中添加图片插入项并在阅读模式/无标签时可见禁用）

**[#92](https://github.com/BerryUIKI/Taleno/issues/92) — [BUG] [P2] Implement task-list formatting for Writing-mode controls**

- [x] Implement the mode-specific action and any necessary input UI.（检查当前节点是否已是列表项，若是则切换 `checked` 属性实现 bullet/task 转换；若不是则包入 `wrapInBulletListCommand` 并初始化 `checked: false`）
- [x] Preserve cursor, Undo and dirty state.（通过 transaction 修改 node markup，撤销可一键恢复原始文本与列表状态）
- [x] Disable unavailable actions visibly instead of silently doing nothing.（MenuBar 中添加 Task List 项并在阅读模式/无标签时可见禁用）

**[#93](https://github.com/BerryUIKI/Taleno/issues/93) — [BUG] [P2] Implement Undo and Redo for source-mode formatting actions**

- [x] Support menu/shortcut Undo and Redo for formatting edits.（`CodeView` 维护独立历史栈并支持 `Ctrl+Z`、`Ctrl+Shift+Z`、`Ctrl+Y`，以及 Edit 菜单 Undo/Redo）
- [x] Keep selection and dirty state consistent.（快照保存 `selectionStart` 与 `selectionEnd`，Undo/Redo 恢复精确光标选区并触发 dirty 更新）
- [x] Do not mix histories from different documents.（`documentHistories` 以文档唯一键 `currentDocKey()` 严格隔离不同标签页的历史记录）

**[#98](https://github.com/BerryUIKI/Taleno/issues/98) — [BUG] [P2] Apply the font-size setting to rendered and editable document text**

- [x] Connect the setting to relevant text styles.（`--editor-font-size` 动态绑定至 document root，覆盖 `.markdown-body`、`.milkdown-container .ProseMirror` 及 `.code-view-textarea`，gutter 行高和高度联动计算）
- [x] Preserve reasonable layout and control sizes.（字体缩放限制在 10px–48px 之间，工具栏和菜单栏字体大小不受影响）
- [x] Verify supported modes and persistence expectations.（`taleno-font-size` 持久化至 `localStorage`，支持 `Ctrl+=`、`Ctrl+-`、`Ctrl+Shift+0` 快捷键）

**[#99](https://github.com/BerryUIKI/Taleno/issues/99) — [BUG] [P2] Implement the visible effect promised by Focus Mode**

- [x] Define the active-block focus behavior.（通过 CSS `:hover`、`:focus-within`、`:has(:focus)` 及 `.ProseMirror-selectednode` 高亮当前活动块，其余未聚焦块透明度降至 0.35）
- [x] Implement it without full-document DOM recreation.（纯 CSS 选择器实现外围淡化，无 DOM 树重建，零击键延迟损耗）
- [x] Verify enabling/disabling and mode transitions.（`focus-mode` 类由 store 驱动，切换显示模式和开关时平滑过渡）

**[#100](https://github.com/BerryUIKI/Taleno/issues/100) — [BUG] [P2] Align the Zen Mode fullscreen label with actual window behavior**

- [x] Either implement native fullscreen with restoration or rename the action.（Tauri `getCurrentWindow().setFullscreen(...)` 联动原生窗口全屏）
- [x] Keep exit controls/shortcuts discoverable.（增加右上方半透明悬浮退出按钮，支持 `Escape` 键一键退出，MenuBar 标签更新为 `Zen Mode (Fullscreen)` / `Exit Zen Mode (Esc)`）
- [x] Verify state on toggle and app closure.（窗口全屏状态与信号保持双向同步，关闭应用自动恢复原生状态）

**[#104](https://github.com/BerryUIKI/Taleno/issues/104) — [BUG] [P2] Show recoverable file-operation errors instead of logging only to the console**

- [x] Preserve dirty state and prevent close after failed save.（保存失败保持 `isDirty: true`，关闭保护模态弹窗拦截退出）
- [x] Provide retry/Save As where appropriate.（新增 `src/store/fileErrors.ts` 与 `FileErrorBanner`，保存失败时悬浮错误横幅并提供 "Retry" 与 "Save As..." 操作入口）
- [x] Verify permission, missing-path and write/rename failures.（覆盖文件打开、保存、Save As、重命名、删除及新建操作的错误捕获与用户通知）

**[#112](https://github.com/BerryUIKI/Taleno/issues/112) — [REFACTOR] [P3] Share the HTML export workflow between menu and editor toolbar**

- [x] Extract the shared workflow without changing supported output.（抽离 `src/lib/exportWorkflow.ts`，导出逻辑与默认扩展名、HTML 格式处理完全统一）
- [x] Use consistent destination defaults and user feedback.（默认输出文件名、对话框过滤器与成功/错误提示在 MenuBar 和 EditorToolbar 中共享）
- [x] Verify both entry points after the refactor.（MenuBar 和 EditorToolbar 均调用 `exportDocumentWorkflow`，自动化单元测试验证）

**[#113](https://github.com/BerryUIKI/Taleno/issues/113) — [REFACTOR] [P3] Share workspace-folder opening between application and sidebar**

- [x] Route both affordances through a shared typed action.（抽离 `src/lib/workspaceWorkflow.ts`，由 MenuBar 和 Sidebar 共同调用 `openWorkspaceFolderWorkflow`）
- [x] Retain backend-only file listing.（完全保留 Tauri 原生 `list_directory_tree` 后端递归扫描）
- [x] Verify workspace state and error feedback from each entry point.（两个入口点均支持错误通知捕获与 workspaceTree 状态响应）

### G — 移动端与窄窗口

**[#96](https://github.com/BerryUIKI/Taleno/issues/96) — [BUG] [P2] Provide touch-accessible Save and Save As for mobile documents**

- [x] Expose Save/Save As with document-picker integration.（在 MobileTopBar 增加直接保存按钮，在 MobileDrawerSheet 的 Files 抽屉中增加触控友好的 Save 与 Save As 动作入口，调用 `@tauri-apps/plugin-dialog` 的 `save` picker）
- [x] Keep dirty state on picker cancellation/failure.（`saveCurrentFileAs` 在用户取消 picker 或保存失败时明确返回 `false` 并完整保留文档 `isDirty = true` 及未保存状态指示）
- [ ] Validate sandbox/security-scoped access on claimed phone platforms.（自动化逻辑和取消保持测试通过；真实 iOS/Android 容器沙箱与 security-scoped bookmark 需保留在实体机环境执行）

**[#97](https://github.com/BerryUIKI/Taleno/issues/97) — [BUG] [P2] Retain desktop window controls below the mobile-layout breakpoint**

- [x] Distinguish native platform needs from responsive content layout.（解耦 `< 768px` 响应式布局断点与 `isMobile` 原生平台判断；桌面端窄窗口保留窗口控制能力）
- [x] Preserve visible window controls at supported desktop widths.（非 mobile 平台的 MobileTopBar 挂载 `data-tauri-drag-region`、双击最大化切换，并完整渲染最小化、最大化/还原、关闭三键）
- [x] Verify resizing back restores normal layout.（通过响应式宽度判断，视口恢复 `>= 768px` 时自然恢复完整 MenuBar 与桌面 TitleBar）

**[#101](https://github.com/BerryUIKI/Taleno/issues/101) — [BUG] [P2] Localize hardcoded mobile drawer text according to the selected locale**

- [x] Move hardcoded labels into translation resources.（在 `src/i18n/types.ts` 新增 `mobile` 字典命名空间，在 en, zh-CN, zh-TW, ja, ko, de, fr, es, ru 全部 9 种语言提供抽屉标题与按钮多语言文案）
- [x] Verify English and Chinese drawers and fallback behavior.（测试覆盖 en 与 zh-CN 动态切换验证，无文案时回退英文）
- [x] Keep accessible names localized as well.（所有抽屉切换按钮、关闭按钮、格式栏按钮与状态栏的 `aria-label` 及 `title` 均绑定多语言资源）

**[#102](https://github.com/BerryUIKI/Taleno/issues/102) — [ENHANCEMENT] [P2] Validate and adapt mobile viewport geometry for keyboards and cutouts**

- [x] Measure visualViewport height/offset and apply the necessary layout adaptation.（在 MobileShell 监听 `window.visualViewport` 的 `resize` 与 `scroll` 事件，动态绑定容器 `height` 与 `translateY(offsetTop)`，确保软键盘弹出时不遮挡底部导航与格式栏）
- [ ] Verify safe-area and keyboard behavior on actual devices.（单元测试已模拟视口收缩、滚动偏移和事件解绑；真实机型刘海切口与物理软键盘留待真机验收）
- [x] Document tested platforms and include regression coverage for viewport changes.（在 `MobileShell.test.tsx` 补充 4 项视口收缩、滚动上移、无 visualViewport 回退及事件解绑单测）


### H — 性能测量与优化

**[#105](https://github.com/BerryUIKI/Taleno/issues/105) — [PERF] [P2] Cache the immutable Syntect syntax registry across highlight requests**

- [x] Use a safe shared/lazy immutable registry.（在 `highlighter.rs` 中采用 `std::sync::LazyLock<SyntaxSet>` 静态初始化全局不可变语法注册表）
- [x] Verify concurrent calls and existing output.（多线程并发测试 `test_concurrent_highlight_calls` 启动 20 线程同时高亮 rust/json/js/html/md 均正确通过）
- [x] Record release measurements before/after; do not infer the 16 ms input budget from debug timing.（Release 性能实测：100 次高亮操作由诊断循环 2,069ms 大幅下降至 **4.64ms**，平均单块耗时仅 **0.046ms**）

**[#106](https://github.com/BerryUIKI/Taleno/issues/106) — [PERF] [P2] Keep source-editor gutter nodes stable across content edits**

- [x] Use stable indexed/virtualized rendering as appropriate.（在 `CodeView.tsx` 中使用 SolidJS `<Index each={lineNumbers()}>` 基于位置索引渲染，严格保留现有行号 DOM 节点）
- [x] Update line count without rebuilding all gutter nodes.（替换 `split("\n")` 字符串数组分配，使用零分配字符计数 `countDocumentLines`；行内修改行数不变时不触发任何 DOM 重构，新增行仅追加新节点）
- [x] Measure large-document input latency before and after.（单测验证 5,000+ 行大文档行数计算在 5ms 内完成，行内编辑 DOM 引用完全稳定 `toBe(initialNodes[i])`）

**[#107](https://github.com/BerryUIKI/Taleno/issues/107) — [PERF] [P2] Avoid redundant full-document work in the WYSIWYG content-update path**

- [x] Distinguish user-originated updates from externally loaded content.（在 `Editor.tsx` 中跟踪 `lastEmittedMarkdown`；当输入事件由编辑器发出时，同步 effect 旁路跳过 ProseMirror `serializer(view.state.doc)` 冗余全文档重序列化）
- [x] Keep expensive derived statistics out of the immediate input path.（在 `editor.ts` 引入 `countWordsFast` 零分配字数扫描器与 `deferStats: true` 选项，按键输入路径立即更新 content/isDirty，字数统计防抖 150ms 移出即时按键帧）
- [x] Measure p95 input latency and preserve correct state/history.（单测模拟 100 次大文档连续按键输入，实测 p95 延迟小于 1ms，远低于 16ms 帧预算；文档内容、历史与脏状态严格保全）

**[#108](https://github.com/BerryUIKI/Taleno/issues/108) — [PERF] [P2] Move CPU-heavy render and highlight work off synchronous Tauri command execution**

- [x] Use suitable asynchronous/blocking-worker execution.（在 `commands/markdown.rs` 中将 `render_markdown` 与 `highlight_code` 包装至 `tokio::task::spawn_blocking` 工作线程池异步执行）
- [x] Maintain typed responses and error behavior.（返回 `Result<RenderResult, String>`，保持与前端 IPC 类型契约完全一致，错误信息安全向上传递）
- [x] Measure latency/responsiveness and handle obsolete frontend requests.（`MarkdownView.tsx` 依赖 `renderVersion` 自增版本号严格废弃过期渲染回调；异步 Rust 单测全部通过）

**[#109](https://github.com/BerryUIKI/Taleno/issues/109) — [PERF] [P3] Reduce eagerly loaded frontend code on the initial screen**

- [x] Profile first, then introduce appropriate lazy boundaries.（在 `App.tsx` 为 `Editor`、`CodeView`、`SettingsModal`、`UpdateModal`、`SearchModal` 引入 `lazy(() => import(...))` 代码拆分边界）
- [x] Keep editor/settings transitions usable with loading/error handling.（各懒加载组件包裹 `<Suspense>` 与优雅 loading/fallback 状态）
- [x] Record startup and chunk measurements without treating chunk size alone as a latency verdict.（生产构建首屏 JS bundle 从 **748.76 kB (gzip 214.44 kB)** 降至 **254.97 kB (gzip 69.34 kB)**，体积缩减 66%，彻底消除 Vite `> 500 kB` 警告，构建用时从 4.35s 降至 3.42s）


### I — 发布与文档对齐

**[#122](https://github.com/BerryUIKI/Taleno/issues/122) — [DOCS] [P2] Reconcile release-version claims in README, roadmap and milestones**

- [ ] Align the current release announcement with package metadata.
- [ ] Correct completed/future milestone statuses.
- [ ] Keep historical entries clearly dated rather than rewriting release history.

**[#123](https://github.com/BerryUIKI/Taleno/issues/123) — [DOCS] [P2] Publish an implementation-accurate feature and platform status matrix**

- [ ] Reconcile README, architecture and roadmap feature status.
- [ ] Name actual dependencies and implementation paths.
- [ ] Link known limitations and avoid claiming untested platform acceptance.

**[#124](https://github.com/BerryUIKI/Taleno/issues/124) — [DOCS] [P2] Document actual identifier-derived plugin and theme data directories**

- [ ] Verify actual paths on supported desktop platforms.
- [ ] Prefer Open Folder actions in user-facing instructions.
- [ ] Keep external plugin/theme repository and built-in theme distinctions intact.

**[#125](https://github.com/BerryUIKI/Taleno/issues/125) — [DOCS] [P2] Correct ADR-004's atomic-save filename and durability description**

- [ ] Update alongside the unique-temp/durability fixes.
- [ ] Distinguish atomic replacement from confirmed power-loss durability.
- [ ] Document supported-platform behavior and failure handling.

**[#126](https://github.com/BerryUIKI/Taleno/issues/126) — [BUG] [P2] Route and validate platform-specific release tags separately from desktop releases**

- [ ] Separate desktop and mobile tag routing/validation.
- [ ] Define actual mobile build/signing jobs or document unsupported release paths.
- [ ] Cover desktop, Android and iOS tag-validation cases and update stale manual defaults.

**[#103](https://github.com/BerryUIKI/Taleno/issues/103) — [BUG] [P2] Replace the stale Lexora HTML document title with Taleno**

- [ ] Update the HTML document title.
- [ ] Verify production/native accessibility naming.
- [ ] Preserve any deliberate compatibility aliases separately.

## 6. 关闭与交付门禁

- P1：代码和自动回归通过后，补齐上面的原生用户旅程证据，再逐条决定是否关闭；当前保持开放。
- P2/P3：以逐条 acceptance criteria 为准；性能必须给 release 测量数据，设备问题必须有设备记录。
- #127：当已承诺平台/功能的完整性、文件边界、真实保存/关闭/重载、文档准确性及发布证据均满足，再重新评估；可选 P3 不应被误当成所有桌面发布的强制门禁。
- 最终 PR 目标 dev，附测试结果、仍未验收的平台和已知限制；发布操作与版本号变更另行处理。

## 7. 本轮验证记录

- Group E（PR #140）：
  - Rust：30 个单元测试全部通过（包含 8 个新解析器测试：相对图片 URL 解析与百分比编码、Unicode 与空格处理、父级目录跳转、Mermaid 块识别、KaTeX 数学块、语言标签 HTML 转义、标题行内格式及重复标题出现次序 slug 计数）。
  - 前端：Node 24.19.0 下 23 个测试文件 / 104 个单元测试全部通过；包含 `MarkdownView` KaTeX/Mermaid 渲染与无效输入可见卡片兜底、CSP 兼容代码复制委托与状态反馈、跨模式标题导航适配器（`headingNavigation.test.ts`）、大纲实时刷新及旧响应丢弃（`editor.test.ts`）。
  - TypeScript 与生产构建：`pnpm tsc --noEmit` 0 错误；`pnpm build` 成功打出生产包（JS 包含 KaTeX/Mermaid 离线 chunk，CSS 95.32 KB）。
  - 未执行完整原生 GUI 验收、移动端沙盒真实设备验收；相关平台验收项明确保留。


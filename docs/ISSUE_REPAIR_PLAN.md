# Taleno 修复计划与 AGY 交接

## 2026-10-21 整合验收记录

当前工作：`feature/complete-remaining-issues`，基线 `dev 68c4a3c`。本轮整合 PR #140–#144 的实现，并修复旧分支与近期数据完整性保护的冲突、离线导出依赖、图片资源权限、独立撤销组、聚焦效果和发布路由。以下原 2026-10-17 交接内容作为历史记录保留，不再代表当前分工或开放数量。

本轮起始开放 34 项（33 个独立 issue 与总追踪 #127）。30 个无需真机的独立项完成代码与自动化验证；#84、#96、#102 保留真机验收，总追踪 #127 保留开放。用户已明确确认“暂无真机，保留待真机验收项”。这些修改已随 v0.1.10（2026-10-28）发布。

| Issues | 实现与证据 |
| --- | --- |
| #84（部分完成，保留） | Rust 相对图片解析、逐文件 asset scope、Writing NodeView 显示 URL 与纯 Markdown 源分离；路径空格/Unicode/越界单测及浏览器 IPC 源保留测试。Android/iOS 外部资源、安全作用域/SAF 仍未验收，原生 provider 适配仍是已知限制。 |
| #85、#86 | 捆绑 Mermaid/KaTeX；错误保留源，图表只替换自身；静态 SVG、数学标记、内嵌 CSS/字体导出。真实 Chrome 阻断外部网络验证显示与导出。 |
| #87、#88、#89 | 实时后台 TOC、版本/文档替换取消、全局唯一锚点、Rust 源行位置；重复/带格式/setext/围栏标题测试；Reading/Writing/Code 导航适配及移动抽屉入口。 |
| #90、#91、#92 | Writing 链接/图片输入对话框、任务列表；ProseMirror 原生事务与独立撤销组。真实浏览器验证 URL/alt、任务列表、Undo、原文字保留。 |
| #93 | Source Undo/Redo、选区快照、标签 ID/实例/Reload 版本隔离；真实 textarea 输入/撤销/重做及同名未保存文档隔离测试。 |
| #94、#95 | 代码语言标签转义，委托复制事件、精确 textContent 与失败反馈；Rust 与前端测试，生产 CSP 无 inline-script 放宽。 |
| #96（部分完成，保留） | 移动 Save/Save As 接入统一保存与关闭保护；取消/失败保持 dirty，浏览器/IPC 回归通过。Android/iOS picker/provider 写入、权限和真机验收待补。 |
| #97、#98、#99、#100、#101 | 窄桌面窗口按钮、跨模式持久字号、原生 decoration 活动块聚焦、Zen 全屏前态恢复与退出、移动可访问标签本地化。Chrome 窄窗口/字号/聚焦及单元测试通过。 |
| #102（部分完成，保留） | visualViewport height/offsetTop、resize/scroll 清理、安全区域 CSS 和键盘布局测试；旋转、输入法、cutout 和真实触屏滚动保留真机验收。 |
| #103 | HTML title 与 Tauri productName/window title 为 Taleno；生产前端和 Windows 原生构建检查。 |
| #104 | 可恢复操作错误，保存失败不关闭；重试/另存绑定原标签实例。App 完整性测试、Rust 写入/替换失败测试。 |
| #105、#106、#107、#108、#109 | 不变语法库缓存、虚拟稳定行号、延迟统计/避免重复序列化、blocking worker、按需分块与重试。见[实测方法和原始结果](performance/2026-10-21.md)。没有将包大小或 debug 数值当作启动/帧率结论；一万行 Source p95 仍高于 16 ms，明确保留性能边界。2026-10-30 复测见 [performance/2026-10-30.md](performance/2026-10-30.md)：去掉逐键全量回写与空转 gutter 更新后，应用自身开销约 1 ms，p95 仍随主机负载波动。 |
| #112、#113 | 菜单/工具栏共用导出（先 flush、捕获源、统一默认名/错误）；App/Sidebar 共用 workspace picker 和 Rust tree。工作流测试与类型检查。 |
| #122、#123、#124、#125、#126 | 九语言当前版本说明、保留历史规划编号、真实路径/依赖/平台矩阵、identifier 数据目录与主题分类、原子写入 ADR、desktop/mobile 标签分类及不支持的移动签名发布说明。版本验证测试通过，手工发布默认值已去除。 |

验证记录：TypeScript 通过；前端 41 个测试文件、200 项通过；Rust 全量 54 项通过，性能项单独以 release 运行；Chrome 9 项端到端验收通过。完整性回归使用真实 Milkdown，不以 formatter mock 替代编辑事务。Clippy `--all-targets -- -D warnings` 与 rustfmt 通过。`pnpm tauri build --no-sign` 与 `pnpm tauri bundle --no-sign --ci` 本地 EXE/MSI/NSIS 检查成功；不包含发布签名。最终以整合 PR 的 CI 记录为准。

本地 `pnpm tauri build` 已构建原生 EXE、MSI 和 NSIS，随后因未提供本机 updater 私钥而在签名阶段退出非零。正式配置保留 updater 签名要求；本地未签名包验证不构成签名发布。正式签名须在 GitHub release workflow 的密钥环境中进行。本轮没有创建新发布 tag。

---


更新：2026-10-17（Asia/Shanghai）。审计基线：`dev c78763c`；当前实现分支：`feature/acceptance-fixes`。

代码分别由两个独立、面向 dev 的 PR 交付：[包目录边界 #131](https://github.com/BerryUIKI/Taleno/pull/131)、[文档完整性 #132](https://github.com/BerryUIKI/Taleno/pull/132)。本机 `feature/acceptance-fixes` 用于联合检查；以各 PR 的最新提交和合并状态为准。

## 1. 范围与执行原则

GitHub 当前清单为 **74 个开放 Issue：15 个 P1、50 个 P2、8 个 P3、1 个总追踪项**。索引：[#127](https://github.com/BerryUIKI/Taleno/issues/127)。v0.1.10 已于北京时间 2026-10-28 正式发布（上一版 v0.1.9 发布于 2026-10-16）。

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
- 依赖/顺序：先于全局搜索导航和 Quick Switcher 扩展。
- 实施范围：把业务逻辑抽到 Rust service；定义符号链接/循环/根目录策略、深度和结果总上限；覆盖多个兄弟目录、拒绝读取和大目录。
- 完成条件：下方逐 Issue 验收条件全部有证据；失败/无法验证项明确保留。

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
- 完成条件：下方逐 Issue 验收条件全部有证据；失败/无法验证项明确保留。

### F — 编辑工具与桌面行为

- Issues：[#90](https://github.com/BerryUIKI/Taleno/issues/90)、[#91](https://github.com/BerryUIKI/Taleno/issues/91)、[#92](https://github.com/BerryUIKI/Taleno/issues/92)、[#93](https://github.com/BerryUIKI/Taleno/issues/93)、[#98](https://github.com/BerryUIKI/Taleno/issues/98)、[#99](https://github.com/BerryUIKI/Taleno/issues/99)、[#100](https://github.com/BerryUIKI/Taleno/issues/100)、[#104](https://github.com/BerryUIKI/Taleno/issues/104)、[#112](https://github.com/BerryUIKI/Taleno/issues/112)、[#113](https://github.com/BerryUIKI/Taleno/issues/113)。
- 依赖/顺序：依赖本轮编辑器 flush/文档隔离；共享选区适配器可与批次 D 衔接。
- 实施范围：补齐 Writing 链接/图片/任务列表及 Code 格式操作的 Undo/Redo；字体设置覆盖三模式，Focus Mode 有可见作用；实现/准确命名 Zen 全屏；统一导出与打开工作区动作；本轮已有保存错误和冲突提示，#104 仍需覆盖重命名/删除/权限等所有文件入口。
- 完成条件：下方逐 Issue 验收条件全部有证据；失败/无法验证项明确保留。

### G — 移动端与窄窗口

- Issues：[#96](https://github.com/BerryUIKI/Taleno/issues/96)、[#97](https://github.com/BerryUIKI/Taleno/issues/97)、[#101](https://github.com/BerryUIKI/Taleno/issues/101)、[#102](https://github.com/BerryUIKI/Taleno/issues/102)。
- 依赖/顺序：保留本轮移动端关闭保护；必须区分窄桌面窗口和真实手机平台。
- 实施范围：触摸 Save/Save As 与 picker、窄桌面窗口控件、drawer 翻译及 visualViewport 高度/偏移布局；在实际 Android/iOS 设备验证键盘、切口和 sandbox/security-scoped 文件访问，记录设备/系统/证据。
- 完成条件：下方逐 Issue 验收条件全部有证据；失败/无法验证项明确保留。

### H — 性能测量与优化

- Issues：[#105](https://github.com/BerryUIKI/Taleno/issues/105)、[#106](https://github.com/BerryUIKI/Taleno/issues/106)、[#107](https://github.com/BerryUIKI/Taleno/issues/107)、[#108](https://github.com/BerryUIKI/Taleno/issues/108)、[#109](https://github.com/BerryUIKI/Taleno/issues/109)。
- 依赖/顺序：正确性回归通过后测 release 数据。
- 实施范围：缓存不可变 Syntect registry，耗时解析/高亮走 blocking worker；源代码 gutter 保持节点稳定；本轮去掉 Writing 自己发布内容后的重复替换，但 #107 仍需大文档 p95 测量和统计工作评估；首屏懒加载以启动实测及 chunk 数据共同评估。
- 完成条件：下方逐 Issue 验收条件全部有证据；失败/无法验证项明确保留。

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

**[#118](https://github.com/BerryUIKI/Taleno/issues/118) — [BUG] [P2] Align the documented Node requirement with locked frontend-test dependencies**

- [ ] Declare a supported Node/package-manager range and align docs/CI.
- [ ] Use clear unsupported-runtime errors.
- [ ] Verify frozen-lockfile setup and tests on the selected supported runtime.

**[#119](https://github.com/BerryUIKI/Taleno/issues/119) — [BUG] [P2] Make the documented pnpm lint command runnable**

- [ ] Implement the intended lint/format tooling or correct obsolete instructions.
- [ ] Keep CI and local verification consistent.
- [ ] Verify the documented command from a clean dependency installation.

**[#120](https://github.com/BerryUIKI/Taleno/issues/120) — [BUG] [P2] Provide a runnable Playwright end-to-end test setup**

- [ ] Supply dependencies/configuration and actual app journeys.
- [ ] Include document-integrity paths rather than only rendering smoke checks.
- [ ] Document native vs browser coverage and runtime prerequisites.

**[#121](https://github.com/BerryUIKI/Taleno/issues/121) — [CI] [P2] Run frontend unit tests in the repository's CI workflow**

- [ ] Run tests on a compatible pinned runtime.
- [ ] Make test failures fail CI.
- [ ] Add desired-behavior coverage for the reviewed document-integrity bugs.

**[#116](https://github.com/BerryUIKI/Taleno/issues/116) — [REFACTOR] [P3] Resolve baseline Rust warnings that fail strict Clippy**

- [ ] Remove or intentionally use the dead model.
- [ ] Use idiomatic result checks.
- [ ] Pass strict Clippy without broad warning suppression.

**[#117](https://github.com/BerryUIKI/Taleno/issues/117) — [REFACTOR] [P3] Normalize baseline Rust formatting so cargo fmt check passes**

- [ ] Apply formatting without behavior changes.
- [ ] Re-run fmt check and Rust tests.
- [ ] Consider a CI check to prevent drift.

### B — 搜索服务边界

**[#110](https://github.com/BerryUIKI/Taleno/issues/110) — [BUG] [P2] Bound workspace traversal and prevent directory-link cycles**

- [ ] Define link policy and root containment.
- [ ] Add cancellation and depth/size bounds or visited-path protection.
- [ ] Test cycles, large trees and unreadable directories.

**[#111](https://github.com/BerryUIKI/Taleno/issues/111) — [BUG] [P2] Enforce the workspace search result limit across all recursive directories**

- [ ] Stop further recursion/scanning after the global cap.
- [ ] Test multiple sibling/deep directories.
- [ ] Expose deterministic truncated-result behavior.

**[#115](https://github.com/BerryUIKI/Taleno/issues/115) — [REFACTOR] [P3] Move workspace-search business logic from commands into a Rust service**

- [ ] Extract search logic into services without frontend I/O.
- [ ] Retain typed command responses.
- [ ] Keep service tests for traversal, matching and limits.

### C — 插件运行边界

**[#69](https://github.com/BerryUIKI/Taleno/issues/69) — [BUG] [P2] Report plugin execution failure under the production CSP**

- [ ] Do not convert source-read/evaluation errors into successful no-op loads.
- [ ] Expose actionable load errors without losing enabled-state intent.
- [ ] Use an execution architecture compatible with the production CSP; do not simply relax CSP for main-realm eval.

**[#70](https://github.com/BerryUIKI/Taleno/issues/70) — [BUG] [P2] Do not list fallback mock plugins as installed production plugins**

- [ ] Keep test/mock manifests out of production discovery.
- [ ] Missing installations do not appear enabled.
- [ ] Refreshing after uninstall does not recreate phantom entries.

**[#71](https://github.com/BerryUIKI/Taleno/issues/71) — [BUG] [P2] Make registered plugin commands reachable from the application**

- [ ] Expose active plugin commands through the chosen command UI.
- [ ] Bind declared shortcuts with conflict handling.
- [ ] Remove command/shortcut registrations on unload.

**[#72](https://github.com/BerryUIKI/Taleno/issues/72) — [BUG] [P2] Insert plugin text at the editor selection instead of appending to the document**

- [ ] Route insertion through the active editor adapter.
- [ ] Preserve proper Undo behavior and dirty state.
- [ ] Specify and test behavior when no editing selection exists.

**[#73](https://github.com/BerryUIKI/Taleno/issues/73) — [ENHANCEMENT] [P2] Implement isolation and permission enforcement for third-party plugin execution**

- [ ] Choose and implement an isolated execution boundary.
- [ ] Enforce allowed operations at the broker/native boundary.
- [ ] Document and verify the actual trust model; keep restrictive production CSP.

**[#114](https://github.com/BerryUIKI/Taleno/issues/114) — [REFACTOR] [P3] Replace plugin and theme IPC any responses with domain types**

- [ ] Use precise domain/response interfaces instead of any.
- [ ] Handle malformed/optional data explicitly at the boundary.
- [ ] Pass pnpm tsc --noEmit and relevant store tests.

### D — 搜索、对话框与键盘导航

**[#74](https://github.com/BerryUIKI/Taleno/issues/74) — [BUG] [P2] Navigate and highlight actual matches for Find Next and Previous**

- [ ] Use mode-specific match navigation in Writing, Code and Reading.
- [ ] Keep counter, selection and visible match consistent.
- [ ] Cover wraparound and changes to the query/content.

**[#75](https://github.com/BerryUIKI/Taleno/issues/75) — [BUG] [P2] Use consistent regex replacement semantics for Replace One and Replace All**

- [ ] Share explicit replacement semantics.
- [ ] Test capture groups, dollar escapes and zero-width patterns.
- [ ] Display invalid-regex feedback rather than silently treating it as no matches.

**[#76](https://github.com/BerryUIKI/Taleno/issues/76) — [BUG] [P2] Focus search inputs each time their conditionally rendered dialogs open**

- [ ] Focus after the input exists on every open.
- [ ] Restore prior editor focus when closing.
- [ ] Verify reopening and keyboard-only invocation.

**[#77](https://github.com/BerryUIKI/Taleno/issues/77) — [BUG] [P2] Respect focused actions and advertised shortcuts in the unsaved-close dialog**

- [ ] Require the documented modifier for discard.
- [ ] Honor focused button activation.
- [ ] Manage initial/trapped/restored focus and suppress unrelated app actions while modal.

**[#78](https://github.com/BerryUIKI/Taleno/issues/78) — [BUG] [P2] Expose document tabs with keyboard navigation and tab semantics**

- [ ] Implement appropriate tablist/tab/selected semantics.
- [ ] Provide predictable keyboard navigation and focus indicators.
- [ ] Keep close actions separately accessible.

**[#79](https://github.com/BerryUIKI/Taleno/issues/79) — [BUG] [P2] Make workspace search results keyboard-selectable**

- [ ] Use accessible controls/list semantics.
- [ ] Support selection, activation and visible focus.
- [ ] Preserve dialog focus behavior and announce result state.

**[#80](https://github.com/BerryUIKI/Taleno/issues/80) — [BUG] [P2] Position the Find panel inside the document viewport instead of over app chrome**

- [ ] Anchor it to the intended viewport or a non-overlapping overlay region.
- [ ] Verify normal and narrow desktop widths.
- [ ] Keep keyboard focus and dismissal accessible.

**[#81](https://github.com/BerryUIKI/Taleno/issues/81) — [BUG] [P2] Discard obsolete workspace search responses**

- [ ] Use request identities/cancellation and sensible debouncing.
- [ ] Ignore responses after close or query clearing.
- [ ] Cover out-of-order completion and failures.

**[#82](https://github.com/BerryUIKI/Taleno/issues/82) — [BUG] [P2] Navigate to the selected workspace search result's line and match**

- [ ] Pass match location through selection/navigation.
- [ ] Reveal the selected match in supported editor modes.
- [ ] Cover multiple results in the same file.

**[#83](https://github.com/BerryUIKI/Taleno/issues/83) — [ENHANCEMENT] [P3] Extend Quick Switcher to unopened workspace files**

- [ ] Define tab/workspace candidate ordering clearly.
- [ ] Use backend workspace discovery/indexing rather than frontend file I/O.
- [ ] Retain open-tab switching and truthful UI wording.

### E — 资源、渲染与大纲

**[#84](https://github.com/BerryUIKI/Taleno/issues/84) — [BUG] [P2] Resolve relative Markdown images against their originating document**

- [ ] Resolve trusted asset paths in Rust and return scoped WebView-safe URLs.
- [ ] Test spaces, Unicode, subdirectories and Save As.
- [ ] Verify sandbox access on claimed mobile platforms.

**[#85](https://github.com/BerryUIKI/Taleno/issues/85) — [BUG] [P2] Render Mermaid fenced blocks as diagrams**

- [ ] Implement a verified offline rendering pipeline.
- [ ] Handle invalid diagram input visibly.
- [ ] Test actual rendered output, not only wrapper class names, including export behavior.

**[#86](https://github.com/BerryUIKI/Taleno/issues/86) — [BUG] [P2] Render math blocks as formatted formulas**

- [ ] Implement supported math syntax and offline resources.
- [ ] Show invalid input without breaking document rendering.
- [ ] Verify formula output and export rather than only wrapper markup.

**[#87](https://github.com/BerryUIKI/Taleno/issues/87) — [BUG] [P2] Refresh the outline from unsaved content while editing**

- [ ] Use versioned backend parsing for outline derivation.
- [ ] Discard obsolete parse responses.
- [ ] Update in both editing modes without requiring Save.

**[#88](https://github.com/BerryUIKI/Taleno/issues/88) — [BUG] [P2] Use unique occurrence-aware heading anchors and outline navigation**

- [ ] Generate deterministic unique IDs shared by HTML and TOC.
- [ ] Use occurrence/source positions rather than first text matches.
- [ ] Cover duplicate, inline-formatted and similar heading text.

**[#89](https://github.com/BerryUIKI/Taleno/issues/89) — [BUG] [P2] Navigate mobile outline entries in Writing and Code modes**

- [ ] Share a mode-aware navigation adapter with desktop.
- [ ] Support touch drawer close/focus after navigation.
- [ ] Cover all three display modes.

**[#94](https://github.com/BerryUIKI/Taleno/issues/94) — [BUG] [P2] Escape fenced-code language labels before inserting them into HTML**

- [ ] Escape labels in highlighted and fallback branches.
- [ ] Test malicious/unusual language strings.
- [ ] Preserve legitimate inline Markdown HTML behavior intentionally.

**[#95](https://github.com/BerryUIKI/Taleno/issues/95) — [BUG] [P2] Handle reading-view Copy Code through CSP-compatible events**

- [ ] Bind controlled frontend events/delegation instead of inline script.
- [ ] Keep restrictive CSP.
- [ ] Test exact copied text and permission/rejection feedback.

### F — 编辑工具与桌面行为

**[#90](https://github.com/BerryUIKI/Taleno/issues/90) — [BUG] [P2] Implement link insertion for Writing-mode controls**

- [ ] Implement the mode-specific action and any necessary input UI.
- [ ] Preserve cursor, Undo and dirty state.
- [ ] Disable unavailable actions visibly instead of silently doing nothing.

**[#91](https://github.com/BerryUIKI/Taleno/issues/91) — [BUG] [P2] Implement image insertion for Writing-mode controls**

- [ ] Implement the mode-specific action and any necessary input UI.
- [ ] Preserve cursor, Undo and dirty state.
- [ ] Disable unavailable actions visibly instead of silently doing nothing.

**[#92](https://github.com/BerryUIKI/Taleno/issues/92) — [BUG] [P2] Implement task-list formatting for Writing-mode controls**

- [ ] Implement the mode-specific action and any necessary input UI.
- [ ] Preserve cursor, Undo and dirty state.
- [ ] Disable unavailable actions visibly instead of silently doing nothing.

**[#93](https://github.com/BerryUIKI/Taleno/issues/93) — [BUG] [P2] Implement Undo and Redo for source-mode formatting actions**

- [ ] Support menu/shortcut Undo and Redo for formatting edits.
- [ ] Keep selection and dirty state consistent.
- [ ] Do not mix histories from different documents.

**[#98](https://github.com/BerryUIKI/Taleno/issues/98) — [BUG] [P2] Apply the font-size setting to rendered and editable document text**

- [ ] Connect the setting to relevant text styles.
- [ ] Preserve reasonable layout and control sizes.
- [ ] Verify supported modes and persistence expectations.

**[#99](https://github.com/BerryUIKI/Taleno/issues/99) — [BUG] [P2] Implement the visible effect promised by Focus Mode**

- [ ] Define the active-block focus behavior.
- [ ] Implement it without full-document DOM recreation.
- [ ] Verify enabling/disabling and mode transitions.

**[#100](https://github.com/BerryUIKI/Taleno/issues/100) — [BUG] [P2] Align the Zen Mode fullscreen label with actual window behavior**

- [ ] Either implement native fullscreen with restoration or rename the action.
- [ ] Keep exit controls/shortcuts discoverable.
- [ ] Verify state on toggle and app closure.

**[#104](https://github.com/BerryUIKI/Taleno/issues/104) — [BUG] [P2] Show recoverable file-operation errors instead of logging only to the console**

- [ ] Preserve dirty state and prevent close after failed save.
- [ ] Provide retry/Save As where appropriate.
- [ ] Verify permission, missing-path and write/rename failures.

**[#112](https://github.com/BerryUIKI/Taleno/issues/112) — [REFACTOR] [P3] Share the HTML export workflow between menu and editor toolbar**

- [ ] Extract the shared workflow without changing supported output.
- [ ] Use consistent destination defaults and user feedback.
- [ ] Verify both entry points after the refactor.

**[#113](https://github.com/BerryUIKI/Taleno/issues/113) — [REFACTOR] [P3] Share workspace-folder opening between application and sidebar**

- [ ] Route both affordances through a shared typed action.
- [ ] Retain backend-only file listing.
- [ ] Verify workspace state and error feedback from each entry point.

### G — 移动端与窄窗口

**[#96](https://github.com/BerryUIKI/Taleno/issues/96) — [BUG] [P2] Provide touch-accessible Save and Save As for mobile documents**

- [ ] Expose Save/Save As with document-picker integration.
- [ ] Keep dirty state on picker cancellation/failure.
- [ ] Validate sandbox/security-scoped access on claimed phone platforms.

**[#97](https://github.com/BerryUIKI/Taleno/issues/97) — [BUG] [P2] Retain desktop window controls below the mobile-layout breakpoint**

- [ ] Distinguish native platform needs from responsive content layout.
- [ ] Preserve visible window controls at supported desktop widths.
- [ ] Verify resizing back restores normal layout.

**[#101](https://github.com/BerryUIKI/Taleno/issues/101) — [BUG] [P2] Localize hardcoded mobile drawer text according to the selected locale**

- [ ] Move hardcoded labels into translation resources.
- [ ] Verify English and Chinese drawers and fallback behavior.
- [ ] Keep accessible names localized as well.

**[#102](https://github.com/BerryUIKI/Taleno/issues/102) — [ENHANCEMENT] [P2] Validate and adapt mobile viewport geometry for keyboards and cutouts**

- [ ] Measure visualViewport height/offset and apply the necessary layout adaptation.
- [ ] Verify safe-area and keyboard behavior on actual devices.
- [ ] Document tested platforms and include regression coverage for viewport changes.

### H — 性能测量与优化

**[#105](https://github.com/BerryUIKI/Taleno/issues/105) — [PERF] [P2] Cache the immutable Syntect syntax registry across highlight requests**

- [ ] Use a safe shared/lazy immutable registry.
- [ ] Verify concurrent calls and existing output.
- [ ] Record release measurements before/after; do not infer the 16 ms input budget from debug timing.

**[#106](https://github.com/BerryUIKI/Taleno/issues/106) — [PERF] [P2] Keep source-editor gutter nodes stable across content edits**

- [ ] Use stable indexed/virtualized rendering as appropriate.
- [ ] Update line count without rebuilding all gutter nodes.
- [ ] Measure large-document input latency before and after.

**[#107](https://github.com/BerryUIKI/Taleno/issues/107) — [PERF] [P2] Avoid redundant full-document work in the WYSIWYG content-update path**

- [ ] Distinguish user-originated updates from externally loaded content.
- [ ] Keep expensive derived statistics out of the immediate input path.
- [ ] Measure p95 input latency and preserve correct state/history.

**[#108](https://github.com/BerryUIKI/Taleno/issues/108) — [PERF] [P2] Move CPU-heavy render and highlight work off synchronous Tauri command execution**

- [ ] Use suitable asynchronous/blocking-worker execution.
- [ ] Maintain typed responses and error behavior.
- [ ] Measure latency/responsiveness and handle obsolete frontend requests.

**[#109](https://github.com/BerryUIKI/Taleno/issues/109) — [PERF] [P3] Reduce eagerly loaded frontend code on the initial screen**

- [ ] Profile first, then introduce appropriate lazy boundaries.
- [ ] Keep editor/settings transitions usable with loading/error handling.
- [ ] Record startup and chunk measurements without treating chunk size alone as a latency verdict.

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

- Rust：31 个单元/服务测试通过；包含真实 notify 连续两次原子替换、Windows junction containment、安装回滚、保存冲突与临时文件保护。
- #132 独立分支的 Rust 27 项测试通过；31 项是合入包目录修复后的联合结果。
- 前端：Node 24.19.0 下 25 个文件 / 100 个测试通过；包含真实 Milkdown、延迟 IPC、失败/取消关闭、更新中新增编辑和冲突暂停自动保存。
- `pnpm tsc --noEmit`、`pnpm build`、`git diff --check` 通过。生产 JS 约 748.51 KB，仍有 chunk 体积警告。
- Rust 仍有既有 `DocumentMeta` 死代码警告；前端仍有既有 Solid root 和测试环境 marketplace IPC 日志。未把这些声明为已修复。
- 未执行完整原生 GUI 验收、macOS/Linux/Android/iOS 设备验证、断电实验、真实更新安装或签名打包；未发布新版本。
- 根据用户最新安排，改动按小 PR / conventional atomic commits 交付；AGY 承接剩余批次时保留这些修复，并先读取最新 PR 状态。


# 分发包记录

# 1.9.2 · 2026-09-15

- 文件：`prototype-requirement-workflow-1.9.2.zip`
- SHA-256：`AC598E99E29BD9499E497F439F5F3065F7C9FE5E8A576A82485B518398BBBC7E`。
- 变更：汇总 1.7.4～1.9.x 的可分发模式库、参考与测试夹具分级、参考驱动需求说明、低保真控件模式、实际 RP 直接复刻、功能框架与竞品截图双输入门禁，以及页面清单/页面画面两道确认门。
- Axure：新建和增量写入改为独立叶子控件，不再把每批控件放进 Group；已有映射中的旧 Group 可在校验叶子控件后安全拆组并继续更新同一 RP。
- 校验：仓库 64/64 项 Node 自动测试通过；仓库 Skill 通过 `quick_validate.py`；ZIP sidecar 哈希一致，68/68 个清单文件哈希一致，禁带文件 0。
- 边界：本次发布检查没有重新执行 4134、4137、4149 三个版本的原生写入；当前支持范围仍只包括这三个 Windows Axure RP 11 精确构建，不扩大到所有 Axure 11、RP9/RP10 或 macOS。

# 1.9.0 · 2026-09-15

- 文件：`prototype-requirement-workflow-1.9.0.zip`
- 变更：新增 `framework-screenshot` 正式新品流程。产品功能框架映射页面范围，手动上传的竞品截图必须先形成低保真 abstraction；增加页面清单确认和页面画面确认两道用户来源门禁。
- 执行：`page-design` 允许无 notes 的页面先行预览或写入 Axure；`final` 只有页面画面确认后才能生成完整说明。旧任务未声明新 profile 时继续按 final 兼容。
- 校验：Bridge 自动测试 64 项通过；新增测试覆盖缺少框架、缺少竞品截图、缺少低保真抽象、页面清单未确认、页面画面未确认、page-design 夹带说明及 final 延迟说明等阻断。
- 边界：本轮没有启动 Axure，也没有重新执行三个精确版本的原生兼容测试；Axure 支持范围仍为 Windows 11.0.0.4134、4137、4149。

# 1.8.0 · 2026-09-15

- 文件：`prototype-requirement-workflow-1.8.0.zip`
- 校验：同目录 `.sha256.txt` sidecar。
- 变更：新增参考驱动需求说明标准、可编辑控件模式库与 version 2 质量门禁；逐页记录主参考和禁止继承项，拦截高后果 assumption、完整产品 assumption 过载、需求说明行为维度缺失、关键状态只写不画及 screen 控件角色不足。
- 新增 `examples/reference/requirement-depth-standard/` 脱敏正例，展示页面说明、页面进入、交互、系统回流、异常边界、美术交付、插画、遮罩与系统弹窗。
- 59 项 Node 自动测试通过；version 2 正例联合校验无警告并完成 HTML 目视检查；仓库 Skill 通过 quick_validate。
- 本轮未启动 Axure、未修改 RP、未重新执行三版本原生测试；Axure 兼容范围仍为 Windows 11.0.0.4134、4137、4149。

## 1.7.6 · 2026-09-15

- 文件：`prototype-requirement-workflow-1.7.6.zip`
- 大小：549242 字节；102 个文件条目（101 个清单文件加 SHA256SUMS.txt）。
- SHA-256：`2EE39D19C75A72EEEE084E07037CB0553AA33DEF72B0ECCC9216CE1F9D3D7C99`
- 变更：在 1.7.5 的 examples 分级基础上，将包根目录和完整说明中的日常输入改为中性的文件扫描工具；reference 模板请求不再点名单一产品，避免兼容夹具继续形成默认业务锚点。
- Printer 只保留在 `examples/test-fixtures/legacy-printer/`、兼容代码和历史验证记录中；包根入口与 `examples/reference/` 的内容扫描均为 0 个 Printer 命中。
- 仓库与本机安装 Skill 均通过结构校验；仓库 54 项自动测试通过。干净解压后 101/101 个清单文件哈希匹配，重新安装依赖并再次通过 54 项测试和 Skill 校验。
- 干净解压后，reference 六页模板与 legacy Printer 两页兼容预览均成功；legacy fixture 继续明确输出兼容警告。
- ZIP 内无旧 examples 路径，不含 RP、RPLIB、本机路径、私有索引、session、映射或依赖缓存。1.7.5 保留为中间封存包，推荐同事使用 1.7.6。
- 本轮未修改桥接协议或适配器，未启动 Axure；三版本原生能力沿用历史验证，不据此宣称重新验收。

## 1.7.5 · 2026-09-15

- 文件：`prototype-requirement-workflow-1.7.5.zip`
- 大小：548857 字节；102 个文件条目（101 个清单文件加 SHA256SUMS.txt）。
- SHA-256：`4A6919958CF2511060E9EE8483035F92B1B9FB4CDD51A755761E73EDD3909D90`
- 变更：将 examples 分成 `reference/` 与 `test-fixtures/`；新增 examples 总入口和 fixture 边界说明。通用模板、双状态布局、共享规则进入 reference；规划门禁样例和旧 Printer 进入 test-fixtures。
- `review-template-library` 新增 `reference-selection.md`；Skill 明确 test fixtures 禁止作为信息架构、页面密度、UI 文案或需求说明来源。
- 仓库与本机安装 Skill 均通过结构校验；仓库 54 项自动测试通过。干净解压后 101/101 个清单文件哈希匹配，重新安装依赖并再次通过 54 项测试和 Skill 校验。
- 干净解压后，reference 六页模板与 legacy Printer 两页兼容预览均成功；后者明确输出 legacy warning，不改变其“只供回归”的身份。
- ZIP 内无旧 examples 路径，Printer 仅存在于 `examples/test-fixtures/legacy-printer/`；不含 RP、RPLIB、本机路径、私有索引、session、映射或依赖缓存。1.7.4 ZIP 保持封存。
- 本轮未修改桥接协议或适配器，未启动 Axure；三版本原生能力沿用历史验证，不据此宣称重新验收。

## 1.7.4 · 2026-09-15

- 文件：`prototype-requirement-workflow-1.7.4.zip`
- 大小：543145 字节；99 个文件条目（98 个清单文件加 SHA256SUMS.txt）。
- SHA-256：`CEA4C4364AEF4874C38C0CCDA7A70A860B55878502DAE05C6C74C1923C069957`
- 变更：把 32 份多产品 RP 的稳定写法脱敏抽象成包内 `rp-pattern-library.md`，提供 12 类页面模式、6 类说明块、内容密度、必要提问和版本角色规则；同事无需原始 RP、本机目录或私有索引。
- 参考路由默认使用一个主模式、最多两个辅模式；当前有效基线优先，局部迭代/Bugfix 只影响声明范围，Mobbin 仍是可选外部补充，最终继续使用用户模板或 `house-review`。
- 仓库与本机安装 Skill 均通过结构校验；仓库 54 项自动测试通过。干净解压后 98/98 个清单文件哈希匹配，重新安装依赖并再次通过 54 项测试、Skill 校验和六页模板 HTML preview。
- ZIP 未包含 RP、RPLIB、私有参考索引、local-runtime、源路径、原文、截图、Mobbin 账号、session、映射、运行历史或依赖缓存。1.7.3 ZIP 保持封存。
- 本轮未修改桥接协议或适配器，未启动 Axure；三版本原生能力沿用历史验证，不据此宣称重新验收。

## 1.7.3 · 2026-09-15

- 文件：`prototype-requirement-workflow-1.7.3.zip`
- 大小：535511 字节；98 个文件条目（97 个清单文件加 SHA256SUMS.txt）。
- SHA-256：`E88F68883A8525AE7DF8F02F0BDFCE29410037D6FA3D4A82A93ED4B3CE2D58E5`
- 变更：新增本地同类 RP/Mobbin 参考路由与单页内容密度检查；Mobbin 只补信息架构、模块角色和状态模式，最终继续使用用户模板或 `house-review`。
- 仓库与本机安装 Skill 均通过结构校验；54 项自动测试通过。干净解压后 97/97 个清单文件哈希匹配，重新安装依赖并通过 54 项测试、Skill 校验和六页模板 HTML preview。
- 包内不含 RP、RPLIB、本机私有参考索引、local-runtime、Mobbin 账号/截图、会话、映射、运行历史或依赖缓存。1.7.2 ZIP 保持封存，不作为推荐分发版本。
- 本轮未修改桥接或适配器，未启动 Axure；三版本原生能力沿用历史验证，不据此宣称重新验收。

## 1.7.2 · 2026-09-15

- 文件：`prototype-requirement-workflow-1.7.2.zip`
- 大小：535328 字节；98 个文件条目（97 个清单文件加 SHA256SUMS.txt）。
- SHA-256：`976823C9C4FDA97AEF0F1517FEB68329164F06AA79FB0606E9BABBF0CBDA6306`
- 变更：新增本地同类 RP/Mobbin 参考路由与单页内容密度检查；Mobbin 仅补信息架构、模块角色和状态模式，最终继续使用用户模板或 `house-review`。
- 仓库与本机安装 Skill 均通过结构校验；54 项自动测试通过。干净解压后 97/97 个清单文件哈希匹配，重新安装依赖并通过 54 项测试、Skill 校验和六页模板 HTML preview。
- 包内不含 RP、RPLIB、本机私有参考索引、local-runtime、Mobbin 账号/截图、会话、映射、运行历史或依赖缓存。1.7.1 ZIP 保持封存。
- 本轮未修改桥接或适配器，未启动 Axure；三版本原生能力沿用历史验证，不据此宣称重新验收。
- 该包为本轮中间封存候选；推荐使用包含最终验证记录的 1.7.3。

## 1.7.1 · 2026-09-15

- 文件：`prototype-requirement-workflow-1.7.1.zip`
- 大小：527883 字节；97 个文件条目（96 个清单文件加 SHA256SUMS.txt）。
- SHA-256：`983C8EDD13918719357F59190F268F977AAC701DE36709FFBF263C2B7EA89572`
- 变更：将规则拆成跨产品硬骨架、按需说明维度和当前产品专属内容；业务说明标题从当前页面动态生成，不再以 Printer 或其他单一示例作为默认章节模板。
- 仓库与本机安装 Skill 均通过结构校验；54 项自动测试通过；六页模板 model/plan/scene 联合校验与 HTML preview 成功。
- Axure 11.0.0.4137 在同一 RP 中完成 10 页原生增量更新、回读、保存与渲染；本轮改动首次为 8 个写入批次，重复 apply 为 0。未重跑 4134/4149 原生测试。
- 包内不含 RP、RPLIB、原始素材、扫描报告、会话、映射、运行历史、账号数据或依赖缓存。1.7.0 ZIP 保持封存。

## 1.7.0 · 2026-09-15

- 文件：`prototype-requirement-workflow-1.7.0.zip`
- 大小：511199 字节；94 个文件条目（93 个清单文件加 SHA256SUMS.txt）。
- SHA-256：`5EE6483354A2D198B69A5F3C820F51B7CC9771DD19E7B44D90C15C773F2C443F`
- 变更：新增 RP 原稿派生的跨产品 `house-review`、六类模板和兼容校验；旧 `android-review` 输出保持兼容。
- 解压后 93 个文件哈希全部匹配；归档未包含 RP、RPLIB、本机路径、会话、映射、私有扫描数据或依赖缓存。
- 从全新解压目录安装依赖后，53 项自动测试全部通过；六页模板的 model/plan/scene 联合校验无错误或警告，HTML 预览成功；Skill 静态校验通过。
- Axure 原生 apply 尚未完成：现有 `Printer-Skill-Demo` 主实例运行时，三个独立目标的启动均返回 STARTUP_NOT_READY；未执行写入，目标文件哈希保持不变。关闭现有 Axure 主实例后再继续，不能把 HTML 预览当作 RP 验收。
- ZIP 已封存；后续内容变更应提升版本，不覆盖同名包。

## 1.6.0 · 2026-09-15

- 文件：`prototype-requirement-workflow-1.6.0.zip`
- 大小：498615 字节；89 个文件条目（88 个清单文件加 SHA256SUMS.txt）。
- SHA-256：`E4928AACC7FDA2F610009AF89A13B1624210821598950C91B97C376094BB6AC8`
- 变更：Skill 内主动收敛模糊需求；先推荐、仅问影响当前页面的关键问题；充分输入直接执行；示例选择与业务确认分开记录；不改变 Axure 适配范围。
- 解压后 88 个文件哈希全部匹配。干净隔离工作目录 PreviewOnly 初始化成功；依赖安装成功；从解压目录执行 52 项自动测试全部通过；共享规则示例生成 2 页 HTML，明确 `axureWritten: false`；Skill 静态校验通过。
- 三个独立 Agent、六轮合成输入行为试跑完成，详见 [评估记录](../docs/INTAKE-EVALUATION.md)。没有本轮 Axure 原生或视觉验收。
- 包内不包含本机路径补充、私有试跑数据、真实 RP、会话、运行历史或依赖缓存。仓库额外文档不在包内清单中。
- ZIP 已封存，后续内容变更应提升版本，不覆盖同名包。上述校验不代表已推送远端；上传状态以 Git 记录为准。

## 1.5.0 · 2026-09-14

- 文件：`prototype-requirement-workflow-1.5.0.zip`
- 大小：493355 字节；88 个文件条目（87 个清单文件加 SHA256SUMS.txt）。
- SHA-256：`D48AA9A8A704D240298D204AF1B63F26502D78D29A64D235F4D3525C3ACC1803`
- 保留原始包，未覆盖。历史发布详情见 [上传记录](../docs/PUBLICATION.md)。
# 1.8.1 · 2026-09-15

- 文件：`prototype-requirement-workflow-1.8.1.zip`
- 大小：576074 字节；110 个文件条目（109 个清单文件加 `SHA256SUMS.txt`）。
- SHA-256：`AF03B3B7F88DF6D8BF85DC09A8B288BC2B6B5E3200E5D3ACBA95954D17DC7F98`。
- 新增 `direct-rp-replica`：逐页记录真实 RP 页面、控件读取、原生渲染和至少四项复刻维度；同产品页面存在时禁止退回功能框架图、流程图、Product Overview 或通用卡片模板。
- 仓库 60/60 项 Node 自动测试通过；仓库、本机安装和干净解压 Skill 均通过 quick_validate。干净解压后 109/109 个 manifest 文件哈希匹配，禁带文件 0。Smart Printer 本地预览已切换为 9 个 Printer RP 原生需求页。
- ZIP 不包含用户 RP、RPLIB、原生渲染图、私有路径索引、原始需求、session、映射、账号或依赖缓存。本轮未写入用户 RP，也未重跑 Axure 4134/4137/4149 原生适配测试。

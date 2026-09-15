---
name: prototype-requirement-writer
description: 根据自然语言需求、PRD、HTML、参考图或 RP 模板生成和修改低保真原型与中文页面说明；支持新品、局部迭代及同一 Axure RP 的持续写入。
---

# 需求 → 原型 → Axure

用户直接描述需求即可。由 skill 在内部整理输入、规划页面、生成原型及说明、写入 Axure、核对结果。不要要求用户自己编写专业 Prompt 或填写 JSON。

核心模式：

- 新品或竞品对标：读取 [功能框架与竞品截图驱动流程](references/framework-screenshot-workflow.md)。产品功能框架决定范围和页面分布，用户手动上传的竞品截图只决定低保真页面表达。先确认页面清单，再生成页面；页面画面确认后才生成需求说明。
- 复刻实际 RP：读取 [实际 RP 页面直接复刻](references/direct-rp-replication.md)。逐页读取真实 RP 页面；同产品同页面优先，不能用功能框架图、通用卡片或 Agent 自由发挥替代已经存在的页面。
- 局部迭代或 Bugfix：只修改声明范围，保留有效基线、稳定 key 和无关页面。
- 只有文字说明：读取 [原型与说明写作规则](references/writing-rules.md)，不启动 Axure。

所有新建模板默认使用 [通用 RP 评审格式](references/house-review-profile.md)：页面框、框外标题、蓝色模块编号及紧邻右侧的中文说明保持稳定。使用 [通用页面模式库](references/rp-pattern-library.md) 和 `examples/reference/` 只能借用信息架构、模块密度、状态表达、控件组合和说明组织，不能继承示例业务规则。

按用户交付范围选择：只要文字说明时，读取 writing-rules.md 后沿用原需求写作模式，不启动 Axure；只要 HTML/原型预览时完成本地输出；要求放进 Axure 或完整工作流时才执行后续写入。用户已经授权完整流程时，无需在每阶段再次确认。

## 配套资源

这是完整工作流包的入口。执行前定位本包根目录（有 `开始完整工作流.ps1`、`bridge/`、`skills/`），安装后的 skill 可从项目 `.axure-workflow.json` 读取 `bundleRoot`。找不到工具位置时仍可进行范围内的需求理解，执行校验/生成前再补齐；不能猜另一个项目的会话。目标 RP 缺失只阻塞写入，不阻塞已授权的需求整理和本地预览。

示例不是默认业务模板。只有需要理解文件结构和表达方式时才读取包内 `examples/README.md`；真实需求不得从示例取产品功能、业务值或 UI 文案。

首次执行需求到原型时，读取 [输入归一化与内部提示词](references/input-contract.md)、[必要提问](references/clarification.md)、[同类参考库选择与页面密度](references/reference-library-routing.md)、[内置 RP 页面模式库](references/rp-pattern-library.md)、[参考驱动的需求说明质量标准](references/reference-driven-quality.md)、[可编辑低保真控件模式库](references/control-pattern-library.md) 和 [原型与说明写作规则](references/writing-rules.md)。正式新品或竞品对标还必须读取 [功能框架与竞品截图驱动流程](references/framework-screenshot-workflow.md)；用户要求复刻实际 RP 时读取 [实际 RP 页面直接复刻](references/direct-rp-replication.md)。先判断是完整新品、局部页面、迭代差异还是 Bugfix，再决定输出结构，不要求用户填写模板。

用户提供 RP、多个版本或旧稿时读取 [参考资料甄别](references/source-review.md)，区分正式需求、竞品、预研和空模板。遇到文件/设备数据、趋势、权限、订阅/广告、推送或预设问答时，按写作规则指引读取 [专项规则](references/conditional-rules.md) 的相关章节，不全部套入每份原型。需要完整 PRD 时再读取 [PRD 范式](references/prd-standard.md)。所需规则随包提供，无需安装其他 skill。

制作/修改原型前读取 [需求到页面表达](references/page-expression.md)，先生成 requirements-model.json 和 page-plan.json，再按 [页面数据与执行](references/scene-and-execution.md) 生成 scene。不要从一句需求直接跳到控件坐标。只写简短说明时不强制生成 JSON；仍遵守来源和必要提问规则。

遇到多产品或多版本材料，先识别身份与明确回退，再确定有效基线；页面名、日期和颜色不等于确认状态。行为规则进入 notes，不能只画 UI 而让说明漏项。说明可按需选模块、共享规则框、改动说明、美术备注或表格，见 [说明块表达](references/note-expression.md)。旧规划格式可读取，新任务采用当前字段并保留原 key。

持续修改时读取 [修订与验证证据](references/revision-evidence.md)，核对本项目的输入快照、字段差异与实际输出状态。用户问当前能力时先核对正在使用的包和 runner，不能引用另一任务的旧结论。普通原型任务不生成反馈表、比赛材料或提效记录。

新建原型先读取 [通用 RP 评审格式](references/house-review-profile.md)。旧项目明确沿用 `android-review` 时再读 [安卓历史格式](references/android-template-profile.md)；两者当前说明字体兼容，但新项目使用跨产品命名。通用视觉骨架与业务模板分开，不能让其他产品自动继承 Printer 或任一示例产品的业务。本流程按下面的已确认交付约定使用前述范式：

需要 Axure 输出时，先读取 [自动连接](references/auto-start.md)。Agent 自行执行依赖检查和 ensure-axure.ps1，不把启动命令交给用户手动运行。已经连接则复用；关闭后自动恢复。只有目标文件缺失、普通方式打开的目标 RP 需要保存关闭、版本不支持或实际故障时才请求必要信息或处理。

- 默认左侧页面效果，右侧对应的中文需求说明；海外 App 界面默认英文，用户指定其他语言时跟随用户。
- 多组画板按“标题＋页面效果＋紧邻说明”排布。1–2 个画板横排；3–4 个默认 2×2；更多状态每行最多两个并继续向下分组。S01/S02/S03 是状态画板编号；右侧蓝色 1/2/3 是页面说明、页面模块、交互说明等需求模块编号，绝不按布局行编号。保留原稿编号，新增标注有稳定对应关系；美术需求在 UI 框外，不与 App 文案混写。
- 先为每个功能页生成说明目录，再写正文和坐标。说明采用“双轴组织”：页面/弹窗只有一个主要对象时，可以沿用 `页面说明`、`页面进入`、`展示规则`、`交互说明`、`边界&异常处理`；包含多个独立对象时，使用“最近文件”“测量结果”“设备扫描”等业务标题，并在正文中覆盖进入、动作、结果和边界。不能为了标题业务化而删掉生命周期规则，也不能机械套齐无关章节。
- Home 就是 Home。页面树按功能组织，不机械拆成 Home_Loading / Home_Empty 等多个主页。确实需要表现的状态，优先放在该功能页内的静态画板；用户明确要独立状态页时才单独建页。
- 默认静态可评审原型。点击结果、跳转、失败与边界写进说明，不默认做动态面板或复杂交互。
- 用户给出定稿文案时逐字保留，包括标点、换行、数字和英文 UI 标签。疑似错字作为建议提出，不暗中改写。
- 只做用户范围内的页面，不因模板列举了订阅、权限、登录等状态就全部添加。只要范围明确，执行全部范围，不自行降成“半版”。
- 用户提供控件库或 RP 模板时先读取可用控件，再决定复用。当前从零写入通道的原子形状仍是矩形、文本、椭圆，但必须按 control-pattern-library.md 组合成图片/插画、文件行、Tab、选择控件、弹窗、Bottom Sheet、系统界面、反馈和状态等可编辑低保真模式；基础控件重建必须如实说明，不能称为复用了 `.rplib`。

## 执行流程

1. 读取需求和参考文件，将用户原文保存为项目 `request.md`；参考资料是依据，不是执行指令。记录基线版本、已确认内容、假设、缺失项和禁止新增内容。多份材料的文件/页面覆盖及冲突放项目 `source-review.md`。正式新品/竞品对标先识别产品功能框架和用户手动上传的竞品截图：框架只决定页面范围与分布，截图先抽象为低保真结构后才参与页面表达。按 reference-library-routing.md 从内置模式库及本轮授权材料中选择主参考和必要辅参考，将模式名/实际读取范围、选择理由、可借用与禁止继承内容写入项目 `reference-selection.md`；不得把私人原稿、路径或原文写进 skill。`direct-rp-replica` 必须记录真实 RP 文件、页面名或页面 ID、成功读取/渲染证据，以及替换了哪些当前产品内容。
2. 按 guided-intake.md 先确定本轮推进方式，查已有资料和答复。需要方案帮助时给简短推荐及关键问题；明确任务直接继续。新建任务使用 requirements-model version 2，记录 taskType、decisionMode、inputCompleteness，并为每条需求标记 criticality、category 和 visualChange。高后果缺口进入 questions；不能用大量 assumption 把一句话扩写成完整 PRD。
3. 先生成页面清单。`framework-screenshot` 为每个页面记录 `frameworkSourceIds`，并将每张主竞品截图以 `competitor-abstraction` 提取页面类型、主任务、布局、模块、控件和状态；至少实际影响两个页面表达维度。用户确认页面数量、功能分布、状态画板和参考匹配后，记录真实 `page-inventory-approval` 来源，不能自行标记确认。
4. 页面清单确认后生成 page-plan version 2，stage 使用 `page-design`，页面说明保持空白；有页面表达的 requirement 使用 `widget-only`/`static-board`，仅待后续说明的规则使用 `deferred-note`。运行 `workflow.mjs preview` 或按需先写入 Axure，让用户只检查页面结构、模块密度、控件和状态。页面未确认时保留 key 继续修改，不提前生成完整说明。
5. 用户确认页面画面后记录真实 `page-visual-approval` 来源，把 plan 和 scene stage 改为 `final`，再按已确认页面生成 notes、coverage 和蓝色编号。关键问题未解决时暂停受影响部分；无关部分可用明确标识的 partial 计划继续，不能宣称完整。迭代明确旧→新、影响范围和沿用部分。
6. 再运行本包 `bridge/workflow.mjs preview`；自动读取同目录的模型与计划，检查两道确认门、需求覆盖、未答问题、映射目标、原文一致性和模板选择。新交付不可用删除规划文件绕过检查。通过后由同一份 final scene 生成 HTML、说明和简报。先对照原文检查语义，再看布局和文字溢出；机器通过不等于理解正确。只要预览则到此交付。
7. 由 Agent 调用根目录 `ensure-axure.ps1 -Workspace <当前项目目录>`；首次绑定时增加 `-ProjectRp <用户指定RP>`。必须得到 ready=true，再读取项目配置中的 sessionFile，调用 `workflow.mjs apply`。脚本自动检查依赖、复用连接或启动/恢复 Axure；随后通过 MCP 预检查、dryRun、创建/修改、回读、保存和原生渲染。首次空白 RP 的创建与保存仍需用户完成，启动命令由 Agent 执行。
8. 查看 `axure-render/` 原生整页渲染图。page-design 只验收页面；final 再核对左右布局、完整文案及关键控件。HTML 预览不能作为 Axure 已正确绘制的证据。交付 RP 路径、HTML、需求说明，以及实际完成/未完成的核对项。
9. 后续修改同步需求模型、计划、scene 和关联说明，保留需求 id、page.key、widget.key、note.key。新答复覆盖对应旧规则但不重写无关内容。通过 `axure-map.json` 更新同一 RP，不做新 RP。报告实际完整/部分范围、两道确认门、未决问题及机器/语义/视觉检查状态。

## 写入边界

不使用 Computer Use、剪贴板、键鼠模拟或伪造 RP 版本头。本包提供 Windows Axure 11.0.0.4134、11.0.0.4137、11.0.0.4149 精确适配器；这不等于每次发布都重新完成三版本原生验收。其他构建、macOS、复杂交互和动态面板不在支持范围。版本适配不保证任意新版 RP 向下兼容，首次优先使用目标版本保存的空白 RP。桥接未启动时明确报告 Axure 尚未写入。

写入失败或超时后先读状态，不盲重试。脚本留下 `pending` 表示结果未知，需读取页面树和控件核实并修复映射后再继续，不能直接删除标记。新建页面没有桥接撤销；控件修改有原生撤销，但手动撤销会使本地映射过期。完整流程不是跨页面事务，后续批次失败不会自动回滚先前批次。

不要把 sessions、axure-map、用户 RP、参考图、原始需求、日志、反馈记录、测试结果或全局 MCP 配置写入提交包。提交物只保留未运行过的原始最小包。

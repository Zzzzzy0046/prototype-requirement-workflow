# 功能框架与竞品截图驱动流程

用于正式新品、整条功能流程或需要竞品对标的页面任务。目标是把输入职责分开，避免 Agent 用一句产品名称自由扩写：

- 产品功能框架决定功能范围、页面清单和页面分布；
- 用户手动上传的竞品截图决定低保真布局、模块密度、控件组合和状态表达；
- `house-review` 与用户指定 RP 基线决定 Axure 评审和交付格式；
- 当前用户明确要求优先于以上材料。

## 最小输入

正式流程至少需要产品/功能名称、平台、本轮范围、产品功能框架、一组竞品截图，以及是否允许补充框架外低风险辅助模块。用户不需要填写 JSON、Prompt 或坐标。

若缺少功能框架，只能交付范围受限的方案探索，不能称为完整页面树。若缺少竞品截图，只有用户接受 fallback 后才可使用团队 RP 模式库，且不能声称完成竞品对标。目标 RP 只影响 Axure 写入，不阻塞前面的规划和页面预览。

新任务在 `requirements-model.json.context.workflowProfile` 使用 `framework-screenshot`。输入来源使用 `sources[].inputRole` 区分：

- `product-framework`：当前产品功能范围；
- `competitor-screenshot`：竞品页面表达；
- `team-rp-template`：交付骨架；
- `current-requirement`、`flow`、`fixed-copy`、`existing-rp`：其他当前来源；
- `page-inventory-approval`：用户确认页面清单；
- `page-visual-approval`：用户确认页面画面。

竞品截图通常是 `kind=reference`，不能成为 confirmed 业务规则的权威来源。产品框架和用户答复可以是 `kind=user` 或有效 `baseline`。

## 阶段 1：功能框架到页面清单

不要把一个脑图节点机械变成一个页面：

| 框架节点 | 默认表达 |
| --- | --- |
| 一级稳定功能域 | 根页面、Tab 或页面组 |
| 可独立完成的用户任务 | 功能页面 |
| 连续且需要决策的步骤 | 流程页面 |
| 内容分区 | 页内模块 |
| 筛选、排序、参数、工具动作 | 控件、弹层或 Bottom Sheet |
| 空态、成功、失败、权限变化 | 同页静态状态画板或说明 |
| 后台能力和数据规则 | 需求说明，不画 App 页面 |

先输出 `function-model.json` 和 `page-inventory.md`。页面清单至少写页面名、所属功能、用户目标、入口、主要模块、可能状态和本轮范围。

用户确认页面有没有漏、多余和分布错误后，新增一条已读 `page-inventory-approval` 用户来源。`page-plan.json.gates.pageInventory` 指向该来源。没有真实用户答复不能标 approved。

## 阶段 2：竞品截图低保真抽象

逐张查看截图并记录：

1. 页面类型和主任务；
2. 布局拓扑；
3. 模块清单和顺序；
4. 主次信息层级；
5. 控件组合；
6. 状态与反馈方式；
7. 可借用部分；
8. 禁止继承部分。

移除品牌、Logo、高保真包装、专属图片、完整竞品文案、未在当前框架中的功能，以及价格、权益、权限、广告、保存、删除、成功判定和数据口径。

为每个页面选一个主截图，最多两个辅助参考。`referenceSelections[].mode` 使用 `competitor-abstraction`；主来源必须是已读 `competitor-screenshot`。填写 `abstraction`，至少包含：

- `pageType`
- `primaryTask`
- `layoutTopology`
- `modules`
- `controlPatterns`
- `stateExpressions`
- `lowFidelity: true`

竞品参考至少实际影响信息架构、模块密度、状态表达、控件模式中的两项。每个页面用 `frameworkSourceIds` 指向决定该页面范围的产品框架来源。

## 阶段 3：页面清单确认后先画页面

页面清单确认后，`page-plan.json.stage` 使用 `page-design`：

- `gates.pageInventory.status=approved`；
- `gates.pageVisual.status=pending`；
- `scene.json.stage=page-design`；
- `scene.pages[].notes=[]`；
- 有可见页面表达的 requirement 使用 `widget-only` 或 `static-board`；
- 只需要后续文字表达的 requirement 使用 `deferred-note`；
- 不创建蓝色说明编号和右侧说明控件。

页面必须达到可评审密度。逐页检查核心任务、当前内容/状态、相关辅助入口、任务结果承接、必要导航和需要视觉表达的状态。只做 Home 只限制页面数量，不等于只画一个 CTA。

不得生成 Product Overview、功能框架展示页、竞品截图页或研究总结页，除非用户明确要求。Axure 业务控件独立可编辑，默认不 Group。

## 阶段 4：页面画面确认

用户检查页面结构、模块完整性、竞品对应关系、控件丰富度、页面密度、状态画板和 RP 风格。只有用户明确接受页面后，新增一条已读 `page-visual-approval` 用户来源。

页面未确认时继续修改 `page-design`，保留 page/widget key。不能先生成完整说明为错误页面背书。

## 阶段 5：再生成需求说明

页面确认后：

- `page-plan.json.stage=final`；
- 两个 gates 都是 approved，且分别指向对应用户来源；
- `scene.json.stage=final`；
- 把 `deferred-note` 和需要行为说明的 `widget-only` 转成 `note-only`、`widget-and-note` 或 `static-board`；
- 为每个 note 补 `coverage`；
- 根据已确认页面中的模块和控件生成说明，而不是先写模板章节。

说明事实来源是产品功能框架、当前需求、用户答复和有效基线。竞品截图只能影响说明颗粒度，不能提供业务结论。

关键行为按实际需要覆盖：

`入口/前置条件 → 用户动作/系统事件 → 页面或数据变化 → 成功结果 → 取消/返回 → 失败 → 状态保留与再次进入`

多模块页面优先使用业务对象标题；弹窗、权限和系统交接可以使用页面说明、展示规则、交互说明、边界&异常处理。蓝色编号对应说明模块，不是页面编号。页面上的按钮、Tab、菜单、开关和可点击列表项必须有结果或明确仅展示。

## 阶段 6：Axure 与持续修改

`page-design` 可以先写入 Axure 供用户看页面，但不能声称需求说明完成。`final` 将已确认页面和说明写入同一个 RP。

持续修改必须复用同一 RP、page.key、widget.key、note.key 和 `axure-map.json`。不使用 Computer Use、剪贴板或键鼠模拟。写入后回读页面树、控件文字、坐标和 Group 数量，保存并检查 Axure 原生渲染；HTML 不能代替原生验收。

## 必要提问

每轮只问 1–3 个会改变页面树、主流程或高后果规则的问题。页面范围冲突、独立页面/页内模块分歧、重要页面无参考、权限、系统交接、保存、删除、付费、广告和成功判定必须询问。字号、间距、标准导航和团队模板排版无需提问。

## 阻断条件

以下情况不得称为完整交付：

- 没有产品功能框架却自行生成完整页面树；
- 没有读取竞品截图却声称竞品对标；
- 页面清单未确认就生成正式页面；
- 页面画面未确认就生成完整需求说明；
- 竞品规则被写成当前产品规则；
- 页面关键业务大部分依赖 assumption；
- 功能框架被画成 Product Overview；
- 页面仅由通用卡片和占位符构成；
- 只验证 HTML，没有检查 Axure 原生渲染与可编辑性。

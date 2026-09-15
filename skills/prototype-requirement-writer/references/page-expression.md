# 需求事实到页面表达

先读 input-contract.md；存在缺口时按 clarification.md 提问。下面是内部文件，不要求用户编写。可执行结构定义位于完整包 bridge/planning.mjs；通用完整正例见 `examples/reference/review-template-library/`。

制作页面前按 reference-library-routing.md 生成项目 `reference-selection.md`。它记录参考选择和借用边界，不替代 requirements-model 的来源状态：参考启发的低风险业务模块必须另建 assumption 来源和 requirement；纯布局/密度借用不伪装成 confirmed 业务规则。

## requirements-model.json

新建和继续维护的任务使用 version 2；version 1 只用于旧项目兼容。version 2 不改变稳定 id/key，而是增加参考、假设和说明质量门禁。

- version: 2。旧项目可读 version 1，但会收到 legacy quality gate warning。
- sources: [{id, kind, locator, read}]。kind 为 user / baseline / reference / assumption。locator 指向项目文件和可定位段落；read=true 仅表示 Agent 实际读取，不代表脚本验证了来源真伪。
- requirements: [{id, sourceIds, status, inScope, pageKey, module, statement, display, trigger, result, boundaries, exactCopies}]。
- status: confirmed / assumption / unresolved / reference。confirmed 至少有一条已读取的 user 或 baseline 来源；竞品参考不能直接升级为事实。
- boundaries 是有依据的规则数组，不是要求填满所有失败状态。未确定部分登记问题。
- exactCopies: [{text, target:{pageKey,kind,key,field,line?}}]。kind=widget 时 field=text；kind=note 时 field=title 或 line，line 为从 0 开始的行号。逐字保留，不 trim、不改标点、不统一换行。
- questions: [{id, question, why, blocking, affectedRequirementIds, status, answer?, answerSourceId?, reason?}]。status=open / answered / deferred；规则见 clarification.md。

### 1.8.0 质量字段

- context 必填 `{productKey,platform,baselineSourceId?,taskType,decisionMode,inputCompleteness}`。taskType=full-product/single-page/iteration/bugfix/faithful-rebuild；decisionMode=source-led/guided-concept/explicit-fiction；inputCompleteness=minimal/partial/detailed。
- 每条 requirement 必填 `criticality=low/medium/high`、`category` 和 `visualChange`。category 区分 display/navigation/input/state/permission/system-handoff/data-write/destructive/monetization/shared-rule/art。
- high 需求不能使用 assumption。完整产品输入不足且 assumption 不少于 4 条并超过一半时，complete 会被阻止；先提问或缩小为 proposal。
- visualChange=true 表示状态会改变结构、操作或系统上下文，必须使用 static-board 表达，不能只写 notes。

## page-plan.json

### 1.5.0 模型扩展（version 仍为 1，兼容旧单页格式）

- context 可选 `{productKey,platform,baselineSourceId}`；多版本/产品素材必须填写，并按 source-review.md 识别有效范围。
- sources 可增加 identity `{productKey,platform,version}`、relation `{type,sourceId,scope}` 和 block `{page,objectId?,role,status,quote?,x?,y?}`。type=inherits/replaces/rolls-back-to；role=requirement/change/reference/research/placeholder/old；status=current/tentative/superseded。关联须同产品同平台、目标存在且无环；这不是自动版本合并器。
- requirements 可增加 applicablePageKeys（完整受影响功能页列表，须包含主 pageKey）。不填时只关联 pageKey。共享规则一个稳定 id，按页面引用，不复制为冲突规则。
- ruleState=current/replaced/withdrawn；历史规则保留但不纳入本次计划。ruleType=behavior/display；新任务逐条声明，行为必须有 notes，纯展示才允许 widget-only。
- fieldSources=`[{field,sourceIds}]`：field=statement/display/trigger/result/boundaries/exactCopies。新任务为有内容且会影响行为或精确保留的字段登记来源，sourceIds 必须属于该需求 sourceIds；历史、竞品、待讨论不能成为 confirmed 字段的唯一依据。数组字段暂追踪到整组，需更细时拆需求或来源块，不声称字符级自动追踪。
- exactCopies 的 note 目标新增 `field:"cell",row,column`，0-based row 不含表头，用于 notes.table.rows 精确保留。
- plan.excludedImpacts=`[{requirementId,pageKey,reason}]`：受规则影响但当前用户没有要求绘制的页面，明确记原因。该页面不能出现在本轮 plan.pages；若已计划绘制，就必须表达相应共享规则。complete 指完整覆盖当前授权范围，不代表所有影响页面都已重画。当前范围内尚未完成仍必须 partial，不能用此字段隐藏遗漏。
- decorations.role 可用 note-container，和手机 frame 分开；仅用作非业务容器，实际说明仍放 notes。

- version: 2；delivery: complete / partial。version 1 仅用于旧项目兼容。
- framework-screenshot 增加 `stage:"page-design"|"final"`。page-design 只生成页面，final 才生成需求说明；旧项目未填 stage 时按 final 兼容。
- framework-screenshot 增加 `gates.pageInventory` 和 `gates.pageVisual`。approved 必须指向已读的对应用户答复来源；page-design 要求页面清单已确认，final 还要求页面画面已确认。
- includedRequirementIds：本次实际表达的需求。complete 必须覆盖全部 inScope=true 的需求；partial 必须写 omissionReason 并在交付中披露遗漏。
- template: {profile:"default"|"house-review"|"android-review", reason}。新建原型默认 house-review；android-review 仅为既有项目兼容别名，default 保留旧项目排版，不自动迁移。
- referenceSelections: 每个功能页一条 `{pageKey,primarySourceId,pattern,mode,borrowedAspects,reason,prohibitedInheritances}`。主来源必须是已读取的 baseline/reference，不能指向 test-fixtures。framework-screenshot 使用 mode=competitor-abstraction，并填写实际低保真 abstraction。
- pages: [{key,name,pageType,frameworkSourceIds?,boards:[{key,purpose,stateType}]}]。pageType=screen/flow/overview/table/iteration；stateType=primary/alternate/exception/system-handoff。每个功能页保留自己的身份。静态状态画板属于 boards，不默认变成新页。frameworkSourceIds 指向决定该页范围的产品功能框架来源。
- expressions: [{requirementId,pageKey,boardKey,method,reason,widgetKeys,noteKeys}]。
  - method=widget-and-note：可见入口/行为，控件和说明都要有；
  - method=static-board：视觉显著变化且有必要比较，控件和说明都要有；
  - method=note-only：规则只需文字表达，不能附带新控件；
  - method=widget-only：纯展示信息，reason 说明为什么无需行为说明。
  - method=deferred-note：只允许 page-design，表示该规则将在页面确认后写说明；不能带 widgetKeys 或 noteKeys。
- decorations: [{pageKey,widgetKey,role,reason}]，role 为 frame / note-container / review-title / system-chrome / number-marker。只登记非业务装饰，不能把新增按钮伪装为装饰绕过需求来源。

## 表达判断

默认可见的信息和主要操作画在主画板。界面结构或可用操作明显变化、仅文字难以评审时才补静态画板。条件、跳转、保存时机和失败处理通常写进对应 notes。提到下游页面不等于授权绘制下游页面。画板标题是评审信息，不是 App UI。

每条已确认且在范围内的需求必须有表达去处，每个业务控件/说明必须能追溯到需求。映射证明“关联存在”，不证明语义正确；Agent 要对照原文检查按钮、触发条件、数值与结果。

生成 scene 前，按 writing-rules.md 和 reference-driven-quality.md 为每个功能页形成说明目录，再确定 noteKeys 和 titles。note key 保持稳定、可使用英文语义标识。页面生命周期标题与业务对象标题可以混合；关键不是标题形式，而是正文是否覆盖当前页面真实的 purpose/entry/trigger/result/cancel-return/failure/persistence/reentry/system-boundary/data-impact。多对象页面不能把所有规则压进一个泛化标题。

framework-screenshot 的 page-design 是例外：本阶段先完成页面结构，scene.pages[].notes 为空，不创建说明目录、蓝色编号或右侧说明控件。用户确认页面画面后进入 final，再根据实际页面模块生成说明目录，并把 widget-only/deferred-note 转为 widget-and-note、static-board 或 note-only。

单页计划还需做页面密度检查。`pages` 只有一个 Home 是合法的，但不代表该 Home 只能有一个 CTA。对照 `reference-selection.md`，确认主任务、当前状态/内容、直接相关的辅助入口、任务完成后的承接信息和必要导航均已逐项判断。最终极简时记录成立理由；否则在低风险范围内补 assumption，或对方向性缺口提问，不能用“范围只有一页”解释空白页面。

## 生成、检查、迭代

Agent 写好两个上游文件，再生成同目录源 scene.json。运行：
`node bridge/validate-plan.mjs --model <requirements-model.json> --plan <page-plan.json> [--spec <scene.json>]`
无 --spec 时检查问答与规划；有 --spec 时增加目标存在、原文、覆盖和样式检查。出现结构错误或关键阻塞先修复；不要改状态或排除需求来制造通过。

workflow.mjs 自动发现源 scene 同目录的这两个文件；也可用 --model / --plan 显式提供。缺一即拒绝。两者全无只保留旧 scene 技术兼容，报告 legacy-unchecked；本 skill 的新建/修改交付不得借此跳过规划。原旧项目迁移时先读取现有内容补齐模型，保留场景 key、RP 和 axure-map。

assumption 若用于输出，必须在 scene.assumptions 中逐字登记其 statement；不得把权益、费用、权限后果、数据写入/删除、系统返回和商业化等关键未知当低风险假设。reference/unresolved 不得在正式计划里作为已实现功能。问题影响被暂缓部分时，partial 可继续无关范围；完整交付前须解决。

迭代保留需求 id、页面/控件/说明 key，记录旧→新及沿用部分在 source-review.md。变更原文时同时更新 exactCopies，且要有本次用户来源，不能为了通过检查修改历史基线。

# 需求事实到页面表达

先读 input-contract.md；存在缺口时按 clarification.md 提问。下面是内部文件，不要求用户编写。可执行结构定义位于完整包 bridge/planning.mjs；完整正例见 examples/clarification-home/。

## requirements-model.json

- version: 1。
- sources: [{id, kind, locator, read}]。kind 为 user / baseline / reference / assumption。locator 指向项目文件和可定位段落；read=true 仅表示 Agent 实际读取，不代表脚本验证了来源真伪。
- requirements: [{id, sourceIds, status, inScope, pageKey, module, statement, display, trigger, result, boundaries, exactCopies}]。
- status: confirmed / assumption / unresolved / reference。confirmed 至少有一条已读取的 user 或 baseline 来源；竞品参考不能直接升级为事实。
- boundaries 是有依据的规则数组，不是要求填满所有失败状态。未确定部分登记问题。
- exactCopies: [{text, target:{pageKey,kind,key,field,line?}}]。kind=widget 时 field=text；kind=note 时 field=title 或 line，line 为从 0 开始的行号。逐字保留，不 trim、不改标点、不统一换行。
- questions: [{id, question, why, blocking, affectedRequirementIds, status, answer?, answerSourceId?, reason?}]。status=open / answered / deferred；规则见 clarification.md。

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

- version: 1；delivery: complete / partial。
- includedRequirementIds：本次实际表达的需求。complete 必须覆盖全部 inScope=true 的需求；partial 必须写 omissionReason 并在交付中披露遗漏。
- template: {profile:"default"|"house-review"|"android-review", reason}。新建原型默认 house-review；android-review 仅为既有项目兼容别名，default 保留旧项目排版，不自动迁移。
- pages: [{key,name,boards:[{key,purpose}]}]。每个功能页保留自己的身份。静态状态画板属于 boards，不默认变成新页。
- expressions: [{requirementId,pageKey,boardKey,method,reason,widgetKeys,noteKeys}]。
  - method=widget-and-note：可见入口/行为，控件和说明都要有；
  - method=static-board：视觉显著变化且有必要比较，控件和说明都要有；
  - method=note-only：规则只需文字表达，不能附带新控件；
  - method=widget-only：纯展示信息，reason 说明为什么无需行为说明。
- decorations: [{pageKey,widgetKey,role,reason}]，role 为 frame / note-container / review-title / system-chrome / number-marker。只登记非业务装饰，不能把新增按钮伪装为装饰绕过需求来源。

## 表达判断

默认可见的信息和主要操作画在主画板。界面结构或可用操作明显变化、仅文字难以评审时才补静态画板。条件、跳转、保存时机和失败处理通常写进对应 notes。提到下游页面不等于授权绘制下游页面。画板标题是评审信息，不是 App UI。

每条已确认且在范围内的需求必须有表达去处，每个业务控件/说明必须能追溯到需求。映射证明“关联存在”，不证明语义正确；Agent 要对照原文检查按钮、触发条件、数值与结果。

## 生成、检查、迭代

Agent 写好两个上游文件，再生成同目录源 scene.json。运行：
`node bridge/validate-plan.mjs --model <requirements-model.json> --plan <page-plan.json> [--spec <scene.json>]`
无 --spec 时检查问答与规划；有 --spec 时增加目标存在、原文、覆盖和样式检查。出现结构错误或关键阻塞先修复；不要改状态或排除需求来制造通过。

workflow.mjs 自动发现源 scene 同目录的这两个文件；也可用 --model / --plan 显式提供。缺一即拒绝。两者全无只保留旧 scene 技术兼容，报告 legacy-unchecked；本 skill 的新建/修改交付不得借此跳过规划。原旧项目迁移时先读取现有内容补齐模型，保留场景 key、RP 和 axure-map。

assumption 若用于输出，必须在 scene.assumptions 中逐字登记其 statement；不得把权益、费用、数据删除等关键未知当低风险假设。reference/unresolved 不得在正式计划里作为已实现功能。问题影响被暂缓部分时，partial 可继续无关范围；完整交付前须解决。

迭代保留需求 id、页面/控件/说明 key，记录旧→新及沿用部分在 source-review.md。变更原文时同时更新 exactCopies，且要有本次用户来源，不能为了通过检查修改历史基线。

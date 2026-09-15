# 页面数据与执行

framework-screenshot 使用两个 scene 阶段：

- `stage: "page-design"`：只包含页面控件，`pages[].notes` 为空；HTML 明确标识这是页面确认稿，requirements.md 只写“页面确认后生成需求说明”。可按需先写入 Axure 供页面评审。
- `stage: "final"`：页面画面获得用户确认后，补充 notes、coverage、蓝色编号和最终说明，再执行完整预览或 Axure 写入。

page-plan.stage 与 scene.stage 必须一致。page-design 不允许夹带需求说明；final 不允许使用 deferred-note。旧项目没有 stage 时按 final 兼容。

`bridge/planning.mjs` 校验需求、必要问答及表达映射；`bridge/scene.mjs` 校验场景。先读 page-expression.md，并遵守 `examples/README.md`：业务表达只参考 `examples/reference/`，且不能继承示例业务。Agent 负责理解需求，脚本不是 AI 模型，不会从一句话自动推断产品规则。

## 数据格式

```json
{
  "version": 2,
  "project": "示例产品",
  "brief": "本次目标及输入依据",
  "assumptions": [],
  "outOfScope": [],
  "pages": [{
    "key": "home", "name": "Home", "width": 390, "height": 780,
    "widgets": [{
      "key": "title", "shape": "Paragraph", "componentRole": "app-bar", "text": "My App",
      "x": 24, "y": 28, "width": 300, "height": 40,
      "fontSize": 18, "bold": true
    }],
    "notes": [{"key": "purpose", "title": "页面说明", "coverage": {"requirementIds": ["R001"], "aspects": ["purpose", "entry"]}, "lines": ["1、说明此页面解决什么问题。"]}]
  }]
}
```

页面坐标以左上角为零；同一页的多个静态状态画板可扩大 width/height 后横排或纵排。实际写入时整体偏移 40，widgets 顺序从底层到顶层。字体单位为 point，HTML 用 pt；位置和尺寸用 px。

完整包 1.2.0 起，notes 支持可选 x、y、width（坐标原点与 widgets 一致）。例如 `{ "key": "home-empty", "title": "Home · 空状态说明", "x": 430, "y": 60, "width": 500, "lines": ["1、……"] }`。这样同一个功能页可排列多组“图＋说明”，不必为状态新建 Axure 页。

不填时保持旧版规则：说明在整页 UI 右侧自动纵排。x/y 为 0 也有效；width 范围 200–2000。正文高度按列宽估算，编译拒绝说明之间重叠；它不会自动排版全部画板，也不保证字形完全一致，仍需可视检查。长标题/正文应拆成有意义的组，不用缩字号硬塞。混用定位与自动说明时，自动纵排从此前最高说明底部继续。

画板标题、蓝色编号、热点、美术交付提示使用普通 widgets（文本/矩形/椭圆）表达，不是动态交互。业务说明统一留在 notes，不能将说明只写成 UI widget 而导致 requirements.md 漏项。version 2 的业务 widgets 填写 control-pattern-library.md 定义的 `componentRole`；notes 填写 reference-driven-quality.md 定义的 `coverage`。这些字段用于质量核对，不直接显示为 UI。

当前 runner 新建的是普通页面，不支持自动创建页面树文件夹。基础控件直接写入页面根级，不创建 Axure Group、Layer 包裹或整页根 Frame；一次批量写入仍可对应一次原生 Undo。旧版 runner 留下的纯叶子 Group 仅在映射和成员完全匹配时自动拆组，混入其他控件或嵌套 Layer 时拒绝迁移。使用与本 skill 同包的 runner，不静默丢弃字段或调用旧版 runner。新 scene 使用 noteProfile=house-review；default 和 android-review 仅用于既有项目兼容，未指定仍保持旧输出。通用几何、说明字体与宽度见 house-review-profile.md；HTML 与 Axure 使用相同编译结果，真实字形/行距仍需核对。notes.kind 和 table 见 note-expression.md。

shape 原子类型仍为 `Rectangle / Paragraph / Ellipse`；按 control-pattern-library.md 组合为有语义的可编辑控件，不得把图像、列表、弹层和系统页面都退化为无上下文矩形。fill、textColor、borderColor 用 `#RRGGBB` 或 `#RRGGBBAA`；支持 fontFamily、fontSize、bold、borderWidth、cornerRadius。默认字体 Microsoft YaHei，白底、深灰字、灰边框。默认文本最大 4000 字符；较长说明分段，不能截断原稿。文字是纯文本，不执行 HTML。

key 用小写英文字母、数字、短横线，页面内唯一。显示文案可以任意语言。key 一旦写入就保留；同一 key 改文案/位置为更新，新 key 是新增。当前工具不支持移除、改 shape 或重命名已建 Axure 页面；遇到这些会在写入前拒绝，需另行明确制定修改方案。不能偷偷隐藏后宣称已删除。

## 命令

以下命令由 Agent 从完整包根目录运行，项目路径由 `.axure-workflow.json` 或用户给出。apply 前按 auto-start.md 自动调用 ensure-axure.ps1，读取其实际 sessionFile 替换下面的示例路径：

```powershell
node .\bridge\workflow.mjs preview --spec 'C:\AxureTrials\Project\scene.json' --out 'C:\AxureTrials\Project\output'
node .\bridge\workflow.mjs apply --spec 'C:\AxureProjects\Project\scene.json' --out 'C:\AxureProjects\Project\output' --session '.\bridge\sessions\default\session.json' --project 'C:\AxureProjects\Project\Prototype.rp'
```

preview 不连接 Axure。preview/apply 都自动读取源 scene 同目录的 requirements-model.json 与 page-plan.json，也支持 --model/--plan 指定。缺一或发现未决关键问题、遗漏、原文变更则在连接前拒绝。两者全无只为旧场景保留 legacy-unchecked 技术兼容，不能作为本 skill 的完整需求验证。规划结果在 planning-check.json；阻塞后旧预览可能仍在，必须以最新报告为准。

apply 包含 preview，并实际写入和保存目标 RP。脚本通过 SDK 启动随包 MCP；即使当前 Agent 对话没刷新 MCP 工具列表，也可以从命令运行，不需要 Computer Use。不要手写 HTTP 或读取并输出 token。

首次 apply 会新建 scene 中的普通页面，保留空白文件自带的 Page 1。更新时读取 `output/axure-map.json`，保留页面/控件 ID；不删除它来“重新开始”。工具会拒绝目标文件不符、映射缺失但出现同名页面、外部修改冲突和未核实的 pending 写入。

输出：

- `prototype.html`：离线 HTML 原型，左图右说明。
- `requirements.md`：按功能页组织的中文说明，直接来源于 notes。
- `brief.md`：目标、假设和范围外内容。
- `scene.json`：此次渲染使用的数据快照。
- `axure-map.json`：本机目标文件、页面和控件映射、并发指纹；不要分发。
- `axure-render/*.png`：Axure 原生整页渲染，直接基于页面根级独立控件。
- `verification.json`：机器校验结果，不能替代人或 Agent 的可视检查。
- `planning-check.json`：问答状态、需求覆盖、原文和目标映射检查及输入摘要哈希；不证明来源真实或语义已正确理解。
- `traceability.json`：规则/字段来源到具体页面控件和说明的追踪汇总。
- `history/<runId>/`：本轮输入快照、需求字段差异、结果与执行段耗时；保持项目私有，不是 RP 自动回滚或防篡改审计。完整边界见 revision-evidence.md。

每次 apply 先扫描所有已映射控件，检查是否仍与上次读取一致，再执行批次。批次上限 150 个控件；回读/写入都按批处理。不同页面串行，避免活动页面错位。用户在 Axure 手动编辑后会触发冲突；先读取对比并将用户编辑纳入 scene/映射，再继续，不能强行覆盖。

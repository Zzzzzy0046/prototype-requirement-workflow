# 需求到 Axure · 完整试用包 1.5.0

入口仍然是 **prototype-requirement-writer**。你提供自然语言需求、PRD 或参考图；skill 在内部整理输入，生成低保真原型和中文说明，再通过 MCP 写入 Axure。以后继续改同一个 RP。

```text
你的需求 / PRD / 参考图 / HTML
  → prototype-requirement-writer
  → 有来源的需求事实 + 必要提问与答复记录
  → 功能页/静态画板/控件/说明的表达映射
  → 选定模板 + 覆盖/原文/未决问题校验
  → 同一份 scene.json
  → HTML 原型 + 中文需求说明
  → MCP 创建 Axure 页面与可编辑控件
  → 回读校验 + 原生渲染 + 保存
  → 改需求后更新同一个 RP
```

默认左图右说明、海外英文 UI、中文需求说明；按功能组织页面。必要状态用静态画板和文字描述，不要求复杂交互。Printer 只是随包演示，换成自己的产品即可。

1.5.0 在 1.4.0 的需求事实、表达规划、必要提问和安卓说明样式基础上，增加产品/版本关系、条目与字段来源、一条共享规则多页表达、分类型说明与表格，以及每轮输入/修改/执行结果记录。只问会实质改变输出的缺口，优先每轮 1–3 个；已有答复不重复问。用户仍只需说自然语言。新字段需要本版 runner，旧单页数据兼容读取。

完整脱敏示例：examples/shared-rules/。运行 `node bridge/workflow.mjs preview --spec examples/shared-rules/scene.json --out <项目输出目录>`。该示例用虚构任务列表说明共享状态与回退，不含真实产品资料。表格通过矩形与文本编译为可编辑基础控件，不承诺原生 Table、富文本或新功能三版本 Axure 原生验收。

输出增加 traceability.json 和 history/，属于项目私有内容，不能重新打进同事通用包。脚本计时不是人工耗时，也不自动计算提效收益。当前包支持范围与真实验证见验证记录.md；旧任务中的版本结论不作为当前状态。

桥接沿用 1.3.0 的 Windows 三版本适配：11.0.0.4134、11.0.0.4137、11.0.0.4149。启动时自动选择对应桥接，不需要三套 skill。两个旧版不依赖 Axure 内置 MCP，仍通过随包自建 MCP 读写原生文档。三版历史验证不等于本版重新完成三版原生测试。

## 第一次使用

推荐直接把解压目录交给 Agent：让它读取 `skills/prototype-requirement-writer/SKILL.md`，给出需求和目标 RP 路径即可。skill 会自动调用 `ensure-axure.ps1` 检查依赖、连接与启动，不需要你手动运行脚本。已经安装旧 skill 时，明确让 Agent 使用本包并合并版本说明，保留已有自定义规则，不能继续从旧包加载桥接。

首次仍需在 Axure 新建并保存一个空白测试 RP。目标文件如果正被普通 Axure 打开，Agent 会提醒你先保存关闭，再自动接管；后续编辑实时写入同一窗口。Axure 关闭后再次调用会自动恢复。

下面保留手动初始化命令作为排错和独立测试入口，日常使用可跳过这些命令，由 Agent 完成。

需要 Windows、PowerShell 7（`pwsh`）、Node.js 20+、可执行本地脚本的 Agent，以及能正常打开 RP 的 Axure。支持精确构建 **11.0.0.4134 / 11.0.0.4137 / 11.0.0.4149**；其他构建仍拒绝写入，不承诺所有 RP11。Agent 模型使用同事自己的账号，本包不附 API key。首次 npm 依赖安装需要联网。

1. 解压完整 ZIP 到固定目录。全部文件一起保留。
2. 用 Axure 手动新建一个空白测试 RP，保存到自己新建的项目文件夹，例如 `C:\AxureTrials\MyProject\Prototype.rp`，然后关闭这份文件。这是当前仍需人工完成的初始化步骤。
3. 在解压目录打开 PowerShell 7，执行（替换成自己的路径）：

```powershell
.\开始完整工作流.ps1 -Workspace 'C:\AxureTrials\MyProject' -ProjectRp 'C:\AxureTrials\MyProject\Prototype.rp'
```

脚本安装锁定的 npm 依赖，将原入口 skill 安装到该项目 `.agents/skills/`，建立项目配置，再启动桥接和检查连接。自动识别 Axure 失败时增加 `-AxureExe '你的AxureRP11.exe完整路径'`。出现 PASS 后再进行 Axure 写入。

4. 在 Codex 打开该项目目录，把 `给Agent的开始提示词.md` 中的示例换成自己的需求发给 Agent。没有自动发现 skill 时，提示词也提供按文件直接读取的入口。
5. Agent 完成后查看 `output/prototype.html`、`output/requirements.md`、Axure 内的页面，以及 `output/axure-render/`。反馈或继续描述修改，沿用原 scene 和映射即可。

可选：添加 `-RegisterMcp` 将工具注册为 `axure-live-trial`，需要 Codex CLI。默认完整流程脚本已通过 SDK 调用随包 MCP，无须修改全局 MCP 设置。注册后现有对话可能需要刷新工具或重开对话。

只先试需求到 HTML，运行：

```powershell
.\开始完整工作流.ps1 -Workspace 'C:\AxureTrials\MyProject' -PreviewOnly
```

Axure 已关闭、下次继续时，在本包原目录运行：

```powershell
.\ensure-axure.ps1 -Workspace 'C:\AxureTrials\MyProject'
```

Axure 仍开着时不必再次启动，直接给 Agent 修改需求。

## 用随包例子检查链路

优先看新例子 `examples/clarification-home/`：虚构需求、必要问题、明确标注的模拟答复、需求模型、页面计划及 scene。先不启动 Axure即可检查：

```powershell
node .\bridge\validate-plan.mjs --model .\examples\clarification-home\requirements-model.json --plan .\examples\clarification-home\page-plan.json --spec .\examples\clarification-home\scene.json
node .\bridge\workflow.mjs preview --spec .\examples\clarification-home\scene.json --out 'C:\AxureTrials\ClarificationDemo\output'
node --test .\bridge\scene.test.mjs .\bridge\planning.test.mjs
```

规划文件和源 scene 同目录时自动加载。新需求交付必须保留规划文件；旧 scene 两份规划文件都不存在时仅作 legacy-unchecked 技术兼容，不代表通过需求检查。关键问题、遗漏或原文校验失败时先停止，不自动选答案、不删除规划文件绕过门禁。

本例是虚构的 Printer 两页演示，不是任何公司原稿。初始化并连接后，在包根目录运行：

```powershell
node .\bridge\workflow.mjs preview --spec .\examples\printer\scene.json --out 'C:\AxureTrials\MyProject\output'
node .\bridge\workflow.mjs apply --spec .\examples\printer\scene.json --out 'C:\AxureTrials\MyProject\output' --session .\bridge\sessions\trial\session.json --project 'C:\AxureTrials\MyProject\Prototype.rp'
```

日常由 Agent 根据你的需求生成 scene，用户不需要写 JSON。示例命令只是绕过 AI 设计阶段，便于区分“模型画得不对”与“Axure 连接故障”。

## 完整包含什么

| 文件 | 用途 |
| --- | --- |
| `skills/prototype-requirement-writer/SKILL.md` | 唯一工作流入口，沿用原 skill 名称 |
| `references/input-contract.md` | skill 内部输入整理与稳定提示词 |
| `references/clarification.md` | 必要提问的触发、问法、答复记录与局部继续 |
| `references/page-expression.md` | 需求模型、表达计划及可执行字段 |
| `references/android-template-profile.md` | 可选安卓评审格式及真实复用边界 |
| `references/writing-rules.md` | 页面组织、模块说明、静态状态、编号与美术交付规则 |
| `references/source-review.md` | 多版本、参考/预研/空模板甄别及迭代继承 |
| `references/conditional-rules.md` | 入口权限、文件/数据、趋势、商业化、推送与问答，按需选择 |
| `references/prd-standard.md` | 此前的 PRD 范式，按需读取 |
| `references/scene-and-execution.md` | 共用页面数据、写入、继续修改规则 |
| `bridge/workflow.mjs`、`scene.mjs` | HTML/说明生成、MCP 写入、映射更新与校验 |
| `bridge/planning.mjs`、`validate-plan.mjs` | 需求/问题/映射/原文校验，写入前门禁 |
| `examples/clarification-home/` | 完整虚构问答与表达示例，非实际产品规则 |
| `bridge/adapters/rp11-4134/`、`rp11-4137/`、`rp11-4149/` | 按版本自动选择的桥接 DLL |
| `bridge/src/` | 三版桥接对应 C# 源码；4134/4137 子目录为 .NET 8 |
| `examples/printer/` | 虚构需求、页面数据与可打开预览 |
| `examples/annotation-layout/` | 虚构 Home 双状态、同页分组说明的布局示例 |
| `开始完整工作流.ps1` | 安装、启动与连接自检 |
| `ensure-axure.ps1` | Agent 按需自动检查、复用连接、启动或恢复 |
| `三版本验证.md`、`compatibility-results.json`、`试用反馈.md` | 本版验证范围、机器摘要和反馈格式 |

## 能力边界

这是完整工作流的实验包，依赖 Agent 执行设计部分。自然语言转成产品方案的质量取决于输入和模型，不能仅凭脚本测试保证。

机器只校验已登记的事实、问题和映射，不能发现所有遗漏的问题，也不能鉴定 Agent 填写的来源是否真实、业务语义是否正确。结构通过后仍需对照原文与渲染图。HTML 不作为中间导入文件；它与 Axure 使用同一 scene。android-review 当前只重建基础控件及说明格式，不导入原库实例或精确富文本行距。

目前支持普通页面、可编辑矩形/文本/椭圆、文字/颜色/布局批量更新、新增页面与控件。任意 HTML/CSS、复杂图标或 `.rplib` 组件不是自动无损转换；有原稿需先读取核对。新建页面本身无桥接撤销；本版 runner 不做页面重命名、删除或修改已有控件类型。Axure 的字体渲染与 HTML 可能略有差异，需要检查原生渲染图。

同一 RP 不要同时开两个进程。出现空引用弹窗、faulted 或 pending 时先停止写入，反馈版本和最后操作。用户在 Axure 手动改动或撤销后，脚本会拒绝覆盖，需要 Agent 读取差异并协调。

三版本适配不等于任意新版 RP 都能向旧版兼容。每位同事优先用自己的目标版本新建空白 RP；跨版本交换已有复杂 RP 时先在副本中检查。旧版适配的验证范围是普通功能页与静态基础控件，不包含动态面板、复杂交互、任意组件库的无损导入或完整交互数据读取。

启动测试时请保持 Windows 桌面已解锁。若 Axure 自身报 `Requested Clipboard operation did not succeed`，先解锁并复制普通文字后再试；Agent 不应清空剪贴板或反复启动。原型写入通道本身不使用剪贴板。

只转发最初的完整 ZIP。使用后产生的 `sessions/`、`axure-map.json`、原始需求、RP 和截图留在自己电脑。包不附 Axure 安装软件、授权、私人模板和会话密钥。底层细节见 `bridge/README-先读我.md`；那份文件只介绍桥接组件，完整流程以本说明为准。

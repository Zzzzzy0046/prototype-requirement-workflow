# 直接发给 Agent

在项目目录中打开 Codex，替换下面的需求即可。未安装 skill 时，直接要求 Agent 读取完整包内的 `skills/prototype-requirement-writer/SKILL.md`：

```text
使用 $prototype-requirement-writer 完成需求到 Axure 的完整流程。
读取已安装的 skill 和当前项目配置；没有配置时使用我提供的目标 RP 路径。
请自动检查依赖、连接或启动 Axure，我不手动运行启动脚本。
目标 RP：填写自己已经新建并保存的测试 RP 完整路径（已有项目配置时不用再填）。

我的需求：做一个 Printer App 的 Home 和 Connect Printer 两个页面。
Home 提供连接打印机、Photos 和 Documents 入口；Connect Printer 展示可选设备和连接按钮。
英文 UI，右侧写中文需求说明。主页就是一个完整主页，必要状态用静态图和文字表达，不做复杂交互。
先整理有来源的需求和表达计划；影响页面范围、基线或关键行为的问题请集中问我，说明影响并给出有依据的建议。我的回答前不要默认选一个方案；不相关的明确部分可以继续，普通排版不用逐项问。不要重复问我已确认的内容。
完成原型和说明后写进项目配置指定的 RP，并核对原生渲染。
```

之后直接说：“把 Home 的 Documents 改成 Print Documents，并同步右侧说明和 Axure。”

你也可以贴自己的 PRD、附参考图或指定现有 HTML；不用填专业模板。skill 会内部规范化需求。

如果没有安装 skill：让 Agent 先读取“完整包解压目录/skills/prototype-requirement-writer/SKILL.md”，再提供项目目录与自己的需求。不要把 `session.json` 的内容粘贴到对话。

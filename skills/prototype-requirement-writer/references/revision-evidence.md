# 修订记录与验证证据

业务链：用户原文/有效资料 → requirements-model（事实与必要提问）→ page-plan（表达去处）→ scene（画面和说明）→ HTML/Markdown/Axure。引用存在不等于理解正确，三端同源不等于正文和 UI 自动语义一致。

## 每轮记录

1.5.0 preview/apply 在输出目录写入项目私有 `history/<runId>/inputs.json`、`start.json`、`result.json`。前两项在规划后记录；result 记录本轮实际结束状态。旧快照不被下一轮替换。inputs 保存模型、计划及可解析 scene；start 记录包版本、输入 hash、上一输入记录和需求字段变更，旧/新原文见两轮快照。

`previousInputRunId` 仅是上一输入，不代表上一轮成功写入的 RP 基线。`latest-input.txt` 不得用于替代 axure-map 或恢复目标 RP。无法解析的输入只保留能读取的部分，原始文件仍须项目保存。

状态：planning-blocked / preview-only / axure-written / failed-before-write / apply-failed-or-unknown。进程被杀可能只有 start 无 result，表示结果未定，不能视为成功；核对 verification 和 pending 及真实 Axure。非跨页事务，不自动回滚；不要把这些记录宣传为防篡改审计或双向同步。

`traceability.json` 将需求、来源、字段来源、页面/说明表达和范围外影响汇总，便于评审反查。confirmed 和 read 是 Agent 根据实际材料填写，程序不验证来源真实性；未提供 fieldSources 的旧模型不具备字段级追踪。

业务提出者、确认者和真实答复来自 source/问题记录，runner 不猜是谁批准。Agent 需要用来源定位支持“为什么改”，结构差异本身只能证明“改了哪些字段”。

## 技术验证和产品验收分开

- 规划检查：覆盖、来源引用、未决问题、原文和目标映射。
- 脚本输出：HTML/Markdown 已生成，不等于 RP 已写入。
- 原生结果：写入、回读、保存和渲染分开报告。新编译功能通过测试，不等于三个 Axure 构建都重测过。
- 语义/视觉：核对产品含义、UI 与说明一致、实际字体排版。未检查保持 required，不改成 passed。
- 最新版本：读取当前真实安装/包绑定和验证文件，旧任务总结是历史证据。

历史、traceability、原始需求、项目 RP、会话、映射和业务指标均属于项目数据，不进入提交包。提交物只保留脱敏合成示例；不得虚构验证结果或把未完成检查标记为通过。

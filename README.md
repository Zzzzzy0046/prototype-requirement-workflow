# 需求到原型 · Axure 完整工作流

将自然语言、PRD、参考图或已有原型整理为有来源的需求、页面表达计划和同源交付物：HTML 预览、中文需求说明、Axure 可编辑基础控件。

当前工作版本：**1.9.0（实验工作流）**。本仓库不包含其他工作台项目的代码或 Git 历史。旧 ZIP 保留，未覆盖。1.9.0 新增 `framework-screenshot`：产品功能框架决定页面分布，用户手动上传的竞品截图先抽象为低保真结构并决定页面表达；必须先确认页面清单，再只生成页面，页面画面确认后才生成完整需求说明。

## 使用

- 同事试用：下载 [1.9.0 完整 ZIP](dist/prototype-requirement-workflow-1.9.0.zip)，交给可以执行本地脚本的 Agent，按 [完整说明](README-完整工作流.md) 操作。正式新品建议同时提供产品功能框架和手动上传的竞品截图；Skill 先确认页面清单和页面画面，再生成需求说明。
- Skill 入口：[prototype-requirement-writer](skills/prototype-requirement-writer/SKILL.md)。已安装后可用 `$prototype-requirement-writer` 调用。
- Agent 负责常规依赖检查及启动脚本；首次仍需使用目标 Axure 新建并保存空白 RP。包不含 Axure 软件、授权或模型账号。
- 只要文字/HTML 时不启动 Axure；要求完整流程时才连接、写入、回读和原生渲染。

当前依赖 Windows、PowerShell 7、Node.js 20+；桥接仅适配 Axure 11.0.0.4134、4137、4149。不是所有 Axure 11，也不支持 Axure 9 写入。详见 [历史三版本验证](三版本验证.md)。

## 信息流

```text
产品功能框架 → 功能树与页面清单
竞品截图 → 低保真页面表达抽象
  → 页面与参考匹配
  → 用户确认页面清单
  → page-design：先生成页面
  → 用户确认页面画面
  → final：再生成中文需求说明
  → HTML / Axure 原生控件
  → 回读、保存、原生渲染与持续修改
```

1.5.0 新增字段来源、共享需求多页映射、说明块类型与基础表格、项目私有修订快照。默认静态原型，不默认做复杂交互或动态面板。

## 修改记录与下一步

- [本次对话修改与决策记录](docs/CONVERSATION-CHANGELOG.md)：按阶段整理已实现、历史验证和未实现讨论。
- [模糊输入引导：实施进度](docs/NEXT-STEPS.md)：用户不必一次提供完整需求；已加入主动收敛指引，行为验证与剩余边界分开记录。
- [各版本验证记录](验证记录.md)：历史结果与本版边界。
- [本次上传与文件范围](docs/PUBLICATION.md)：来源、完整性、隐私与复测方式。

## 测试与边界

```powershell
Set-Location bridge
npm ci --ignore-scripts --no-audit --no-fund
Set-Location ..
node --test bridge/scene.test.mjs bridge/planning.test.mjs bridge/evolution.test.mjs
node bridge/workflow.mjs preview --spec examples/reference/shared-rules/scene.json --out output/shared-rules
```

1.5.0 已通过 52 项自动测试与干净目录安装/预览检查；新增说明框和表格尚未完成三版本 Axure 原生验收，HTML 目视检查未完成。自动测试不能证明需求理解或视觉质量正确。

1.6.0 复跑原 52 项测试通过，并使用三个独立 Agent 完成六轮合成输入的引导/生成/修改检查。方法与边界见 [主动收敛行为试跑](docs/INTAKE-EVALUATION.md)，不是同事独立设备或大样本统计验证。

1.7.0 只读盘点 32 个用户 RP，新增跨产品 `house-review` 和六类模板；当前 53 项自动测试通过，模板规划无警告，六页 HTML 预览已生成。详细证据与取舍见 [RP 规范盘点](docs/RP-STANDARD-STUDY.md)。Axure 原生写入仍需目标实例独占启动，不能用 HTML 结果冒充 RP 已写入。

1.7.1 将通用规则分成“硬骨架 / 可选表达 / 产品专属”三层；新增业务说明目录和跨产品残留检查，移除内部提示词的 Printer 默认入口。当前同一 RP 的 10 页模板已通过原生增量更新、回读和渲染；底层 Axure 版本范围未扩大。

1.7.4 的参考选择层默认先使用包内 RP 派生模式库：一个主模式、最多两个辅模式；如本轮另有用户提供材料或已连接 Mobbin，再作为更具体的补充。`只做 Home` 不再自动降成标题加单 CTA，模式库也不会把订阅、广告、权限或其他业务模块全量套入页面。

1.7.5 增加 [Examples 使用边界](examples/README.md)：`examples/reference/` 只用于学习结构和表达，`examples/test-fixtures/` 只用于自动测试与兼容回归。真实需求禁止从 test fixtures 继承页面、文案或业务规则；旧 Printer 只保留为 legacy fixture。

1.8.1 在 1.8.0 的参考驱动质量标准上增加 [实际 RP 页面直接复刻](skills/prototype-requirement-writer/references/direct-rp-replication.md)。新任务可在 `page-plan.json.referenceSelections` 中声明 `direct-rp-replica`、源页面证据和至少四项复刻维度；旧 version 1 继续可读，但会明确提示未经过新质量门禁。

1.9.0 增加 [竞品截图与功能框架驱动工作流规范](docs/竞品截图与功能框架驱动工作流规范.md) 和 [Skill 执行规则](skills/prototype-requirement-writer/references/framework-screenshot-workflow.md)。Bridge 识别 `page-design`/`final` 两阶段、两道用户确认门、产品框架来源映射和竞品截图低保真抽象；缺少必要输入或确认时会在连接 Axure 前阻断。

这是非官方本地实验桥接，不是 Axure 官方写入 API。原生编辑非跨页事务；外部修改/未知 pending 会阻止继续。自动反向同步、初始空白 RP 自动创建、页面删除/重命名、复杂控件和任意 HTML 无损转换均不在当前保证范围。

## 数据与分发

只发送未运行的 ZIP。原始 RP、私人素材、需求、扫描结果、会话/令牌、映射、运行历史、真实业务指标不纳入仓库。合成示例不代表真实用户决策。私有仓库不等于可以忽略数据检查。

`SHA256SUMS.txt` 对应当前 1.9.0 包内内容，不含仓库额外 README、对话记录及 ZIP；旧版本清单仍在各自 ZIP 内。各 ZIP 校验见 [dist/RELEASES.md](dist/RELEASES.md)。

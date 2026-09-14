# 需求到原型 · Axure 完整工作流

将自然语言、PRD、参考图或已有原型整理为有来源的需求、页面表达计划和同源交付物：HTML 预览、中文需求说明、Axure 可编辑基础控件。

当前工作版本：**1.6.0（实验工作流）**。本仓库不包含其他工作台项目的代码或 Git 历史。1.5.0 原始 ZIP 保留，未覆盖。1.6.0 主要改进模糊需求的主动收敛，不扩大 Axure 能力范围。

## 使用

- 同事试用：下载 [1.6.0 完整 ZIP](dist/prototype-requirement-workflow-1.6.0.zip)，交给可以执行本地脚本的 Agent，按 [完整说明](README-完整工作流.md) 操作。已安装后一句话描述需求即可，不必复制长模板。
- Skill 入口：[prototype-requirement-writer](skills/prototype-requirement-writer/SKILL.md)。已安装后可用 `$prototype-requirement-writer` 调用。
- Agent 负责常规依赖检查及启动脚本；首次仍需使用目标 Axure 新建并保存空白 RP。包不含 Axure 软件、授权或模型账号。
- 只要文字/HTML 时不启动 Axure；要求完整流程时才连接、写入、回读和原生渲染。

当前依赖 Windows、PowerShell 7、Node.js 20+；桥接仅适配 Axure 11.0.0.4134、4137、4149。不是所有 Axure 11，也不支持 Axure 9 写入。详见 [历史三版本验证](三版本验证.md)。

## 信息流

```text
需求与参考资料
  → 来源/产品/版本判断与必要提问
  → requirements-model.json
  → page-plan.json
  → scene.json
  → HTML / 中文说明 / Axure 原生控件
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
node bridge/workflow.mjs preview --spec examples/shared-rules/scene.json --out output/shared-rules
```

1.5.0 已通过 52 项自动测试与干净目录安装/预览检查；新增说明框和表格尚未完成三版本 Axure 原生验收，HTML 目视检查未完成。自动测试不能证明需求理解或视觉质量正确。

1.6.0 复跑原 52 项测试通过，并使用三个独立 Agent 完成六轮合成输入的引导/生成/修改检查。方法与边界见 [主动收敛行为试跑](docs/INTAKE-EVALUATION.md)，不是同事独立设备或大样本统计验证。

这是非官方本地实验桥接，不是 Axure 官方写入 API。原生编辑非跨页事务；外部修改/未知 pending 会阻止继续。自动反向同步、初始空白 RP 自动创建、页面删除/重命名、复杂控件和任意 HTML 无损转换均不在当前保证范围。

## 数据与分发

只发送未运行的 ZIP。原始 RP、私人素材、需求、扫描结果、会话/令牌、映射、运行历史、真实业务指标不纳入仓库。合成示例不代表真实用户决策。私有仓库不等于可以忽略数据检查。

`SHA256SUMS.txt` 对应当前 1.6.0 包内内容，不含仓库额外 README、对话记录及 ZIP；旧 1.5.0 清单仍在旧 ZIP 内。各 ZIP 校验见 [dist/RELEASES.md](dist/RELEASES.md)。

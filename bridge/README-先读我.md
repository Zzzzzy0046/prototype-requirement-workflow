# Axure Agent Bridge · 同事试用包 0.3.1

这是 Windows 本地实验版 MCP 桥接，不是 Axure 官方插件。已在 Axure **11.0.0.4134 / 11.0.0.4137 / 11.0.0.4149** 验证新建普通页面、创建/修改原生基础控件、撤销重做、原生渲染、保存重开。其他 RP11 构建、RP9/RP10、macOS 不在当前支持范围。4134/4137 使用自建原生读取层，不依赖官方 MCP；复杂交互/动态面板不在旧版适配范围。

## 先决条件

- 合法安装并能正常运行 Axure RP 11.0.0.4134、11.0.0.4137 或 11.0.0.4149。不要为试用卸载当前 Axure 或绕过公司软件策略；版本不符先反馈。启动时保持桌面解锁。
- Node.js 20+、PowerShell **7**（命令 `pwsh`，不是 Windows 自带的 PowerShell 5）。
- 支持本地 stdio MCP 的 Agent；下面按已安装 Codex CLI、`codex` 命令可用的环境演示。
- 这是将自编译 .NET 启动钩子载入自己启动的 Axure 进程。安装文件不改动，但公司终端策略可能拦截；不要关闭安全软件或用管理员权限绕过。

## 第一次试用

1. 将整个 ZIP 解压到固定的本地目录。不要在压缩包里运行，也不要随意移动已建立会话的目录。
2. 在 Axure 手动新建一个空白 RP，另存为 `Agent-Test.rp`，然后关闭这份文件。**不要用唯一原稿，也不要把同一 RP 同时开在两个进程里。** 本包不包含个人原稿、Axure 安装包或授权。
3. 在解压目录打开 PowerShell 7，运行：

```powershell
node --version
pwsh --version
codex --version
npm ci --ignore-scripts
```

依赖从 npm 公共仓库安装，锁定版本；该步骤不上传 RP。AI 服务本身仍可能按你的 Agent 配置接收页面文字/截图，首次只用虚构数据。

4. 用你自己的完整路径启动。脚本会尝试从注册表识别已验证的 Axure：

```powershell
.\试用启动.ps1 -ProjectRp 'C:\AxureTrials\Agent-Test.rp' -RegisterMcp
```

识别失败时明确提供安装路径：

```powershell
.\试用启动.ps1 -ProjectRp 'C:\AxureTrials\Agent-Test.rp' -AxureExe 'C:\Program Files\Axure\Axure RP 11\AxureRP11.exe' -RegisterMcp
```

示例路径需要替换。`-RegisterMcp` 会创建/更新名为 `axure-live-trial` 的 Codex MCP 配置，不覆盖其他名字的服务器。若已有同名配置，先确认它就是本试用服务。

5. 等 Axure 正常打开目标文件，在同一目录运行只读自检：

```powershell
node verify-connection.mjs --session .\sessions\trial\session.json
```

必须返回 PASS。自检会短暂重试只读状态，等待 Axure 初始化，不会重试写操作。若连接失败，不继续绘制。配置后按 Agent 客户端需要刷新 MCP 或新开对话，再检查工具可见；注册成功不等于当前对话已加载。

6. 把 `给Agent的试用提示词.md` 发给 Agent，按提示完成一次新建页面和保存测试。

## 以后继续同一个文件

Axure 关闭后，在原解压目录执行：

```powershell
.\试用启动.ps1 -ProjectRp 'C:\AxureTrials\Agent-Test.rp' -Resume
```

关闭前先显式保存，再正常退出 Axure；不要强杀。启动会轮换本地密钥，已连接的 MCP 客户端可能需要重新连接。创建另一会话用不同 `-SessionName` 和空闲 `-Port`，但初次试用只保留一个。

## 能力与边界

- 自动创建根级普通页面并打开；页面内创建矩形、文本、椭圆，修改位置/大小/颜色/字体；已有合适模板时可克隆图形和图片。新建及克隆的基础控件直接写入页面根级，默认不创建 Axure Group/Layer，每个控件都可单独选择和编辑。
- 旧版桥接生成且映射仍完整的纯叶子 Group 会在后续 apply 时安全迁移为独立控件；混入非映射控件、嵌套 Layer 或叶子缺失时拒绝自动拆组。
- 控件修改支持原生撤销/重做；**新建页面本身没有桥接撤销**，不测试删除或批量破坏性操作。
- dryRun 默认开启；实际写入使用唯一 requestId；相同请求重试复用同一 ID。防重只在当前 Axure 进程内有效，跨重启必须先读页面树。
- 不自动支持复杂交互、任意组件、动态面板、任意 HTML 的精确还原、跨版本文件降级。
- 本包是执行桥接 + 使用说明，不包含完整 PRD/产品设计 Skill。自然语言到合格产品方案仍由 Agent 和你的需求依据决定。

## 报错处理

出现空引用/恢复弹窗时停止操作，不反复点保存，不盲重试写入。截图报错及文档标题，反馈 Axure 版本和最后一步操作。DOCUMENT_NOT_READY 表示文件未正常加载；faulted 表示会话已拒绝继续写入，不代表已自动回滚。

不要转发 `sessions/`、`session.json`、带公司数据的 RP、完整全局配置或未脱敏日志。本地 session.json 包含控制进程的密钥。

退出试用：正常保存关闭测试 Axure，执行 `codex mcp remove axure-live-trial`。保留自己的 RP；无需卸载 Axure。

## 包内内容

`adapters/rp11-4134/`、`adapters/rp11-4137/`、`adapters/rp11-4149/` 为按精确版本选择的桥接 DLL；`mcp-live.mjs` 为 MCP 服务；`试用启动.ps1` 为桥接启动入口；`start-project.ps1` / `resume-live.ps1` / `compatibility.ps1` 为底层启动与版本检查；包根目录的 `SHA256SUMS.txt` 为文件校验清单。完整需求工作流以包根 README 和 skill 为入口。没有附带源码、测试文件、现有会话密钥或私人原稿。

本地桥接无新增云服务器成本，Agent 用量仍按你的账号计费。验收范围为本机测试，不能把它视为所有同事环境都已通过。

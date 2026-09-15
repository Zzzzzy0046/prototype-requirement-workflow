# 自动连接与启动

用户要求 Axure 输出或完整流程，就包含执行本包常规启动步骤的授权。Agent 自动检查和调用，不要求用户复制命令，也不在每一步询问是否继续。仅文字或 HTML 输出不启动 Axure。

## 标准操作

从当前项目 `.axure-workflow.json` 或本机 `local-runtime.md` 定位完整包；直接从解压包调用 skill 时，可沿 skill 目录向上定位根目录。然后使用 PowerShell 7 执行：

若项目配置指向旧包且缺少 ensure-axure.ps1，使用当前安装 skill 对应的新包执行 helper。保留既有 projectRp、sessionFile 和 outputDirectory；helper 验证后更新 bundleRoot，不新建一份 RP 或丢弃映射。

```powershell
& '<完整包目录>/ensure-axure.ps1' -Workspace '<当前项目绝对路径>'
```

尚未绑定项目时，从用户明确给出的目标路径补充 `-ProjectRp '<目标RP绝对路径>'`。安装路径自动识别失败时，可用已核实的本机路径补充 `-AxureExe`。不能猜测使用历史测试文件。如果用户尚未给出目标，继续生成本地原型，同时简洁询问要写入哪份 RP。

助手自己执行命令；上面的代码是操作协议，不是交给用户手动执行的流程。

## 返回与分支

| 返回 / 错误 | Agent 后续动作 |
| --- | --- |
| ready=true, action=reused | 原连接可用；直接继续，不再次启动 |
| ready=true, action=started | 新桥接进程就绪；继续绘制 |
| ready=true, action=resumed | 原 RP 已恢复；沿用原控件映射继续 |
| PROJECT_REQUIRED / 路径不存在 | 要求提供目标 RP；首次仍需用户新建并保存空白 RP |
| PROJECT_OPEN / PROJECT_BUSY | 提醒用户保存关闭指定 RP，再由 Agent 重试；不关闭或杀死用户进程 |
| SESSION_UNRESPONSIVE / STARTUP_NOT_READY | 检查现有进程与错误；停止重复启动，不能通过换端口再开同一 RP |
| BRIDGE_ERROR / BRIDGE_FAULTED | 停止写入并报告实际问题；不得清除 faulted 或 pending |
| 版本不支持 / 缺 Node 或 PowerShell | 报告缺少的依赖，不自行绕过版本限制或修改系统策略 |

helper 缺 npm 依赖时才安装锁定依赖。已连接的重复调用不会重装依赖或重开 Axure。新会话存放当前项目 `.axure-session/`，自动选择空闲端口；既有项目沿用原 sessionFile。只输出状态与路径，不输出 token。

就绪后重新读取 `.axure-workflow.json`，将其中 sessionFile、projectRp、outputDirectory 交给 workflow.mjs apply。不要硬编码 `bridge/sessions/default/session.json`，也不要仅因为启动进程成功就认为已连接。当前流程使用包内 MCP SDK，不要求先注册全局 MCP。

自动启动是 Agent 执行的按需步骤，不是后台服务或开机启动项。每次 Axure 写入前运行一次即可；操作中途连接断开时不要盲重放写入，先核实结果。

1.3.0 支持 Windows 11.0.0.4134 / 4137 / 4149。版本号由安装程序文件与运行中桥接共同检查，适配器在 `bridge/adapters/`，不要删除版本检查或混用 DLL。旧版不需要启用官方 MCP 设置。

若 Axure 启动时弹出剪贴板读取错误，停止重复启动，请用户解锁桌面并复制普通文字后再检查；不清空用户剪贴板，不把失败的启动当作 ready。此错误来自 Axure 自身启动逻辑，不代表本工作流用剪贴板写入。

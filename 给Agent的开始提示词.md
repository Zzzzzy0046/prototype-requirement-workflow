# 直接说需求即可

已经安装 Skill 时，不需要复制运行协议、填写表格或准备完整 PRD。下面任选一句，换成你的产品即可：

```text
使用 $prototype-requirement-writer，帮我做一个 Printer 主页。
```

```text
使用 $prototype-requirement-writer，按我附的需求文档做原型和中文说明。
```

```text
继续修改这个项目，把 Documents 改成 Print Documents，其他不动。
```

Skill 会先读已有资料：信息足够就做；缺关键业务时给简短推荐并问你；普通排版自行处理。你不必提前知道页面/状态如何拆分，也不用告诉它怎样启动脚本。

想先看效果，可以说“先给 HTML 预览，不写 Axure”；想试一个虚构案例，可以说“你决定，做个示例让我看看”。示例假设不会冒充正式业务要求。

需要 Axure 时再说“把确认后的内容写进这个 RP”并提供路径；已有项目绑定则沿用。首次仍需你用受支持的 Axure 新建并保存空白 RP，Agent 在需要时提醒，不要求一开始就提供。目标文件被普通窗口占用时，先保存关闭，再让 Agent 连接。未写入时它应明确告诉你。

未安装时，将完整包解压目录交给 Agent：

```text
读取这个包里的 skills/prototype-requirement-writer/SKILL.md，
按它处理我接下来提供的需求；需要安装或连接时由你执行常规步骤。
```

不要粘贴 session.json、token 或账户凭证；不要把自己使用后产生的目录再打包给同事。环境条件和边界见 README-完整工作流.md。

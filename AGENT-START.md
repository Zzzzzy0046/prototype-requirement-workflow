# 调用入口

已经安装 Skill 时，直接描述产品和范围，不需要复制运行协议、填写 JSON 或提前准备完整 PRD：

```text
使用 $prototype-requirement-writer，帮我做一个文件扫描工具的 Home。
```

```text
使用 $prototype-requirement-writer，按我附的产品功能框架和竞品截图做原型和中文说明。先输出页面清单，不要开始画。
```

```text
继续修改这个项目，把 Recent Files 改成 Recent Documents，其他不动。
```

Skill 会先读取已有资料：信息足够则直接推进；缺少会改变页面清单或关键业务规则的信息时，给出简短建议并提问；普通排版由 Agent 自行处理。

只需要 HTML 时，可以说“先生成 HTML 预览，不写 Axure”。需要 Axure 时，说“把确认后的内容写进这个 RP”并提供路径；已有项目绑定则沿用同一个 RP。首次仍需用受支持的 Axure 版本新建并保存空白 RP，目标文件被普通窗口占用时先保存关闭。

尚未安装时，让 Agent 读取解压目录：

```text
读取这个包里的 skills/prototype-requirement-writer/SKILL.md，
按它处理我接下来提供的需求；需要安装或连接时由你执行常规步骤。
```

不要提供 session.json、token 或账户凭证。运行后产生的 sessions、history、output、项目映射、RP 和截图不得写回提交包。环境条件和能力边界见 `README-完整工作流.md`。


# 用户 RP 到通用评审规范：只读盘点

日期：2026-09-15。范围：用户明确提供的 Find-Phone、新品 Doc Reader、新品 Printer、iOS Heart Rate 和“素材”五组目录。

## 覆盖与证据

- 共 32 个 `.rp`：29 个 RP9、3 个 RP11。
- 原文件逐个计算 SHA-256，解析结束后再次核对，未修改源文件。
- 共识别 267 个页面记录，其中 201 个页面完成控件结构化解析；其余页面只保留字符串表和缩略图证据，不把解析失败当作空白。
- 结构化页面累计约 3.7 万个控件。另对 Printer、Doc Reader、Heart Rate、Clap、Airtag、Translator、Widget 和 Android 初稿 8 个代表文件提取字体、样式来源、几何与 Layer/Table 结构。
- 提取了全部可用页面缩略图，并目视核对了 Printer Home、Doc Reader 启动流程、Heart Rate Home、Find Phone 引导/配置、Widget Home 等代表页。缩略图不是完整分辨率视觉验收。
- 扫描报告、缩略图、原文和路径保留在本机私有研究目录，不进入 Git 或同事分发包。

## 稳定共性

1. `360×640` 是最常见的移动画板组合；长内容存在 360×724、783、830 等高度，说明宽度稳定、高度按内容延展比强制裁切更符合原稿。
2. 代表样本最常见字体组合为 Arial 9.75pt 正文、10.5pt 标题/正文、13.5pt 加粗评审标题；需求说明标题稳定为 10.5pt Bold，正文常用 9pt。
3. 画板右侧说明起点相对最后一个 360px 画板的众数间距为 83px；现有安卓模板记录同样使用“编号起点 +45px、说明再 +38px”。
4. 页面框常见来源是 `需求常用库 1 / Box 1` 或 `需求常用库 / Box 1`；标题、正文、Primary Button、Image、Ellipse、Marker、Table/TableCell 和 Layer 在多产品重复出现。
5. 页面组织方式稳定为“框外页面/状态标题 + 页面效果 + 编号 + 右侧需求说明”。状态通常在同一功能页并列；说明按真实模块使用页面说明、页面进入、交互说明、页面状态、异常与边界。
6. 美术交付标题和研发/运营备注位于 App 框外；它们是交付注释，不是 App UI。`需要美术出图 * N` 不能成为所有页面默认占位。

## 转成规范时的取舍

- 新增跨产品 `house-review`，不再把通用评审格式命名为 Android；`android-review` 保留为旧项目兼容别名。
- 新建原型使用 360px 宽、白底、`#797979` 直角框，Arial 13.5pt Bold 框外标题；说明编号在最后画板右侧 45px，说明文本在右侧 83px；标题 10.5pt Bold、正文 9pt、默认宽 322px。
- 同组多状态画板间距 32px；长页允许增加高度。普通说明保持窄列，共享规则表格可增宽。
- 需求概览、单页、多状态、流程、局部迭代/Bugfix、共享规则共用视觉骨架，但采用不同信息结构。
- 库名和 MatchInfo 仅作为来源证据；当前 live bridge 以可编辑基础控件重建，未直接捕获的 Master、复杂 Layer、图片或矢量资源不宣称无损复用。

## 未进入通用规范的内容

各产品的订阅价格、广告频率和 SDK、权限申请顺序、健康阈值、竞品链接、内部人员/排期、埋点 ID、具体 UI 文案和图片资产均被排除。它们只能作为对应产品的需求，不是模板默认值。

可执行规则见 `skills/prototype-requirement-writer/references/house-review-profile.md`；六类模板见 `examples/reference/review-template-library/`。

# Examples 使用边界

`examples` 用于演示数据结构和页面表达，不是产品功能模板。生成真实需求时，先使用当前需求、有效基线和 `skills/prototype-requirement-writer/references/rp-pattern-library.md`；不能因为某个示例字段更完整，就复制其产品名、按钮、状态或业务规则。

## reference：允许参考表达方式

只允许借用文件结构、页面表达和说明组织，不把示例业务当作 confirmed requirement。

| 目录 | 用途 | 可参考 | 不可继承 |
| --- | --- | --- | --- |
| `reference/requirement-depth-standard/` | version 2 主要质量正例；展示参考实际使用、完整需求说明、系统回流和复合控件 | 页面说明/进入/交互/边界颗粒度、coverage、componentRole | 示例权限类型、文件业务和系统实现 |
| `reference/review-template-library/` | 主要教学案例；完整展示需求模型、页面计划、scene 和六类交付形态 | `house-review` 骨架、说明块、模板选择记录 | 示例页面的业务内容 |
| `reference/annotation-layout/` | 双状态 Home 与紧邻说明的视觉排版 | 画板、编号、说明的相对关系 | 文件库功能和按钮结果 |
| `reference/shared-rules/` | 共享 requirement、版本回退与表格 | 跨页映射、适用范围、例外和 change/table 表达 | 示例版本号与任务规则 |

使用这些示例时，在项目 `reference-selection.md` 记录实际参考的目录和借用范围。若当前任务已有更具体的用户基线，以用户基线为准。

新任务先看 `reference/requirement-depth-standard/` 的 version 2 质量字段；`review-template-library/` 保留六类交付形态的 version 1 兼容教学，不应作为新任务跳过质量门禁的理由。

## 文件角色

- `request.md`：虚构用户输入快照。
- `reference-selection.md`：本例使用的模式、借用范围和禁止继承项。
- `requirements-model.json`：需求、来源、假设、问题和版本关系。
- `page-plan.json`：需求到功能页、画板、控件和说明的映射。
- `scene.json`：HTML、需求说明和 Axure 共用的结构化页面数据。
- `preview/`、`preview.html`：脱敏的视觉示例，不是新的业务输入。

## 选择优先级

```text
当前明确需求
→ 当前项目有效基线
→ 内置 rp-pattern-library
→ examples/reference 中与任务匹配的表达示例
→ 用户授权的外部参考
```

示例只能帮助回答“数据应该怎样组织、页面怎样表达”；不能替用户回答权限、支付、广告、保存删除、成功判定、数据归属或平台能力。

---
name: prd-prototype-standard
description: Produce Chinese PRD plus prototype handoff deliverables in the user's standard format. Use when the user asks for 标准需求文档, PRD, 需求文档, 原型图说明, Axure/蓝湖交付, 页面说明, 交互说明, 状态图, 验收标准, or asks Codex to output requirements and prototype artifacts using the saved 范式.
---

# PRD Prototype Standard

## Goal

Produce implementation-ready Chinese product requirement documents and prototype handoff notes for C-end overseas products. Treat the PRD as the source of truth for goals, rules, boundaries, and acceptance criteria; treat prototype screens as visual evidence for page structure, states, and interaction entry points.

## Core Judgment

Before writing, judge whether the feature direction is sound:

1. Is the target user clear?
2. Is the pain real and frequent enough?
3. Does the retention path make sense?
4. Is the monetization path natural?
5. Are there Google Play / App Store policy risks, especially around subscriptions, ads, permissions, AI, health, finance, children, dating, or UGC?

If the direction is weak, say so first and propose a simpler alternative before producing the document.

## Output Principles

1. Put the important conclusion first.
2. Write in Chinese, preserving English UI labels exactly when the target app uses English UI.
3. Separate "现在必须做", "可以后置", and "不要做" when scope judgment matters.
4. Do not let Axure interactions carry hidden business rules. Important logic must be written in the PRD.
5. Make prototype screens statically readable for 蓝湖: key states must be flattened into separate screens, not hidden inside Dynamic Panel states only.
6. Avoid over-documenting. Write enough for design, development, and QA to execute without guessing.

## Standard Delivery Package

Use this structure when the user asks for a full requirement plus prototype handoff:

```text
需求包
├── PRD 文档：为什么做、做什么、规则、边界、验收
├── 原型图：页面、状态、流程、交互入口
├── 蓝湖/标注文档：设计稿、页面说明、评论记录
└── 版本记录：每次改了什么，谁确认
```

## PRD Template

Use this as the default PRD structure:

```text
# XXX 功能 PRD

一、文档信息
1、需求名称：
2、版本号：V1.0
3、负责人：
4、创建时间：
5、关联原型：
6、关联设计稿：
7、当前状态：草稿 / 评审中 / 已确认 / 开发中 / 已上线

二、需求背景
1、当前用户遇到什么问题？
2、这个问题是否真实、高频、影响核心路径？
3、为什么现在要做？
4、不做会有什么影响？

三、目标与指标
1、产品目标：
2、用户目标：
3、业务目标：
4、核心指标：
   - 激活率
   - 核心功能使用率
   - 次日留存
   - 订阅转化率
   - 广告展示率
   - 崩溃率

四、用户与场景
1、目标用户：
2、使用场景：
3、用户前置条件：
4、用户完成后的结果：

五、需求范围
1、本期必须做：
2、本期不做：
3、以后再说：
4、依赖条件：

六、核心流程
1、用户从哪里进入？
2、经过哪些关键页面？
3、最终完成什么动作？
4、失败时怎么处理？

七、原型说明
1、原型链接：
2、页面清单：
3、状态清单：
4、评审说明：

八、功能需求
按页面/模块写。每个页面使用下面的页面模板。
```

## Page Requirement Template

For each page or module, use this structure:

```text
页面说明
1、该页面用于……
2、该页面解决用户……
3、该页面不承担……

页面进入
1、用户从……进入该页面。
2、首次进入时……
3、再次进入时……

页面模块
1、顶部区域：
2、核心内容区：
3、底部操作区：
4、异常提示区：

展示规则
1、字段 A 展示……
2、字段为空时展示……
3、数据按……排序。
4、数据超过……时……

按钮交互
1、点击 A 后，进入……
2、点击 B 后，弹出……
3、重复点击时……
4、网络异常时……

页面状态
1、默认状态：
2、加载状态：
3、空状态：
4、错误状态：
5、无权限状态：
6、未登录状态：
7、未订阅状态：

边界情况
1、用户无数据时……
2、用户拒绝权限时……
3、接口失败时……
4、数据部分缺失时……
5、用户中途退出后再次进入时……

验收标准
1、当……时，页面应……
2、当……时，按钮应……
3、当……时，不应……
```

## Prototype Handoff Rules

Do not deliver only a happy path. Split key states into separate screens so they can be reviewed in 蓝湖 without clicking through hidden interactions.

Use this naming style:

```text
01_Home_Default
01_Home_Loading
01_Home_Empty
01_Home_Error
01_Home_NoPermission
01_Home_NotLogin

02_Result_Default
02_Result_PartialData
02_Result_Failed

03_Paywall_Default
03_Paywall_PurchaseSuccess
03_Paywall_PurchaseFailed
03_Paywall_RestorePurchase
```

Each prototype screen should include or be paired with:

```text
页面目的：
进入条件：
展示规则：
点击行为：
异常状态：
```

## Lanhu Grouping

Recommend this grouping when the user asks how to organize screens in 蓝湖:

```text
P0_核心流程
├── 01_Home_默认状态
├── 02_Home_无权限状态
├── 03_Result_成功状态
├── 04_Result_失败状态
├── 05_Paywall_订阅页
└── 06_Settings_设置页

P1_异常状态
├── 网络错误
├── 空数据
├── 权限拒绝
└── 支付失败
```

## Product Checks For Overseas Apps

Apply these checks when relevant:

1. Google Play first, App Store second unless the user says otherwise.
2. Subscription and IAP need clear trigger timing, price display, restore/cancel handling, trial rules, and failure states.
3. Ads must not block core task completion unless the product deliberately uses rewarded ads.
4. Permissions need clear value exchange; avoid over-requesting permissions.
5.欧美用户更在意 privacy、subscription transparency 和 trust signals.
6.东南亚、拉美用户更价格敏感，广告和低价套餐通常更容易接受.
7.中东市场要注意内容、性别、宗教文化和支付方式差异.
8. Do not assume China product habits transfer directly to overseas markets.

## Example Page Output

Use this style for concrete page requirements:

```text
Home 页面需求

页面说明
1、Home 是用户进入 App 后的主页面，用于承载核心功能入口。
2、该页面优先让用户理解产品能解决什么问题，并触发第一次核心操作。
3、Home 不承载复杂设置、历史记录和订阅说明，避免首屏变重。

页面进入
1、用户打开 App 后默认进入 Home。
2、若用户首次打开 App，展示 onboarding 后进入 Home。
3、若用户未授权必要权限，Home 展示权限引导状态。
4、若用户已完成授权，Home 展示默认状态。

页面模块
1、顶部区域展示产品名称和设置入口。
2、中间区域展示核心功能说明和主操作按钮。
3、底部区域展示最近一次结果或历史入口。
4、未订阅用户点击高级功能时，进入 Paywall。

按钮交互
1、点击 Start 后，若权限已授权，进入扫描/处理状态。
2、点击 Start 后，若权限未授权，先展示权限说明弹窗。
3、点击 Settings 后，进入 Settings 页面。
4、重复点击 Start 时，不重复发起任务，只保留当前进行中状态。

页面状态
1、默认状态：展示 Start 按钮和核心说明。
2、加载状态：Start 按钮置灰，展示处理中状态。
3、空状态：无历史记录时，不展示空白列表，展示引导文案。
4、错误状态：展示失败原因和 Retry 按钮。
5、无权限状态：展示权限说明和 Enable 按钮。

边界情况
1、用户拒绝权限后，不进入核心功能，停留在权限引导状态。
2、用户从系统设置开启权限后，返回 App 时重新检测权限。
3、处理过程中退出页面，再次进入时展示上次任务状态。
4、网络异常时，不清空已有本地数据。
```

## Delivery Checklist

Before finalizing, check:

1. PRD can be understood without clicking the prototype.
2. Prototype screens expose default, loading, empty, error, permission, login, and monetization states when applicable.
3. Every visible button, tab, modal, list item, and paywall action has an interaction rule.
4. Data display rules cover sorting, empty values, fallback text, duplicate records, stale data, and long text when relevant.
5. Edge cases are specific, not a generic long list.
6. Acceptance criteria are testable by QA.
7. Platform and monetization risks are surfaced when relevant.

# Printer Workflow Demo · 页面需求

## Home

### 页面说明

1、Home 是打印功能的主页，集中展示连接打印机和选择打印内容的入口。

2、主页按功能组织，不按连接状态拆成多个主页。

### 页面进入

1、进入 App 后展示 Home；本例展示未连接打印机的状态。

### 按钮交互

1、点击 Connect Printer 后进入 Connect Printer 页面。

2、未连接时点击 Photos 或 Documents，先进入 Connect Printer；连接成功后继续原先选择的内容入口。

3、已连接时点击 Photos 打开照片选择；点击 Documents 打开文档选择。本例只描述后续流程，不额外绘制这些页面。

### 边界情况

1、取消连接时返回 Home，不进入内容选择。

2、连接失败时保留现有操作意图，用户可重试或返回。

### 验收标准

1、Home 可看到 Connect Printer、Photos、Documents 三个入口。

2、原型与本说明的英文按钮标签一致。

## Connect Printer

### 页面说明

1、该页面用于选择并连接打印机。Office Printer 为虚构示例设备。

### 页面进入

1、由 Home 的 Connect Printer 入口，或未连接时的内容入口进入。

### 按钮交互

1、点击设备后将其设为待连接设备；点击 Connect 发起连接。

2、连接成功后，若由内容入口进入则继续原操作，否则返回 Home 并展示设备名称。

3、点击 Back 返回 Home，不改变原有连接状态。

### 边界情况

1、连接中重复点击不发起第二次连接。

2、连接失败时显示失败原因与 Retry 入口；无设备时说明检查网络并重新扫描。以上状态以文字描述，本例不实现真实扫描或动态面板。

### 验收标准

1、可看到 Office Printer、Connect 和 Back。

2、成功、失败和取消后的去向均有明确说明。

# Privacy Policy / 隐私政策

Last updated: 2026-03-11

## 中文说明（Chinese）

Dev Toolbox（以下简称“本扩展”）是一个离线开发工具箱扩展，提供时间戳转换、JSON 格式化/校验、文本与列表互转、文本转义/去转义等功能。

### 我们收集哪些数据

本扩展**不会**将任何数据发送到开发者服务器，也**不会**集成分析/广告 SDK。

为实现功能与提升使用体验，本扩展会在用户的浏览器中**本地存储**以下信息：

- 用户输入内容（草稿）：例如你粘贴/输入的 JSON、文本、时间戳等，用于下次打开时恢复编辑内容。
- 用户偏好设置：例如缩进、是否排序 key、分隔符、选项开关、上次打开的工具 Tab 等。

上述数据可能存储在：

- `chrome.storage.local`：本机存储（草稿等）。
- `chrome.storage.sync`：同步存储（偏好设置等）。如果你在 Chrome 中启用了同步，相关偏好可能随你的 Google 账号在你的设备间同步。

### 数据如何使用

- 仅用于在本地完成格式化/转换/校验等工具功能。
- 仅用于保存草稿与偏好设置以提升易用性。
- 不用于广告、画像、追踪，也不出售或共享给第三方。

### 权限说明

- `storage`：用于保存草稿与偏好设置（如上所述）。

### 剪贴板

当你点击“复制”按钮时，本扩展会将结果写入系统剪贴板以便你粘贴使用。本扩展不主动读取你的剪贴板内容。

### 数据删除

你可以通过以下方式删除本扩展存储的数据：

- 在扩展界面中清空输入内容（会覆盖草稿）。
- 在 Chrome 扩展管理页移除本扩展（会清除扩展数据）。
- 在浏览器设置中清除该扩展的站点/扩展存储数据。

### 联系方式

如有隐私相关问题，请联系：`REPLACE_WITH_YOUR_SUPPORT_EMAIL`

## English

Dev Toolbox (the "Extension") is an offline developer toolbox that provides timestamp conversion, JSON formatting/validation, text/list conversion, and text escaping/unescaping.

### Data We Collect

The Extension does **not** send any data to a developer-operated server and does **not** include analytics or advertising SDKs.

To provide functionality and a better user experience, the Extension stores the following data **locally in your browser**:

- User-provided content (drafts): e.g., JSON/text/timestamps you paste or type, to restore your last input.
- User preferences: e.g., indentation, sort-keys toggle, delimiters, option switches, and the last active tool tab.

This data may be stored in:

- `chrome.storage.local` (on-device storage; typically drafts).
- `chrome.storage.sync` (synced storage; typically preferences). If Chrome Sync is enabled, preferences may sync across your own devices.

### How We Use Data

- Only to perform transformations/validation locally.
- Only to save drafts and preferences.
- Not for advertising, profiling, tracking, selling, or sharing with third parties.

### Permissions

- `storage`: used to store drafts and preferences.

### Clipboard

When you click a "Copy" action, the Extension writes the generated output to your clipboard so you can paste it elsewhere. The Extension does not proactively read clipboard contents.

### Data Deletion

You can delete stored data by clearing inputs (overwrites drafts), uninstalling the Extension, or clearing extension storage via browser settings.

### Contact

For privacy questions, contact: `REPLACE_WITH_YOUR_SUPPORT_EMAIL`


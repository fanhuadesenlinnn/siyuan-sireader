# SiReader Integration API v1

SiReader exposes its integration surface at `window.sireader.integration`:

```ts
{
  protocol: 'sireader-integration',
  version: 1,
  capabilities: ['lifecycle.events', 'session.query'],
  getSessionFocus(options?: { localDate?: string }): Promise<{ focusMs: number }>
}
```

Check `protocol`, `version`, and `capabilities` before using the API. `getSessionFocus` reports milliseconds for a local calendar date (`YYYY-MM-DD`); omitting `localDate` queries today. It counts time only while the reader has document focus and the host window is visible. The `integration` property is removed when SiReader unloads.

The following window-level `CustomEvent`s are stable in v1. Their `detail` is `{ at: number }`, where `at` is a Unix timestamp in milliseconds. Book titles and URLs are intentionally excluded.

| Event | Meaning |
| --- | --- |
| `reader:open` | A reader was opened |
| `reader:focus` | The reader gained document focus |
| `reader:blur` | The reader lost document focus, the tab changed, or the host window became hidden |
| `reader:close` | The reader was closed |

## Optional recent-reading widget

When `小驴雷切` is installed, SiReader registers a `sireader-recent-books` home module. It shows up to five recently read books with progress. Its links use `sireader://resume?url=<encoded-book-url>` and reopen the saved reading position. Registration retries are bounded; the module is omitted when the host plugin is unavailable and is removed on unload.

---

# SiReader 阅读生命周期集成 API v1

思阅通过 `window.sireader.integration` 暴露集成接口：

```ts
{
  protocol: 'sireader-integration',
  version: 1,
  capabilities: ['lifecycle.events', 'session.query'],
  getSessionFocus(options?: { localDate?: string }): Promise<{ focusMs: number }>
}
```

使用前请检查 `protocol`、`version` 和 `capabilities`。`getSessionFocus` 返回指定本地日历日期（`YYYY-MM-DD`）的专注时长，单位为毫秒；省略 `localDate` 时查询当天。仅统计阅读器持有文档焦点且宿主窗口可见的时间。思阅卸载时会移除 `integration` 属性。

以下 window 级 `CustomEvent` 在 v1 中保持稳定。事件 `detail` 为 `{ at: number }`，`at` 是 Unix 毫秒时间戳；事件不会暴露书名或 URL。

| 事件 | 含义 |
| --- | --- |
| `reader:open` | 阅读器已打开 |
| `reader:focus` | 阅读器获得文档焦点 |
| `reader:blur` | 阅读器失去文档焦点、切换页签或宿主窗口隐藏 |
| `reader:close` | 阅读器已关闭 |

## 可选的最近阅读小组件

安装“小驴雷切”后，思阅会注册 `sireader-recent-books` 主界面模块，展示最多 5 本最近阅读的书籍及进度。条目链接使用 `sireader://resume?url=<编码后的书籍 URL>`，点击后从上次阅读位置继续。注册会有限重试；宿主插件不可用时不影响思阅，思阅卸载时会移除该模块。

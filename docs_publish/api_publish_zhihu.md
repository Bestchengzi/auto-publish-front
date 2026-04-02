# `POST /api/publish` 使用说明：`zhihu`

本文只说明 HTTP API 的发布接口 `POST /api/publish`，并以 `zhihu` 为例说明完整用法。

服务默认启动方式：

```bash
.venv/bin/python api_server.py --host 127.0.0.1 --port 8000
```

默认接口地址：

- 发布接口：`http://127.0.0.1:8000/api/publish`
- 健康检查：`http://127.0.0.1:8000/healthz`

## 1. 接口用途

用于直接调用统一发布服务，向知乎专栏发布文章。

最常见的调用方式是：

- 直接传 `content` 字符串
- 直接传 `cookie` 字符串
- 通过 `platform_options` 传知乎封面参数

## 2. 请求方式

- Method: `POST`
- Content-Type: `application/json`

## 3. 顶层请求体字段

这些字段属于 `/api/publish` 的通用请求体，不只 `zhihu` 可用。

### `platform`

- 类型：`string`
- 必填：是
- `zhihu` 单平台调用时固定传：`"zhihu"`

### `content`

- 类型：`string`
- 必填：否
- 说明：直接传 Markdown 内容
- 与 `article_file` 二选一即可
- 推荐用于 API 调用
- 一级标题默认作为文章标题；如果需要覆盖最终发布标题，可额外传 `platform_options.title`

示例：

```markdown
# 我的知乎文章标题

这是正文第一段。
```

### `article_file`

- 类型：`string`
- 必填：否
- 说明：Markdown 文件路径
- 如果同时传了 `content` 和 `article_file`，实际以 `content` 为准

### `cookie`

- 类型：`string`
- 必填：否
- 说明：知乎登录态 Cookie 字符串

### `cookie_file`

- 类型：`string`
- 必填：否
- 说明：Cookie 文件路径

### `platform_options`

- 类型：`object`
- 必填：否
- 说明：知乎平台扩展参数

### `draft`

- 类型：`boolean`
- 必填：否
- 默认值：`false`
- 说明：
  - `true`：只保存草稿
  - `false`：正式发布

### `dry_run`

- 类型：`boolean`
- 必填：否
- 默认值：`false`
- 说明：
  - `true`：只做本地转换，不访问知乎接口
  - `false`：真实访问知乎接口

### `skip_image_upload`

- 类型：`boolean`
- 必填：否
- 默认值：`false`
- 说明：
  - `true`：跳过图片上传
  - `false`：按知乎规则上传正文图片

### `timeout`

- 类型：`integer`
- 必填：否
- 默认值：`20`
- 说明：HTTP 请求超时时间，单位秒

## 4. `zhihu` 的 `platform_options`

知乎当前支持标题覆盖和封面参数。

### `title`

- 类型：`string`
- 必填：否
- 说明：覆盖 Markdown 一级标题

这些别名也支持：

- `标题`

### `cover_image`

- 类型：`string`
- 必填：否
- 说明：封面图来源
- 支持：
  - 本地图片路径
  - HTTP 图片 URL
  - 其他当前项目已支持的图片输入来源

这些别名也支持：

- `cover`
- `cover_url`
- `title_image`
- `封面`
- `封面图`

### `cover_full_screen`

- 类型：`boolean`
- 必填：否
- 默认值：`false`
- 说明：是否使用全屏封面

这些别名也支持：

- `coverFullscreen`
- `is_title_image_full_screen`
- `封面全屏`
- `全屏封面`

## 5. 最小正式发布示例

```json
{
  "platform": "zhihu",
  "cookie": "_xsrf=xxx; z_c0=xxx; d_c0=xxx",
  "content": "# 我的知乎文章\n\n这是正文。",
  "draft": false
}
```

## 6. 带封面的正式发布示例

```json
{
  "platform": "zhihu",
  "cookie": "_xsrf=xxx; z_c0=xxx; d_c0=xxx",
  "content": "# 我的知乎文章\n\n这是正文。",
  "platform_options": {
    "cover_image": "/absolute/path/to/cover.png",
    "cover_full_screen": true
  }
}
```

## 7. `curl` 调用示例

```bash
curl -X POST http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "zhihu",
    "cookie": "_xsrf=xxx; z_c0=xxx; d_c0=xxx",
    "content": "# 我的知乎文章\n\n这是正文。",
    "platform_options": {
      "封面图": "/absolute/path/to/cover.png",
      "封面全屏": true
    }
  }'
```

## 8. 返回结果说明

成功时返回 JSON，核心字段通常包括：

- `ok`: 是否成功
- `results`: 各平台结果列表
- `result.article_id`: 知乎文章 ID
- `result.draft_url`: 草稿编辑地址
- `result.published_url`: 正式文章地址

如果传了 `draft=true`，通常会返回：

- `draft_only=true`
- 可编辑的 `draft_url`

## 9. 注意事项

- `content` 必须包含一级标题 `# 标题`
- 知乎 Cookie 至少要保证当前登录态有效
- 如果传了封面图，发布器会先上传封面，再补写到草稿
- 是否能成功正式发布，仍受知乎账号风控、发文权限和 Cookie 时效影响

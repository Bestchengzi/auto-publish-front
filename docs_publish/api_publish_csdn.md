# `POST /api/publish` 使用说明：`csdn`

本文只说明 HTTP API 的发布接口 `POST /api/publish`，并以 `csdn` 为例说明完整用法。

服务默认启动方式：

```bash
.venv/bin/python api_server.py --host 127.0.0.1 --port 8000
```

默认接口地址：

- 发布接口：`http://127.0.0.1:8000/api/publish`
- 健康检查：`http://127.0.0.1:8000/healthz`

## 1. 接口用途

用于直接调用统一发布服务，向 CSDN 保存草稿、直接发布，或提交定时发布文章。

当前 CSDN 发布器会自动：

- 从 Markdown 提取标题、摘要、标签
- 把正文 Markdown 渲染为 HTML 后提交给 CSDN 旧编辑接口链
- 对非 CSDN 图床的远程图片优先走外链转存，失败时回退到二进制上传
- 自动选择正文第一张图片作为封面；如果显式传 `cover_image`，则优先使用显式封面

当前实现对应的核心接口包括：

- 保存/发布：`/blog-console-api/v1/postedit/saveArticle`
- 读取文章：`/blog-console-api/v1/editor/getArticle`
- 最近编辑：`/blog/phoenix/console/v1/article/get-recently-edit`
- 文章列表：`/blog/phoenix/console/v1/article/list`
- 图片外链转存：`/resource-api/v1/image/external/storage`
- 图片直传签名：`/resource-api/v1/image/direct/upload/signature`

## 2. 请求方式

- Method: `POST`
- Content-Type: `application/json`

## 3. 顶层请求体字段

这些字段属于 `/api/publish` 的通用请求体，不只 `csdn` 可用。

### `platform`

- 类型：`string`
- 必填：是
- 说明：目标平台
- `csdn` 单平台调用时固定传：`"csdn"`

### `article_file`

- 类型：`string`
- 必填：否
- 说明：Markdown 文件路径
- 与 `content` 二选一即可
- 如果同时传了 `content` 和 `article_file`，实际以 `content` 为准

### `content`

- 类型：`string`
- 必填：否
- 说明：直接传 Markdown 内容
- 推荐用于 API 调用
- 必须包含一级标题，例如：
- 一级标题默认作为文章标题；如果需要覆盖最终发布标题，可额外传 `platform_options.title`

```markdown
# 我的标题

正文第一段。
```

### `cookie_file`

- 类型：`string`
- 必填：否
- 说明：Cookie 文件路径

### `cookie`

- 类型：`string`
- 必填：否
- 说明：CSDN 登录态 Cookie 字符串
- 支持浏览器导出的 JSON cookies 字符串
- 也支持 `name=value; name2=value2` 形式

### `platform_options`

- 类型：`object`
- 必填：否
- 说明：CSDN 发布扩展参数

### `draft`

- 类型：`boolean`
- 必填：否
- 默认值：`false`
- 说明：
  - `true`：保存为草稿
  - `false`：正式提交发布或定时发布

### `dry_run`

- 类型：`boolean`
- 必填：否
- 默认值：`false`
- 说明：
  - `true`：只做内容转换和 payload 生成，不访问 CSDN 接口
  - `false`：真实调用 CSDN 接口

### `skip_image_upload`

- 类型：`boolean`
- 必填：否
- 默认值：`false`
- 说明：
  - `true`：跳过图片转存/上传，保留原始图片地址
  - `false`：按 CSDN 规则处理正文图片与封面图

补充说明：

- 当 `skip_image_upload=false` 时，正文图片会尝试被替换为 CSDN 图床地址
- 显式传入的 `cover_image` 如果是本地文件或外站图片，也会在发布前转成 CSDN 可接受的地址

### `timeout`

- 类型：`integer`
- 必填：否
- 默认值：`20`
- 说明：HTTP 请求超时时间，单位秒

## 4. `csdn` 的 `platform_options` 全参数说明

以下字段都写在 `platform_options` 对象内。

---

### `article_id`

- 类型：`string`
- 别名：`articleId` / `文章ID`
- 说明：更新已有草稿或已有文章时使用

说明：

- 不传时视为新建文章
- 传入后会在保存 payload 中附带 `article_id`

---

### `title`

- 类型：`string`
- 别名：`标题`
- 说明：覆盖 Markdown 一级标题

说明：

- 不传时默认取 Markdown 第一行 `# 标题`
- 传入后会直接覆盖正文里解析出来的标题

---

### `description`

- 类型：`string`
- 别名：`desc` / `摘要`
- 说明：文章摘要

说明：

- 不传时会自动从正文里提取第一段有效文本
- 最终会截断到 256 个字符以内

---

### `tags`

- 类型：`string`
- 别名：`标签`
- 说明：文章标签，逗号分隔

说明：

- 不传时会尝试从文末 `关键词` 行提取 `#标签`
- 会自动去重并去掉多余的 `#`

示例：

```json
{
  "tags": "python,ai,后端"
}
```

---

### `categories`

- 类型：`string`
- 别名：`分类`
- 说明：文章分类

说明：

- 当前按字符串原样传给 CSDN 保存接口
- 多个分类时建议使用英文逗号分隔

---

### `cover_image`

- 类型：`string`
- 别名：`cover` / `封面` / `封面图`
- 说明：显式指定封面图
- 支持远程 URL，也支持相对 `article_file` 所在目录的本地路径

说明：

- 不传时，代码会自动取正文里的第一张图片作为封面
- 如果传的是外站图片，发布前会优先尝试转存到 CSDN 图床
- 如果传的是本地路径，发布前会自动上传到 CSDN 图床

---

### `article_type`

- 类型：`string`
- 别名：`type` / `文章类型`
- 支持值：
  - `"original"` / `"原创"`
  - `"repost"` / `"转载"`
  - `"translated"` / `"翻译"`

---

### `read_type`

- 类型：`string`
- 别名：`visibility` / `可见范围`
- 支持值：
  - `"public"` / `"公开"`
  - `"private"` / `"私密"`
  - `"vip"` / `"会员"`
  - `"fans"` / `"粉丝"`

---

### `creation_statement`

- 类型：`integer`
- 别名：`原创声明`
- 支持值：`0` / `1` / `2` / `3`

说明：

- 传入布尔值会报错
- 传入其他整数也会报错

---

### `scheduled_at`

- 类型：`string`
- 别名：`publish_at` / `定时发布` / `发布时间`
- 说明：定时发布时间字符串
- 格式：`YYYY-MM-DD HH:MM[:SS]`
- 时区：`Asia/Shanghai`

说明：

- 只在 `draft=false` 时参与定时发布
- 解析后会自动转成 `scheduled_time` 时间戳

---

### `scheduled_time`

- 类型：`integer`
- 别名：`scheduledTime`
- 说明：定时发布时间时间戳

说明：

- 如果同时传了 `scheduled_time` 和 `scheduled_at`，优先使用 `scheduled_time`
- 定时发布成功时，返回通常会保留 `draft_url`，且 `draft_only=true`

## 5. 按编辑页文案传值

`csdn` 也支持直接按编辑页或业务表单文案传值。

例如：

```json
{
  "文章ID": "123456789",
  "摘要": "这是一段摘要",
  "标签": "python,ai",
  "分类": "开发工具,AI",
  "封面图": "cover.png",
  "文章类型": "原创",
  "可见范围": "公开",
  "原创声明": 2,
  "定时发布": "2026-03-29 10:00:00"
}
```

对应关系：

- `文章ID` -> `article_id`
- `标题` -> `title`
- `摘要` -> `description`
- `标签` -> `tags`
- `分类` -> `categories`
- `封面图` -> `cover_image`
- `文章类型` -> `article_type`
- `可见范围` -> `read_type`
- `原创声明` -> `creation_statement`
- `定时发布` / `发布时间` -> `scheduled_at`

## 6. 最小可用请求示例

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "csdn",
    "content": "# CSDN API 发布示例\n\n正文第一段。",
    "cookie": "uuid_tt_dd=...; UserName=...; UserInfo=..."
  }'
```

## 7. 保存草稿示例

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "csdn",
    "content": "# CSDN 草稿示例\n\n正文第一段。",
    "cookie": "uuid_tt_dd=...; UserName=...; UserInfo=...",
    "draft": true
  }'
```

## 8. 带全部参数的完整请求示例

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "csdn",
    "content": "# CSDN 完整发布示例\n\n正文第一段。\n\n![配图1](https://example.com/1.jpg)\n\n![配图2](./cover.png)\n\n**关键词：** #Python #AI",
    "cookie": "uuid_tt_dd=...; UserName=...; UserInfo=...",
    "draft": false,
    "dry_run": false,
    "skip_image_upload": false,
    "timeout": 30,
    "platform_options": {
      "description": "这是一段摘要",
      "tags": "python,ai",
      "categories": "开发工具,AI",
      "cover_image": "./cover.png",
      "article_type": "original",
      "read_type": "public",
      "creation_statement": 0
    }
  }'
```

## 9. 更新已有文章示例

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "csdn",
    "content": "# 更新已有文章示例\n\n这是更新后的正文。",
    "cookie": "uuid_tt_dd=...; UserName=...; UserInfo=...",
    "platform_options": {
      "article_id": "123456789"
    }
  }'
```

## 10. 定时发布示例

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "csdn",
    "content": "# 定时发布示例\n\n正文",
    "cookie": "uuid_tt_dd=...; UserName=...; UserInfo=...",
    "platform_options": {
      "scheduled_at": "2026-03-29 10:00:00"
    }
  }'
```

## 11. Python 调用示例

```python
import requests

payload = {
    "platform": "csdn",
    "content": "# 标题\n\n正文",
    "cookie": "uuid_tt_dd=...; UserName=...; UserInfo=...",
    "platform_options": {
        "description": "自定义摘要",
        "tags": "python,ai",
        "categories": "开发工具,AI",
        "cover_image": "cover.png",
        "article_type": "original",
        "read_type": "public",
    },
    "draft": False,
    "timeout": 20,
}

resp = requests.post(
    "http://127.0.0.1:8000/api/publish",
    json=payload,
    timeout=30,
)
resp.raise_for_status()
print(resp.json())
```

## 12. 返回结果说明

成功时返回统一结构：

```json
{
  "exit_code": 0,
  "results": [
    {
      "platform": "csdn",
      "account_info": {},
      "prepared": {},
      "result": {},
      "output": {}
    }
  ],
  "summary": [
    {
      "platform": "csdn",
      "nickname": "账号昵称",
      "url": "文章地址或草稿地址",
      "user_id": "账号 ID",
      "profile_url": "博客主页"
    }
  ]
}
```

常见判定：

- `exit_code=0`：本次调用整体成功
- `results[*].error` 存在：对应平台发布失败
- `draft=true` 时，返回的 `url` 通常是草稿编辑地址
- `scheduled_at` / `scheduled_time` 生效且平台未立即给出线上地址时，通常返回 `draft_only=true`
- `dry_run=true` 时，不会真正访问 CSDN 发布接口

## 13. 结果文件与排查

默认最近一次统一发布结果会写入：

- `csdn_publish/last_publish_result.json`

如果你只想确认最近一次调用结果，可直接查看：

- `GET /api/results?platform=csdn`

如果你想看准备后的内容摘要，也可以查看：

- `GET /api/status?platform=csdn&include_content=true`

## 14. 注意事项

- `content` 必须带一级标题 `# 标题`
- `cookie` 需要是当前可用的 CSDN 登录态
- `scheduled_at` 格式必须是 `YYYY-MM-DD HH:MM[:SS]`
- `creation_statement` 只能传 `0-3`
- 显式封面如果是本地路径，解析基准是 `article_file` 所在目录；如果直接传 `content`，则相对当前服务工作目录
- 当前实现使用的是旧编辑接口链；如果某些已发布文章处于平台新流程状态，接口行为可能受文章状态限制

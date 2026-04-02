# `POST /api/publish` 使用说明：`baijiahao`

本文只说明 HTTP API 的发布接口 `POST /api/publish`，并以 `baijiahao` 为例说明完整用法。

服务默认启动方式：

```bash
.venv/bin/python api_server.py --host 127.0.0.1 --port 8000
```

默认接口地址：

- 发布接口：`http://127.0.0.1:8000/api/publish`
- 健康检查：`http://127.0.0.1:8000/healthz`

## 1. 接口用途

用于直接调用统一发布服务，向百家号发布文章或保存草稿。

当前百家号发布器会自动：

- 用你传入的 `cookie` 访问编辑页
- 提取编辑页里的 `window.__BJH__INIT__AUTH__`
- 优先走百家号远程图片转存，失败时回退到图片二进制直传
- 以请求头 `token` 调用百家号保存、`editCheck` 和正式发布接口

当前已经做过真实账号验证：

- 验证日期：`2026-03-25`
- `save`：成功
- `editCheck`：成功
- `publish`：被百家号风控拦截，错误为“百家号发布被平台风控拦截，请先在百家号创作者平台完成安全验证后重试。”

这说明当前代码链路已打通到正式发布接口；如果正式发布失败，优先排查账号风控或平台安全验证，而不是 Cookie 失效。

## 2. 请求方式

- Method: `POST`
- Content-Type: `application/json`

## 3. 顶层请求体字段

这些字段属于 `/api/publish` 的通用请求体，不只 `baijiahao` 可用。

### `platform`

- 类型：`string`
- 必填：是
- 说明：目标平台
- `baijiahao` 单平台调用时固定传：`"baijiahao"`

### `content`

- 类型：`string`
- 必填：否
- 说明：直接传 Markdown 内容
- 推荐 API 场景直接使用
- 必须包含一级标题，例如：
- 一级标题默认作为文章标题；如果需要覆盖最终发布标题，可额外传 `platform_options.title`

```markdown
# 我的标题

正文第一段。
```

### `article_file`

- 类型：`string`
- 必填：否
- 说明：Markdown 文件路径
- 与 `content` 二选一即可
- 如果同时传了 `content` 和 `article_file`，实际以 `content` 为准

### `cookie`

- 类型：`string`
- 必填：否
- 说明：百家号登录态 Cookie 字符串
- 支持浏览器导出的 JSON cookies 字符串
- 也支持 `name=value; name2=value2` 形式

### `cookie_file`

- 类型：`string`
- 必填：否
- 说明：Cookie 文件路径

### `platform_options`

- 类型：`object`
- 必填：否
- 说明：百家号发布参数对象

### `draft`

- 类型：`boolean`
- 默认值：`false`
- 说明：
  - `true`：保存为草稿
  - `false`：正式发布

### `dry_run`

- 类型：`boolean`
- 默认值：`false`
- 说明：
  - `true`：只做内容转换和 payload 生成，不真实请求百家号接口
  - `false`：真实调用接口

### `skip_image_upload`

- 类型：`boolean`
- 默认值：`false`
- 说明：
  - `false`：按默认链路处理图片
  - `true`：跳过正文图片上传/转存，保留原始图片地址

补充说明：

- 当前百家号实现已支持远程图片转存失败后的二进制上传兜底
- 当前也支持本地图片直传；如果是 `content` 方式提交，默认从服务当前工作目录解析相对路径

### `timeout`

- 类型：`integer`
- 默认值：`20`
- 说明：HTTP 请求超时时间，单位秒

## 4. `baijiahao` 的 `platform_options`

以下字段都写在 `platform_options` 对象内。

---

### `title`

- 类型：`string`
- 别名：`标题`
- 说明：覆盖 Markdown 一级标题

说明：

- 不传时默认取 Markdown 第一行 `# 标题`
- 传入后只覆盖最终发布标题，不影响正文解析

---

### `abstract`

- 类型：`string`
- 别名：`summary` / `digest` / `摘要`
- 说明：文章摘要

### `cover_layout`

- 类型：`string`
- 别名：`cover_mode` / `展示封面` / `封面样式`
- 支持值：
  - `"zero"` / `"none"` / `"无封面"`
  - `"one"` / `"single"` / `"单图"`
  - `"three"` / `"三图"`

说明：

- 选 `"单图"` 时需要至少 1 张图片
- 选 `"三图"` 时需要至少 3 张图片
- 如果不传，代码会优先使用正文图片自动推断：3 张及以上为三图，1 张为单图，没有图片为无封面

---

### `cover_images`

- 类型：`array`
- 别名：`cover` / `封面` / `封面图` / `封面图片`
- 说明：显式指定封面图
- 支持远程 URL，也支持相对 `article_file` 所在目录的本地路径
- 如果你直接传 `content`，相对路径默认相对于服务当前工作目录

支持两种写法。

写法 1：直接传字符串数组

```json
[
  "https://cdn.example.com/cover-1.png",
  "https://cdn.example.com/cover-2.png",
  "https://cdn.example.com/cover-3.png"
]
```

写法 2：传对象数组

```json
[
  {
    "src": "https://cdn.example.com/cover-1.png",
    "origin_src": "https://cdn.example.com/cover-1.png",
    "cropData": {},
    "isLegal": 0,
    "cover_source_tag": "local"
  }
]
```

---

### `feed_cat`

- 类型：`string`
- 别名：`category` / `分类`
- 说明：文章分类

说明：

- 可以直接传平台分类 ID，例如 `8`
- 也可以直接传中文分类名称，例如 `科技`
- 代码会自动调用 `/pcui/article/getnewscate`，把分类名称解析为平台 `cateid`

---

### `activity_list`

- 类型：`array`
- 别名：`activity_submission` / `活动投稿`
- 说明：活动投稿信息

可以直接传对象、对象数组，或者活动 ID。

示例：

```json
[
  {
    "id": "activity-001",
    "title": "测试活动"
  }
]
```

---

### `declare_aigc`

- 类型：`boolean`
- 别名：`declareAigc` / `aigc` / `声明AIGC`
- 说明：
  - 为 `true` 时，会自动把 `aigc_bjh_status` 写入 `activity_list`
  - 同时会带上 `creative_method`

---

### `auto_tts`

- 类型：`boolean`
- 别名：`autoTts` / `ai_tts` / `AI配音`
- 说明：
  - 会把 `ai_tts` 写入 `activity_list`
  - `true` 表示 `is_checked=1`
  - `false` 表示 `is_checked=0`

---

### `creative_method`

- 类型：`string`
- 别名：`creativeMethod`
- 说明：
  - 配合 `declare_aigc=true` 使用
  - 不传时默认回退为 `bjh_pc_article`

---

### `original_announce`

- 类型：`boolean`
- 别名：`originalAnnounce` / `原创声明`
- 说明：
  - 为 `true` 时，会附带 `original.hasAnnounced=1`

---

### `event_spec`

- 类型：`object`
- 别名：`事件来源说明`
- 说明：事件时间与地点
- 支持字段：
  - `time`: 事件时间，例如 `2026-03-25`
  - `pos`: 事件地点，平台实际接收格式是逗号拼接字符串，例如 `北京市,北京市`

也支持直接传：

```json
{
  "时间": "2026-03-25",
  "地点": ["北京市", "北京市"]
}
```

---

### `settings`

- 类型：`object`
- 别名：`设置`
- 说明：其他开关透传

当前已验证并内置支持：

- `open_comment`
- `selected_comment_option`

这两个字段也可以直接在 `platform_options` 顶层传。

## 5. 按编辑页文案传值

`baijiahao` 也支持直接按编辑页文案传值，适合前端表单直接透传。

例如：

```json
{
  "摘要": "这是一段摘要",
  "展示封面": "三图",
  "封面": [
    "https://cdn.example.com/cover-1.png",
    "https://cdn.example.com/cover-2.png",
    "https://cdn.example.com/cover-3.png"
  ],
  "分类": "科技",
  "活动投稿": [
    {
      "id": "activity-001",
      "title": "测试活动"
    }
  ],
  "声明AIGC": true,
  "AI配音": false,
  "原创声明": true,
  "事件来源说明": {
    "时间": "2026-03-25",
    "地点": ["北京市", "北京市"]
  },
  "设置": {
    "open_comment": true
  }
}
```

对应关系：

- `摘要` -> `abstract`
- `展示封面` -> `cover_layout`
- `封面` / `封面图` -> `cover_images`
- `分类` -> `feed_cat`
- `活动投稿` -> `activity_list`
- `声明AIGC` -> `declare_aigc`
- `AI配音` -> `auto_tts`
- `原创声明` -> `original_announce`
- `事件来源说明` -> `event_spec`
- `设置` -> `settings`

## 6. 最小草稿示例

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "baijiahao",
    "content": "# 测试标题\n\n这是一段正文。",
    "cookie": "[{\"name\":\"BDUSS\",\"value\":\"...\"}]",
    "draft": true
  }'
```

## 7. 带全部参数的正式发布示例

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "baijiahao",
    "content": "# 测试标题\n\n正文第一段。\n\n![配图](https://cdn.example.com/body-1.png)\n\n![配图](https://cdn.example.com/body-2.png)\n\n![配图](https://cdn.example.com/body-3.png)",
    "cookie": "[{\"name\":\"BDUSS\",\"value\":\"...\"}]",
    "draft": false,
    "dry_run": false,
    "skip_image_upload": false,
    "timeout": 30,
    "platform_options": {
      "摘要": "这是一段摘要",
      "展示封面": "三图",
      "封面": [
        "https://cdn.example.com/cover-1.png",
        "https://cdn.example.com/cover-2.png",
        "https://cdn.example.com/cover-3.png"
      ],
      "分类": "科技",
      "活动投稿": [
        {
          "id": "activity-001",
          "title": "测试活动"
        }
      ],
      "事件来源说明": {
        "时间": "2026-03-25",
        "地点": ["北京市", "北京市"]
      },
      "设置": {
        "open_comment": true
      },
      "selected_comment_option": true
    }
  }'
```

## 8. Python 调用示例

```python
import requests

payload = {
    "platform": "baijiahao",
    "content": "# 标题\n\n正文",
    "cookie": "[{\"name\":\"BDUSS\",\"value\":\"...\"}]",
    "platform_options": {
        "摘要": "这是一段摘要",
        "展示封面": "单图",
        "分类": "科技",
        "声明AIGC": True,
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

## 9. 返回结果

成功后返回结构与其他平台一致，核心字段包括：

- `exit_code`
- `results`
- `summary`

单个平台成功记录中通常可看到：

- `platform`
- `account_info`
- `prepared`
- `result.article_id`
- `result.draft_url`
- `result.published_url`
- `output`

如果 `draft=true`，最终 URL 优先返回草稿编辑地址。

百家号补充说明：

- 草稿保存成功时，`result.preview_url` 只是后台预览地址，不代表已经正式发布。
- 只有正式发布接口成功后，`result.published_url` 才表示真实线上文章地址。

## 10. 调试产物

百家号平台每次真实发布或正式发布失败后，还会额外落盘：

- `baijiahao_publish/last_publish_result.json`
  - 统一发布服务的最近一次结果
- `baijiahao_publish/last_publish_debug.json`
  - 百家号三段链路调试结果
  - 关键字段通常包括：
    - `status`
    - `save`
    - `edit_check`
    - `publish`
    - `error`
    - `error_type`

如果需要排查“草稿能保存、正式发布失败”的问题，优先查看 `last_publish_debug.json`。

如果你走的是 Web API 调用链，还可以直接查看：

- `GET /api/artifacts?platform=baijiahao&include_content=true`

返回中会包含 `PUBLISH_DEBUG_PATH`，可直接看到最近一次 `save`、`editCheck` 和 `publish` 的调试结果。

另外可以直接查看状态：

- `GET /api/status?platform=baijiahao&include_content=true`

如果最近一次百家号实发满足：

- `save` 成功
- `editCheck` 成功
- `publish` 被平台风控拦截

那么返回状态会是：

- `publish_blocked_by_risk_control`

并在 `signals` 中带出：

- `publish_risk_blocked`
- `save_succeeded`
- `edit_check_passed`
- `publish_debug_error`

## 11. 注意事项

- `content` 必须带一级标题 `# 标题`
- `cookie` 需要是当前可用的百家号登录态
- `cover_layout="one"` 时至少需要 1 张图片
- `cover_layout="three"` 时至少需要 3 张图片
- `feed_cat` 传中文分类时，服务会先查分类映射再提交
- `declare_aigc=true` 时，若不传 `creative_method`，默认回退为 `bjh_pc_article`
- 目前真实链路已经打通到正式发布接口，但账号风控或平台安全验证仍可能阻断最终发布

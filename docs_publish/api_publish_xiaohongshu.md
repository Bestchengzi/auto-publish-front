# `POST /api/publish` 使用说明：`rednote`

本文说明如何通过统一 HTTP API `POST /api/publish` 调用小红书图文发布。

服务启动方式：

```bash
.venv/bin/python api_server.py --host 127.0.0.1 --port 8000
```

接口地址：

- 发布接口：`http://127.0.0.1:8000/api/publish`
- 账号信息接口：`http://127.0.0.1:8000/api/account-info`

## 1. 适用范围

当前 `rednote` 平台实现的是图文笔记发布流程，底层参考 `xhs_api.py` 中的 `publish_xhs_note`，通过 `api.beeize.com/creator/api/xhs/create_images_note` 进行 multipart 发布。统一入口仍然是：

- `platform`: `"rednote"`
- `content`: Markdown 字符串
- `cookie`: 直接传 Cookie 字符串或 JSON cookies 字符串

## 2. 顶层请求体字段

`/api/publish` 的通用字段和其他平台一致，常用如下：

- `platform`
- `content`
- `cookie`
- `platform_options`
- `draft`
- `dry_run`
- `skip_image_upload`
- `timeout`

其中对小红书需要特别注意：

- `draft=true` 当前不支持，会直接报错
- 图文至少需要 1 张图片
- 图片来自 Markdown 图片或 `platform_options.images`
- `platform_options.uploaded_images` 仅保留兼容解析，不参与实际发布；参考实现要求原始图片文件

## 3. Markdown 输入要求

必须包含一级标题：

```markdown
# 小红书标题

这是正文第一段。

![配图1](./a.png)

这是正文第二段。
```

规则说明：

- H1 作为默认标题；如果传了 `platform_options.title`，最终发布标题会以该字段为准，但 H1 仍需保留
- 正文里的 Markdown 图片会被提取为图文图片
- 去掉图片后的正文会转换成小红书 `desc`

## 4. 图片要求与实测结论

当前小红书图文发布依赖上游 multipart 上传链路，图片文件本身会直接参与发布请求。

实测结论：

- 小图可正常发布
- 图片过大时，上游可能返回 `uploadTempPermits` 相关错误
- 这类错误在当前服务里会被翻译成更明确的提示，优先建议压缩图片或换更小图片重试

建议：

- 优先使用压缩后的 `jpg` / `png`
- 单次请求前，先确认 Markdown 中引用的是本地真实图片文件
- 若返回“上传接口未返回有效上传凭证”且附带图片大小，先缩小图片再重试，不要先怀疑 cookie 失效

## 5. `platform_options` 字段说明

### `title`

- 类型：`string`
- 说明：覆盖 Markdown H1 标题

### `desc`

- 类型：`string`
- 说明：覆盖自动生成的正文描述

### `privacy`

- 类型：`string`
- 默认值：`"PUBLIC"`
- 支持值：
  - `"PUBLIC"` / `"公开"`
  - `"PRIVATE"` / `"私密"`
  - `"PARTIALLY_VISIBLE"` / `"关注可见"`
  - `"PARTIALLY_INVISIBLE"` / `"指定人可见"`

### `user_ids`

- 类型：`array[string]`
- 说明：当 `privacy` 为指定人可见类时，对应的用户 ID 列表

### `post_loc`

- 类型：`object`
- 说明：位置对象
- 常用字段：
  - `id` / `poi_id`
  - `name`
  - `address`
  - `lat` / `latitude`
  - `lng` / `longitude`

### `collection_id`

- 类型：`string`
- 说明：当前参考 API 不使用，保留兼容字段

### `note_copyable`

- 类型：`boolean`
- 说明：当前参考 API 不使用，保留兼容字段

### `original`

- 类型：`boolean`
- 说明：当前参考 API 不使用，保留兼容字段

### `is_private`

- 类型：`string`
- 支持值：`"0"`、`"1"`
- 说明：直接透传参考实现的私密参数
- 若未传，内部会根据 `privacy` 自动映射：`PRIVATE -> "1"`，其他值 -> `"0"`

### `proxy`

- 类型：`string`
- 说明：透传参考实现的代理参数

### `ats_list`

- 类型：`array[object]`
- 说明：透传 @ 用户列表

### `topic_list`

- 类型：`array[object]`
- 说明：透传话题列表

### `post_time`

- 类型：`string`
- 说明：预约发布时间，格式与参考实现一致，例如 `2026-03-26 12:00:00`

### `goods_id`

- 类型：`string`
- 说明：透传商品 ID

### `images`

- 类型：`array[string]`
- 说明：额外补充的图片来源列表
- 可与 Markdown 图片一起使用

### `uploaded_images`

- 类型：`array[object]`
- 说明：仅兼容旧字段解析，不会参与参考 API 的实际发布

## 6. 最常用请求示例

直接传正文和 cookie：

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "rednote",
    "content": "# 小红书图文标题\n\n第一段正文。\n\n![配图](./cover.png)\n",
    "cookie": "a1=...; web_session=...; gid=...; webId=...; xsecappid=ugc",
    "timeout": 30
  }'
```

显式传平台参数：

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "rednote",
    "content": "# 小红书图文标题\n\n正文内容。\n\n![图1](./1.png)\n![图2](./2.png)\n",
    "cookie": "a1=...; web_session=...; gid=...; webId=...; xsecappid=ugc",
    "platform_options": {
      "privacy": "公开",
      "note_copyable": true,
      "original": true,
      "collection_id": "collection-001",
      "post_loc": {
        "poi_id": "poi-001",
        "name": "上海外滩"
      }
    },
    "timeout": 30
  }'
```

带参考实现参数的完整示例：

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "rednote",
    "content": "# 小红书图文标题\n\n正文内容。\n\n![图1](./1.png)",
    "cookie": "a1=...; web_session=...; gid=...; webId=...; xsecappid=ugc",
    "platform_options": {
      "is_private": "0",
      "proxy": "",
      "ats_list": [],
      "topic_list": [
        {
          "id": "66954530000000002403df7e",
          "name": "集蜂云",
          "type": "topic"
        }
      ],
      "post_time": "2026-03-26 12:00:00",
      "goods_id": "goods-001"
    }
  }'
```

显式追加图片并使用私密发布：

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "rednote",
    "content": "# 小红书图文标题\n\n正文内容，无内嵌图片。",
    "cookie": "a1=...; web_session=...; gid=...; webId=...; xsecappid=ugc",
    "platform_options": {
      "is_private": "1",
      "images": ["./small-cover.jpg"],
      "topic_list": [
        {
          "id": "66954530000000002403df7e",
          "name": "集蜂云",
          "type": "topic"
        }
      ]
    },
    "timeout": 30
  }'
```

## 7. 返回结果

发布成功时，统一结果里会带：

- `article_id`
- `published_url`
- `type`

`published_url` 格式为：

```text
https://www.xiaohongshu.com/explore/<note_id>
```

## 8. 常见失败提示

### `uploadTempPermits`

当前服务会把这类上游错误翻译为类似下面的提示：

```text
小红书发布失败：上游上传接口未返回有效上传凭证。实测这类报错常见于图片过大，也可能是当前 Cookie 的上传态异常。请优先压缩图片或改用更小图片后重试。当前图片大小：big.png=3.0MB。
```

排查顺序建议：

1. 先缩小图片体积后重试
2. 再检查 Markdown 中引用的图片是否真实存在
3. 最后再检查 cookie 是否过期

### `draft=true`

小红书当前不支持草稿发布；传入 `draft=true` 会直接失败。

### 无图片

图文笔记至少需要 1 张图片。可通过两种方式提供：

- 在 Markdown 中写图片语法
- 通过 `platform_options.images` 额外传入本地图片路径

## 9. 当前实现说明

已确认的接口分层：

- 账号信息：`creator.xiaohongshu.com`
- 实际发布：`api.beeize.com/creator/api/xhs/create_images_note`

当前代码已经完成：

- 统一平台接入
- Cookie 直传
- 账号信息读取
- Markdown 图片提取
- multipart 图文发布

如果你要先验证会话是否有效，可先调用：

```bash
curl -s http://127.0.0.1:8000/api/account-info \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "rednote",
    "cookie": "a1=...; web_session=...; gid=...; webId=...; xsecappid=ugc"
  }'
```

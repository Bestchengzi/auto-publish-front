# `POST /api/publish` 使用说明：`wechat_mp`

本文只说明 HTTP API 的发布接口 `POST /api/publish`，并以 `wechat_mp` 为例说明完整用法。

服务默认启动方式：

```bash
.venv/bin/python api_server.py --host 127.0.0.1 --port 8000
```

默认接口地址：

- 发布接口：`http://127.0.0.1:8000/api/publish`
- 健康检查：`http://127.0.0.1:8000/healthz`

## 1. 接口用途

用于直接调用统一发布服务，向微信公众号发布图文。

最常见的调用方式是：

- 直接传 `content` 字符串
- 直接传 `cookie` 字符串
- 通过 `platform_options` 传公众号文章设置

## 2. 请求方式

- Method: `POST`
- Content-Type: `application/json`

## 3. 顶层请求体字段

这些字段属于 `/api/publish` 的通用请求体，不只 `wechat_mp` 可用。

### `platform`

- 类型：`string`
- 必填：是
- `wechat_mp` 单平台调用时固定传：`"wechat_mp"`

### `content`

- 类型：`string`
- 必填：否
- 说明：直接传 Markdown 内容
- 与 `article_file` 二选一即可

### `article_file`

- 类型：`string`
- 必填：否
- 说明：Markdown 文件路径

### `cookie`

- 类型：`string`
- 必填：否
- 说明：微信公众号后台 Cookie 字符串

### `cookie_file`

- 类型：`string`
- 必填：否
- 说明：Cookie 文件路径

### `platform_options`

- 类型：`object`
- 必填：否
- 说明：公众号图文设置项

### `draft`

- 类型：`boolean`
- 必填：否
- 默认值：`false`
- 说明：
  - `true`：保存草稿
  - `false`：正式发表

### `dry_run`

- 类型：`boolean`
- 必填：否
- 默认值：`false`

### `skip_image_upload`

- 类型：`boolean`
- 必填：否
- 默认值：`false`

### `timeout`

- 类型：`integer`
- 必填：否
- 默认值：`20`

## 4. `wechat_mp` 的 `platform_options`

以下字段都写在 `platform_options` 对象里。

### 标题

#### `title`

- 类型：`string`
- 说明：覆盖 Markdown 一级标题

也支持这些别名：

- `标题`

### 原文链接

#### `source_url`

- 类型：`string`
- 说明：原文链接

也支持这些别名：

- `sourceurl`
- `原文链接`
- `原文地址`

### 留言开关

#### `enable_comment`

- 类型：`boolean`
- 说明：是否开启留言

也支持这些别名：

- `open_comment`
- `留言开关`

### 谁可以留言

#### `comment_permission`

- 类型：`string` 或 `integer`
- 说明：谁可以留言

支持值：

- `0` / `所有人`
- `1` / `已关注的人`
- `2` / `已关注7天及以上的人`

也支持别名：

- `who_can_comment`
- `谁可以留言`

### 谁可以回复

#### `reply_permission`

- 类型：`string` 或 `integer`
- 说明：谁可以回复

支持值：

- `0` / `所有人`
- `1` / `已关注的人`
- `2` / `已关注7天及以上的人`

也支持别名：

- `who_can_reply`
- `谁可以回复`

### 自动精选留言

#### `auto_select_comment`

- 类型：`boolean`
- 说明：是否自动精选留言

也支持：

- `auto_elect_comment`
- `自动精选留言`

### 自动精选回复

#### `auto_select_reply`

- 类型：`boolean`
- 说明：是否自动精选回复

也支持：

- `auto_elect_reply`
- `自动精选回复`

### 原创声明

#### `copyright_type`

- 类型：`string` 或 `integer`
- 说明：原创声明类型

当前支持：

- `0` / `文字原创` / `text`
- `1` / `漫画原创` / `cartoon`

也支持别名：

- `original_statement`
- `原创声明`

#### `original_article_type`

- 类型：`string`
- 说明：原创分类字符串
- 例如：`科技_软件工具`

也支持别名：

- `article_category`
- `原创分类`

### 赞赏

#### `can_reward`

- 类型：`boolean`
- 说明：是否开启赞赏

也支持别名：

- `enable_reward`
- `开启赞赏`
- `原创声明后开启赞赏`

#### `reward_reply_id`

- 类型：`string`
- 说明：赞赏自动回复素材 ID

#### `pay_gifts_count`

- 类型：`integer`
- 说明：赞赏配置中的相关数值字段，通常无需手传

### 合集

#### `appmsg_album_info`

- 类型：`object`
- 说明：合集信息

推荐传法：

```json
{
  "id": "album-001",
  "title": "我的合集"
}
```

也支持：

- `album`
- `album_info`
- `合集`

内部会转成：

```json
{
  "appmsg_album_infos": [
    {
      "id": "album-001",
      "title": "我的合集"
    }
  ]
}
```

### 创作来源

#### `claim_source_type`

- 类型：`string` 或 `integer`
- 说明：创作来源声明类型

支持值：

- `0` / `无需声明`
- `1` / `内容由AI生成`
- `2` / `素材来源官方媒体/网络新闻`
- `3` / `内容剧情演绎，仅供娱乐`
- `4` / `个人观点，仅供参考`
- `5` / `健康医疗分享，仅供参考`
- `6` / `投资观点，仅供参考`

#### `claim_source`

- 类型：`string` 或 `object`
- 说明：
  - 传字符串时，会自动映射到 `claim_source_type`
  - 传对象时，会原样写入公众号接口字段

也支持别名：

- `创作来源`

#### `is_user_no_claim_source`

- 类型：`boolean`
- 说明：是否显式标记“无需声明”

说明：

- 如果 `claim_source` 传的是 `无需声明`，代码会自动补这个标记

### 平台推荐

#### `platform_recommend`

- 类型：`boolean`
- 说明：是否允许平台推荐

也支持：

- `recommend`
- `平台推荐`

内部会转换成：

- `disable_recommend=0` 表示开启推荐
- `disable_recommend=1` 表示关闭推荐

#### `disable_recommend`

- 类型：`boolean`
- 说明：直接传公众号编辑器同名字段
- 优先级高于 `platform_recommend`

## 5. 最小草稿示例

```json
{
  "platform": "wechat_mp",
  "cookie": "bizuin=xxx; data_ticket=xxx; slave_sid=xxx; slave_user=xxx",
  "content": "# 我的公众号文章\n\n这是正文。",
  "draft": true
}
```

## 6. 正式发表示例

```json
{
  "platform": "wechat_mp",
  "cookie": "bizuin=xxx; data_ticket=xxx; slave_sid=xxx; slave_user=xxx",
  "content": "# 我的公众号文章\n\n这是正文。",
  "platform_options": {
    "原文链接": "https://example.com/source",
    "留言开关": true,
    "谁可以留言": "所有人",
    "谁可以回复": "所有人",
    "自动精选留言": true,
    "自动精选回复": true,
    "创作来源": "无需声明",
    "平台推荐": true
  }
}
```

## 7. 带更多设置的完整示例

```json
{
  "platform": "wechat_mp",
  "cookie": "bizuin=xxx; data_ticket=xxx; slave_sid=xxx; slave_user=xxx",
  "content": "# 我的公众号文章\n\n这是正文。",
  "platform_options": {
    "source_url": "https://example.com/source",
    "comment_permission": "已关注的人",
    "reply_permission": "已关注的人",
    "auto_select_comment": true,
    "auto_select_reply": false,
    "copyright_type": "文字原创",
    "original_article_type": "科技_软件工具",
    "can_reward": true,
    "reward_reply_id": "reply-001",
    "appmsg_album_info": {
      "id": "album-001",
      "title": "测试合集"
    },
    "claim_source": "内容由AI生成",
    "platform_recommend": true
  }
}
```

## 8. `curl` 调用示例

```bash
curl -X POST http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "wechat_mp",
    "cookie": "bizuin=xxx; data_ticket=xxx; slave_sid=xxx; slave_user=xxx",
    "content": "# 我的公众号文章\n\n这是正文。",
    "platform_options": {
      "留言开关": true,
      "谁可以留言": "所有人",
      "自动精选留言": true,
      "创作来源": "无需声明",
      "平台推荐": true
    }
  }'
```

## 9. 返回结果说明

成功时返回 JSON，核心字段通常包括：

- `ok`: 是否成功
- `results`: 各平台结果列表
- `result.article_id`: 公众号 `appMsgId`
- `result.draft_url`: 后台草稿编辑地址
- `result.publish_result.msgid`: 群发消息 ID

## 10. 注意事项

- `content` 必须包含一级标题 `# 标题`
- 如果账号开启了群发保护，接口会直接失败并返回以下提示，不再提供二维码扫码流程：
  `账号开启了群发保护；需前往微信公众平台-设置与开发-安全中心-风险操作保护-关闭<群发消息>保护后再试。`
- 当前返回的一般是公众号后台编辑地址，不是前台文章公开链接
- 合集、原创声明、赞赏、平台推荐等参数是否最终被平台接受，仍取决于账号权限和平台校验

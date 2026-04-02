# `POST /api/publish` 使用说明：`douyin`

本文说明如何通过统一发布接口向抖音创作者中心提交视频。

服务默认启动方式：

```bash
.venv/bin/python api_server.py --host 127.0.0.1 --port 8000
```

默认接口地址：

- 发布接口：`http://127.0.0.1:8000/api/publish`
- 健康检查：`http://127.0.0.1:8000/healthz`

## 1. 前置要求

抖音当前不是纯 HTTP 发布，而是浏览器辅助发布。

调用前需要满足：

- 本机已安装并能打开 Chrome
- Chrome 以远程调试模式启动，默认端口 `9223`
- 例如：

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9223
```

- 请求里提供有效的抖音创作者 Cookie
- 提供可被统一接口解析的视频输入

可通过环境变量覆盖调试地址：

- `DOUYIN_CDP_HOST`
- `DOUYIN_CDP_PORT`

## 2. 接口用途

用于把视频上传到抖音创作者中心，并执行：

- 正式发布
- 或保存草稿

## 3. 顶层请求体字段

以下字段属于统一发布接口的通用字段，其中 `douyin` 最关键的是视频输入字段。

### `platform`

- 类型：`string`
- 必填：是
- 固定传：`"douyin"`

### `video_file`

- 类型：`string`
- 必填：否
- 说明：本地视频文件绝对路径

### `video_url`

- 类型：`string`
- 必填：否
- 说明：远程视频链接，当前支持 `http://` 与 `https://`

### `video_filename`

- 类型：`string`
- 必填：否
- 说明：视频链接下载后的目标文件名，或上传流落盘时的文件名

### 上传视频流

- `multipart/form-data`：
  - 文件字段支持 `video`、`video_file`、`video_upload`、`video_stream`
- 原始流请求：
  - `Content-Type` 为 `video/*` 或 `application/octet-stream`
  - 元数据通过 `X-Publish-Meta` 请求头 JSON 或查询参数传入

说明：

- `video_file`、`video_url`、上传流三种输入方式只应提供一种

### `content`

- 类型：`string`
- 必填：否
- 说明：可选的标题/简介来源
- 若为 Markdown，建议包含一级标题：

```markdown
# 视频标题

这里是视频简介。
```

解析规则：

- 一级标题作为视频标题
- 正文转成纯文本后作为视频简介

### `article_file`

- 类型：`string`
- 必填：否
- 说明：可选的 Markdown 文件路径
- 当未传 `content` 时，可作为标题/简介来源

### `cookie_file`

- 类型：`string`
- 必填：否
- 说明：Cookie 文件路径
- 推荐直接放浏览器导出的 JSON cookie 列表

### `cookie`

- 类型：`string`
- 必填：否
- 说明：登录态 Cookie 字符串或 JSON cookies

### `platform_options`

- 类型：`object`
- 必填：否
- 说明：抖音视频发布扩展参数

### `draft`

- 类型：`boolean`
- 必填：否
- 默认值：`false`
- 说明：
  - `true`：暂存离开
  - `false`：正式发布

### `dry_run`

- 类型：`boolean`
- 必填：否
- 默认值：`false`
- 说明：只做本地预处理，不调用浏览器发布动作

### `timeout`

- 类型：`integer`
- 必填：否
- 默认值：`20`
- 说明：账号信息读取等 HTTP 请求超时时间，单位秒

## 4. `douyin` 的 `platform_options`

以下字段都放在 `platform_options` 对象里。

### `title`

- 类型：`string`
- 说明：覆盖视频标题
- 兼容别名：`标题`

### `description`

- 类型：`string`
- 说明：覆盖视频简介
- 兼容别名：
  - `desc`
  - `简介`
  - `描述`
  - `正文`

### `visibility`

- 类型：`string`
- 说明：控制“谁可以看”
- 兼容别名：
  - `who_can_watch`
  - `谁可以看`
  - `可见范围`

支持值：

- `公开`
- `好友可见`
- `仅自己可见`

也兼容英文值：

- `public`
- `friends`
- `private`

## 5. 示例

### 5.1 保存草稿

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "douyin",
    "video_file": "/absolute/path/demo.mp4",
    "content": "# 视频标题\n\n视频简介",
    "cookie": "[{\"name\":\"sessionid\",\"value\":\"...\"}]",
    "platform_options": {
      "visibility": "仅自己可见"
    },
    "draft": true
  }'
```

### 5.2 正式发布

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "douyin",
    "video_file": "/absolute/path/demo.mp4",
    "platform_options": {
      "title": "覆盖标题",
      "description": "覆盖简介",
      "visibility": "公开"
    },
    "cookie_file": "/absolute/path/douyin-cookie.json"
  }'
```

## 6. 返回结果说明

成功时仍沿用统一结果结构：

- `prepared`: 预处理摘要
- `result`: 平台返回结果与浏览器当前 URL
- `summary`: 标准输出行

抖音当前会尽量返回：

- `published_url`
- 或 `draft_url`
- 若能从平台响应中提取到作品 ID，也会回填到 `article_id` 字段以兼容现有统一结构

## 7. 注意事项

- 当前版本优先保证“上传视频 + 填标题/简介 + 设置可见范围 + 发布/暂存”的主链路
- 如果页面弹出二次确认、风控验证或安全提示，接口会报错并把调试信息写到：
  - `douyin_publish/last_publish_debug.json`
- 建议第一次接入先走 `draft=true`

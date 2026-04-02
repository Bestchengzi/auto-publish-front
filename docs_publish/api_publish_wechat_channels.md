# `POST /api/publish` 使用说明：`wechat_channels`

本文说明如何通过统一发布接口向微信视频号提交视频。

服务默认启动方式：

```bash
.venv/bin/python api_server.py --host 127.0.0.1 --port 8000
```

默认接口地址：

- 发布接口：`http://127.0.0.1:8000/api/publish`
- 健康检查：`http://127.0.0.1:8000/healthz`

## 1. 接口用途

用于把视频发布到视频号，当前支持：

- 正式发布
- 保存草稿

注意：

- `wechat_channels` 当前只支持视频发布，不支持把 Markdown 图文直接发布到视频号。
- `content` 或 `article_file` 仅作为视频标题/简介的来源。

## 2. 发布路径说明

视频号当前有两条发布路径：

- HTTP 直发
- 浏览器辅助发布

当前默认策略：

- `draft=false` 且具备 `X-WECHAT-UIN`、`finger-print-device-id` 时，优先走 HTTP 直发
- `draft=true` 时，走浏览器路径
- `publish_mode=auto` 且缺少 HTTP 头部时，回退到浏览器路径
- `publish_mode=http` 但缺少 HTTP 头部时，直接报错
- `publish_mode=browser` 时，强制走浏览器路径

说明：

- 浏览器创建页上出现“你还不能发表视频”不应再被当作唯一发布能力判断依据
- 对部分账号，浏览器页面文案可能阻断，但同一会话的 HTTP 直发仍能成功

## 3. 前置要求

### 3.1 HTTP 直发

正式发布推荐使用 HTTP 直发。调用前需要准备：

- 有效的视频号 Cookie
- 可被接口解析的视频输入
- `X-WECHAT-UIN`
- `finger-print-device-id`

可选但推荐提供：

- `finder_username`

### 3.2 浏览器路径

当你要保存草稿，或显式强制走浏览器路径时，需要：

- 本机已安装 Chrome
- Chrome 以远程调试模式启动
- 默认调试端口为 `9223`

例如：

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9223
```

可通过环境变量覆盖浏览器地址：

- `WECHAT_CHANNELS_CDP_HOST`
- `WECHAT_CHANNELS_CDP_PORT`

## 4. 顶层请求体字段

以下字段属于统一发布接口的通用字段，其中 `wechat_channels` 最关键的是视频输入字段。

### `platform`

- 类型：`string`
- 必填：是
- 固定传：`"wechat_channels"`

### `video_file`

- 类型：`string`
- 必填：否
- 说明：本地视频文件绝对路径

### `video_url`

- 类型：`string`
- 必填：否
- 说明：远程视频链接，当前支持 `http://` 与 `https://`

说明：

- 服务端会先把视频下载到临时文件，再走现有视频发布链路
- 当 URL 不带扩展名时，建议同时传 `video_filename`

### `video_filename`

- 类型：`string`
- 必填：否
- 说明：视频链接下载后的目标文件名，或上传流落盘时的文件名

说明：

- 原始视频流上传时，若未提供，服务端会按 `Content-Type` 自动补默认扩展名
- `video_file`、`video_url`、上传流三种输入方式只应提供一种

### 上传视频流

- HTTP `multipart/form-data`：
  - 文件字段支持 `video`、`video_file`、`video_upload`、`video_stream`
  - 其他字段仍按普通表单传，例如 `platform`、`cookie`、`content`
- HTTP 原始流：
  - `Content-Type` 可为 `video/*` 或 `application/octet-stream`
  - 其他元数据可通过请求头 `X-Publish-Meta` 传 JSON 对象
  - 也可通过查询参数传 `platform`、`cookie`、`content`、`video_filename` 等字段

### `content`

- 类型：`string`
- 必填：否
- 说明：可选的标题/简介来源

若为 Markdown，建议包含一级标题：

```markdown
# 视频标题

这里是视频简介。
```

解析规则：

- 一级标题作为视频标题
- 正文转成纯文本后作为视频简介
- 若未提供标题，最终会回退到视频文件名

### `article_file`

- 类型：`string`
- 必填：否
- 说明：可选的 Markdown 文件路径
- 当未传 `content` 时，可作为标题/简介来源

### `cookie`

- 类型：`string`
- 必填：否
- 说明：登录态 Cookie 字符串或 JSON cookies

支持两种常见形式：

- 普通 Cookie 字符串：`"sessionid=...; wxuin=..."`
- 浏览器导出的 JSON cookies 数组

### `cookie_file`

- 类型：`string`
- 必填：否
- 说明：Cookie 文件路径

### `platform_options`

- 类型：`object`
- 必填：否
- 说明：视频号视频发布扩展参数

### `draft`

- 类型：`boolean`
- 必填：否
- 默认值：`false`
- 说明：
  - `true`：保存草稿
  - `false`：正式发布

说明：

- 目前草稿仍依赖浏览器路径

### `dry_run`

- 类型：`boolean`
- 必填：否
- 默认值：`false`
- 说明：只做本地预处理，不调用真实上传/发布动作

### `timeout`

- 类型：`integer`
- 必填：否
- 默认值：`20`
- 说明：账号信息读取等 HTTP 请求超时时间，单位秒

## 5. `wechat_channels` 的 `platform_options`

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
  - `content`
  - `正文`

### `short_title`

- 类型：`string`
- 说明：短标题
- 兼容别名：
  - `shortTitle`
  - `短标题`

说明：

- 浏览器路径会尝试填写短标题输入框
- HTTP 直发仅在显式传入 `short_title` 时才会写入 `shortTitle`
- 若未显式传入，HTTP 直发不会把自动推导出的标题强行写成短标题

### `x_wechat_uin`

- 类型：`string`
- 说明：HTTP 直发所需请求头 `X-WECHAT-UIN`
- 兼容别名：
  - `xWechatUin`
  - `wechat_uin`
  - `X-WECHAT-UIN`
  - `微信UIN`

### `fingerprint_device_id`

- 类型：`string`
- 说明：HTTP 直发所需请求头 `finger-print-device-id`
- 兼容别名：
  - `fingerPrintDeviceId`
  - `finger-print-device-id`
  - `device_id`
  - `设备指纹ID`

### `finder_username`

- 类型：`string`
- 说明：视频号账号标识
- 兼容别名：
  - `finderUsername`
  - `视频号账号`
  - `视频号ID`

说明：

- 若不手传，程序会优先尝试从账号信息接口里读取
- 已知场景下，显式传入会更稳定

### `publish_mode`

- 类型：`string`
- 说明：控制发布路径
- 兼容别名：
  - `publishMode`
  - `mode`
  - `发布方式`

支持值：

- `auto`
- `http`
- `browser`

含义：

- `auto`：优先 HTTP，缺少必要头部时回退浏览器
- `http`：强制 HTTP 直发
- `browser`：强制浏览器路径

### `declare_original`

- 类型：`boolean`
- 说明：声明原创
- 兼容别名：
  - `declareOriginal`
  - `原创声明`

说明：

- 当前实现按页面 bundle 的已确认逻辑，把该状态写入 `postFlag.Original_Flag`
- 当前不会额外猜测或伪造未确认的 `originalInfoDesc` 结构

### `ext_reading`

- 类型：`object`
- 说明：附加链接信息，对应 `objectDesc.extReading`
- 兼容别名：
  - `extReading`
  - `链接信息`
  - `扩展链接`

也支持以下便捷字段：

- `ext_reading_link` / `extReadingLink`
- `ext_reading_title` / `extReadingTitle`
- `ext_reading_url_type` / `extReadingUrlType`

说明：

- 便捷字段会合并进 `ext_reading`
- `ext_reading_link` 必须是 `http://` 或 `https://` URL

### `member`

- 类型：`object`
- 说明：会员/VIP 发布信息，对应 `objectDesc.member`
- 兼容别名：
  - `会员`

说明：

- 当 `member` 非空时，HTTP 直发会同时写入 `postFlag.Member_Flag`

### `location`

- 类型：`object`
- 说明：作品定位，对应 `objectDesc.location`
- 兼容别名：
  - `定位`
  - `位置`

说明：

- 若对象中包含 `longitude/lng` 与 `latitude/lat`，会同步映射到顶层 `longitude`、`latitude`

### `feed_location`

- 类型：`object`
- 说明：动态流定位，对应 `objectDesc.feedLocation`
- 兼容别名：
  - `feedLocation`

说明：

- 若对象中包含 `longitude/lng` 与 `latitude/lat`，会同步映射到顶层 `feedLongitude`、`feedLatitude`

### `topic`

- 类型：`object` 或 `array`
- 说明：话题信息，对应 `objectDesc.topic`
- 兼容别名：
  - `topics`
  - `话题`

说明：

- 当显式传入时，也会按页面 bundle 的已确认逻辑同步到顶层 `topics`

### `event`

- 类型：`object`
- 说明：活动信息，对应 `objectDesc.event`
- 兼容别名：
  - `活动`

### `mentioned_user`

- 类型：`array`
- 说明：@ 用户列表，对应 `objectDesc.mentionedUser`
- 兼容别名：
  - `mentionedUser`
  - `提及用户`

### `component`

- 类型：`object`
- 说明：附加组件信息，对应 `objectDesc.component`
- 兼容别名：
  - `组件`

也支持以下便捷字段：

- `component_id` / `componentId`
- `component_type` / `componentType`
- `component_title` / `componentTitle`

### `follow_post_info`

- 类型：`object`
- 说明：跟拍/BGM 等附加信息，对应 `objectDesc.followPostInfo`
- 兼容别名：
  - `followPostInfo`
  - `bgm_data`
  - `bgmData`
  - `背景音乐`

## 6. 环境变量

除 `platform_options` 外，也可以通过环境变量提供 HTTP 直发参数：

- `WECHAT_CHANNELS_X_WECHAT_UIN`
- `WECHAT_CHANNELS_FINGERPRINT_DEVICE_ID`
- `WECHAT_CHANNELS_FINDER_USERNAME`
- `WECHAT_CHANNELS_PUBLISH_MODE`

优先级说明：

- `platform_options` 高于环境变量

## 7. 示例

### 7.1 HTTP 直发正式发布

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "wechat_channels",
    "video_url": "https://example.com/demo.mov",
    "video_filename": "demo.mov",
    "content": "# 视频标题\n\n这里是视频简介。",
    "cookie": "[{\"name\":\"sessionid\",\"value\":\"...\"},{\"name\":\"wxuin\",\"value\":\"...\"}]",
    "platform_options": {
      "x_wechat_uin": "3382031421",
      "fingerprint_device_id": "d07827f22a289a98bb0326d53aa6538b",
      "finder_username": "v2_xxx@finder",
      "publish_mode": "http"
    }
  }'
```

### 7.1.2 通过 `multipart/form-data` 上传视频流

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -F 'platform=wechat_channels' \
  -F 'cookie_file=/absolute/path/wechat-channels-cookie.json' \
  -F 'content=# 视频标题\n\n这里是视频简介。' \
  -F 'platform_options={"publish_mode":"http","x_wechat_uin":"3382031421","fingerprint_device_id":"d07827f22a289a98bb0326d53aa6538b"}' \
  -F 'video=@/absolute/path/demo.mov;type=video/quicktime'
```

### 7.1.3 通过原始请求体发送视频流

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: video/mp4' \
  -H 'X-Publish-Meta: {"platform":"wechat_channels","cookie_file":"/absolute/path/wechat-channels-cookie.json","content":"# Video Title\\n\\nVideo description.","video_filename":"demo.mp4","platform_options":{"publish_mode":"http","x_wechat_uin":"3382031421","fingerprint_device_id":"d07827f22a289a98bb0326d53aa6538b"}}' \
  --data-binary @/absolute/path/demo.mp4
```

### 7.1.1 HTTP 直发并携带编辑页可选参数

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "wechat_channels",
    "video_file": "/absolute/path/demo.mov",
    "cookie_file": "/absolute/path/wechat-channels-cookie.json",
    "platform_options": {
      "x_wechat_uin": "3382031421",
      "fingerprint_device_id": "d07827f22a289a98bb0326d53aa6538b",
      "finder_username": "v2_xxx@finder",
      "publish_mode": "http",
      "short_title": "6到16字短标题",
      "declare_original": true,
      "ext_reading": {
        "link": "https://example.com/article",
        "title": "相关阅读",
        "urlType": 11
      },
      "location": {
        "city": "南京市",
        "latitude": 32.09635925292969,
        "longitude": 118.90907287597656
      },
      "topic": {
        "finderTopicInfo": "#集蜂云"
      },
      "mentioned_user": [
        {"finderUsername": "v2_xxx@finder"}
      ],
      "component": {
        "id": "component-1",
        "type": 7,
        "title": "课程标题"
      }
    }
  }'
```

### 7.2 用环境变量走 HTTP 直发

```bash
export WECHAT_CHANNELS_X_WECHAT_UIN="3382031421"
export WECHAT_CHANNELS_FINGERPRINT_DEVICE_ID="d07827f22a289a98bb0326d53aa6538b"
export WECHAT_CHANNELS_FINDER_USERNAME="v2_xxx@finder"
export WECHAT_CHANNELS_PUBLISH_MODE="auto"

curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "wechat_channels",
    "video_file": "/absolute/path/demo.mov",
    "cookie_file": "/absolute/path/wechat-channels-cookie.json",
    "content": "# 视频标题\n\n这里是视频简介。"
  }'
```

### 7.3 浏览器路径保存草稿

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "wechat_channels",
    "video_file": "/absolute/path/demo.mov",
    "cookie_file": "/absolute/path/wechat-channels-cookie.json",
    "platform_options": {
      "title": "覆盖标题",
      "description": "覆盖简介",
      "short_title": "短标题",
      "publish_mode": "browser"
    },
    "draft": true
  }'
```

## 8. 返回结果说明

成功时仍沿用统一结果结构：

- `prepared`: 视频标题、简介、文件路径、文件大小等预处理摘要
- `result`: 平台返回结果
- `summary`: 标准输出行

视频号当前会尽量返回：

- `published_url`
- 或 `draft_url`
- `draft_only`
- `type=video`

HTTP 直发成功时，`result` 中通常还会包含：

- `publish_method="http"`
- `video_clip_task_id`
- `trace_key`
- `upload_host`
- `video_meta`

说明：

- 当前视频号正式发布成功后，接口未稳定返回作品分享页 URL
- 因此 `published_url` 目前可能回填为视频号平台主页，而不是单条作品地址

## 9. 注意事项

- 正式发布推荐优先提供 HTTP 直发所需头部，不要只依赖浏览器页面文案判断权限
- 当前 HTTP 路径已覆盖主发布链路：
  - `helper_upload_params`
  - `auth/auth_data`
  - `snsuploadbig`
  - `post_clip_video`
  - `post_create`
- 当前正式 API 已支持把以下编辑页已确认字段透传到 `post_create`：
  - `shortTitle`
  - `extReading`
  - `member`
  - `location`
  - `feedLocation`
  - `topic`
  - `event`
  - `mentionedUser`
  - `component`
  - `followPostInfo`
  - `postFlag` 中的 `Original_Flag` / `Member_Flag`
- 草稿保存仍主要依赖浏览器路径
- 浏览器路径若失败，调试信息会写到：
  - `wechat_channels_publish/last_publish_debug.json`
- 第一次接入建议先用较短视频做一次正式或草稿验证，确认 Cookie、`X-WECHAT-UIN` 与设备指纹匹配

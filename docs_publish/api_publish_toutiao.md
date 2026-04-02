# `POST /api/publish` 使用说明：`toutiao`

本文只说明 HTTP API 的发布接口 `POST /api/publish`，并以 `toutiao` 为例说明完整用法。

服务默认启动方式：

```bash
.venv/bin/python api_server.py --host 127.0.0.1 --port 8000
```

默认接口地址：

- 发布接口：`http://127.0.0.1:8000/api/publish`
- 健康检查：`http://127.0.0.1:8000/healthz`

## 1. 接口用途

用于直接调用统一发布服务，向一个或多个平台发布文章。

以 `toutiao` 为例，最常见的调用方式是：

- 直接传 `content` 字符串
- 直接传 `cookie` 字符串
- 通过 `platform_options` 传头条发布参数

## 2. 请求方式

- Method: `POST`
- Content-Type: `application/json`

## 3. 顶层请求体字段

这些字段属于 `/api/publish` 的通用请求体，不只 `toutiao` 可用。

### `platform`

- 类型：`string`
- 必填：是
- 说明：目标平台
- `toutiao` 单平台调用时固定传：`"toutiao"`
- 也支持多平台逗号分隔，例如：`"toutiao,zhihu"`

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
- 如果已经直接传了 `cookie`，通常不需要再传这个字段

### `cookie`

- 类型：`string`
- 必填：否
- 说明：登录态 Cookie 字符串
- `toutiao` 单平台调用时，推荐直接传完整 Cookie 字符串

### `platform_options`

- 类型：`object`
- 必填：否
- 说明：平台发布扩展参数
- `toutiao` 的全部发布参数都放在这里

### `draft`

- 类型：`boolean`
- 必填：否
- 默认值：`false`
- 说明：
  - `true`：保存为草稿
  - `false`：正式提交发布

### `dry_run`

- 类型：`boolean`
- 必填：否
- 默认值：`false`
- 说明：
  - `true`：只做本地转换和 payload 生成，不访问平台真实发布接口
  - `false`：真实请求平台接口

### `skip_image_upload`

- 类型：`boolean`
- 必填：否
- 默认值：`false`
- 说明：
  - `true`：跳过图片上传，保留原始图片地址
  - `false`：按头条规则上传图片并替换正文图片地址
- 对 `toutiao` 而言，如果需要根据正文图片自动生成封面字段 `pgc_feed_covers`，不要设为 `true`
- 如果你显式传了 `platform_options.pgc_feed_covers`，服务端会优先按这组链接处理封面图，不再依赖正文图片顺序

### `timeout`

- 类型：`integer`
- 必填：否
- 默认值：`20`
- 说明：HTTP 请求超时时间，单位秒

## 4. `toutiao` 的 `platform_options` 全参数说明

以下字段都写在 `platform_options` 对象内。

---

### `title`

- 类型：`string`
- 说明：覆盖 Markdown 一级标题

说明：

- 不传时默认取 Markdown 第一行 `# 标题`
- 传入后只覆盖最终发布标题，不影响正文解析

---

### `cover_mode`

- 类型：`string`
- 说明：展示封面模式
- 支持值：
  - `"none"` / `"无封面"`
  - `"single"` / `"单图"`
  - `"three"` / `"三图"`

说明：

- `single/单图` 要求正文至少有 1 张图片
- `three/三图` 要求正文至少有 3 张图片
- 当前实现会按正文图片在 Markdown 中出现的顺序选封面：
  - `single` 取第 1 张
  - `three` 取前 3 张
- 如果前端希望精确控制封面图，优先改传 `pgc_feed_covers`
- `cover_mode` 更适合“直接从正文图自动选封面”的场景

---

### `pgc_feed_covers`

- 类型：`string[]`
- 说明：显式指定封面图链接数组。前端只需要传图片链接，不需要自己构造头条官方要求的复杂对象。
- 优先级：高于 `cover_mode`

推荐规则：

- `[]` -> 无封面
- `["https://.../cover.jpg"]` -> 单图封面
- `["https://.../1.jpg", "https://.../2.jpg", "https://.../3.jpg"]` -> 三图封面
- 传 `3` 张以上时，服务端只取前 `3` 张
- 传 `2` 张会报错，因为头条只支持无封面 / 单图 / 三图

服务端内部处理逻辑：

- 如果链接已经出现在正文图片里，优先复用正文图的上传结果
- 如果链接不在正文里，服务端会单独上传这组封面图
- 最终仍会转换成头条真实接口要求的 `pgc_feed_covers` JSON 字符串

头条真实接口内部提交的每一项结构类似：

```json
{
  "id": 0,
  "url": "上传接口返回的 url",
  "uri": "上传接口返回的 web_uri / origin_web_uri / uri / original",
  "origin_uri": "同 uri",
  "ic_uri": "同 uri",
  "thumb_width": 800,
  "thumb_height": 902
}
```

说明：

- 上面这个对象结构由服务根据图片上传结果自动拼装
- 如果你直连头条官方接口 `/mp/agw/article/publish/`，则 `pgc_feed_covers` 需要作为 JSON 字符串随表单提交
- 如果你调用的是本文档说明的 `/api/publish`，则只需要传图片链接数组，服务端会自动转换

如果你不传 `pgc_feed_covers`，仍然可以继续使用 `cover_mode`，由服务端按正文图片顺序自动选封面：

- `cover_mode="none"` -> 内部提交 `cover_type=1`，`pgc_feed_covers=[]`
- `cover_mode="single"` -> 内部提交 `cover_type=2`，`pgc_feed_covers` 取正文第 1 张图
- `cover_mode="three"` -> 内部提交 `cover_type=3`，`pgc_feed_covers` 取正文前 3 张图

---

### `position`

- 类型：`object`
- 说明：文章位置。推荐前端只传城市名称和城市编码，复杂映射由服务端处理。

推荐写法：

示例：

```json
{
  "city": "上海",
  "id": "310000"
}
```

说明：

- `city`: 城市名称，例如 `上海`、`北京`
- `id`: 城市编码，来源于 [`toutiao_publish/position.json`](/Users/zhaoyang/Desktop/beeize/publish_articles/toutiao_publish/position.json) 的 `code`
- `city` 和 `id` 允许只传一个；服务端会根据映射表自动补齐另一个
- 如果两者同时传但不匹配，接口会直接报错
- 为兼容历史调用，旧的完整 POI 对象仍然可用；但新接入前端不建议再传经纬度、`type_code`、`poi_id`

---

### `enable_ad`

- 类型：`boolean`
- 说明：是否投放广告赚收益
- 取值：
  - `true`：投放广告赚收益
  - `false`：不投放广告

---

### `first_publish`

- 类型：`boolean`
- 说明：是否声明头条首发
- 取值：
  - `true`：声明首发
  - `false`：不声明

说明：

- 当前已验证接口接受该参数
- 但平台回读里暂时没有稳定字段能证明它被长期持久化

---

### `collection_id`

- 类型：`string`
- 说明：合集 ID
- 仅在你已经拿到真实可用合集 ID 时传

说明：

- 代码支持传该字段
- 但是否能成功挂到合集，取决于你传入的 `collection_id` 是否真实有效，以及账号是否具备合集权限

---

### `sync_to_weitoutiao`

- 类型：`boolean`
- 说明：是否同时发布微头条
- 取值：
  - `true`：同时发布微头条
  - `false`：不同时发布

---

### `work_statement`

- 类型：`string`
- 说明：作品声明的快捷写法
- 支持值：
  - `"取材网络"`
  - `"引用站内"`
  - `"个人观点，仅供参考"`
  - `"引用AI"`
  - `"虚构演绎，故事经历"`
  - `"投资观点，仅供参考"`
  - `"健康医疗分享，仅供参考"`

说明：

- 普通场景下直接传 `work_statement` 就够用
- 如果需要更细控制，可改传 `info_source`

---

### `info_source`

- 类型：`object`
- 说明：作品声明的完整对象写法
- 常用字段：
  - `source_type`
  - `source_link`
  - `source_author_uid`
  - `time_format`
  - `position`

其中 `source_type` 支持：

- `"引用站内"` 或 `1`
- `"引用AI"` 或 `3`
- `"取材网络"` 或 `4`
- `"个人观点，仅供参考"` 或 `5`
- `"虚构演绎，故事经历"` 或 `6`
- `"投资观点，仅供参考"` 或 `7`
- `"健康医疗分享，仅供参考"` 或 `8`

示例：

```json
{
  "source_type": "引用AI"
}
```

### `source_author_uid`

- 类型：`string`
- 说明：当作品声明为 `引用站内` 时必须提供
- 可直接放在 `platform_options` 顶层，也可以写进 `info_source`

示例：

```json
{
  "work_statement": "引用站内",
  "source_author_uid": "1833622900583475"
}
```

## 5. 按编辑页文案传值

`toutiao` 也支持直接按编辑页文案传值，适合前端表单直接透传。

例如：

```json
{
  "展示封面": "三图",
  "投放广告": "投放广告赚收益",
  "声明首发": "头条首发",
  "合集": "1234567890",
  "同时发布微头条": "发布得更多收益",
  "作品声明": "引用AI"
}
```

对应关系：

- `展示封面` -> `cover_mode`
- `添加位置` -> `position`
- `投放广告` -> `enable_ad`
- `声明首发` -> `first_publish`
- `合集` -> `collection_id`
- `同时发布微头条` -> `sync_to_weitoutiao`
- `作品声明` -> `work_statement` / `info_source`

## 6. 最小可用请求示例

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "toutiao",
    "content": "# 标题\n\n正文",
    "cookie": "sessionid=..."
  }'
```

## 7. 带全部参数的完整请求示例

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "toutiao",
    "content": "# 头条 API 发布示例\n\n正文第一段。\n\n![配图1](https://example.com/1.jpg)\n\n![配图2](https://example.com/2.jpg)\n\n![配图3](https://example.com/3.jpg)",
    "cookie": "sessionid=...; uid_tt=...; tt_webid=...; passport_csrf_token=...",
    "draft": false,
    "dry_run": false,
    "skip_image_upload": false,
    "timeout": 30,
    "platform_options": {
      "pgc_feed_covers": [
        "https://example.com/cover-1.jpg",
        "https://example.com/cover-2.jpg",
        "https://example.com/cover-3.jpg"
      ],
      "position": {
        "city": "上海",
        "id": "310000"
      },
      "enable_ad": true,
      "first_publish": true,
      "collection_id": "1234567890",
      "sync_to_weitoutiao": true,
      "work_statement": "引用AI"
    }
  }'
```

## 8. `引用站内` 的完整示例

```bash
curl -s http://127.0.0.1:8000/api/publish \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "toutiao",
    "content": "# 引用站内示例\n\n正文",
    "cookie": "sessionid=...; uid_tt=...; tt_webid=...",
    "platform_options": {
      "work_statement": "引用站内",
      "source_author_uid": "1833622900583475"
    }
  }'
```

## 9. Python 调用示例

```python
import requests

payload = {
    "platform": "toutiao",
    "content": "# 标题\n\n正文",
    "cookie": "sessionid=...; uid_tt=...; tt_webid=...",
    "platform_options": {
        "pgc_feed_covers": ["https://example.com/cover.jpg"],
        "position": {
            "city": "北京",
            "id": "110000",
        },
        "enable_ad": True,
        "sync_to_weitoutiao": True,
        "work_statement": "引用AI",
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

## 10. 前端 `fetch` 调用示例

浏览器侧调用 `/api/publish` 时，建议直接传 Markdown 内容，并把封面图数组单独放到 `platform_options.pgc_feed_covers`。这样前端不需要再关心正文图片顺序。

```ts
type ToutiaoPublishInput = {
  title: string;
  paragraphs: string[];
  coverImages: string[];
  bodyImages?: string[];
  cookie: string;
};

function buildToutiaoMarkdown(input: ToutiaoPublishInput): string {
  const images = [...(input.bodyImages ?? [])];
  const blocks: string[] = [`# ${input.title}`, ""];

  for (const paragraph of input.paragraphs) {
    blocks.push(paragraph, "");
  }

  images.forEach((url, index) => {
    blocks.push(`![配图${index + 1}](${url})`, "");
  });

  return blocks.join("\n").trim();
}

export async function publishToutiaoArticle(input: ToutiaoPublishInput) {
  if (input.coverImages.length < 3) {
    throw new Error("三图封面至少需要 3 张图片");
  }

  const response = await fetch("http://127.0.0.1:8000/api/publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      platform: "toutiao",
      content: buildToutiaoMarkdown(input),
      cookie: input.cookie,
      draft: false,
      dry_run: false,
      skip_image_upload: false,
      timeout: 30,
      platform_options: {
        pgc_feed_covers: input.coverImages,
        position: {
          city: "上海",
          id: "310000",
        },
      },
    }),
  });

  const data = await response.json();
  const result = data.results?.[0];

  if (!response.ok || data.exit_code !== 0 || result?.error) {
    throw new Error(result?.error || data.message || "头条发布失败");
  }

  return data;
}
```

调用要点：

- `coverImages` 必须是服务端可访问的 `http/https` 图片地址
- 当前 `/api/publish` 不直接接收浏览器里的 `File` 或 `Blob`；如果前端只有本地文件，先上传到你自己的文件服务，再把得到的 URL 写入 Markdown
- 如果你依赖 `cover_mode` 从正文图自动生成封面，`skip_image_upload` 需要保持为 `false`
- 如果你显式传 `pgc_feed_covers`，服务端会优先处理这组封面图链接

## 11. 返回结果说明

成功时返回统一结构：

```json
{
  "exit_code": 0,
  "results": [
    {
      "platform": "toutiao",
      "account_info": {},
      "prepared": {},
      "result": {},
      "output": {}
    }
  ],
  "summary": [
    {
      "platform": "toutiao",
      "nickname": "账号昵称",
      "url": "文章地址",
      "user_id": "账号 ID",
      "profile_url": ""
    }
  ]
}
```

常见判定：

- `exit_code=0`：本次调用整体成功
- `results[*].error` 存在：对应平台发布失败
- `draft=true` 时，返回的 `url` 通常是草稿地址
- `dry_run=true` 时，不会真正访问平台发布接口

## 12. 注意事项

- `content` 必须带一级标题 `# 标题`
- `cookie` 需要是当前可用的头条登录态
- `pgc_feed_covers` 优先级高于 `cover_mode`
- 显式 `pgc_feed_covers` 只支持 `0`、`1`、`3+` 张；传 `3+` 时内部只取前 `3` 张
- 如果不传 `pgc_feed_covers`，`cover_mode="three"` 时正文必须至少有 `3` 张图片
- 如果依赖 `cover_mode` 从正文图自动生成封面，不要把 `skip_image_upload` 设为 `true`
- `position` 推荐只传 `city + id`，编码来源于 [`toutiao_publish/position.json`](/Users/zhaoyang/Desktop/beeize/publish_articles/toutiao_publish/position.json)
- `work_statement="引用站内"` 时必须提供 `source_author_uid`
- `collection_id` 是否最终生效，取决于合集 ID 是否真实可用以及账号权限
- `first_publish` 当前可确认接口接受，但平台暂未暴露稳定回读字段

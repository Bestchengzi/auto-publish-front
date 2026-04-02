# `POST /fans` 使用说明

本文档说明统一 HTTP API 中粉丝数接口的用法。

接口地址：

- `POST /fans`

默认本地地址示例：

- `http://127.0.0.1:8000/fans`

## 请求体

请求体必须是 JSON 对象。

字段：

- `platform`
  - 必填
  - 平台标识
- `cookie`
  - 必填
  - 浏览器导出的 Cookie 字符串，或 JSON cookies 原文字符串

最小请求示例：

```bash
curl -s http://127.0.0.1:8000/fans \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "toutiao",
    "cookie": "sessionid=..."
  }'
```

## 成功响应字段

所有已实现平台成功时都返回同一组字段：

- `active`
  - 是否成功
- `message`
  - 成功时固定为 `success`
- `platform`
  - 平台标识
- `user_id`
  - 平台账号 ID
- `fans`
  - 粉丝数
- `nickname`
  - 账号昵称
- `avatar_url`
  - 头像地址

成功响应示例：

```json
{
  "active": true,
  "message": "success",
  "platform": "zhihu",
  "user_id": "488021e383a3162b8a92bc9326f0c912",
  "fans": 20,
  "nickname": "热爱可抵岁月漫长",
  "avatar_url": "https://picx.zhimg.com/..."
}
```

## 失败响应

参数错误时返回：

```json
{
  "ok": false,
  "error": "cookie 必须是非空字符串。"
}
```

上游请求失败时，返回：

```json
{
  "active": false,
  "message": "Upstream request failed: ...",
  "platform": "wechat_mp"
}
```

## 平台支持情况

当前 `/fans` 路由声明支持的平台有：

- `baijiahao`
- `csdn`
- `toutiao`
- `douyin`
- `rednote`
- `zhihu`
- `wechat_mp`
- `wechat_video`

其中当前已实现：

- `baijiahao`
- `csdn`
- `toutiao`
- `rednote`
- `zhihu`
- `wechat_mp`

当前未实现：

- `douyin`
- `wechat_video`

未实现平台会返回：

```json
{
  "active": false,
  "message": "Platform is not implemented yet",
  "platform": "douyin",
  "user_id": "",
  "fans": 0,
  "nickname": "",
  "avatar_url": ""
}
```

## 各平台说明

### 1. `toutiao`

Cookie 要求：

- 传头条创作者后台登录 Cookie

当前取数接口：

- `GET https://mp.toutiao.com/mp/agw/creator_center/user_info?app_id=1231`

响应中使用：

- `user_id_str`
- `total_fans_count`
- `name`
- `avatar_url`

调用示例：

```bash
curl -s http://127.0.0.1:8000/fans \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "toutiao",
    "cookie": "sessionid=..."
}'
```

### 2. `baijiahao`

Cookie 要求：

- 传百家号创作者后台登录 Cookie

当前取数接口：

- `GET https://baijiahao.baidu.com/builder/app/appinfo`

当前实现会优先从响应里提取：

- `app_id` / `appId` / `bjh_app_id` / `uk`
- `display_name` / `app_name`
- `avatar_url` / `head_img`
- `fans_num` / `fansCount` / `follower_count` / `subscribe_count`

调用示例：

```bash
curl -s http://127.0.0.1:8000/fans \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "baijiahao",
    "cookie": "BDUSS=...; STOKEN=..."
  }'
```

### 3. `csdn`

Cookie 要求：

- 传 CSDN 创作者后台登录 Cookie

当前取数接口：

- `GET https://bizapi.csdn.net/blog/phoenix/console/v1/article/get-recently-edit?editType=0`

当前实现会优先从响应里提取：

- `blog_user_id` / `user_id`
- `blog_name` / `user_name`
- `avatar_url` / `head_img`
- `fans_num` / `fansCount` / `follower_count` / `subscribe_count`

调用示例：

```bash
curl -s http://127.0.0.1:8000/fans \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "csdn",
    "cookie": "uuid_tt_dd=...; UserName=...; UserInfo=..."
  }'
```

### 4. `zhihu`

Cookie 要求：

- 传知乎登录 Cookie
- 推荐至少包含 `z_c0`
- 通常还会带 `_xsrf`

当前取数链路：

1. `GET https://www.zhihu.com/api/v4/me`
2. `GET https://www.zhihu.com/api/v4/members/<url_token>?include=follower_count,following_count,articles_count,answer_count,question_count,columns_count,pins_count,voteup_count,thanked_count`

最终使用：

- `id`
- `name`
- `avatar_url`
- `follower_count`

调用示例：

```bash
curl -s http://127.0.0.1:8000/fans \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "zhihu",
    "cookie": "z_c0=...; _xsrf=..."
}'
```

### 5. `rednote`

Cookie 要求：

- 传小红书登录 Cookie
- 推荐至少包含创作者后台可用的会话字段，例如 `web_session`、`a1`

当前取数链路：

1. `GET https://creator.xiaohongshu.com/api/galaxy/user/my-info`
   - 用于获取当前登录账号的 `user_id`、昵称、头像
2. 优先尝试 `GET https://www.xiaohongshu.com/user/profile/<user_id>`
   - 从页面内嵌的 `interactions` 数据或页面 HTML 中提取 `type=fans` 的 `count`
3. 如果资料页被降级成通用首页，回退到
   - `POST https://api.beeize.com/more/api/xhs/user_detail`
   - 请求体示例：`{"user_id":"<user_id>","proxy":""}`
   - 从返回的 `interactions` 中提取 `type=fans` 的 `count`

最终使用：

- `data.userDetail.id`
- `data.userDetail.nickName`
- `data.userDetail.url`
- 资料页或 Beeize `user_detail` 中的粉丝数 `count`

调用示例：

```bash
curl -s http://127.0.0.1:8000/fans \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "rednote",
    "cookie": "web_session=...; a1=..."
}'
```

### 6. `wechat_mp`

Cookie 要求：

- 传微信公众号后台登录 Cookie

当前取数链路：

1. `GET https://mp.weixin.qq.com/`
   - 用于校验后台登录态并解析 `token`
2. `GET https://mp.weixin.qq.com/misc/useranalysis?token=<token>&lang=zh_CN`
   - 从页面内嵌 `window.CGI_DATA['pages/statistics/user_statistics']` 中提取最新日期的 `cumulate_user`

最终使用：

- `user_name` 或 `alias`
- `nick_name`
- `head_img`
- 最新日期的 `cumulate_user`

调用示例：

```bash
curl -s http://127.0.0.1:8000/fans \
  -H 'Content-Type: application/json' \
  -d '{
    "platform": "wechat_mp",
    "cookie": "slave_user=...; data_ticket=...; slave_sid=..."
  }'
```

## 运行前提

先启动服务：

```bash
.venv/bin/python api_server.py --host 127.0.0.1 --port 8000
```

然后再调用 `/fans`。

## 代码位置

- 路由入口：
  - [`api_server.py`](/Users/zhaoyang/Desktop/beeize/publish_articles/api_server.py)
- 业务实现：
  - [`platform_data_service.py`](/Users/zhaoyang/Desktop/beeize/publish_articles/platform_data_service.py)

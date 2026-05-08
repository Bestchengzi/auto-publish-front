/**
 * 主进程白名单：仅允许打开这些登录页并读取对应域下的 cookie。
 */
export type PlatformAuthId =
  | "toutiao"
  | "rednote"
  | "douyin"
  | "wechat_mp"
  | "wechat_channels"
  | "zhihu"
  | "baijiahao"
  | "csdn";

export type PlatformAuthEntry = {
  loginUrl: string;
  authedUrl?: string;
  /** 用于 session.cookies.get({ url }) 的基准 URL，可多条以覆盖子域 */
  cookieUrls: string[];
  /**
   * 当前页 URL 任一正则匹配则视为已离开登录页（扫码/登录成功后的典型地址）。
   * 若平台改版跳转地址变化，在此调整。
   */
  successUrlPatterns: string[];
};

export const PLATFORM_AUTH_CONFIG: Record<PlatformAuthId, PlatformAuthEntry> = {
  toutiao: {
    loginUrl: "https://mp.toutiao.com/auth/page/login",
    authedUrl: "https://mp.toutiao.com/",
    cookieUrls: ["https://mp.toutiao.com/"],
    successUrlPatterns: ["^https://mp\\.toutiao\\.com/(?!auth/page/login)"],
  },
  rednote: {
    loginUrl: "https://creator.xiaohongshu.com/login?selfLogout=true",
    authedUrl: "https://creator.xiaohongshu.com/new/home",
    cookieUrls: [
      "https://creator.xiaohongshu.com/",
    ],
    successUrlPatterns: [
      "^https://creator\\.xiaohongshu\\.com/(?!login(?:/|[?#]|$))",
    ],
  },
  douyin: {
    loginUrl: "https://creator.douyin.com/",
    authedUrl: "https://creator.douyin.com/creator-micro/home",
    cookieUrls: ["https://creator.douyin.com/"],
    successUrlPatterns: [
      "^https://creator\\.douyin\\.com/creator-micro",
      "^https://creator\\.douyin\\.com/content/",
      "^https://creator\\.douyin\\.com/publish",
    ],
  },
  wechat_mp: {
    loginUrl: "https://mp.weixin.qq.com/",
    authedUrl: "https://mp.weixin.qq.com/",
    cookieUrls: ["https://mp.weixin.qq.com/"],
    successUrlPatterns: ["^https://mp\\.weixin\\.qq\\.com/cgi-bin/(?!loginpage)"],
  },
  wechat_channels: {
    loginUrl: "https://channels.weixin.qq.com/login.html",
    authedUrl: "https://channels.weixin.qq.com/platform",
    cookieUrls: ["https://channels.weixin.qq.com/"],
    successUrlPatterns: ["^https://channels\\.weixin\\.qq\\.com/(?!login\\.html)"],
  },
  zhihu: {
    loginUrl: "https://www.zhihu.com/signin?next=%2Fcreator",
    authedUrl: "https://www.zhihu.com/creator",
    cookieUrls: ["https://www.zhihu.com/"],
    successUrlPatterns: ["^https://www\\.zhihu\\.com/creator"],
  },
  baijiahao: {
    loginUrl: "https://baijiahao.baidu.com/builder/theme/bjh/login",
    authedUrl: "https://baijiahao.baidu.com/builder/rc/home",
    cookieUrls: ["https://baijiahao.baidu.com/"],
    successUrlPatterns: [
      "^https://baijiahao\\.baidu\\.com/builder/(?!theme/bjh/login(?:/|[?#]|$))",
    ],
  },
  csdn: {
    loginUrl: "https://passport.csdn.net/login?code=applets",
    authedUrl: "https://www.csdn.net/",
    cookieUrls: ["https://passport.csdn.net/", "https://www.csdn.net/"],
    successUrlPatterns: [
      "^https://passport\\.csdn\\.net/(?!login(?:/|[?#]|$))",
      "^https://www\\.csdn\\.net/",
    ],
  },
};

const SUCCESS_URL_REGEX: Record<PlatformAuthId, RegExp[]> = (
  Object.keys(PLATFORM_AUTH_CONFIG) as PlatformAuthId[]
).reduce(
  (acc, id) => {
    acc[id] = PLATFORM_AUTH_CONFIG[id].successUrlPatterns.map(
      (s) => new RegExp(s),
    );
    return acc;
  },
  {} as Record<PlatformAuthId, RegExp[]>,
);

/** 主进程内根据当前 URL 判断是否已进入登录后页面 */
export function isPlatformAuthSuccessUrl(
  id: PlatformAuthId,
  url: string,
): boolean {
  return SUCCESS_URL_REGEX[id].some((re) => re.test(url));
}

export function isPlatformAuthId(id: string): id is PlatformAuthId {
  return id in PLATFORM_AUTH_CONFIG;
}

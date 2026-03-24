/**
 * 主进程白名单：仅允许打开这些登录页并读取对应域下的 cookie。
 */
export type PlatformAuthId =
  | "toutiao"
  | "xhs"
  | "douyin"
  | "wx_mp"
  | "wx_channels";

export type PlatformAuthEntry = {
  loginUrl: string;
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
    cookieUrls: ["https://mp.toutiao.com/"],
    successUrlPatterns: ["^https://mp\\.toutiao\\.com/(?!auth/page/login)"],
  },
  xhs: {
    loginUrl: "https://creator.xiaohongshu.com/login",
    cookieUrls: ["https://creator.xiaohongshu.com/"],
    successUrlPatterns: [
      "^https://creator\\.xiaohongshu\\.com/(?!login(?:/|[?#]|$))",
    ],
  },
  douyin: {
    loginUrl: "https://creator.douyin.com/",
    cookieUrls: ["https://creator.douyin.com/"],
    successUrlPatterns: [
      "^https://creator\\.douyin\\.com/creator-micro",
      "^https://creator\\.douyin\\.com/content/",
      "^https://creator\\.douyin\\.com/publish",
    ],
  },
  wx_mp: {
    loginUrl:
      "https://mp.weixin.qq.com/cgi-bin/loginpage?url=%2Fcgi-bin%2Fhome",
    cookieUrls: ["https://mp.weixin.qq.com/"],
    successUrlPatterns: ["^https://mp\\.weixin\\.qq\\.com/cgi-bin/(?!loginpage)"],
  },
  wx_channels: {
    loginUrl: "https://channels.weixin.qq.com/login.html",
    cookieUrls: ["https://channels.weixin.qq.com/"],
    successUrlPatterns: ["^https://channels\\.weixin\\.qq\\.com/(?!login\\.html)"],
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

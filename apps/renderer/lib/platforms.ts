/**
 * 统一平台常量，按顺序：今日头条、小红书、抖音、微信公众号、微信视频号、知讯宝
 */
export type PlatformId =
  | "toutiao"
  | "rednote"
  | "douyin"
  | "wechat_mp"
  | "wechat_channels"
  | "zhixunbao";

export type Platform = {
  id: PlatformId;
  /** logo filename in /platform-logos/, e.g. xhs.svg */
  logo: string;
};

/** 平台列表，按固定顺序：今日头条、小红书、抖音、微信公众号、微信视频号、知讯宝 */
export const PLATFORM_IDS: PlatformId[] = [
  "toutiao",
  "rednote",
  "douyin",
  "wechat_mp",
  "wechat_channels",
  "zhixunbao",
];

/** 平台配置，logo 对应 public/platform-logos/ 下的文件名 */
export const PLATFORMS: Platform[] = [
  { id: "toutiao", logo: "jin-ri-tou-tiao.png" },
  { id: "rednote", logo: "xiao-hong-shu.png" },
  { id: "douyin", logo: "dou-yin.png" },
  { id: "wechat_mp", logo: "wei-xin-gong-zhong-hao.png" },
  { id: "wechat_channels", logo: "wei-xin-shi-pin-hao.png" },
  { id: "zhixunbao", logo: "zhi-xun-bao.png" },
];

export function getPlatformById(id: PlatformId): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}

export function getPlatformLogoPath(platformId: PlatformId): string {
  const p = getPlatformById(platformId);
  return p ? `/platform-logos/${p.logo}` : "/platform-logos/xiao-hong-shu.png";
}

/** 带展示信息的平台 */
export type PlatformWithName = {
  id: PlatformId;
  name: string;
  logo: string;
};

/** nameForId: (id) => 平台名称，如 (id) => t(\`account.platforms.${id}\`) */
export function getPlatformsWithNames(
  nameForId: (id: PlatformId) => string
): PlatformWithName[] {
  return PLATFORMS.map((p) => ({
    id: p.id,
    name: nameForId(p.id),
    logo: p.logo,
  }));
}

/**
 * 官网「下载客户端」直链：文件名不含 version，与 electron-builder `artifactName` 一致。
 * Windows 安装包在 OSS 桶根；Mac Intel / ARM 分目录（与 `apps/desktop/src/main.ts` 自动更新 feed 一致），避免两份 `latest-mac.yml` 互相覆盖。
 * 发新版时覆盖 OSS 同名对象即可，无需改前端版本号。
 */
export const DESKTOP_OSS_BASE_URL = "https://open-stack.oss-cn-shanghai.aliyuncs.com";

const base = DESKTOP_OSS_BASE_URL.replace(/\/$/, "");

export const desktopMarketingDownloadUrls = {
  windowsExe: `${base}/KeduckAI-win-x64.exe`,
  macIntelDmg: `${base}/mac/x64/KeduckAI-mac-x64.dmg`,
  macAppleSiliconDmg: `${base}/mac/arm64/KeduckAI-mac-arm64.dmg`,
} as const;

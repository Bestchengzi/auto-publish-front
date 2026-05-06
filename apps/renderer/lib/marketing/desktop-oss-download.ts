/**
 * 官网「下载客户端」直链：文件名不含 version，与 electron-builder `artifactName` 一致。
 * 发新版时只需将同名文件覆盖上传到 OSS，无需改前端。
 * OSS 根路径与 `apps/desktop/electron-builder.yml` 的 `publish.url` 一致。
 */
export const DESKTOP_OSS_BASE_URL = "https://open-stack.oss-cn-shanghai.aliyuncs.com";

const base = DESKTOP_OSS_BASE_URL.replace(/\/$/, "");

export const desktopMarketingDownloadUrls = {
  windowsExe: `${base}/keduckAI-win-x64.exe`,
  macIntelDmg: `${base}/keduckAI-mac-x64.dmg`,
  macAppleSiliconDmg: `${base}/keduckAI-mac-arm64.dmg`,
} as const;

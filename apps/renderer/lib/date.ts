import dayjs from "dayjs";

/** 将接口常见 Unix 秒 / 毫秒时间戳规范为毫秒 */
function toEpochMs(value: number): number {
  return value < 1_000_000_000_000 ? value * 1000 : value;
}

/**
 * 日期时间显示格式：YYYY/MM/DD HH:mm
 * 用于上传时间、创建时间等列表/详情展示
 */
const FORMAT_DATETIME = "YYYY/MM/DD HH:mm";

/**
 * 格式化日期时间为 YYYY/MM/DD HH:mm
 * @param value - ISO 字符串、Date 或时间戳
 * @param fallback - 无效时返回的默认值
 */
export function formatDateTime(
  value: string | Date | number | null | undefined,
  fallback = "--",
): string {
  if (value == null) return fallback;
  const d = dayjs(value);
  return d.isValid() ? d.format(FORMAT_DATETIME) : fallback;
}

/** 短日期格式 MM/DD，用于表格列等紧凑展示 */
export function formatDateShort(
  value: string | Date | number | null | undefined,
  fallback = "--",
): string {
  if (value == null) return fallback;
  const d = dayjs(value);
  return d.isValid() ? d.format("MM/DD") : fallback;
}

/**
 * 热榜「多久前」（基于 `update_time`）：最小单位为 1 分钟（不足 1 分钟也显示 1 分钟前），
 * 最大单位为小时（不展示天/周等，长时间仍用「N 小时前」）。
 */
export function formatUpdateAgoMinutesToHours(
  epochSecondsOrMs: number,
  appLocale: string,
): string {
  const ms = toEpochMs(epochSecondsOrMs);
  const d = dayjs(ms);
  if (!d.isValid()) return "--";
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  const isZh = appLocale.toLowerCase().startsWith("zh");

  if (diffSec < 60) {
    return isZh ? "1 分钟前" : "1 minute ago";
  }

  const totalMinutes = Math.floor(diffSec / 60);
  if (totalMinutes < 60) {
    if (isZh) {
      return totalMinutes === 1 ? "1 分钟前" : `${totalMinutes} 分钟前`;
    }
    return totalMinutes === 1 ? "1 minute ago" : `${totalMinutes} minutes ago`;
  }

  const totalHours = Math.floor(diffSec / 3600);
  if (isZh) {
    return totalHours === 1 ? "1 小时前" : `${totalHours} 小时前`;
  }
  return totalHours === 1 ? "1 hour ago" : `${totalHours} hours ago`;
}

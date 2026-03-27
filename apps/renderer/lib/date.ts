import dayjs from "dayjs";

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

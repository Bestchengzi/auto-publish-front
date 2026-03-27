export type TabItem = {
  id: string;
  path: string;
  titleKey: string;
  /** 新开的空白标签页，尚未输入地址 */
  isEmpty?: boolean;
  /** 外部网页 URL，使用 WebContentsView 嵌入加载 */
  isExternal?: boolean;
  /** 平台授权标签，使用独立 partition 加载登录页 */
  platformAuthId?: string;
  /** 页面 favicon URL（与浏览器标签一致） */
  favicon?: string;
  /** 页面标题（与 document.title 一致） */
  title?: string;
  /** 外部标签加载中 */
  loading?: boolean;
  /** 主框架加载失败（由主进程 did-fail-load 上报） */
  loadError?: {
    code: number;
    description: string;
    validatedUrl: string;
  };
};

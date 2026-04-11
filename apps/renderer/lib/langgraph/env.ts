/** DeerFlow 兼容：供 langgraph 迁移模块读取 NEXT_PUBLIC_*，不做 zod 校验 */
export const env = {
  NEXT_PUBLIC_LANGGRAPH_BASE_URL:
    process.env.NEXT_PUBLIC_LANGGRAPH_BASE_URL ?? "",
} as const;

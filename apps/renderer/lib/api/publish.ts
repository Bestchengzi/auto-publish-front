import { request } from "@/lib/request";
import { apiUrl } from "./config";

export type PublishEditAccount = {
  id: string;
  avatar: string | null;
  nickname: string;
  account: string;
  platform: string;
};

export type PublishEditPlatform = {
  accounts: PublishEditAccount[];
  content: string;
  draft: boolean;
  skip_image_upload: boolean;
  timeout: number;
  platform_options: Record<string, unknown>;
};

export type PublishEditResponse = {
  thread_id: string;
  artifacts: string;
  platform: Record<string, PublishEditPlatform>;
};

export type PublishPlatformRequest = {
  account_ids: string[];
  content: string;
  draft?: boolean;
  dry_run?: boolean;
  skip_image_upload?: boolean;
  timeout?: number;
  platform_options?: Record<string, unknown> | null;
};

export type PublishRequest = {
  platforms: Record<string, PublishPlatformRequest>;
};

/** `POST /api/threads/:id/publish` 响应中的汇总结构 */
export type PublishSummaryDetail = {
  account_id: string;
  account_name: string;
  account_platform?: string;
  publish_status: string;
  failure_reason?: string | null;
};

export type PublishSummary = {
  total: number;
  success: number;
  failed: number;
  status?: string;
  details: PublishSummaryDetail[];
};

/**
 * 从发布接口 JSON 中解析 `summary`（用于结果弹窗，不依赖 HTTP 状态或其它顶层字段判断成败）
 */
export function parsePublishThreadResponse(data: unknown): PublishSummary | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const s = root.summary;
  if (!s || typeof s !== "object") return null;
  const sum = s as Record<string, unknown>;
  const rawDetails = sum.details;
  const details: PublishSummaryDetail[] = Array.isArray(rawDetails)
    ? rawDetails.map((item) => {
        const x = (item && typeof item === "object" ? item : {}) as Record<
          string,
          unknown
        >;
        return {
          account_id: String(x.account_id ?? ""),
          account_name: String(x.account_name ?? ""),
          account_platform:
            typeof x.account_platform === "string" ? x.account_platform : undefined,
          publish_status: String(x.publish_status ?? ""),
          failure_reason:
            x.failure_reason == null || x.failure_reason === undefined
              ? null
              : String(x.failure_reason),
        };
      })
    : [];
  return {
    total: typeof sum.total === "number" ? sum.total : 0,
    success: typeof sum.success === "number" ? sum.success : 0,
    failed: typeof sum.failed === "number" ? sum.failed : 0,
    status: typeof sum.status === "string" ? sum.status : undefined,
    details,
  };
}

export type PublishRecordResponse = {
  id: string;
  thread_id: string;
  account_id: string;
  account_info?: {
    id?: string;
    avatar?: string | null;
    nickname?: string | null;
    account?: string | null;
    platform?: string | null;
  } | null;
  platform: string;
  trigger_source: string;
  success: boolean;
  published_url: string | null;
  error_message: string | null;
  publish_info: unknown;
  created_at: string;
};

export type PublishRecordGroupResponse = {
  thread_id: string;
  title?: string | null;
  created_at: string;
  last_published_at: string;
  success_account_count: number;
  failed_account_count: number;
  records: PublishRecordResponse[];
};

export type PublishRecordGroupListResponse = {
  items: PublishRecordGroupResponse[];
  total: number;
  page: number;
  page_size: number;
};

export type BulkDeletePublishRecordGroupsRequest = {
  threadIds: string[];
};

export type BulkDeletePublishRecordGroupsResponse = {
  success: boolean;
  deleted: number;
  deleted_threads: number;
};

export async function buildPublishEditPayload(params: {
  threadId: string;
  artifacts: string;
  accountIds: string[];
}): Promise<PublishEditResponse> {
  const { threadId, artifacts, accountIds } = params;
  return request<PublishEditResponse>(
    apiUrl(`/api/threads/${threadId}/publish/edit`),
    {
      method: "POST",
      body: JSON.stringify({
        artifacts,
        account_ids: accountIds,
      }),
    },
  );
}

export async function publishThreadArticle(params: {
  threadId: string;
  payload: PublishRequest;
  source?: string;
}): Promise<unknown> {
  const { threadId, payload, source } = params;
  return request<unknown>(
    apiUrl(`/api/threads/${threadId}/publish`),
    {
      method: "POST",
      headers: source ? { "X-DeerFlow-Publish-Source": source } : undefined,
      body: JSON.stringify(payload),
    },
  );
}

export async function listUserPublishRecordGroups(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PublishRecordGroupListResponse> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const search = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  return request<PublishRecordGroupListResponse>(apiUrl(`/api/publish-records?${search.toString()}`), {
    method: "GET",
  });
}

export async function deleteUserPublishRecordGroups(
  params: BulkDeletePublishRecordGroupsRequest,
): Promise<BulkDeletePublishRecordGroupsResponse> {
  const { threadIds } = params;
  return request<BulkDeletePublishRecordGroupsResponse>(apiUrl(`/api/publish-records`), {
    method: "DELETE",
    body: JSON.stringify({
      thread_ids: threadIds,
    }),
  });
}

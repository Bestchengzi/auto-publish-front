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

export type PublishRecordResponse = {
  id: string;
  thread_id: string;
  account_id: string;
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


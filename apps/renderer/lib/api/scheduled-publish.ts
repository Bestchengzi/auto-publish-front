/**
 * 定时发布任务 API（api.json → scheduled_publish）
 */
import { request } from "@/lib/request";
import { apiUrl } from "./config";

export type ScheduledPublishPlatform =
  | "toutiao"
  | "wechat_mp"
  | "rednote"
  | "zhihu"
  | "baijiahao"
  | "csdn";

export type ScheduledPublishImageSource =
  | "ai_generate"
  | "web_search"
  | "media_library";

export type ScheduledPublishCronSchedule = {
  type: "cron";
  expression: string;
};

export type ScheduledPublishTarget = {
  account_ids: string[];
};

export type PublishTargetsMap = Record<string, ScheduledPublishTarget>;

export type ScheduledPublishTaskCreateBody = {
  name: string;
  prompt: string;
  model_name?: string | null;
  schedule_enabled?: boolean;
  jitter_minutes?: number;
  persona_id?: string | null;
  image_source: ScheduledPublishImageSource | null;
  timezone: string;
  /** 自然语言描述定时规则，由服务端解析并生成 schedule */
  schedule_text: string;
  publish_targets: PublishTargetsMap;
};

export type ScheduledPublishTaskUpdateBody = {
  name: string;
  prompt: string;
  model_name: string | null;
  schedule_enabled: boolean;
  jitter_minutes?: number;
  persona_id: string | null;
  image_source: ScheduledPublishImageSource | null;
  timezone: string;
  schedule_text: string;
  publish_targets: PublishTargetsMap;
};

export type ScheduledPublishLastRunStatus =
  | "queued"
  | "running"
  | "success"
  | "partial_success"
  | "failed";

export type ScheduledPublishTaskResponse = {
  id: string;
  name: string;
  prompt: string;
  model_name: string | null;
  schedule_enabled: boolean;
  jitter_minutes: number;
  persona_id: string | null;
  image_source: ScheduledPublishImageSource | null;
  timezone: string;
  /** 创建/编辑时提交的定时描述；列表与编辑表单可展示 */
  schedule_text?: string | null;
  /** 服务端根据 schedule_text 解析后的 Cron 等调度信息 */
  schedule: ScheduledPublishCronSchedule;
  publish_targets: PublishTargetsMap;
  next_run_at: string;
  last_run_at: string | null;
  last_run_status: ScheduledPublishLastRunStatus | null;
  created_at: string;
  updated_at: string;
};

export type ScheduledPublishTaskListResponse = {
  items: ScheduledPublishTaskResponse[];
  total: number;
};

export type ScheduledPublishTaskDeleteResponse = {
  success: boolean;
  id: string;
};

export type ScheduledPublishTaskRunRecordResponse = {
  id: string;
  task_id: string;
  status: ScheduledPublishLastRunStatus;
};

export const SCHEDULED_PUBLISH_PLATFORM_IDS: ScheduledPublishPlatform[] = [
  "toutiao",
  "rednote",
  "wechat_mp",
  "zhihu",
  "baijiahao",
  "csdn",
];

export async function listScheduledPublishTasks(): Promise<ScheduledPublishTaskListResponse> {
  return request<ScheduledPublishTaskListResponse>(
    apiUrl("/api/scheduled-publish-tasks/"),
    { method: "GET" },
  );
}

export async function createScheduledPublishTask(
  body: ScheduledPublishTaskCreateBody,
): Promise<ScheduledPublishTaskResponse> {
  return request<ScheduledPublishTaskResponse>(
    apiUrl("/api/scheduled-publish-tasks/"),
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function updateScheduledPublishTask(
  taskId: string,
  body: ScheduledPublishTaskUpdateBody,
): Promise<ScheduledPublishTaskResponse> {
  return request<ScheduledPublishTaskResponse>(
    apiUrl(`/api/scheduled-publish-tasks/${taskId}`),
    { method: "PUT", body: JSON.stringify(body) },
  );
}

export async function deleteScheduledPublishTask(
  taskId: string,
): Promise<ScheduledPublishTaskDeleteResponse> {
  return request<ScheduledPublishTaskDeleteResponse>(
    apiUrl(`/api/scheduled-publish-tasks/${taskId}`),
    { method: "DELETE" },
  );
}

export async function runScheduledPublishTaskNow(
  taskId: string,
): Promise<ScheduledPublishTaskRunRecordResponse> {
  return request<ScheduledPublishTaskRunRecordResponse>(
    apiUrl(`/api/scheduled-publish-tasks/${taskId}/run-now`),
    { method: "POST" },
  );
}

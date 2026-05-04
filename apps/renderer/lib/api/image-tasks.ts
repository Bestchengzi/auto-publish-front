import { request } from "@/lib/request";

import { apiUrl } from "./config";

export type ImageTaskStatus = "queued" | "processing" | "completed" | "failed";

export type ImageTaskPrompt = {
  uid: string;
  title?: string | null;
  prompt: string;
};

export type ImageTaskItemResponse = {
  uid: string;
  title?: string | null;
  prompt: string;
  status: ImageTaskStatus;
  upstream_task_id: string | null;
  url: string | null;
  error: unknown;
  created_at: string;
  updated_at: string;
};

export type ImageTaskResponse = {
  id: string;
  thread_id: string;
  size: string | null;
  resolution: string | null;
  input_images: string[];
  created_at: string;
  updated_at: string;
  items: ImageTaskItemResponse[];
};

export type ImageTaskListResponse = {
  items: ImageTaskResponse[];
  total: number;
};

export async function listThreadImageTasks(
  threadId: string,
): Promise<ImageTaskListResponse> {
  return request<ImageTaskListResponse>(
    apiUrl(`/api/threads/${threadId}/image_task`),
  );
}

export async function createThreadImageTask(
  threadId: string,
  body: {
    prompts: ImageTaskPrompt[];
    size?: string | null;
    input_images?: string[];
  },
): Promise<ImageTaskResponse> {
  return request<ImageTaskResponse>(
    apiUrl(`/api/threads/${threadId}/image_task`),
    {
      method: "POST",
      body: JSON.stringify(body),
      suppressErrorToast: true,
    },
  );
}

export async function getThreadImageTask(
  threadId: string,
  imageTaskId: string,
): Promise<ImageTaskResponse> {
  return request<ImageTaskResponse>(
    apiUrl(`/api/threads/${threadId}/image_task/${imageTaskId}`),
  );
}

import { apiUrl } from "@/lib/api/config";
import { request } from "@/lib/request";

export type FeedbackStatus =
  | "submitted"
  | "processing"
  | "resolved"
  | "closed";

export type FeedbackCreateRequest = {
  title: string;
  content: string;
  contact?: string | null;
  thread_id?: string | null;
};

export type FeedbackResponse = {
  id: string;
  title: string;
  content: string;
  contact: string | null;
  thread_id: string | null;
  status: FeedbackStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export async function createFeedback(
  payload: FeedbackCreateRequest,
): Promise<FeedbackResponse> {
  return request<FeedbackResponse>(apiUrl("/api/feedback"), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

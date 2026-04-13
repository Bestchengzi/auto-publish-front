/**
 * 素材（media）相关 API，对应 api.json 中的 media 模块
 */
import { request, upload } from "@/lib/request";
import { apiUrl } from "./config";

export type MediaType = "image" | "video" | "document";

export type GroupBrief = {
  id: number;
  name: string;
};

export type MediaResponse = {
  id: string;
  name: string;
  file_path: string;
  media_type: MediaType;
  tags: string[];
  file_size: number;
  remark: string | null;
  created_at: string;
  updated_at: string;
  groups: GroupBrief[];
};

export type MediaListResponse = {
  items: MediaResponse[];
  total: number;
};

export type MediaUpdateBody = {
  name?: string | null;
  tags?: string[] | null;
  remark?: string | null;
  group_ids?: number[] | null;
};

export async function listMedia(params?: {
  name?: string | null;
  tags?: string | null;
  media_type?: MediaType | null;
  group_id?: number | null;
}): Promise<MediaListResponse> {
  const search = new URLSearchParams();
  if (params?.name != null && params.name !== "")
    search.set("name", params.name);
  if (params?.tags != null && params.tags !== "")
    search.set("tags", params.tags);
  if (params?.media_type != null)
    search.set("media_type", params.media_type);
  if (params?.group_id !== undefined && params?.group_id !== null)
    search.set("group_id", String(params.group_id));
  const qs = search.toString();
  const path = `/api/media${qs ? `?${qs}` : ""}`;
  return request<MediaListResponse>(apiUrl(path));
}

export async function uploadMedia(file: File): Promise<MediaResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await upload<MediaResponse>(
    apiUrl("/api/media/upload"),
    formData,
    { method: "POST" },
  );
  return res;
}

export async function editMedia(
  mediaId: string,
  body: MediaUpdateBody,
): Promise<MediaResponse> {
  return request<MediaResponse>(apiUrl(`/api/media/${mediaId}`), {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteMedia(mediaIds: string[]): Promise<unknown> {
  return request(apiUrl("/api/media"), {
    method: "DELETE",
    body: JSON.stringify({ ids: mediaIds }),
  });
}

export async function moveMediaToGroup(
  mediaIds: string[],
  groupId: number | null,
): Promise<unknown> {
  return request(apiUrl("/api/media/move-group"), {
    method: "POST",
    body: JSON.stringify({ ids: mediaIds, group_id: groupId }),
  });
}

// export function getMediaDownloadUrl(mediaId: string): string {
//   return apiUrl(`/api/media/${mediaId}/download`);
// }

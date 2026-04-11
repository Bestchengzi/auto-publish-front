/**
 * 素材分组（media_groups）相关 API，对应 api.json 中的 media_groups 模块
 */
import { request } from "@/lib/request";
import { apiUrl } from "./config";

export type GroupAggregateItem = {
  group_id: number | null;
  group_name: string;
  count: number;
};

export type GroupAggregateResponse = {
  items: GroupAggregateItem[];
};

export type GroupResponse = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export async function listMediaGroupsWithCounts(): Promise<GroupAggregateResponse> {
  return request<GroupAggregateResponse>(apiUrl("/api/media-groups/aggregate"));
}

export async function createMediaGroup(name: string): Promise<GroupResponse> {
  return request<GroupResponse>(apiUrl("/api/media-groups"), {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function renameMediaGroup(
  groupId: number,
  name: string,
): Promise<GroupResponse> {
  return request<GroupResponse>(apiUrl(`/api/media-groups/${groupId}`), {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function deleteMediaGroup(groupId: number): Promise<unknown> {
  return request(apiUrl(`/api/media-groups/${groupId}`), {
    method: "DELETE",
  });
}

/**
 * 账号分组（account_groups）相关 API，对应 api.json 中的 account_groups 模块
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

export async function listAccountGroupsWithCounts(): Promise<GroupAggregateResponse> {
  return request<GroupAggregateResponse>(
    apiUrl("/api/account-groups/aggregate"),
  );
}

export async function createAccountGroup(name: string): Promise<GroupResponse> {
  return request<GroupResponse>(apiUrl("/api/account-groups"), {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function renameAccountGroup(
  groupId: number,
  name: string,
): Promise<GroupResponse> {
  return request<GroupResponse>(apiUrl(`/api/account-groups/${groupId}`), {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function deleteAccountGroup(groupId: number): Promise<unknown> {
  return request(apiUrl(`/api/account-groups/${groupId}`), {
    method: "DELETE",
  });
}

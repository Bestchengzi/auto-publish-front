/**
 * 账号管理相关 API，对应 api.json 中的 accounts 模块
 */
import { request } from "@/lib/request";
import { apiUrl } from "./config";

export type AccountResponse = {
  id: string;
  avatar: string | null;
  nickname: string;
  account: string;
  platform: string;
  follower_count: number;
  status: "online" | "offline";
  cookie: string | null;
  created_at: string;
  updated_at: string;
  last_refreshed_at?: string | null;
  groups: { id: number; name: string }[];
};

export type AccountListResponse = {
  items: AccountResponse[];
  total: number;
};

export type AccountCreateBody = {
  nickname: string;
  account: string;
  platform: string;
  avatar?: string | null;
  follower_count?: number;
  status?: "online" | "offline";
  cookie?: string | null;
  group_ids?: number[];
};

/** 授权完成后创建账户：仅需 cookie（JSON 字符串）和 platform，后端会根据 cookie 解析账号信息 */
export type CreateAccountFromAuthBody = {
  cookie: string;
  platform: string;
};

export type AccountUpdateBody = {
  avatar?: string | null;
  nickname?: string | null;
  account?: string | null;
  platform?: string | null;
  follower_count?: number | null;
  status?: "online" | "offline" | null;
  cookie?: string | null;
  group_ids?: number[] | null;
};

export async function listAccounts(params?: {
  status?: "online" | "offline" | null;
  platforms?: string | null;
  group_id?: number | null;
}): Promise<AccountListResponse> {
  const search = new URLSearchParams();
  if (params?.status != null) search.set("status", params.status);
  if (params?.platforms != null && params.platforms !== "")
    search.set("platforms", params.platforms);
  if (params?.group_id !== undefined && params?.group_id !== null)
    search.set("group_id", String(params.group_id));
  const qs = search.toString();
  const path = `/api/accounts${qs ? `?${qs}` : ""}`;
  return request<AccountListResponse>(apiUrl(path));
}

export async function createAccount(body: AccountCreateBody): Promise<AccountResponse> {
  return request<AccountResponse>(apiUrl("/api/accounts"), {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** 根据授权 cookie 创建账户，仅传 cookie（JSON 字符串）和 platform */
export async function createAccountFromAuth(
  body: CreateAccountFromAuthBody,
): Promise<AccountResponse> {
  return request<AccountResponse>(apiUrl("/api/accounts"), {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAccount(
  accountId: string,
  body: AccountUpdateBody,
): Promise<AccountResponse> {
  return request<AccountResponse>(apiUrl(`/api/accounts/${accountId}`), {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteAccount(accountId: string): Promise<unknown> {
  return request(apiUrl(`/api/accounts/${accountId}`), {
    method: "DELETE",
  });
}

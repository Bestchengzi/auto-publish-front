import { apiUrl } from "@/lib/api/config";
import { getAuthorizationHeaderValue } from "@/lib/auth/session";
import { request } from "@/lib/request";

/** 与 api.json `WechatParamQrcodeResponse` 一致 */
export type WechatParamQrcodeResponse = {
  url: string;
  expire_in: number;
  id: string;
};

/** 与 api.json `WechatScanTokenResponse` 一致；后端可能额外返回 `phone` 等字段 */
export type WechatScanTokenResponse = {
  id: string;
  name?: string | null;
  create_at?: string;
  update_at?: string;
  three_party_identities?: Array<{
    id: string;
    three_party_type: string;
    three_party_open_id: string;
    three_party_scan: string;
  }>;
  access_token: string;
  token_type?: string;
  phone?: string | null;
};

function readStringField(
  source: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

function normalizeScanTokenResponse(raw: unknown): WechatScanTokenResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const accessToken = readStringField(obj, ["access_token"]);
  if (!accessToken) return null;

  const id = readStringField(obj, ["id"]);
  if (!id) return null;

  return {
    id,
    name: readStringField(obj, ["name"]) ?? undefined,
    create_at:
      (typeof obj.create_at === "string" ? obj.create_at : undefined) ??
      undefined,
    update_at:
      (typeof obj.update_at === "string" ? obj.update_at : undefined) ??
      undefined,
    three_party_identities: Array.isArray(obj.three_party_identities)
      ? (obj.three_party_identities as WechatScanTokenResponse["three_party_identities"])
      : undefined,
    access_token: accessToken,
    token_type: typeof obj.token_type === "string" ? obj.token_type : undefined,
    phone: typeof obj.phone === "string" ? obj.phone : undefined,
  };
}

export async function getWechatParamQrcode(
  inviteCode?: string | null,
): Promise<WechatParamQrcodeResponse> {
  const invite = typeof inviteCode === "string" ? inviteCode.trim() : "";
  const query = invite.length > 0 ? `?invite_code=${encodeURIComponent(invite)}` : "";
  return request<WechatParamQrcodeResponse>(apiUrl(`/api/wechat/param_qrcode${query}`), {
    method: "GET",
  });
}

/**
 * 轮询扫码结果：用户未扫码时可能 404 或空，不抛错，返回 null
 */
export async function fetchUserScanStatus(
  threePartyScan: string,
): Promise<WechatScanTokenResponse | null> {
  const url = apiUrl(`/api/user/scan/${encodeURIComponent(threePartyScan)}`);
  const authorization = getAuthorizationHeaderValue();
  const res = await fetch(url, {
    method: "GET",
    headers: authorization ? { Authorization: authorization } : undefined,
  });

  if (res.status === 404) return null;
  if (!res.ok) return null;

  const text = await res.text();
  if (!text) return null;
  try {
    return normalizeScanTokenResponse(JSON.parse(text));
  } catch {
    return null;
  }
}

import { env } from "@/env";

import { getBackendBaseURL } from "../config";

function authorizationValue(): string | undefined {
  const token = env.NEXT_PUBLIC_API_BEARER_TOKEN;
  return token ? `Bearer ${token}` : undefined;
}

/**
 * Merges default API `Authorization` when `NEXT_PUBLIC_API_BEARER_TOKEN` is set
 * and the caller did not already provide one.
 */
export function mergeBackendAuthHeaders(init?: RequestInit): RequestInit {
  const auth = authorizationValue();
  if (!auth) {
    return init ?? {};
  }

  const headers = new Headers(init?.headers);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", auth);
  }

  return { ...init, headers };
}

/**
 * Forwards or injects API auth on upstream requests (e.g. Next.js route proxies).
 */
export function applyDefaultApiAuthorization(headers: Headers): void {
  const token = env.NEXT_PUBLIC_API_BEARER_TOKEN;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
}

/**
 * `fetch` against the DeerFlow backend base URL, with optional bearer auth.
 * @param path Must start with `/` (e.g. `/api/models`).
 */
export function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const base = getBackendBaseURL().replace(/\/+$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return fetch(`${base}${normalized}`, mergeBackendAuthHeaders(init));
}

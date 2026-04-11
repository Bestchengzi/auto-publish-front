import { API_BASE_URL, getLangGraphBaseUrl } from "@/lib/api/config";

export function getBackendBaseURL(): string {
  return API_BASE_URL || "";
}

export function getLangGraphBaseURL(): string {
  return getLangGraphBaseUrl();
}

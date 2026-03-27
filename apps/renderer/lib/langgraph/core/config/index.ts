import { API_BASE_URL, getLangGraphBaseUrl } from "@/lib/api/config";
import { env } from "@/lib/langgraph/env";

export function getBackendBaseURL(): string {
  if (env.NEXT_PUBLIC_BACKEND_BASE_URL) {
    return env.NEXT_PUBLIC_BACKEND_BASE_URL.replace(/\/$/, "");
  }
  return API_BASE_URL || "";
}

export function getLangGraphBaseURL(): string {
  const fromApp = getLangGraphBaseUrl();
  if (fromApp) return fromApp;
  if (env.NEXT_PUBLIC_LANGGRAPH_BASE_URL) {
    return env.NEXT_PUBLIC_LANGGRAPH_BASE_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/langgraph`;
  }
  return "http://localhost:13200/api/langgraph";
}

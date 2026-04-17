/** 网关 /api/models，供定时任务等选择模型 */
import { request } from "@/lib/request";
import { apiUrl } from "./config";

export type ModelCatalogItem = {
  name: string;
  display_name: string | null;
  description: string | null;
  supports_thinking?: boolean;
  supports_reasoning_effort?: boolean;
};

export type ModelsListResponse = {
  models: ModelCatalogItem[];
};

export async function listModelsCatalog(): Promise<ModelsListResponse> {
  return request<ModelsListResponse>(apiUrl("/api/models"), { method: "GET" });
}

import { backendFetch } from "../api/backend-fetch";

import type { ModelsResponse } from "./types";

export async function loadModels(): Promise<ModelsResponse> {
  const res = await backendFetch("/api/models");
  const data = (await res.json()) as Partial<ModelsResponse>;
  return {
    models: data.models ?? [],
    token_usage: data.token_usage ?? { enabled: false },
  };
}

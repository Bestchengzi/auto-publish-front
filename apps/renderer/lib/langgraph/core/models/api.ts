import { getBackendBaseURL } from "../config";
import { request } from "@/lib/request";

import type { Model } from "./types";

export async function loadModels() {
  const { models } = await request<{ models: Model[] }>(
    `${getBackendBaseURL()}/api/models`,
  );
  return models;
}

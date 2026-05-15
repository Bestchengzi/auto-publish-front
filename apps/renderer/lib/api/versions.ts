import { request } from "@/lib/request";

import { apiUrl } from "./config";

export type VersionManifestEntry = {
  name: string;
  description: string;
  type: string;
  downloadUrl: string;
  ymlUrl: string;
};

export function listVersionsManifest() {
  return request<VersionManifestEntry[]>(apiUrl("/api/versions"), {
    method: "GET",
    cache: "no-store",
    suppressErrorToast: true,
  });
}

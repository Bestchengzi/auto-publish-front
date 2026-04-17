import { backendFetch } from "@/core/api/backend-fetch";

import type { MCPConfig } from "./types";

export async function loadMCPConfig() {
  const response = await backendFetch("/api/mcp/config");
  return response.json() as Promise<MCPConfig>;
}

export async function updateMCPConfig(config: MCPConfig) {
  const response = await backendFetch("/api/mcp/config", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });
  return response.json();
}

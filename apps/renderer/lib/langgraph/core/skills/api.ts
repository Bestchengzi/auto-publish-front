import { getBackendBaseURL } from "@/lib/langgraph/core/config";
import { request } from "@/lib/request";

import type { Skill } from "./type";

export async function loadSkills() {
  const json = await request<{ skills: Skill[] }>(
    `${getBackendBaseURL()}/api/skills`,
  );
  return json.skills;
}

export async function enableSkill(skillName: string, enabled: boolean) {
  return request(
    `${getBackendBaseURL()}/api/skills/${skillName}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        enabled,
      }),
    },
  );
}

export interface InstallSkillRequest {
  thread_id: string;
  path: string;
}

export interface InstallSkillResponse {
  success: boolean;
  skill_name: string;
  message: string;
}

export async function installSkill(
  payload: InstallSkillRequest,
): Promise<InstallSkillResponse> {
  try {
    return await request<InstallSkillResponse>(
      `${getBackendBaseURL()}/api/skills/install`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Install skill failed";
    return {
      success: false,
      skill_name: "",
      message: errorMessage,
    };
  }
}

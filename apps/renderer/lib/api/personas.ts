import { request } from "@/lib/request";

import { apiUrl } from "./config";

export type PersonaPlatform =
  | "toutiao"
  | "wechat_mp"
  | "rednote"
  | "zhihu"
  | "baijiahao"
  | "csdn";

export type PersonaCreateRequest = {
  name: string;
  platform: PersonaPlatform;
  content: string;
};

export type PersonaUpdateRequest = PersonaCreateRequest;

export type PersonaResponse = {
  id: string;
  name: string;
  platform: PersonaPlatform;
  content: string;
  created_at: string;
  updated_at: string;
};

export type PersonaListResponse = {
  items: PersonaResponse[];
};

export async function listPersonas(): Promise<PersonaListResponse> {
  return request<PersonaListResponse>(apiUrl("/api/personas/"), {
    method: "GET",
  });
}

export async function createPersona(
  payload: PersonaCreateRequest,
): Promise<PersonaResponse> {
  return request<PersonaResponse>(apiUrl("/api/personas/"), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deletePersona(personaId: string): Promise<unknown> {
  return request<unknown>(apiUrl(`/api/personas/${personaId}`), {
    method: "DELETE",
  });
}

export async function updatePersona(
  personaId: string,
  payload: PersonaUpdateRequest,
): Promise<PersonaResponse> {
  return request<PersonaResponse>(apiUrl(`/api/personas/${personaId}`), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

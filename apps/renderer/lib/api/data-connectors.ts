import { apiUrl } from "@/lib/api/config";
import { request } from "@/lib/request";

export type DataConnectorFieldComponent =
  | "input"
  | "password"
  | "textarea"
  | "select"
  | "switch"
  | "number";

export type DataConnectorFieldOption = {
  label: string;
  value: string;
};

export type DataConnectorFieldDefinition = {
  name: string;
  label: string;
  component: DataConnectorFieldComponent;
  required?: boolean;
  secret?: boolean;
  default?: unknown;
  placeholder?: string | null;
  help_text?: string | null;
  options?: DataConnectorFieldOption[];
};

export type DataConnectorProviderDefinition = {
  key: string;
  name: string;
  description: string;
  config_fields?: DataConnectorFieldDefinition[];
  secret_fields?: DataConnectorFieldDefinition[];
  board_query_fields?: DataConnectorFieldDefinition[];
};

export type DataConnectorProviderListResponse = {
  items: DataConnectorProviderDefinition[];
  total: number;
};

export type DataConnectionBoardResponse = {
  board_id: string;
  connection_id: string;
  provider_key: string;
  provider_name: string;
  provider_board_key?: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  board_context: string | null;
  enabled?: boolean;
  badge_count?: number | null;
};

export type DataConnectionSecretState = {
  name: string;
  has_value: boolean;
  masked_value?: string | null;
};

export type DataConnectionResponse = {
  id: string;
  provider_key: string;
  provider_name: string;
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  default_query: Record<string, unknown>;
  secret_states?: DataConnectionSecretState[];
  last_test_status?: "success" | "failed" | null;
  last_test_error?: string | null;
  last_tested_at?: string | null;
  board_count?: number;
  boards?: DataConnectionBoardResponse[];
  created_at: string;
  updated_at: string;
};

export type DataConnectionListResponse = {
  items: DataConnectionResponse[];
  total: number;
};

export type DataConnectionCreateRequest = {
  provider_key: string;
  name: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
  secrets?: Record<string, unknown>;
  default_query?: Record<string, unknown>;
};

export type DataConnectionUpdateRequest = {
  name?: string | null;
  enabled?: boolean | null;
  config?: Record<string, unknown> | null;
  secrets?: Record<string, unknown> | null;
  default_query?: Record<string, unknown> | null;
};

export type DataConnectionDeleteResponse = {
  success: boolean;
  id: string;
};

export type TopicBoardResponse = {
  board_id: string;
  connection_id: string;
  provider_key: string;
  provider_name: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  board_context: string | null;
  badge_count?: number | null;
};

export type TopicBoardListResponse = {
  items: TopicBoardResponse[];
  total: number;
};

export type DataConnectionBoardCandidate = {
  provider_board_key: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  board_context: string | null;
  default_query?: Record<string, unknown>;
  board_meta?: Record<string, unknown>;
};

export type DataConnectionDiscoverBoardsResponse = {
  items: DataConnectionBoardCandidate[];
  total: number;
};

export type DataConnectionBoardSelectionRequest = {
  provider_board_keys: string[];
};

export type TopicDataListItemResponse = {
  item_id: string;
  title: string;
  source_name?: string | null;
  published_at?: string | null;
  summary?: string | null;
  match_reason?: string | null;
  cover_image_url?: string | null;
  content_url?: string | null;
  extra?: Record<string, unknown>;
};

export type TopicBoardItemsResponse = {
  board: TopicBoardResponse;
  items: TopicDataListItemResponse[];
  total: number;
  page: number;
  page_size: number;
};

export type TopicBoardItemDetailResponse = {
  item_id: string;
  board_id?: string;
  title: string;
  source_name?: string | null;
  source_url?: string | null;
  published_at?: string | null;
  summary?: string | null;
  content_text?: string | null;
  content?: string | null;
  content_url?: string | null;
  cover_image_url?: string | null;
  image_urls?: string | null;
  video_urls?: string | null;
  extra?: Record<string, unknown>;
};

export async function listDataConnectorProviders(): Promise<DataConnectorProviderListResponse> {
  return request<DataConnectorProviderListResponse>(
    apiUrl("/api/data-connector-providers"),
  );
}

export async function listDataConnections(): Promise<DataConnectionListResponse> {
  return request<DataConnectionListResponse>(apiUrl("/api/data-connections"));
}

export async function createDataConnection(
  payload: DataConnectionCreateRequest,
): Promise<DataConnectionResponse> {
  return request<DataConnectionResponse>(apiUrl("/api/data-connections"), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDataConnection(
  connectionId: string,
  payload: DataConnectionUpdateRequest,
): Promise<DataConnectionResponse> {
  return request<DataConnectionResponse>(
    apiUrl(`/api/data-connections/${encodeURIComponent(connectionId)}`),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteDataConnection(
  connectionId: string,
): Promise<DataConnectionDeleteResponse> {
  return request<DataConnectionDeleteResponse>(
    apiUrl(`/api/data-connections/${encodeURIComponent(connectionId)}`),
    {
      method: "DELETE",
    },
  );
}

/** Discover boards from provider (e.g. 知讯宝「我的专题」). OpenAPI: POST. */
export async function discoverDataConnectionBoards(
  connectionId: string,
): Promise<DataConnectionDiscoverBoardsResponse> {
  return request<DataConnectionDiscoverBoardsResponse>(
    apiUrl(
      `/api/data-connections/${encodeURIComponent(connectionId)}/discover-boards`,
    ),
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}

/** Sync selected boards to topic center. OpenAPI: PUT. */
export async function syncDataConnectionBoards(
  connectionId: string,
  payload: DataConnectionBoardSelectionRequest,
): Promise<DataConnectionDiscoverBoardsResponse> {
  return request<DataConnectionDiscoverBoardsResponse>(
    apiUrl(`/api/data-connections/${encodeURIComponent(connectionId)}/boards`),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export async function listTopicCenterBoards(): Promise<TopicBoardListResponse> {
  return request<TopicBoardListResponse>(apiUrl("/api/topic-center/boards"));
}

export async function listTopicCenterBoardItems(
  boardId: string,
  params?: {
    page?: number;
    size?: number;
    match_level?: string | null;
  },
): Promise<TopicBoardItemsResponse> {
  const searchParams = new URLSearchParams();
  if (typeof params?.page === "number") {
    searchParams.set("page", String(params.page));
  }
  if (typeof params?.size === "number") {
    searchParams.set("size", String(params.size));
  }
  if (typeof params?.match_level === "string" && params.match_level.trim()) {
    searchParams.set("match_level", params.match_level.trim());
  }

  const query = searchParams.toString();
  const path = `/api/topic-center/boards/${encodeURIComponent(boardId)}/items`;
  return request<TopicBoardItemsResponse>(
    apiUrl(query ? `${path}?${query}` : path),
  );
}

export async function getTopicCenterBoardItemDetail(
  boardId: string,
  itemId: string,
): Promise<TopicBoardItemDetailResponse> {
  const response = await request<
    TopicBoardItemDetailResponse | { item?: TopicBoardItemDetailResponse }
  >(
    apiUrl(
      `/api/topic-center/boards/${encodeURIComponent(boardId)}/items/${encodeURIComponent(itemId)}`,
    ),
  );
  if (
    response &&
    typeof response === "object" &&
    "item" in response &&
    response.item
  ) {
    return response.item;
  }
  return response as TopicBoardItemDetailResponse;
}

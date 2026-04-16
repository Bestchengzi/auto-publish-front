export const CONNECTIONS_QUERY_KEY = ["topic-center", "data-connections"] as const;
export const PROVIDERS_QUERY_KEY = [
  "topic-center",
  "data-connector-providers",
] as const;

export const discoverBoardsQueryKey = (connectionId: string) =>
  ["topic-center", "data-connection-discover-boards", connectionId] as const;

export const BOARD_ITEMS_PAGE_SIZE = 20;
export const BOARD_CARD_VISIBLE_ROWS = 10;
/** 与热门榜单卡片内列表一致：10 行 `h-8` + `space-y-1` */
export const BOARD_CARD_LIST_BODY_MAX_HEIGHT_CLASS =
  "max-h-[calc(10*2rem+9*0.25rem)]";
export const FIELD_SELECT_EMPTY_VALUE = "__empty__";

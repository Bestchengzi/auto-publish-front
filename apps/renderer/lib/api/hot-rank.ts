/**
 * 热搜榜（hot_rank）API，对应 api.json `/api/hot-rank/`
 * 与账号「平台」常量解耦；热榜展示键见 {@link HOT_RANK_LIST_ORDER}
 */
import { request } from "@/lib/request";
import { apiUrl } from "./config";

export type HotRankPlatformData = {
  platform: string;
  group: string;
  items: unknown[];
  update_time: number;
};

/** OpenAPI 中的键 + 后端可能扩展的键 */
export type HotRankResponse = Partial<
  Record<string, HotRankPlatformData | null | undefined>
>;

export type HotRankDisplayItem = {
  title: string;
  /** 有值时前端以新标签页打开 */
  url: string | null;
};

const TITLE_KEYS = [
  "title",
  "word",
  "keyword",
  "name",
  "text",
  "hot_word",
  "desc",
  "topic",
  "query",
  "hot_title",
  "item",
  "content",
] as const;

function pickTitleFromRecord(o: Record<string, unknown>): string | null {
  for (const k of TITLE_KEYS) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const strings = Object.values(o).filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0,
  );
  if (strings.length === 1) return strings[0].trim();
  return null;
}

const URL_KEYS = [
  "url",
  "link",
  "href",
  "article_url",
  "detail_url",
  "pc_url",
  "mobile_url",
  "target_url",
  "share_url",
  "jump_url",
  "uri",
] as const;

function normalizeHttpUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("//")) return `https:${t}`;
  return null;
}

function pickUrlFromRecord(o: Record<string, unknown>): string | null {
  for (const k of URL_KEYS) {
    const v = o[k];
    if (typeof v === "string") {
      const u = normalizeHttpUrl(v);
      if (u) {
        try {
          new URL(u);
          return u;
        } catch {
          continue;
        }
      }
    }
  }
  return null;
}

function coerceRank(o: Record<string, unknown>, fallback: number): number {
  const r = o.rank ?? o.idx ?? o.index ?? o.order ?? o.pos;
  if (typeof r === "number" && Number.isFinite(r)) return r;
  if (typeof r === "string" && /^\d+$/.test(r)) return parseInt(r, 10);
  return fallback;
}

/** 将接口返回的 items 解析为展示用条目（按 rank 升序，无 rank 则保持顺序） */
export function parseHotRankItems(
  items: unknown[] | undefined,
): HotRankDisplayItem[] {
  if (!items?.length) return [];
  const rows: { rank: number; item: HotRankDisplayItem }[] = [];
  items.forEach((raw, i) => {
    if (typeof raw === "string") {
      const title = raw.trim();
      if (title) {
        rows.push({
          rank: i + 1,
          item: { title, url: null },
        });
      }
      return;
    }
    if (!raw || typeof raw !== "object") return;
    const o = raw as Record<string, unknown>;
    const title = pickTitleFromRecord(o);
    if (!title) return;
    rows.push({
      rank: coerceRank(o, i + 1),
      item: { title, url: pickUrlFromRecord(o) },
    });
  });
  rows.sort((a, b) => a.rank - b.rank);
  return rows.map((r) => r.item);
}

/** 将接口返回的 items 解析为展示用标题列表（按 rank 升序） */
export function parseHotRankItemTitles(items: unknown[] | undefined): string[] {
  return parseHotRankItems(items).map((x) => x.title);
}

/** 热门榜单区块顺序与接口字段（与账号平台无关） */
export type HotRankListId = "baidu" | "toutiao" | "weibo" | "zhihu";

export const HOT_RANK_LIST_ORDER: HotRankListId[] = [
  "baidu",
  "toutiao",
  "weibo",
  "zhihu",
];

/** 每个热榜对应接口响应中的键（可扩展别名） */
const HOT_RANK_API_KEYS: Record<HotRankListId, string[]> = {
  baidu: ["baidu"],
  toutiao: ["toutiao"],
  weibo: ["weibo"],
  zhihu: ["zhihu"],
};

/** `public/platform-logos/` 下文件名（不含扩展名），与 HOT_RANK_LIST_ORDER 一一对应 */
const HOT_RANK_LOGO_BASENAME: Record<HotRankListId, string> = {
  baidu: "baidu",
  toutiao: "jin-ri-tou-tiao",
  weibo: "xin-lang-wei-bo",
  zhihu: "zhihu",
};

export function getHotRankLogoPath(listId: HotRankListId): string {
  return `/platform-logos/${HOT_RANK_LOGO_BASENAME[listId]}.png`;
}

function getHotRankBlockForList(
  data: HotRankResponse | undefined,
  listId: HotRankListId,
): HotRankPlatformData | null {
  if (!data) return null;
  for (const key of HOT_RANK_API_KEYS[listId]) {
    const block = data[key];
    if (block && typeof block === "object") return block;
  }
  return null;
}

export function getHotRankItemsForList(
  data: HotRankResponse | undefined,
  listId: HotRankListId,
): HotRankDisplayItem[] {
  const block = getHotRankBlockForList(data, listId);
  if (!block?.items?.length) return [];
  return parseHotRankItems(block.items);
}

/** 各平台热榜数据的 `update_time`（Unix 秒或毫秒，由 {@link formatUpdateAgoMinutesToHours} 识别） */
export function getHotRankUpdateTimeForList(
  data: HotRankResponse | undefined,
  listId: HotRankListId,
): number | null {
  const block = getHotRankBlockForList(data, listId);
  const t = block?.update_time;
  return typeof t === "number" && Number.isFinite(t) ? t : null;
}

export async function fetchHotRank(): Promise<HotRankResponse> {
  return request<HotRankResponse>(apiUrl("/api/hot-rank/"));
}

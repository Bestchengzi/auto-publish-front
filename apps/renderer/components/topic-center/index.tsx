"use client";

import * as React from "react";
import { MoreHorizontalIcon, SendIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { getPlatformsWithNames } from "@/lib/platforms";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlatformLogo } from "@/components/account-management/platform-logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TRACKS = [
  { id: "shizheng", nameKey: "topicCenter.tracks.shizheng" },
  { id: "guofang", nameKey: "topicCenter.tracks.guofang" },
  { id: "ai", nameKey: "topicCenter.tracks.ai" },
  { id: "jinrong", nameKey: "topicCenter.tracks.jinrong" },
  { id: "shangye", nameKey: "topicCenter.tracks.shangye" },
  { id: "touzi", nameKey: "topicCenter.tracks.touzi" },
  { id: "xinnengyuan", nameKey: "topicCenter.tracks.xinnengyuan" },
  { id: "qiche", nameKey: "topicCenter.tracks.qiche" },
  { id: "bandaoti", nameKey: "topicCenter.tracks.bandaoti" },
  { id: "yiyao", nameKey: "topicCenter.tracks.yiyao" },
] as const;

// Mock hot list items per platform
const MOCK_HOT_ITEMS: Record<string, string[]> = {
  toutiao: [
    "今日头条算法机制解析",
    "微头条爆款写作技巧",
    "图文带货选品策略",
    "头条号运营数据分析",
    "垂直领域内容规划",
    "青云计划获奖案例",
    "悟空问答引流方法",
  ],
  xhs: [
    "春日穿搭灵感分享",
    "周末探店vlog合集",
    "平价好物开箱测评",
    "治愈系生活方式记录",
    "职场新人成长日记",
    "宅家美食DIY教程",
    "读书笔记与书单推荐",
    "城市漫步citywalk",
  ],
  douyin: [
    "热门舞蹈挑战合集",
    "爆款短视频创作技巧",
    "直播带货运营心得",
    "短视频脚本模板分享",
    "涨粉数据分析复盘",
    "剧情号拍摄方法论",
    "带货选品避坑指南",
    "爆款BGM合集推荐",
  ],
  wx_mp: [
    "公众号变现模式分析",
    "10万+爆文标题技巧",
    "私域流量运营方法论",
    "小程序裂变增长案例",
    "内容付费产品设计",
    "用户增长转化漏斗",
  ],
  wx_channels: [
    "视频号推荐机制解读",
    "视频号直播带货实战",
    "短视频引流到私域",
    "视频号与公众号联动",
    "短视频脚本创作技巧",
    "直播话术与节奏把控",
  ],
  zhixunbao: [
    "知识付费产品设计",
    "付费社群运营方法论",
    "课程选题与大纲设计",
    "用户留存与复购策略",
    "知识IP打造路径",
    "直播课交付流程",
  ],
};

function HotListCard({
  platformId,
  platformName,
  items,
}: {
  platformId: import("@/lib/platforms").PlatformId;
  platformName: string;
  items: string[];
}) {
  const t = useTranslations("topicCenter");
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="size-8 shrink-0 flex items-center justify-center">
          <PlatformLogo platformId={platformId} size={26} />
        </div>
        <h3 className="truncate text-sm font-semibold text-foreground flex-1 min-w-0">
          {platformName}热榜
        </h3>
      </div>
      <Separator />
      <ul className="px-4 py-3 space-y-1">
        {items.map((item, i) => {
          const rank = i + 1;
          const rankColorClass =
            rank === 1
              ? "text-red-500 font-semibold"
              : rank === 2
                ? "text-orange-500 font-semibold"
                : rank === 3
                  ? "text-amber-500 font-semibold"
                  : "text-muted-foreground";
          return (
            <li
              key={`${platformId}-${i}`}
              className="group flex items-center gap-2 text-sm leading-relaxed cursor-pointer -mx-2 px-2 py-1 rounded-md hover:bg-muted/60 transition-colors"
            >
              <span
                className={cn("shrink-0 w-5 text-center", rankColorClass)}
                aria-hidden
              >
                {rank}
              </span>
              <span className="line-clamp-1 text-foreground/90 flex-1 min-w-0 truncate">
                {item}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={t("actions.more")}
                    >
                      <MoreHorizontalIcon className="size-3.5" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => {}}>
                    {t("actions.secondaryCreation")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function TopicCenter() {
  const t = useTranslations();
  const platforms = React.useMemo(
    () => getPlatformsWithNames((id) => t(`topicCenter.platforms.${id}`)),
    [t],
  );
  const [searchValue, setSearchValue] = React.useState("");
  const [platform, setPlatform] = React.useState<string>("all");
  const [track, setTrack] = React.useState<string>("all");

  const handleSearch = () => {
    console.log("search", { searchValue, platform, track });
  };

  const contentMaxWidth = "max-w-4xl";

  return (
    <div className="flex flex-col px-8 pt-10 pb-8">
      {/* Search Area */}
      <div className={cn("mx-auto w-full", contentMaxWidth)}>
        <h1 className="text-left text-[1.5rem] font-semibold tracking-tight text-foreground mb-4 uppercase">
          {t("topicCenter.title")}
        </h1>
        <div className="rounded-2xl border border-primary bg-card shadow-[0_0_20px_rgba(124,58,237,0.25)] overflow-hidden">
          <Textarea
            placeholder={t("topicCenter.searchPlaceholder")}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="min-h-[100px] border-0 rounded-none focus-visible:ring-0 resize-none px-4 pt-4 pb-1 md:text-base placeholder:text-base"
            rows={3}
          />
          <div className="flex items-center justify-between gap-4 px-4 pb-2">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={platform} onValueChange={(v) => setPlatform(v ?? "all")}>
                <SelectTrigger className="h-8 min-w-[120px] rounded-md bg-muted/60 border-border text-sm gap-1.5">
                  <span className="text-muted-foreground shrink-0">{t("topicCenter.platform")}</span>
                  <span className="inline-flex items-center gap-2 font-medium min-w-0">
                    {platform === "all" ? (
                      t("topicCenter.all")
                    ) : (
                      <>
                        <PlatformLogo platformId={platform as import("@/lib/platforms").PlatformId} size={20} className="shrink-0" />
                        <span className="whitespace-nowrap">{platforms.find((p) => p.id === platform)?.name ?? t("topicCenter.all")}</span>
                      </>
                    )}
                  </span>
                  <SelectValue className="sr-only" />
                </SelectTrigger>
                <SelectContent align="end" className="w-56">
                  <SelectGroup>
                    <SelectLabel>{t("topicCenter.platform")}</SelectLabel>
                    <SelectItem value="all">
                      <span className="inline-flex items-center gap-2">
                        <span className="grid size-5 place-items-center rounded-md bg-muted text-[10px] font-semibold text-foreground/70 ring-1 ring-border">
                          {t("topicCenter.allShort")}
                        </span>
                        {t("topicCenter.all")}
                      </span>
                    </SelectItem>
                    {platforms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="inline-flex items-center gap-2">
                          <PlatformLogo platformId={p.id} size={20} />
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select value={track} onValueChange={(v) => setTrack(v ?? "all")}>
                <SelectTrigger className="h-8 min-w-[120px] rounded-md bg-muted/60 border-border text-sm gap-1.5">
                  <span className="text-muted-foreground shrink-0">{t("topicCenter.track")}</span>
                  <span className="font-medium min-w-0 whitespace-nowrap">
                    {track === "all" ? t("topicCenter.all") : t(TRACKS.find((tr) => tr.id === track)?.nameKey ?? "topicCenter.all")}
                  </span>
                  <SelectValue className="sr-only" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("topicCenter.all")}</SelectItem>
                  {TRACKS.map((tr) => (
                    <SelectItem key={tr.id} value={tr.id}>
                      {t(tr.nameKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="icon"
              variant="default"
              className="size-8 shrink-0 rounded-full"
              onClick={handleSearch}
              disabled={!searchValue.trim()}
              aria-label={t("topicCenter.search")}
            >
              <SendIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className={cn("mt-8 flex-1 min-h-0 w-full", contentMaxWidth, "mx-auto")}>
        <Tabs defaultValue="hot" className="h-full flex flex-col">
          <TabsList variant="line">
            <TabsTrigger value="hot">{t("topicCenter.tabs.hotTopics")}</TabsTrigger>
            <TabsTrigger value="track">{t("topicCenter.tabs.trackTopics")}</TabsTrigger>
          </TabsList>
          <TabsContent value="hot" className="flex-1 mt-2 overflow-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {platforms.map((p) => {
                const items = MOCK_HOT_ITEMS[p.id] ?? MOCK_HOT_ITEMS.xhs;
                return (
                  <HotListCard
                    key={p.id}
                    platformId={p.id}
                    platformName={p.name}
                    items={items}
                  />
                );
              })}
            </div>
          </TabsContent>
          <TabsContent value="track" className="flex-1 mt-0 overflow-auto">
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              {t("topicCenter.trackTopicsPlaceholder")}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

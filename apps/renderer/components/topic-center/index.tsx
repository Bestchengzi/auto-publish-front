"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { TopicCenterDataConnectorsPanel } from "@/components/topic-center/data-connectors";
import { TopicCenterHotRankPanel } from "@/components/topic-center/hot-rank-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TopicCenter() {
  const t = useTranslations();
  const tTopicCenter = useTranslations("topicCenter");
  const [activeView, setActiveView] = React.useState<
    "hot-rank" | "data-connectors"
  >("data-connectors");
  const [dataConnectorsToolbarEl, setDataConnectorsToolbarEl] =
    React.useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (activeView !== "data-connectors") {
      setDataConnectorsToolbarEl(null);
    }
  }, [activeView]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl">
        <Tabs
          value={activeView}
          onValueChange={(value) =>
            setActiveView((value as "hot-rank" | "data-connectors") ?? "data-connectors")
          }
          className="min-h-0 w-full flex-1 gap-4 overflow-hidden"
        >
          <div className="min-w-0 shrink-0 px-16 pt-8">
            <div className="mx-auto relative w-full max-w-7xl">
              <TabsList
                variant="line"
                className="h-auto w-full min-w-0 justify-start gap-3 p-0"
              >
                <TabsTrigger
                  value="data-connectors"
                  className="h-9 pl-0 pr-1.5 text-base group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:after:left-0"
                >
                  {tTopicCenter("dataConnectors.title")}
                </TabsTrigger>
                <TabsTrigger value="hot-rank" className="h-9 px-1.5 text-base">
                  {t("topicCenter.hotRankBoardTitle")}
                </TabsTrigger>
              </TabsList>
              {activeView === "data-connectors" ? (
                <div
                  ref={setDataConnectorsToolbarEl}
                  className="absolute -top-1 right-0 z-20 flex h-9 items-center"
                />
              ) : null}
            </div>
          </div>

          <TabsContent
            value="data-connectors"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-16 pb-8"
          >
            <div className="mx-auto min-h-full w-full max-w-7xl">
              <TopicCenterDataConnectorsPanel
                toolbarAnchorEl={dataConnectorsToolbarEl}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="hot-rank"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-16 pb-8"
          >
            <TopicCenterHotRankPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

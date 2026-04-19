"use client";

import dynamic from "next/dynamic";

import { CreationCenterPageSkeleton } from "@/components/creation-center/creation-center-page-skeleton";

const CreationCenterThreadRouteContent = dynamic(
  () =>
    import(
      "@/components/creation-center/creation-center-thread-route-content"
    ).then((module) => module.CreationCenterThreadRouteContent),
  {
    loading: () => <CreationCenterPageSkeleton variant="thread" />,
  },
);

export function CreationCenterThreadRoute({
  appLocale,
}: {
  appLocale: string;
}) {
  return <CreationCenterThreadRouteContent appLocale={appLocale} />;
}

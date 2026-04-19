"use client";

import dynamic from "next/dynamic";

import { CreationCenterPageSkeleton } from "@/components/creation-center/creation-center-page-skeleton";

const CreationCenterNewRouteContent = dynamic(
  () =>
    import("@/components/creation-center/creation-center-new-route-content").then(
      (module) => module.CreationCenterNewRouteContent,
    ),
  {
    loading: () => <CreationCenterPageSkeleton variant="new" />,
  },
);

export function CreationCenterNewRoute({
  appLocale,
}: {
  appLocale: string;
}) {
  return <CreationCenterNewRouteContent appLocale={appLocale} />;
}

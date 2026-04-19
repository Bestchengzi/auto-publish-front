import { Skeleton } from "@/components/ui/skeleton";

export function TopicCenterSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden px-16 pt-8">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden">
        <div className="flex h-9 items-center gap-4">
          <Skeleton className="h-7 w-28 rounded-md" />
          <Skeleton className="h-7 w-24 rounded-md" />
        </div>
        <div className="mt-6 grid min-h-0 flex-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-xl border border-border/70 p-4">
            <Skeleton className="h-6 w-24 rounded-md" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton
                  key={`topic-center-filter-skeleton-${index}`}
                  className="h-12 w-full rounded-lg"
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border/70 p-4">
            <Skeleton className="h-8 w-44 rounded-md" />
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`topic-center-card-skeleton-${index}`}
                  className="rounded-xl border border-border/60 p-4"
                >
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <Skeleton className="mt-4 h-5 w-3/4 rounded-md" />
                  <Skeleton className="mt-3 h-4 w-full rounded-md" />
                  <Skeleton className="mt-2 h-4 w-2/3 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

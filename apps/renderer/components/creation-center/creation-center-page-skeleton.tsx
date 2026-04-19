import { Skeleton } from "@/components/ui/skeleton";

export function CreationCenterPageSkeleton({
  variant,
}: {
  variant: "new" | "thread";
}) {
  if (variant === "new") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-3xl -translate-y-20 flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Skeleton className="h-10 w-72 rounded-md" />
            <Skeleton className="h-5 w-80 max-w-full rounded-md" />
          </div>
          <div className="w-full rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <Skeleton className="h-28 w-full rounded-xl" />
            <div className="mt-4 flex items-center gap-3">
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="ml-auto h-9 w-32 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex size-full min-h-0 justify-between">
        <main className="flex min-h-0 max-w-full flex-1 flex-col">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden px-6 pt-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`creation-center-message-skeleton-${index}`}
                className="flex flex-col gap-2"
              >
                <Skeleton className="h-5 w-36 rounded-md" />
                <Skeleton className="h-4 w-full max-w-3xl rounded-md" />
                <Skeleton className="h-4 w-5/6 max-w-2xl rounded-md" />
              </div>
            ))}
          </div>
          <div className="z-30 flex shrink-0 justify-center px-4 pb-4 pt-4">
            <div className="w-full max-w-(--container-width-md) rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
              <Skeleton className="h-24 w-full rounded-xl" />
              <div className="mt-4 flex items-center gap-3">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="ml-auto h-8 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

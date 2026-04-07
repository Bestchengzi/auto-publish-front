import type { QueryClient } from "@tanstack/react-query";

export function clearAuthRelatedQueryCache(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: ["models"] });
  queryClient.removeQueries({ queryKey: ["personas", "list"] });
}

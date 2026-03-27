import * as React from "react";
import { debounce } from "lodash";

type AccountLike = {
  name: string;
};

export function useAccountFilterState() {
  const [queryInput, setQueryInput] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [platformFilter, setPlatformFilter] = React.useState<string | "all">(
    "all",
  );
  const [statusFilter, setStatusFilter] = React.useState<
    "online" | "offline" | "all"
  >("all");
  const [groupFilter, setGroupFilter] = React.useState<string>("all");

  const updateQuery = React.useMemo(
    () => debounce((next: string) => setQuery(next), 300),
    [],
  );

  React.useEffect(() => () => updateQuery.cancel(), [updateQuery]);

  return {
    query,
    queryInput,
    setQueryInput,
    updateQuery,
    platformFilter,
    setPlatformFilter,
    statusFilter,
    setStatusFilter,
    groupFilter,
    setGroupFilter,
  };
}

export function useAccountFilters<T extends AccountLike>(
  accounts: T[],
  query: string,
) {
  const filteredAccounts = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter((a) => !q || a.name.toLowerCase().includes(q));
  }, [accounts, query]);

  return {
    filteredAccounts,
  };
}

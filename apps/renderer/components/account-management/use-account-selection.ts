import * as React from "react";

type AccountLike = { id: string };

export function useAccountSelection(accounts: AccountLike[]) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(),
  );

  React.useEffect(() => {
    setSelectedIds((prev) => {
      const allowed = new Set(accounts.map((a) => a.id));
      const next = new Set<string>();
      for (const id of prev) if (allowed.has(id)) next.add(id);
      return next;
    });
  }, [accounts]);

  const allSelected = accounts.length > 0 && selectedIds.size === accounts.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleOne = React.useCallback((id: string, next: boolean) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (next) n.add(id);
      else n.delete(id);
      return n;
    });
  }, []);

  const toggleAll = React.useCallback(
    (next: boolean) => {
      setSelectedIds(next ? new Set(accounts.map((a) => a.id)) : new Set());
    },
    [accounts],
  );

  return {
    selectedIds,
    setSelectedIds,
    allSelected,
    someSelected,
    toggleOne,
    toggleAll,
  };
}

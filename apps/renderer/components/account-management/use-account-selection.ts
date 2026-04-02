import * as React from "react";

type AccountLike = { id: string };

export type UseAccountSelectionOptions = {
  /**
   * Selection is only pruned to IDs that still exist in this set (e.g. all loaded accounts).
   * Checkbox “select all” / indeterminate still applies to `visibleAccounts` (first argument).
   * Defaults to `visibleAccounts` — changing the visible filter also drops selections outside it.
   */
  selectionUniverse?: AccountLike[];
};

export function useAccountSelection(
  visibleAccounts: AccountLike[],
  options?: UseAccountSelectionOptions,
) {
  const selectionUniverse = options?.selectionUniverse ?? visibleAccounts;

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(),
  );

  const allowedIds = React.useMemo(
    () => new Set(selectionUniverse.map((a) => a.id)),
    [selectionUniverse],
  );

  React.useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) if (allowedIds.has(id)) next.add(id);
      return next;
    });
  }, [allowedIds]);

  const allSelected =
    visibleAccounts.length > 0 &&
    visibleAccounts.every((a) => selectedIds.has(a.id));
  const someSelected =
    visibleAccounts.some((a) => selectedIds.has(a.id)) && !allSelected;

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
      setSelectedIds((prev) => {
        const n = new Set(prev);
        if (next) {
          for (const a of visibleAccounts) n.add(a.id);
        } else {
          for (const a of visibleAccounts) n.delete(a.id);
        }
        return n;
      });
    },
    [visibleAccounts],
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

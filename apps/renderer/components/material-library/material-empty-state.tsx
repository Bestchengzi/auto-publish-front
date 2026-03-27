"use client";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

type MaterialEmptyStateProps = {
  title: string;
  description: string;
};

export function MaterialEmptyState({
  title,
  description,
}: MaterialEmptyStateProps) {
  return (
    <Empty className="min-h-[200px]">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

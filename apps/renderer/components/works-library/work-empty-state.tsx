"use client";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

type WorkEmptyStateProps = {
  title: string;
  description: string;
};

export function WorkEmptyState({ title, description }: WorkEmptyStateProps) {
  return (
    <Empty className="min-h-[200px]">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent />
    </Empty>
  );
}

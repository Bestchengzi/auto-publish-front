"use client";

import { FileTextIcon } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
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
        <EmptyMedia variant="icon">
          <FileTextIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent />
    </Empty>
  );
}

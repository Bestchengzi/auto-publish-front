"use client";

import { PlusIcon } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

type AccountEmptyStateProps = {
  title: string;
  description: string;
  onAddAccount?: () => void;
  addLabel?: string;
};

export function AccountEmptyState({
  title,
  description,
  onAddAccount,
  addLabel,
}: AccountEmptyStateProps) {
  return (
    <Empty className="min-h-[200px]">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {onAddAccount && addLabel ? (
        <EmptyContent>
          <Button size="sm" onClick={onAddAccount} className="gap-1.5">
            <PlusIcon className="size-4" />
            {addLabel}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

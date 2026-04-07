"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type PageEmptyStateProps = {
  title: string;
  description: string;
  children?: ReactNode;
  /** 传入时显示图标；默认不展示，与账号/素材库/发布记录一致 */
  icon?: LucideIcon;
};

export function PageEmptyState({
  title,
  description,
  children,
  icon: Icon,
}: PageEmptyStateProps) {
  return (
    <Empty className="min-h-[200px]">
      <EmptyHeader>
        {Icon ? (
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
        ) : null}
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children ? <EmptyContent>{children}</EmptyContent> : <EmptyContent />}
    </Empty>
  );
}

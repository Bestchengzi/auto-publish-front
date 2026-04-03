"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** 与素材库表格骨架一致：表头占位 + 多行 shimmer，仅用于首次进入页面的加载态 */
export function AutoPublishSkeleton() {
  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <Table bodyScroll className="min-w-[800px] table-fixed">
        <TableHeader
          className={cn(
            "[&_tr]:border-border [&_th]:h-[47px] [&_th]:py-0 [&_tr]:py-0",
            "[&_tr]:bg-muted/40",
          )}
        >
          <TableRow className="hover:bg-muted/40">
            <TableHead className="w-44 min-w-0 pl-4">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="min-w-0">
              <Skeleton className="h-4 w-12" />
            </TableHead>
            <TableHead className="w-40 shrink-0">
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead className="w-40 shrink-0">
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead className="w-28 shrink-0 text-center">
              <Skeleton className="mx-auto h-4 w-14" />
            </TableHead>
            <TableHead className="w-28 shrink-0 text-center">
              <Skeleton className="mx-auto h-4 w-12" />
            </TableHead>
            <TableHead className="w-12 shrink-0 text-right">
              <Skeleton className="ml-auto h-4 w-4" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <TableRow
              key={i}
              className="[&_td]:h-[53px] [&_td]:py-0"
            >
              <TableCell className="w-44 min-w-0 pl-4">
                <Skeleton
                  className="h-4"
                  style={{ width: `${48 + (i % 4) * 10}%` }}
                />
              </TableCell>
              <TableCell className="min-w-0 max-w-0">
                <Skeleton
                  className="h-4 max-w-full"
                  style={{ width: `${55 + (i % 3) * 12}%` }}
                />
              </TableCell>
              <TableCell className="w-40 shrink-0">
                <Skeleton className="h-4 w-28 font-mono" />
              </TableCell>
              <TableCell className="w-40 shrink-0">
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell className="w-28 shrink-0 text-center">
                <Skeleton className="mx-auto h-4 w-12" />
              </TableCell>
              <TableCell className="w-28 shrink-0 text-center">
                <Skeleton className="mx-auto h-8 w-10 rounded-full" />
              </TableCell>
              <TableCell className="w-12 shrink-0 text-right">
                <Skeleton className="ml-auto h-6 w-6 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

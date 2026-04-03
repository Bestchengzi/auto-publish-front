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

export function MaterialLibrarySkeleton() {
  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4 lg:flex-row lg:items-stretch">
      {/* Left groups sidebar */}
      <div className="rounded-xl border border-border p-3 lg:w-[260px] flex flex-col min-h-0 lg:self-stretch">
        <div className="h-12 -mx-3 -mt-3 mb-2 rounded-t-xl border-b border-border bg-muted/60 px-4 flex items-center justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex h-9 items-center justify-between rounded-lg px-2"
            >
              <Skeleton
                className="h-4 flex-1 max-w-[140px]"
                style={{ width: `${60 + i * 15}%` }}
              />
              <Skeleton className="h-5 w-6 rounded-md shrink-0 ml-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Right: table area - 无选中时无 BulkBar，直接展示表格 */}
      <div className="min-w-0 flex-1 rounded-xl border border-border flex flex-col min-h-0 lg:self-stretch overflow-hidden">
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col p-0">
          <Table bodyScroll className="min-w-[860px] table-fixed">
            <TableHeader
              className="[&_tr]:border-border [&_th]:h-[47px] [&_th]:py-0 [&_tr]:py-0 [&_tr]:bg-muted/60"
            >
              <TableRow>
                <TableHead className="w-12 shrink-0 px-4">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
                <TableHead className="w-52 shrink-0 px-4">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead className="w-24 shrink-0 px-4">
                  <Skeleton className="h-4 w-12" />
                </TableHead>
                <TableHead className="w-32 shrink-0 px-4">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="w-28 shrink-0 px-4">
                  <Skeleton className="h-4 w-14" />
                </TableHead>
                <TableHead className="w-24 shrink-0 px-4">
                  <Skeleton className="h-4 w-12" />
                </TableHead>
                <TableHead className="w-36 shrink-0 px-4">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="w-12 shrink-0 px-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <TableRow key={i} className="[&_td]:py-0 [&_td]:h-[53px]">
                  <TableCell className="w-12 shrink-0 px-4">
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell className="w-52 shrink-0 px-4">
                    <Skeleton
                      className="h-4"
                      style={{ width: `${65 + (i % 3) * 8}%` }}
                    />
                  </TableCell>
                  <TableCell className="w-24 shrink-0 px-4">
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell className="w-32 shrink-0 px-4">
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="w-28 shrink-0 px-4">
                    <Skeleton className="h-4 w-14" />
                  </TableCell>
                  <TableCell className="w-24 shrink-0 px-4">
                    <Skeleton className="h-4 w-10" />
                  </TableCell>
                  <TableCell className="w-36 shrink-0 px-4">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="w-12 shrink-0 px-4 text-right">
                    <Skeleton className="h-6 w-6 rounded ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

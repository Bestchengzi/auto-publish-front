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

export function WorksLibrarySkeleton() {
  return (
    <div className="flex-1 min-h-0 rounded-xl border border-border flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto">
        <Table className="min-w-[880px]">
          <TableHeader className="[&_tr]:border-border [&_th]:h-[47px] [&_th]:py-0 [&_tr]:py-0 [&_tr]:bg-muted/60">
            <TableRow>
              <TableHead className="w-12 shrink-0 px-4">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead className="w-96 max-w-96">
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead className="w-44 min-w-44 max-w-44">
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead className="w-[8.5rem] max-w-[8.5rem]">
                <Skeleton className="h-4 w-full max-w-[6.5rem]" />
              </TableHead>
              <TableHead className="w-[6.75rem] max-w-[6.75rem]">
                <Skeleton className="h-4 w-14" />
              </TableHead>
              <TableHead className="w-14 max-w-14 text-center">
                <Skeleton className="mx-auto h-4 w-8" />
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <TableRow key={i}>
                <TableCell className="w-12 shrink-0 px-4">
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell className="w-96 max-w-96">
                  <Skeleton className="h-4 w-full max-w-[18rem]" />
                </TableCell>
                <TableCell className="w-44 min-w-44 max-w-44">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Skeleton className="size-7 rounded-md" />
                    <Skeleton className="size-7 rounded-md" />
                  </div>
                </TableCell>
                <TableCell className="w-[8.5rem] max-w-[8.5rem]">
                  <Skeleton className="h-4 w-full max-w-[6.5rem]" />
                </TableCell>
                <TableCell className="w-[6.75rem] max-w-[6.75rem]">
                  <Skeleton className="h-4 w-14" />
                </TableCell>
                <TableCell className="w-14 max-w-14">
                  <Skeleton className="mx-auto h-4 w-8" />
                </TableCell>
                <TableCell className="w-12 text-right">
                  <Skeleton className="h-6 w-6 rounded ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

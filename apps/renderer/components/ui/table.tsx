"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type TableProps = React.ComponentProps<"table"> & {
  /** 表头固定在外，仅 tbody 纵向滚动（滚动条只出现在数据区） */
  bodyScroll?: boolean
}

function Table({ className, bodyScroll = false, ...props }: TableProps) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "relative min-w-0",
        bodyScroll
          ? "flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-auto"
          : "w-full",
      )}
    >
      <table
        data-slot="table"
        className={cn(
          "caption-bottom text-sm",
          bodyScroll
            ? "flex h-full min-h-0 w-full flex-col border-collapse [&>thead]:w-full [&>thead]:shrink-0 [&>thead]:[scrollbar-gutter:stable] [&>thead>tr]:table [&>thead>tr]:w-full [&>thead>tr]:table-fixed [&>tbody]:min-h-0 [&>tbody]:w-full [&>tbody]:flex-1 [&>tbody]:overflow-x-hidden [&>tbody]:overflow-y-auto [&>tbody]:[scrollbar-gutter:stable] [&>tbody>tr]:table [&>tbody>tr]:w-full [&>tbody>tr]:table-fixed"
            : "w-full",
          className,
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

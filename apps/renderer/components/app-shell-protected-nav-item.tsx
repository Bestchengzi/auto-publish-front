"use client";

import Link from "next/link";

import { getAuthToken } from "@/lib/auth/session";

type AppShellProtectedNavItemProps = {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: React.ReactNode;
};

export function AppShellProtectedNavItem({
  href,
  active,
  icon,
  label,
}: AppShellProtectedNavItemProps) {
  return (
    <Link
      href={href}
      onClick={(event) => {
        if (getAuthToken()) return;
        event.preventDefault();
        window.dispatchEvent(new Event("media-auth-open-login"));
      }}
      className={
        active
          ? "flex h-9 cursor-pointer items-center gap-2 rounded-md bg-gray-200/60 px-2 text-sm font-medium text-gray-900 dark:bg-sidebar-border dark:text-gray-100"
          : "flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-sidebar-border/50"
      }
    >
      {icon}
      {label}
    </Link>
  );
}

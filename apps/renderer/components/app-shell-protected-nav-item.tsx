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
          ? "flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary/10 px-2 text-sm font-medium text-primary"
          : "flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground"
      }
    >
      {icon}
      {label}
    </Link>
  );
}

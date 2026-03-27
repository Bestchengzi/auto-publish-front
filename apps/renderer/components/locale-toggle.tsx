"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { LanguagesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Locale = "zh-CN" | "en";

function setLocaleCookie(locale: Locale) {
  // Cookie-based locale so SSR can pick it up.
  // Lax is enough for this use-case.
  document.cookie = `NEXT_LOCALE=${encodeURIComponent(locale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function switchLocalePath(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/").filter(Boolean);
  const current = segments[0];
  if (current === "zh-CN" || current === "en") {
    segments[0] = nextLocale;
    return `/${segments.join("/")}`;
  }
  // If somehow not prefixed, just prefix.
  return `/${nextLocale}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

export function LocaleToggle({
  label,
  zhLabel,
  enLabel,
}: {
  label: string;
  zhLabel: string;
  enLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const onPick = (locale: Locale) => {
    setLocaleCookie(locale);
    router.push(switchLocalePath(pathname, locale));
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
        <LanguagesIcon />
        <span className="sr-only">{label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onPick("zh-CN")}>
            {zhLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPick("en")}>{enLabel}</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


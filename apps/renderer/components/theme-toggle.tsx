"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react";

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

export function ThemeToggle({
  label = "Theme",
  lightLabel = "Light",
  darkLabel = "Dark",
  systemLabel = "System",
}: {
  label?: string;
  lightLabel?: string;
  darkLabel?: string;
  systemLabel?: string;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const Icon = !mounted
    ? MonitorIcon
    : theme === "dark"
      ? MoonIcon
      : theme === "light"
        ? SunIcon
        : MonitorIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
        <Icon />
        <span className="sr-only">{label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <SunIcon />
            {lightLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <MoonIcon />
            {darkLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <MonitorIcon />
            {systemLabel}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


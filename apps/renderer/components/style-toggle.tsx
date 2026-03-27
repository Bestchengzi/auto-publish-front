"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PaletteIcon } from "lucide-react";

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

type AccentPreset = "neutral" | "blue" | "violet";

const ACCENT_COOKIE = "UI_ACCENT";

function setAccentCookie(preset: AccentPreset) {
  document.cookie = `${ACCENT_COOKIE}=${encodeURIComponent(preset)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function applyAccent(preset: AccentPreset) {
  const body = document.body;
  body.classList.remove("ui-accent-blue", "ui-accent-violet");

  if (preset === "blue") body.classList.add("ui-accent-blue");
  if (preset === "violet") body.classList.add("ui-accent-violet");
}

function getInitialPreset(): AccentPreset {
  if (typeof document === "undefined") return "neutral";

  const match = document.cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${ACCENT_COOKIE}=`));

  const raw = match?.split("=").slice(1).join("=");
  return raw === "blue" || raw === "violet" ? raw : "neutral";
}

export function StyleToggle({
  label,
  neutralLabel,
  blueLabel,
  violetLabel,
}: {
  label: string;
  neutralLabel: string;
  blueLabel: string;
  violetLabel: string;
}) {
  const router = useRouter();
  const [, setPreset] = React.useState<AccentPreset>("neutral");

  React.useEffect(() => {
    const initial = getInitialPreset();
    setPreset(initial);
    applyAccent(initial);
  }, []);

  const onPick = (next: AccentPreset) => {
    setPreset(next);
    setAccentCookie(next);
    applyAccent(next);
    // Refresh so server-rendered pages (and metadata) stay consistent if needed.
    router.refresh();
  };

  const Icon = PaletteIcon;

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
          <DropdownMenuItem onClick={() => onPick("neutral")}>
            {neutralLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPick("blue")}>
            {blueLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPick("violet")}>
            {violetLabel}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


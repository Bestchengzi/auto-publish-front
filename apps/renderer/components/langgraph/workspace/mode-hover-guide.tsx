"use client";

import { useI18n } from "@/lib/langgraph/core/i18n/hooks";

import { Tooltip } from "./tooltip";

export type AgentMode = "flash" | "thinking" | "pro" | "ultra";

function getModeLabelKey(
  mode: AgentMode,
): "flashMode" | "reasoningMode" | "proMode" | "ultraMode" {
  switch (mode) {
    case "flash":
      return "flashMode";
    case "thinking":
      return "reasoningMode";
    case "pro":
      return "proMode";
    case "ultra":
      return "ultraMode";
  }
}

function getModeDescriptionKey(
  mode: AgentMode,
):
  | "flashModeDescription"
  | "reasoningModeDescription"
  | "proModeDescription"
  | "ultraModeDescription" {
  switch (mode) {
    case "flash":
      return "flashModeDescription";
    case "thinking":
      return "reasoningModeDescription";
    case "pro":
      return "proModeDescription";
    case "ultra":
      return "ultraModeDescription";
  }
}

export function ModeHoverGuide({
  mode,
  children,
  showTitle = true,
}: {
  mode: AgentMode;
  children: React.ReactNode;
  /** When true, tooltip shows "ModeName: Description". When false, only description. */
  showTitle?: boolean;
}) {
  const { t } = useI18n();
  const label = t.inputBox[getModeLabelKey(mode)];
  const description = t.inputBox[getModeDescriptionKey(mode)];
  const content = showTitle ? `${label}: ${description}` : description;

  return <Tooltip content={content}>{children}</Tooltip>;
}

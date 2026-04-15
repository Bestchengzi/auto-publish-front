"use client";

import { useMemo } from "react";
import { useMessages } from "next-intl";
import {
  CompassIcon,
  GraduationCapIcon,
  ImageIcon,
  MicroscopeIcon,
  PenLineIcon,
  ShapesIcon,
  SparklesIcon,
  VideoIcon,
  type LucideIcon,
} from "lucide-react";

type SuggestionItem = {
  suggestion: string;
  prompt: string;
  icon: LucideIcon;
};

type SuggestionCreateItem =
  | {
      suggestion: string;
      prompt: string;
      icon: LucideIcon;
    }
  | {
      type: "separator";
    };

type LanggraphMessages = {
  common: {
    edit: string;
    delete: string;
    cancel: string;
    create: string;
    copy: string;
    thinking: string;
    download: string;
    publish: string;
    savePersona: string;
    close: string;
    undo: string;
    redo: string;
    artifacts: string;
    saving: string;
  };
  clipboard: {
    copyToClipboard: string;
    copiedToClipboard: string;
    failedToCopyToClipboard: string;
    linkCopied: string;
  };
  inputBox: {
    placeholder: string;
    createSkillPrompt: string;
    addAttachments: string;
    mode: string;
    flashMode: string;
    flashModeDescription: string;
    reasoningMode: string;
    reasoningModeDescription: string;
    proMode: string;
    proModeDescription: string;
    ultraMode: string;
    ultraModeDescription: string;
    reasoningEffort: string;
    reasoningEffortMinimal: string;
    reasoningEffortMinimalDescription: string;
    reasoningEffortLow: string;
    reasoningEffortLowDescription: string;
    reasoningEffortMedium: string;
    reasoningEffortMediumDescription: string;
    reasoningEffortHigh: string;
    reasoningEffortHighDescription: string;
    surpriseMe: string;
    surpriseMePrompt: string;
    followupLoading: string;
    followupConfirmTitle: string;
    followupConfirmDescription: string;
    followupConfirmAppend: string;
    followupConfirmReplace: string;
    suggestions: Array<{
      suggestion: string;
      prompt: string;
    }>;
    suggestionsCreate: Array<
      | {
          suggestion: string;
          prompt: string;
        }
      | {
          type: "separator";
        }
    >;
  };
  toolCalls: {
    moreSteps: string;
    lessSteps: string;
    executeCommand: string;
    presentFiles: string;
    needYourHelp: string;
    useTool: string;
    searchFor: string;
    searchForRelatedInfo: string;
    searchForRelatedImages: string;
    searchForRelatedImagesFor: string;
    searchOnWebFor: string;
    viewWebPage: string;
    listFolder: string;
    readFile: string;
    writeFile: string;
    writeTodos: string;
    continueIdeation: string;
    startCreation: string;
    createXiaohongshu: string;
    createMediumLongArticle: string;
    imageGenerationFailed: string;
  };
  uploads: {
    uploading: string;
    uploadingFiles: string;
  };
  subtasks: {
    subtask: string;
    executing: string;
    in_progress: string;
    completed: string;
    failed: string;
  };
  coverDrawer: {
    tabUpload: string;
    tabLibrary: string;
    tabProject: string;
    tabSearch: string;
    uploading: string;
    uploadLocal: string;
    uploadContinue: string;
    uploadedCoverAlt: string;
    reupload: string;
    libraryLoading: string;
    emptyTitle: string;
    emptyDescription: string;
    searchEmptyDescription: string;
    searchInputPlaceholder: string;
    searchButton: string;
    searchKeywordRequired: string;
    maxSelect: string;
    replaceModeSingleHint: string;
    cancel: string;
    confirm: string;
    replaceCover: string;
  };
  slashMenu: {
    placeholder: string;
    sectionCommon: string;
    sectionBasic: string;
    image: string;
    paragraph: string;
    heading1: string;
    heading2: string;
    heading3: string;
    heading4: string;
  };
};

const replaceTemplate = (
  template: string,
  values: Record<string, string | number>,
) =>
  Object.entries(values).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template,
  );

export function useI18n() {
  const messages = useMessages() as Record<string, unknown>;
  const langgraph = messages.langgraph as LanggraphMessages;

  const t = useMemo(
    () => ({
      common: langgraph.common,
      clipboard: langgraph.clipboard,
      inputBox: {
        ...langgraph.inputBox,
        suggestions: langgraph.inputBox.suggestions.map((item, index) => {
          const icons: LucideIcon[] = [
            PenLineIcon,
            MicroscopeIcon,
            ShapesIcon,
            GraduationCapIcon,
          ];
          const icon = icons[index] ?? SparklesIcon;
          return { ...item, icon } as SuggestionItem;
        }),
        suggestionsCreate: langgraph.inputBox.suggestionsCreate.map((item, index) => {
          if ("type" in item && item.type === "separator") {
            return { type: "separator" } as SuggestionCreateItem;
          }
          const icons: LucideIcon[] = [
            CompassIcon,
            ImageIcon,
            VideoIcon,
            SparklesIcon,
          ];
          const icon = icons[index] ?? SparklesIcon;
          return { ...item, icon } as SuggestionCreateItem;
        }),
      },
      toolCalls: {
        ...langgraph.toolCalls,
        moreSteps: (count: number) =>
          replaceTemplate(langgraph.toolCalls.moreSteps, { count }),
        useTool: (toolName: string) =>
          replaceTemplate(langgraph.toolCalls.useTool, { toolName }),
        searchFor: (query: string) =>
          replaceTemplate(langgraph.toolCalls.searchFor, { query }),
        searchForRelatedImagesFor: (query: string) =>
          replaceTemplate(langgraph.toolCalls.searchForRelatedImagesFor, { query }),
        searchOnWebFor: (query: string) =>
          replaceTemplate(langgraph.toolCalls.searchOnWebFor, { query }),
      },
      uploads: langgraph.uploads,
      subtasks: {
        ...langgraph.subtasks,
        executing: (count: number) =>
          replaceTemplate(langgraph.subtasks.executing, { count }),
      },
      coverDrawer: {
        ...langgraph.coverDrawer,
        maxSelect: (count: number) =>
          replaceTemplate(langgraph.coverDrawer.maxSelect, { count }),
      },
      slashMenu: langgraph.slashMenu,
    }),
    [langgraph],
  );

  return {
    t,
  };
}

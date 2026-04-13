import type { AIMessage } from "@langchain/langgraph-sdk";

type ToolCall = NonNullable<AIMessage["tool_calls"]>[number];

import { hasToolCalls } from "../messages/utils";

type I18nText = {
  common: {
    thinking: string;
  };
  toolCalls: {
    searchFor: (query: string) => string;
    viewWebPage: string;
    presentFiles: string;
    writeTodos: string;
    useTool: (toolName: string) => string;
  };
};

export function explainLastToolCall(message: AIMessage, t: I18nText) {
  if (hasToolCalls(message)) {
    const lastToolCall = message.tool_calls![message.tool_calls!.length - 1]!;
    return explainToolCall(lastToolCall, t);
  }
  return t.common.thinking;
}

export function explainToolCall(toolCall: ToolCall, t: I18nText) {
  if (toolCall.name === "web_search" || toolCall.name === "image_search") {
    return t.toolCalls.searchFor(toolCall.args.query);
  } else if (toolCall.name === "web_fetch") {
    return t.toolCalls.viewWebPage;
  } else if (toolCall.name === "present_files") {
    return t.toolCalls.presentFiles;
  } else if (toolCall.name === "write_todos") {
    return t.toolCalls.writeTodos;
  } else if (toolCall.args.description) {
    return toolCall.args.description;
  } else {
    return t.toolCalls.useTool(toolCall.name);
  }
}

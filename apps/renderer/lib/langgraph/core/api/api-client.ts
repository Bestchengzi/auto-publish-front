"use client";

import { Client as LangGraphClient } from "@langchain/langgraph-sdk/client";

import { getLangGraphBaseURL } from "../config";

import { sanitizeRunStreamOptions } from "./stream-mode";

function createCompatibleClient(): LangGraphClient {
  const client = new LangGraphClient({
    apiUrl: getLangGraphBaseURL(),
  });

  const originalRunStream = client.runs.stream.bind(client.runs);
  client.runs.stream = ((
    threadId: string | null,
    assistantId: string,
    payload: Parameters<typeof originalRunStream>[2],
  ) =>
    originalRunStream(
      threadId as never,
      assistantId,
      sanitizeRunStreamOptions(payload),
    )) as typeof client.runs.stream;

  const originalJoinStream = client.runs.joinStream.bind(client.runs);
  client.runs.joinStream = ((
    threadId: string,
    runId: string,
    options: Parameters<typeof originalJoinStream>[2],
  ) =>
    originalJoinStream(
      threadId,
      runId,
      sanitizeRunStreamOptions(options),
    )) as typeof client.runs.joinStream;

  return client;
}

let _singleton: LangGraphClient | null = null;
export function getAPIClient(): LangGraphClient {
  _singleton ??= createCompatibleClient();
  return _singleton;
}

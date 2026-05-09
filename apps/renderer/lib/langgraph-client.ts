"use client";

import { Client } from "@langchain/langgraph-sdk/client";

import { getLangGraphBaseUrl } from "@/lib/api/config";
import { applyStreamingProxyClientHints } from "@/lib/api/streaming-fetch-headers";
import { getAuthorizationHeaderValue } from "@/lib/auth/session";

let _client: Client | null = null;
let _clientApiUrl: string | null = null;

/**
 * LangGraph SDK 客户端，apiUrl 与 {@link getLangGraphBaseUrl} 一致。
 */
export function getLangGraphClient(): Client {
  const apiUrl = getLangGraphBaseUrl();
  if (!apiUrl) {
    throw new Error("LangGraph API base URL is empty");
  }
  if (!_client || _clientApiUrl !== apiUrl) {
    _client = new Client({
      apiUrl,
      onRequest: async (_url: URL, init: RequestInit) => {
        const authorization = getAuthorizationHeaderValue();
        const headers = new Headers(init?.headers);
        applyStreamingProxyClientHints(headers);
        if (authorization) {
          headers.set("Authorization", authorization);
        }
        return { ...init, headers };
      },
    });
    _clientApiUrl = apiUrl;
  }
  return _client;
}

export type CreateThreadOptions = {
  metadata?: Record<string, unknown>;
  /** 不传则由服务端生成 UUID */
  threadId?: string;
};

/** 创作中心线程根 metadata.platform：小红书 Agent 会话 */
export const THREAD_METADATA_PLATFORM_REDNOTE = "rednote" as const;

export function readThreadRootPlatform(
  thread: { metadata?: unknown } | null | undefined,
): string | undefined {
  const meta = thread?.metadata;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return undefined;
  }
  const p = (meta as Record<string, unknown>).platform;
  return typeof p === "string" && p.trim().length > 0 ? p : undefined;
}

/**
 * POST /threads，创建对话线程，返回 thread_id。
 */
export async function createThread(
  options: CreateThreadOptions = {}
): Promise<string> {
  const client = getLangGraphClient();
  const thread = await client.threads.create({
    metadata: options.metadata ?? {},
    threadId: options.threadId,
  });
  if (!thread.thread_id) {
    throw new Error("创建线程失败：响应中无 thread_id");
  }
  return thread.thread_id;
}

/**
 * GET /threads/:thread_id，读取线程（含根级 metadata，如 platform）。
 */
export async function getLangGraphThread(threadId: string) {
  const client = getLangGraphClient();
  return client.threads.get(threadId);
}
